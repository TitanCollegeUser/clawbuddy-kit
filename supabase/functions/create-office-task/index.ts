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

    const { office_id, title, client_name, description, assigned_agents } =
      await req.json();

    if (!office_id || !title) {
      return new Response(
        JSON.stringify({ error: "office_id and title are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const agents = assigned_agents || [];

    // Create task
    const { data: task, error: taskError } = await supabase
      .from("office_tasks")
      .insert({
        office_id,
        title,
        client_name: client_name || null,
        description: description || null,
        assigned_agents: agents,
        total_agents: agents.length,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Create director directive event
    await supabase.from("office_events").insert({
      office_id,
      agent_name: "Director",
      event_type: "director_directive",
      task_id: task.id,
      payload: { title, client_name, assigned_agents: agents },
    });

    // Log activity
    await supabase.from("office_activity_log").insert({
      office_id,
      agent_name: "Director",
      action: `New task received: "${title}"`,
      log_type: "task",
      task_id: task.id,
    });

    // Update director status
    const { data: directorAgents } = await supabase
      .from("office_agents")
      .select("id")
      .eq("office_id", office_id)
      .eq("role", "Director")
      .limit(1);

    if (directorAgents && directorAgents.length > 0) {
      await supabase
        .from("office_agents")
        .update({
          status: "delegating",
          current_thought: `Briefing team on: ${title}`,
          current_task_id: task.id,
        })
        .eq("id", directorAgents[0].id);
    }

    return new Response(JSON.stringify({ success: true, task }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
