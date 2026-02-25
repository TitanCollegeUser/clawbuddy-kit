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
    let scopedUserId: string | null = null;

    if (apiKey && apiKey === expectedKey) {
      authenticated = true;
      // API key auth: no user scoping (returns all offices)
    } else if (webhookSecret) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("webhook_secret", webhookSecret)
        .single();
      if (userData && !userError) {
        authenticated = true;
        scopedUserId = userData.id;
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional query params
    const url = new URL(req.url);
    const includeAgents = url.searchParams.get("include_agents") === "true";

    // Build query
    let query = supabase.from("offices").select("*").order("created_at", { ascending: false });

    // Scope to user if authenticated via webhook secret
    if (scopedUserId) {
      query = query.eq("user_id", scopedUserId);
    }

    const { data: offices, error: officesError } = await query;
    if (officesError) throw officesError;

    // Get agent counts for each office
    const officeIds = (offices || []).map((o: { id: string }) => o.id);
    let agentCounts: Record<string, number> = {};
    let agentsByOffice: Record<string, unknown[]> = {};

    if (officeIds.length > 0) {
      const { data: agents, error: agentsError } = await supabase
        .from("office_agents")
        .select("*")
        .in("office_id", officeIds);

      if (!agentsError && agents) {
        for (const agent of agents) {
          agentCounts[agent.office_id] = (agentCounts[agent.office_id] || 0) + 1;
          if (includeAgents) {
            if (!agentsByOffice[agent.office_id]) agentsByOffice[agent.office_id] = [];
            agentsByOffice[agent.office_id].push(agent);
          }
        }
      }
    }

    const result = (offices || []).map((office: Record<string, unknown>) => {
      const entry: Record<string, unknown> = {
        id: office.id,
        name: office.name,
        director_name: office.director_name,
        description: office.description,
        created_at: office.created_at,
        agent_count: agentCounts[office.id as string] || 0,
      };
      if (includeAgents) {
        entry.agents = agentsByOffice[office.id as string] || [];
      }
      return entry;
    });

    return new Response(JSON.stringify({ offices: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
