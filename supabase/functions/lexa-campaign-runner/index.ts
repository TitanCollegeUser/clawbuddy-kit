import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MILLIS_API_KEY = Deno.env.get("MILLIS_API_KEY")!;
const MILLIS_BASE_URL = "https://api-west.millis.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { campaign_id, offset = 0 } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from("lexa_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campErr || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found", details: campErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pending leads (batch of 50)
    const batchSize = 50;
    const { data: leads, error: leadsErr } = await supabase
      .from("lexa_leads")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .range(0, batchSize - 1);

    if (leadsErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch leads", details: leadsErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!leads || leads.length === 0) {
      // No more pending leads — mark campaign as complete if all done
      const { count: pendingCount } = await supabase
        .from("lexa_leads")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign_id)
        .eq("status", "pending");

      if (pendingCount === 0) {
        await supabase
          .from("lexa_campaigns")
          .update({ status: "completed" })
          .eq("id", campaign_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "No pending leads", calls_initiated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign status to running
    await supabase
      .from("lexa_campaigns")
      .update({ status: "running" })
      .eq("id", campaign_id);

    const fromPhone = campaign.from_phone || "+17787439520";
    const agentId = campaign.agent_id || "-OmNNf485Na8Bw82RSfz";
    const delayMs = (campaign.call_delay_seconds || 5) * 1000;

    let callsInitiated = 0;
    let callsFailed = 0;

    console.log(
      `[lexa-campaign-runner] Starting batch: ${leads.length} leads for campaign "${campaign.name}"`
    );

    for (const lead of leads) {
      try {
        // Update lead status to calling
        await supabase
          .from("lexa_leads")
          .update({ status: "calling", last_attempt_at: new Date().toISOString() })
          .eq("id", lead.id);

        // Build metadata from lead fields
        const metadata: Record<string, unknown> = {
          campaign_id: campaign.id,
          lead_id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || "",
          company: lead.company || "",
          ...((lead.custom_fields as Record<string, string>) || {}),
        };

        // Call Millis AI outbound
        const millisRes = await fetch(`${MILLIS_BASE_URL}/start_outbound_call`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: MILLIS_API_KEY,
          },
          body: JSON.stringify({
            agent_id: agentId,
            from_phone: fromPhone,
            to_phone: lead.phone,
            metadata,
            include_metadata_in_prompt: true,
          }),
        });

        if (!millisRes.ok) {
          const errText = await millisRes.text();
          console.error(
            `[lexa-campaign-runner] Millis API error for lead ${lead.id}: ${millisRes.status} ${errText}`
          );

          // Mark lead as failed
          await supabase
            .from("lexa_leads")
            .update({
              status: "failed",
              call_result: "failed",
              attempts: (lead.attempts || 0) + 1,
            })
            .eq("id", lead.id);

          callsFailed++;
        } else {
          const result = await millisRes.json();
          console.log(
            `[lexa-campaign-runner] Call initiated for ${lead.name} (${lead.phone}): session=${result.session_id || "unknown"}`
          );
          callsInitiated++;
        }
      } catch (leadErr: any) {
        console.error(
          `[lexa-campaign-runner] Error processing lead ${lead.id}:`,
          leadErr.message
        );
        await supabase
          .from("lexa_leads")
          .update({
            status: "failed",
            call_result: "failed",
            attempts: (lead.attempts || 0) + 1,
          })
          .eq("id", lead.id);
        callsFailed++;
      }

      // Delay between calls
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Check if more pending leads remain — if so, invoke self for next batch
    const { count: remainingCount } = await supabase
      .from("lexa_leads")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id)
      .eq("status", "pending");

    let continuationScheduled = false;
    if (remainingCount && remainingCount > 0) {
      // Self-invoke for next batch (fire-and-forget)
      try {
        await supabase.functions.invoke("lexa-campaign-runner", {
          body: { campaign_id, offset: offset + batchSize },
        });
        continuationScheduled = true;
      } catch (contErr: any) {
        console.error("[lexa-campaign-runner] Failed to schedule continuation:", contErr.message);
      }
    } else {
      // All leads processed — mark campaign complete
      await supabase
        .from("lexa_campaigns")
        .update({ status: "completed" })
        .eq("id", campaign_id);
    }

    console.log(
      `[lexa-campaign-runner] Batch complete: ${callsInitiated} calls initiated, ${callsFailed} failed, ${remainingCount || 0} remaining`
    );

    return new Response(
      JSON.stringify({
        success: true,
        calls_initiated: callsInitiated,
        calls_failed: callsFailed,
        remaining: remainingCount || 0,
        continuation_scheduled: continuationScheduled,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[lexa-campaign-runner] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
