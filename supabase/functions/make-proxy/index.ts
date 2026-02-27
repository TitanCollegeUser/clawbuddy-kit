import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
};

const MAKE_API_TOKEN = Deno.env.get("MAKE_API_TOKEN")!;
const MAKE_TEAM_ID = Deno.env.get("MAKE_TEAM_ID")!;
const MAKE_BASE = "https://us1.make.com/api/v2";

// --- Auth (reused from intelligence-sync) ---

async function authenticate(
  req: Request
): Promise<{ userId: string | null; error?: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const secret =
    req.headers.get("x-webhook-secret") || req.headers.get("x-api-key");

  if (!secret) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Missing authentication" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      ),
    };
  }

  // 1. Check users table
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("webhook_secret", secret)
    .maybeSingle();

  if (userData?.id) return { userId: userData.id };

  // 2. Check ai_agents table
  const { data: agentData } = await supabase
    .from("ai_agents")
    .select("id, user_id")
    .eq("webhook_secret", secret)
    .maybeSingle();

  if (agentData?.user_id) return { userId: agentData.user_id };

  // 3. Fallback to env var
  const configuredKey = Deno.env.get("AI_TASKS_API_KEY");
  if (configuredKey && secret === configuredKey) {
    return { userId: "env-key" };
  }

  return {
    userId: null,
    error: new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }),
  };
}

// --- Make.com API helpers ---

async function makeGet(path: string): Promise<unknown> {
  const resp = await fetch(`${MAKE_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${MAKE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Make.com API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function makePost(
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const resp = await fetch(`${MAKE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${MAKE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Make.com API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// --- Actions ---

interface Scenario {
  id: number;
  name: string;
  islinked: boolean;
  isPaused: boolean;
  scheduling?: unknown;
  description?: string;
}

async function listScenarios(activeOnly: boolean): Promise<unknown> {
  const result = (await makeGet(
    `/scenarios?teamId=${MAKE_TEAM_ID}&pg[limit]=500`
  )) as { scenarios: Scenario[] };

  let scenarios = result.scenarios || [];

  if (activeOnly) {
    scenarios = scenarios.filter((s) => s.islinked && !s.isPaused);
  }

  return {
    success: true,
    action: "list",
    count: scenarios.length,
    scenarios: scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      active: s.islinked && !s.isPaused,
      description: s.description || null,
    })),
  };
}

async function runScenario(
  scenarioId: number,
  data?: Record<string, unknown>
): Promise<unknown> {
  const result = await makePost(`/scenarios/${scenarioId}/run`, {
    responsive: true,
    data: data || {},
  });

  return {
    success: true,
    action: "run",
    scenario_id: scenarioId,
    result,
  };
}

async function getExecution(
  scenarioId: number,
  executionId: string
): Promise<unknown> {
  const result = await makeGet(
    `/scenarios/${scenarioId}/executions/${executionId}`
  );

  return {
    success: true,
    action: "get_execution",
    scenario_id: scenarioId,
    execution_id: executionId,
    result,
  };
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const { userId, error } = await authenticate(req);
    if (error) return error;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Could not resolve user" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({
          error: 'Missing action. Use "run", "list", or "get_execution".',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: unknown;

    switch (action) {
      case "list": {
        const activeOnly =
          body.active_only !== undefined ? body.active_only : true;
        result = await listScenarios(activeOnly);
        break;
      }

      case "run": {
        const { scenario_id, data } = body;
        if (!scenario_id) {
          return new Response(
            JSON.stringify({ error: "Missing required field: scenario_id" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
        result = await runScenario(scenario_id, data);
        break;
      }

      case "get_execution": {
        const { scenario_id, execution_id } = body;
        if (!scenario_id || !execution_id) {
          return new Response(
            JSON.stringify({
              error:
                "Missing required fields: scenario_id and execution_id",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
        result = await getExecution(scenario_id, execution_id);
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${action}. Use "run", "list", or "get_execution".`,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("make-proxy error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
