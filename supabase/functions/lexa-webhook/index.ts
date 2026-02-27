import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Set your Lexa phone number here (from your Millis AI account)
const LEXA_PHONE = Deno.env.get("LEXA_PHONE_NUMBER") || "+1XXXXXXXXXX";

// OpsCenter dual-write constants
const LEXA_APP_ID = "f8c824a5-6f67-4842-ad1f-82c52d85aa3d";
const LEXA_FEED_BLOCK_ID = "07d55570-3804-4697-9f42-3e3fd69664a8";
const LEXA_OVERVIEW_ID = "54f6c282-1721-46e3-a7c6-aba530c9d975";
const MANI_USER_ID = "b214ea6a-57ed-4fc8-8a6a-86e7140d9639";

// Simple sentiment analysis based on transcript content
function analyzeSentiment(transcript: Array<{ role: string; content: string }>): string {
  const positiveWords = [
    "great", "excellent", "perfect", "wonderful", "amazing", "thank", "thanks",
    "interested", "love", "yes", "sure", "absolutely", "sounds good", "appreciate",
    "helpful", "fantastic", "awesome", "happy", "pleased", "excited", "looking forward",
  ];
  const negativeWords = [
    "not interested", "no thanks", "don't", "can't", "won't", "hate", "terrible",
    "awful", "bad", "horrible", "annoying", "stop", "remove", "unsubscribe",
    "hang up", "go away", "waste", "scam", "spam",
  ];

  const text = transcript.map((m) => m.content.toLowerCase()).join(" ");
  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach((w) => { if (text.includes(w)) positiveScore++; });
  negativeWords.forEach((w) => { if (text.includes(w)) negativeScore++; });

  if (positiveScore > negativeScore + 1) return "positive";
  if (negativeScore > positiveScore + 1) return "negative";
  return "neutral";
}

