import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_EVENT_TYPES = [
  "status_change",
  "thought",
  "task_start",
  "task_complete",
  "delegation",
  "movement",
  "collection",
  "report",
  "director_directive",
  "error",
];

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

    const body = await req.json();
    const {
      office_id,
      agent_name,
      status,
      thought,
      event_type,
      task_id,
      target_agent,
      metadata,
    } = body;

    if (!office_id || !agent_name) {
      return new Response(
        JSON.stringify({ error: "office_id and agent_name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (event_type && !VALID_EVENT_TYPES.includes(event_type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update agent state
    const updateFields: Record<string, unknown> = {};
    if (status) updateFields.status = status;
    if (thought !== undefined) updateFields.current_thought = thought;
    if (task_id !== undefined) updateFields.current_task_id = task_id;
    if (target_agent !== undefined) updateFields.target_agent = target_agent;
    if (metadata) updateFields.metadata = metadata;

    if (Object.keys(updateFields).length > 0) {
      await supabase
        .from("office_agents")
        .update(updateFields)
        .eq("office_id", office_id)
        .eq("name", agent_name);
    }

    // Insert event
    if (event_type) {
      await supabase.from("office_events").insert({
        office_id,
        agent_name,
        event_type,
        task_id: task_id || null,
        payload: {
          status,
          thought,
          target_agent,
          ...(metadata || {}),
        },
      });
    }

    // Log activity
    const actionMap: Record<string, string> = {
      status_change: `Status → ${status}`,
      thought: `Thinking: "${thought}"`,
      task_start: `Started working on task`,
      task_complete: `Completed task`,
      delegation: `Delegating to ${target_agent}`,
      movement: `Moving`,
      collection: `Collecting from ${target_agent}`,
      report: `Reporting results`,
      director_directive: `Directive issued`,
      error: `Error occurred`,
    };

    const logType =
      event_type === "task_complete"
        ? "completion"
        : event_type === "delegation"
          ? "delegation"
          : event_type === "error"
            ? "error"
            : "info";

    await supabase.from("office_activity_log").insert({
      office_id,
      agent_name,
      action: actionMap[event_type || "status_change"] || `${event_type}: ${status || thought || ""}`,
      log_type: logType,
      task_id: task_id || null,
    });

    // On task_complete, update task progress
    if (event_type === "task_complete" && task_id) {
      const { data: task } = await supabase
        .from("office_tasks")
        .select("*")
        .eq("id", task_id)
        .single();

      if (task) {
        const completed = [...(task.completed_agents || [])];
        if (!completed.includes(agent_name)) {
          completed.push(agent_name);
        }
        const total = task.total_agents || task.assigned_agents?.length || 1;
        const progress = completed.length / total;
        const isComplete = completed.length >= total;

        await supabase
          .from("office_tasks")
          .update({
            completed_agents: completed,
            progress,
            status: isComplete ? "completed" : "in_progress",
            completed_at: isComplete ? new Date().toISOString() : null,
          })
          .eq("id", task_id);
      }
    }

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
