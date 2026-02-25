import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GoalAnalysisRequest {
  goal: string;
  goal_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  user_notes?: string;
}

interface Assumption {
  category: string;
  value: string;
  explanation: string;
}

interface Metric {
  name: string;
  value: number | string;
  unit?: string;
}

interface ActionItem {
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  description: string;
  estimated_time: string;
  metric_impact: string;
}

interface GoalAnalysis {
  title: string;
  assumptions: Assumption[];
  metrics: Metric[];
  action_items: ActionItem[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication - support webhook secret, user JWT, or API key
    const webhookSecret = req.headers.get("x-webhook-secret");
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    let userId: string | null = null;

    if (webhookSecret) {
      // Webhook secret auth for Ray/OpenClaw
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("webhook_secret", webhookSecret)
        .single();

      if (userError || !userData) {
        console.log("Invalid webhook secret");
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid webhook secret" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = userData.id;
      console.log(`Goal analyzer authenticated via webhook_secret, user: ${userId}`);
    } else if (authHeader?.startsWith("Bearer ")) {
      // User JWT auth for browser/frontend
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userSupabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        console.log("Invalid user auth token");
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid auth token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = claimsData.claims.sub as string;
      console.log(`Goal analyzer authenticated via JWT, user: ${userId}`);
    } else {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No authentication provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { goal, goal_type, user_notes } = await req.json() as GoalAnalysisRequest;

    if (!goal || !goal_type) {
      return new Response(
        JSON.stringify({ error: "Goal and goal_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing goal: "${goal}" (${goal_type})`);

    const systemPrompt = `You are a business strategy expert who helps entrepreneurs reverse-engineer their goals into actionable tasks.

When given a goal, you should:
1. Make realistic industry-standard assumptions about metrics like close rates, conversion rates, pricing, etc.
2. Calculate the required metrics to achieve the goal
3. Generate specific, actionable tasks with priorities

Be specific with numbers. Use industry averages when the user doesn't provide specifics.
Consider the goal timeframe (${goal_type}) when generating action items.`;

    const userPrompt = `My goal is: "${goal}"

Goal timeframe: ${goal_type}
${user_notes ? `Additional context: ${user_notes}` : ''}

Analyze this goal and provide:
1. Your assumptions about relevant metrics (close rate, conversion rate, pricing, etc.)
2. Calculated metrics showing what's needed to achieve the goal
3. 5-8 specific action items I should focus on`;

    const tools = [{
      type: "function",
      function: {
        name: "analyze_goal",
        description: "Analyze a business goal and break it into actionable items with assumptions and metrics",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "A concise title summarizing the goal"
            },
            assumptions: {
              type: "array",
              description: "Industry-standard assumptions made for the analysis",
              items: {
                type: "object",
                properties: {
                  category: { type: "string", description: "Category like 'Close Rate', 'Package Size', 'Conversion Rate'" },
                  value: { type: "string", description: "The assumed value like '20%' or '$2,500/month'" },
                  explanation: { type: "string", description: "Brief explanation of why this assumption" }
                },
                required: ["category", "value", "explanation"]
              }
            },
            metrics: {
              type: "array",
              description: "Calculated metrics showing what's needed to achieve the goal",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Metric name like 'Target Revenue', 'Leads Needed'" },
                  value: { type: "string", description: "The calculated value" },
                  unit: { type: "string", description: "Optional unit like 'USD', 'per week'" }
                },
                required: ["name", "value"]
              }
            },
            action_items: {
              type: "array",
              description: "Specific actionable tasks to achieve the goal",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clear, actionable task title" },
                  priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"], description: "Task priority" },
                  description: { type: "string", description: "Detailed description of what to do" },
                  estimated_time: { type: "string", description: "Estimated time like '2 hours', '1 day'" },
                  metric_impact: { type: "string", description: "How this task impacts the goal metrics" }
                },
                required: ["title", "priority", "description", "estimated_time", "metric_impact"]
              }
            }
          },
          required: ["title", "assumptions", "metrics", "action_items"]
        }
      }
    }];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_goal" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received:", JSON.stringify(aiResponse).slice(0, 500));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_goal") {
      throw new Error("Unexpected AI response format");
    }

    const analysis: GoalAnalysis = JSON.parse(toolCall.function.arguments);
    console.log("Parsed analysis with", analysis.action_items?.length, "action items");

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Goal analyzer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
