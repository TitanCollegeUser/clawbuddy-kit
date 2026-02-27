import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Millis AI calls this as GET with query params:
    // ?session_id=...&from=...&to=...&agent_id=...
    const url = new URL(req.url);
    const callerNumber = url.searchParams.get("from") || "";
    const agentId = url.searchParams.get("agent_id") || "";
    const sessionId = url.searchParams.get("session_id") || "";

    console.log(`[lexa-precall] Pre-call lookup for ${callerNumber}, session: ${sessionId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Look up previous calls from this number
    const { data: previousCalls } = await supabase
      .from("lexa_calls")
      .select("id, session_id, call_status, duration_seconds, summary, sentiment, created_at")
      .eq("caller_number", callerNumber)
      .order("created_at", { ascending: false })
      .limit(5);

    const callCount = previousCalls?.length || 0;

    // Build context for Lexa
    let extraPrompt = "";
    const metadata: Record<string, unknown> = {
      caller_number: callerNumber,
      previous_calls: callCount,
      session_id: sessionId,
    };

    if (callCount > 0) {
      const lastCall = previousCalls![0];
      metadata.last_call_date = lastCall.created_at;
      metadata.last_call_summary = lastCall.summary;
      metadata.last_call_sentiment = lastCall.sentiment;

      extraPrompt = `This is a returning caller (${callCount} previous call${callCount > 1 ? "s" : ""}). `;
      extraPrompt += `Their last call was on ${new Date(lastCall.created_at).toLocaleDateString()} — `;
      extraPrompt += `Summary: "${lastCall.summary}". `;
      extraPrompt += `Previous sentiment was ${lastCall.sentiment}. `;
      extraPrompt += `Reference their history naturally to build rapport.`;
    } else {
      extraPrompt = "This is a first-time caller. Be welcoming and introduce yourself clearly.";
    }

    // ── Campaign prompt substitution ────────────────────────────────
    // Millis AI passes metadata (including campaign_id, lead_id) via include_metadata_in_prompt
    // The campaign runner puts campaign_id and lead_id in metadata when starting the call
    const campaignId = url.searchParams.get("campaign_id") || "";
    const leadId = url.searchParams.get("lead_id") || "";

    if (campaignId) {
      try {
        const { data: campaign } = await supabase
          .from("lexa_campaigns")
          .select("ai_prompt, prompt_variables")
          .eq("id", campaignId)
          .single();

        if (campaign?.ai_prompt) {
          let prompt = campaign.ai_prompt;
          // Substitute {{variables}} from metadata
          for (const [key, value] of Object.entries(metadata)) {
            prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value || ""));
          }

          // Look up lead record for custom_fields substitution
          if (leadId) {
            const { data: lead } = await supabase
              .from("lexa_leads")
              .select("*")
              .eq("id", leadId)
              .single();

            if (lead) {
              metadata.lead_name = lead.name;
              metadata.lead_data = lead.custom_fields;
              // Substitute standard lead fields
              prompt = prompt.replace(/\{\{name\}\}/g, lead.name || "");
              prompt = prompt.replace(/\{\{phone\}\}/g, lead.phone || "");
              prompt = prompt.replace(/\{\{email\}\}/g, lead.email || "");
              prompt = prompt.replace(/\{\{company\}\}/g, lead.company || "");
              // Substitute custom fields
              for (const [key, val] of Object.entries((lead.custom_fields as Record<string, string>) || {})) {
                prompt = prompt.replace(
                  new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                  String(val || "")
                );
              }
            }
          }

          extraPrompt = prompt;
          console.log(`[lexa-precall] Campaign prompt substituted for campaign: ${campaignId}`);
        }
      } catch (campErr: any) {
        console.error("[lexa-precall] Campaign lookup error:", campErr.message);
      }
    }

    // Also check if there's a contact record in ops_data (from Jason's leads, etc.)
    // Only for non-campaign calls (campaign calls use lexa_leads instead)
    const cleanNumber = callerNumber.replace(/\D/g, "");
    if (cleanNumber.length >= 10 && !campaignId) {
      const { data: leadData } = await supabase
        .from("ops_data")
        .select("title, data")
        .eq("item_type", "lead")
        .ilike("data->>phone", `%${cleanNumber.slice(-10)}%`)
        .limit(1)
        .single();

      if (leadData) {
        metadata.lead_name = leadData.title;
        metadata.lead_data = leadData.data;
        extraPrompt += ` The caller's name is ${leadData.title}.`;
        if (leadData.data?.company_website) {
          extraPrompt += ` They are from ${leadData.data.company_website}.`;
        }
        if (leadData.data?.ai_summary) {
          extraPrompt += ` Notes: ${leadData.data.ai_summary}`;
        }
      }
    }

    console.log(`[lexa-precall] Returning context: ${callCount} previous calls, campaign: ${campaignId || "none"}`);

    return new Response(
      JSON.stringify({ metadata, extra_prompt: extraPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[lexa-precall] Error:", error.message);
    // Return empty context on error (don't block the call)
    return new Response(
      JSON.stringify({
        metadata: {},
        extra_prompt: "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