// Generate a brief summary from transcript
function generateSummary(
  transcript: Array<{ role: string; content: string }>,
  callStatus: string,
  callType: string
): string {
  if (!transcript || transcript.length === 0) {
    return `${callType} call ended with status: ${callStatus}`;
  }

  const firstUser = transcript.find((m) => m.role === "user");
  const lastAssistant = [...transcript].reverse().find((m) => m.role === "assistant");
  const userContent = firstUser?.content?.slice(0, 80) || "No user response";
  const direction = callType === "inbound" ? "Incoming" : "Outgoing";

  return `${direction} call (${callStatus}). User: "${userContent}"${
    lastAssistant ? ` — Lexa: "${lastAssistant.content.slice(0, 60)}"` : ""
  }`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("[lexa-webhook] Received webhook payload, session:", payload.session_id);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse transcript (chat comes as JSON string from Millis AI)
    let transcript: Array<{ role: string; content: string }> = [];
    try {
      if (typeof payload.chat === "string") {
        transcript = JSON.parse(payload.chat);
      } else if (Array.isArray(payload.chat)) {
        transcript = payload.chat;
      }
    } catch (e) {
      console.warn("[lexa-webhook] Failed to parse chat:", e.message);
    }

    // Determine call type
    const voipFrom = payload.voip?.from || "";
    const voipTo = payload.voip?.to || "";
    const hasCampaignId = payload.metadata?.campaign_id || null;
    let callType = "unknown";
    if (hasCampaignId) {
      callType = "campaign";
    } else if (voipFrom === LEXA_PHONE || voipFrom.includes("7787439520")) {
      callType = "outbound";
    } else {
      callType = "inbound";
    }

    // Calculate total cost from cost_breakdown
    const costBreakdown = payload.cost_breakdown || [];
    const totalCost = costBreakdown.reduce(
      (sum: number, item: { credit?: number }) => sum + (item.credit || 0),
      0
    );

    // Analyze sentiment
    const sentiment = analyzeSentiment(transcript);

    // Generate summary
    const summary = generateSummary(transcript, payload.call_status || "unknown", callType);

    // Extract average latency
    const avgLatency = payload.call_metrics?.utterance_latency?.avg || 0;

    // Build call record
    const callRecord = {
      session_id: payload.session_id || payload.call_id || `unknown_${Date.now()}`,
      agent_id: payload.agent_id || "-OmNNf485Na8Bw82RSfz",
      call_status: payload.call_status || "unknown",
      duration_seconds: payload.duration || 0,
      transcript,
      cost_breakdown: costBreakdown,
      total_cost: totalCost,
      call_metrics: payload.call_metrics || null,
      voip: payload.voip || null,
      caller_number: voipFrom,
      callee_number: voipTo,
      recording_url: payload.recording?.recording_url || null,
      metadata: payload.metadata || {},
      sentiment,
      call_type: callType,
      campaign_id: hasCampaignId,
      summary,
      action_items: [],
      tags: [],
    };

    // Upsert into lexa_calls (session_id is unique)
    const { data: insertedCall, error: insertError } = await supabase
      .from("lexa_calls")
      .upsert(callRecord, { onConflict: "session_id" })
      .select()
      .single();

    if (insertError) {
      console.error("[lexa-webhook] Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[lexa-webhook] Call record saved:", insertedCall?.id);

    // ── Dual-write to OpsCenter (ops_data) ──────────────────────────
    try {
      const durationMin = Math.floor((payload.duration || 0) / 60);
      const durationSec = (payload.duration || 0) % 60;
      const dirLabel = callType === "inbound" ? "Inbound" : callType === "outbound" ? "Outbound" : "Campaign";
      const feedTitle = `${dirLabel} call${voipFrom ? ` from ${voipFrom}` : ""} — ${payload.call_status || "unknown"}, ${durationMin}m ${durationSec}s`;

      // 1. Insert feed activity record (shows in dashboard feed)
      await supabase.from("ops_data").insert({
        app_id: LEXA_APP_ID,
        block_id: LEXA_FEED_BLOCK_ID,
        item_type: "activity",
        title: feedTitle,
        status: payload.call_status || "unknown",
        data: {
          caller_number: voipFrom,
          call_type: callType,
          call_status: payload.call_status,
          duration: payload.duration || 0,
          sentiment,
          cost: totalCost,
          session_id: callRecord.session_id,
        },
        metadata: { agent: "Lexa" },
        user_id: MANI_USER_ID,
      });

      // 2. Insert call record for the Call Log table (item_type: "call")
      await supabase.from("ops_data").insert({
        app_id: LEXA_APP_ID,
        item_type: "call",
        title: summary,
        status: payload.call_status || "unknown",
        data: {
          caller_number: voipFrom || "Unknown",
          call_type: callType,
          call_status: payload.call_status,
          duration: payload.duration || 0,
          sentiment,
          cost: totalCost,
          session_id: callRecord.session_id,
          recording_url: callRecord.recording_url,
        },
        metadata: { agent: "Lexa" },
        user_id: MANI_USER_ID,
      });

      console.log("[lexa-webhook] OpsCenter feed + call records written");
    } catch (opsError) {
      // Don't fail the webhook if OpsCenter write fails
      console.error("[lexa-webhook] OpsCenter dual-write error:", opsError.message);
    }

    // Update daily metrics (upsert for today)
    const today = new Date().toISOString().split("T")[0];
    const { data: existingMetric } = await supabase
      .from("lexa_daily_metrics")
      .select("*")
      .eq("date", today)
      .single();

    const isAnswered = ["user-ended", "agent-ended", "api-ended"].includes(
      payload.call_status || ""
    );
    const isVoicemail = ["voicemail-message", "voicemail-hangup"].includes(
      payload.call_status || ""
    );
    const isFailed = ["error", "timeout"].includes(payload.call_status || "");

    if (existingMetric) {
      // Update existing
      const newTotal = existingMetric.total_calls + 1;
      const newDuration = existingMetric.total_duration_seconds + (payload.duration || 0);
      await supabase
        .from("lexa_daily_metrics")
        .update({
          total_calls: newTotal,
          inbound_calls: existingMetric.inbound_calls + (callType === "inbound" ? 1 : 0),
          outbound_calls: existingMetric.outbound_calls + (callType === "outbound" ? 1 : 0),
          campaign_calls: existingMetric.campaign_calls + (callType === "campaign" ? 1 : 0),
          total_duration_seconds: newDuration,
          avg_duration_seconds: newDuration / newTotal,
          total_cost: existingMetric.total_cost + totalCost,
          calls_answered: existingMetric.calls_answered + (isAnswered ? 1 : 0),
          calls_voicemail: existingMetric.calls_voicemail + (isVoicemail ? 1 : 0),
          calls_failed: existingMetric.calls_failed + (isFailed ? 1 : 0),
          avg_latency_ms: avgLatency
            ? (existingMetric.avg_latency_ms * existingMetric.total_calls + avgLatency) / newTotal
            : existingMetric.avg_latency_ms,
        })
        .eq("date", today);
    } else {
      // Insert new day
      await supabase.from("lexa_daily_metrics").insert({
        date: today,
        total_calls: 1,
        inbound_calls: callType === "inbound" ? 1 : 0,
        outbound_calls: callType === "outbound" ? 1 : 0,
        campaign_calls: callType === "campaign" ? 1 : 0,
        total_duration_seconds: payload.duration || 0,
        avg_duration_seconds: payload.duration || 0,
        total_cost: totalCost,
        calls_answered: isAnswered ? 1 : 0,
        calls_voicemail: isVoicemail ? 1 : 0,
        calls_failed: isFailed ? 1 : 0,
        avg_latency_ms: avgLatency,
      });
    }

    // ── Update OpsCenter overview + daily_metric records ──────────
    try {
      const { data: allMetrics } = await supabase
        .from("lexa_daily_metrics")
        .select("total_calls, calls_answered, calls_voicemail, calls_failed, total_duration_seconds, total_cost, avg_latency_ms, inbound_calls, outbound_calls, campaign_calls");

      if (allMetrics && allMetrics.length > 0) {
        const totals = allMetrics.reduce(
          (acc: any, m: any) => ({
            total_calls: acc.total_calls + (m.total_calls || 0),
            calls_answered: acc.calls_answered + (m.calls_answered || 0),
            calls_voicemail: acc.calls_voicemail + (m.calls_voicemail || 0),
            calls_failed: acc.calls_failed + (m.calls_failed || 0),
            total_duration: acc.total_duration + (m.total_duration_seconds || 0),
            total_cost: acc.total_cost + (m.total_cost || 0),
            latency_sum: acc.latency_sum + (m.avg_latency_ms || 0),
            inbound: acc.inbound + (m.inbound_calls || 0),
            outbound: acc.outbound + (m.outbound_calls || 0),
            campaign: acc.campaign + (m.campaign_calls || 0),
          }),
          { total_calls: 0, calls_answered: 0, calls_voicemail: 0, calls_failed: 0, total_duration: 0, total_cost: 0, latency_sum: 0, inbound: 0, outbound: 0, campaign: 0 }
        );

        const { data: todayData } = await supabase
          .from("lexa_daily_metrics")
          .select("total_calls")
          .eq("date", today)
          .single();

        const answerRate = totals.total_calls > 0
          ? Math.round((totals.calls_answered / totals.total_calls) * 100)
          : 0;
        const avgDuration = totals.total_calls > 0
          ? Math.round(totals.total_duration / totals.total_calls)
          : 0;
        const latencyAvg = allMetrics.length > 0
          ? Math.round(totals.latency_sum / allMetrics.length)
          : 0;

        // Update overview record for metric cards
        await supabase.from("ops_data").update({
          data: {
            type: "overview",
            total_calls: totals.total_calls,
            calls_answered: totals.calls_answered,
            calls_voicemail: totals.calls_voicemail,
            calls_failed: totals.calls_failed,
            answer_rate: answerRate,
            avg_duration_seconds: avgDuration,
            total_cost: Math.round(totals.total_cost * 100) / 100,
            avg_latency_ms: latencyAvg,
            inbound_calls: totals.inbound,
            outbound_calls: totals.outbound,
            campaign_calls: totals.campaign,
            calls_today: todayData?.total_calls || 0,
            last_updated: new Date().toISOString(),
          },
        }).eq("id", LEXA_OVERVIEW_ID);

        // Upsert daily_metric record for Performance table
        const { data: existingOpsDaily } = await supabase
          .from("ops_data")
          .select("id")
          .eq("app_id", LEXA_APP_ID)
          .eq("item_type", "daily_metric")
          .eq("title", today)
          .maybeSingle();

        const dailyOpsData = {
          total_calls: todayData?.total_calls || 1,
          calls_answered: (existingMetric?.calls_answered || 0) + (isAnswered ? 1 : 0),
          calls_voicemail: (existingMetric?.calls_voicemail || 0) + (isVoicemail ? 1 : 0),
          calls_failed: (existingMetric?.calls_failed || 0) + (isFailed ? 1 : 0),
          avg_duration_seconds: existingMetric
            ? (existingMetric.total_duration_seconds + (payload.duration || 0)) / ((existingMetric.total_calls || 0) + 1)
            : (payload.duration || 0),
          total_cost: (existingMetric?.total_cost || 0) + totalCost,
        };

        if (existingOpsDaily) {
          await supabase.from("ops_data").update({ data: dailyOpsData }).eq("id", existingOpsDaily.id);
        } else {
          await supabase.from("ops_data").insert({
            app_id: LEXA_APP_ID,
            item_type: "daily_metric",
            title: today,
            status: "active",
            data: dailyOpsData,
            metadata: { agent: "Lexa" },
            user_id: MANI_USER_ID,
          });
        }

        console.log("[lexa-webhook] OpsCenter overview + daily_metric updated");
      }
    } catch (overviewError) {
      console.error("[lexa-webhook] Overview update error:", overviewError.message);
    }

    // Update campaign counters if applicable
    if (hasCampaignId) {
      // Try lookup by campaign UUID (our runner) first, then millis_campaign_id
      let campaign: any = null;
      const { data: byId } = await supabase
        .from("lexa_campaigns")
        .select("*")
        .eq("id", hasCampaignId)
        .maybeSingle();

      if (byId) {
        campaign = byId;
      } else {
        const { data: byMillis } = await supabase
          .from("lexa_campaigns")
          .select("*")
          .eq("millis_campaign_id", hasCampaignId)
          .maybeSingle();
        campaign = byMillis;
      }

      if (campaign) {
        const newCallsMade = campaign.calls_made + 1;
        const newTotalDuration =
          campaign.avg_duration_seconds * campaign.calls_made + (payload.duration || 0);
        await supabase
          .from("lexa_campaigns")
          .update({
            calls_made: newCallsMade,
            calls_answered: campaign.calls_answered + (isAnswered ? 1 : 0),
            calls_voicemail: campaign.calls_voicemail + (isVoicemail ? 1 : 0),
            calls_failed: campaign.calls_failed + (isFailed ? 1 : 0),
            avg_duration_seconds: newTotalDuration / newCallsMade,
            total_cost: campaign.total_cost + totalCost,
          })
          .eq("id", campaign.id);
      }
    }

    // ── Update lead status after campaign call ──────────────────────
    const leadId = payload.metadata?.lead_id;
    if (hasCampaignId && leadId) {
      try {
        const leadStatus = isAnswered ? "completed" : isFailed ? "failed" : "completed";
        const callResult = isAnswered
          ? "answered"
          : isVoicemail
          ? "voicemail"
          : isFailed
          ? "failed"
          : "no-answer";

        // Get current attempts count
        const { data: currentLead } = await supabase
          .from("lexa_leads")
          .select("attempts")
          .eq("id", leadId)
          .maybeSingle();

        await supabase
          .from("lexa_leads")
          .update({
            status: leadStatus,
            call_session_id: callRecord.session_id,
            call_result: callResult,
            call_duration_seconds: payload.duration || 0,
            call_sentiment: sentiment,
            call_summary: summary,
            attempts: (currentLead?.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
          })
          .eq("id", leadId);

        console.log(`[lexa-webhook] Lead ${leadId} updated: ${leadStatus} (${callResult})`);
      } catch (leadErr: any) {
        console.error("[lexa-webhook] Lead update error:", leadErr.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, call_id: insertedCall?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[lexa-webhook] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
