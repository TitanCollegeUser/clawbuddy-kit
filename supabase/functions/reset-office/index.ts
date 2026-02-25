import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Dual auth: x-api-key OR x-webhook-secret
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("AI_TASKS_API_KEY");
    const webhookSecret = req.headers.get("x-webhook-secret");

    let authenticated = false;

    if (apiKey && apiKey === expectedKey) {
      authenticated = true;
    } else if (webhookSecret) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("webhook_secret", webhookSecret)
        .single();
      if (userData && !userError) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { office_id } = await req.json();

    if (!office_id) {
      return new Response(
        JSON.stringify({ error: "office_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Reset all agents to idle
    await supabase
      .from("office_agents")
      .update({
        status: "idle",
        current_thought: null,
        current_task_id: null,
        target_agent: null,
      })
      .eq("office_id", office_id);

    // Log the reset
    await supabase.from("office_activity_log").insert({
      office_id,
      agent_name: "System",
      action: "Office reset — all agents returned to idle",
      log_type: "info",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
