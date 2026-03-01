import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
};

// --- Auth (reused from make-proxy / intelligence-sync) ---

async function authenticate(
  req: Request
): Promise<{ userId: string | null; error?: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Support both JWT (frontend) and webhook secret (agents)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (user?.id && !error) return { userId: user.id };
  }

  const secret =
    req.headers.get("x-webhook-secret") || req.headers.get("x-api-key");

  if (!secret) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("webhook_secret", secret)
    .maybeSingle();
  if (userData?.id) return { userId: userData.id };

  const { data: agentData } = await supabase
    .from("ai_agents")
    .select("id, user_id")
    .eq("webhook_secret", secret)
    .maybeSingle();
  if (agentData?.user_id) return { userId: agentData.user_id };

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

// --- YouTube metadata extraction ---

async function getYouTubeMetadata(url: string): Promise<{ title: string; author: string; videoId: string } | null> {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1).split("?")[0];
    } else {
      videoId = u.searchParams.get("v") || "";
    }
  } catch {
    return null;
  }
  if (!videoId) return null;

  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (resp.ok) {
      const data = await resp.json();
      return { title: data.title || "Unknown", author: data.author_name || "Unknown", videoId };
    }
  } catch { /* */ }
  return { title: "Unknown", author: "Unknown", videoId };
}

// --- URL content extraction ---

async function extractUrlContent(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ClawBuddy/1.0)" },
  });
  if (!resp.ok) throw new Error(`Failed to fetch URL: ${resp.status}`);

  const html = await resp.text();

  // Strip HTML tags, scripts, styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to ~15K chars to stay within AI token limits
  if (text.length > 15000) {
    text = text.substring(0, 15000) + "\n\n[Content truncated at 15,000 characters]";
  }

  return text;
}

// --- AI analysis ---

const FORGE_SYSTEM_PROMPT = `You are a technical architect analyzing content to identify buildable AI tools, skills, and applications for the ClawBuddy platform.

ClawBuddy supports:
- **Skills**: API integrations registered in Skill Factory (REST, SMTP, GraphQL, webhook, custom protocols)
- **OpsCenter Apps**: Dashboard apps with pages, blocks (metric cards, tables, feeds, charts), and data storage
- **Automations**: Scheduled tasks (pg_cron) that run edge functions on a schedule
- **Edge Functions**: Deno-based serverless functions deployed to Supabase
- **Tools**: Standalone utilities that agents can use
- **Make.com Scenarios**: No-code automation workflows

Given the input content, analyze it and identify what can be built. For each buildable item, provide:

1. name — short kebab-case name (e.g., "stripe-webhook-handler")
2. type — one of: "skill", "ops_app", "automation", "edge_function", "tool", "make_scenario"
3. description — what it does (1-2 sentences)
4. complexity — "simple" (< 1 hour), "moderate" (1-4 hours), "complex" (4+ hours)
5. recommended_agent — "Sherlock" (Claude Code, complex builds), "Ray" (OpenClaw, simpler tasks), or "Sub-Agent" (specialized)
6. recommended_model — AI model best suited (e.g., "claude-opus-4-6", "gpt-4o", "gpt-4o-mini")
7. build_steps — array of 3-7 specific implementation steps
8. apis_needed — external APIs or services required (empty array if none)
9. estimated_effort — human-readable estimate (e.g., "30 minutes", "2 hours")
10. priority — "high" (immediately useful), "medium" (nice to have), "low" (future consideration)

Return a JSON object with:
{
  "summary": "Brief overview of what was analyzed",
  "source_type": "What kind of content this is (video tutorial, API docs, etc.)",
  "items": [ ...array of buildable items... ],
  "total_items": number,
  "key_technologies": ["tech1", "tech2"]
}

Focus on practical, immediately buildable items. Prioritize by impact. Be specific about implementation steps.`;

async function analyzeWithAI(content: string, inputType: string): Promise<any> {
  const apiKey = Deno.env.get("KIMI_API_KEY");
  if (!apiKey) throw new Error("KIMI_API_KEY not configured");

  const userMessage = `Analyze the following ${inputType} content and identify what can be built:\n\n${content}`;

  const resp = await fetch("https://api.moonshot.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "kimi-k2.5",
      messages: [
        { role: "system", content: FORGE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Kimi API error: ${resp.status} - ${errText}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from AI");

  return JSON.parse(text);
}

// --- Helpers ---

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, error: authError } = await authenticate(req);
    if (authError) return authError;

    const body = await req.json();
    const action = body.action as string;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // --- ANALYZE ---
    if (action === "analyze") {
      const inputType = body.input_type as string;
      const content = body.content as string | undefined;
      // Support both single url and urls array (backward compatible)
      const singleUrl = body.url as string | undefined;
      const urlsArray = body.urls as string[] | undefined;
      const urls: string[] = urlsArray || (singleUrl ? [singleUrl] : []);

      if (!inputType) {
        return jsonResponse({ error: "input_type is required" }, 400);
      }

      let textToAnalyze = "";
      let inputSource = "";

      // Process based on input type
      if (inputType === "transcript" && content) {
        // User-pasted transcript — enrich with YouTube metadata if URLs provided
        textToAnalyze = content;
        inputSource = urls.join(", ");

        // Fetch metadata for all YouTube URLs and prepend
        const metaHeaders: string[] = [];
        for (const u of urls) {
          if (isYouTubeUrl(u)) {
            const meta = await getYouTubeMetadata(u);
            if (meta) {
              metaHeaders.push(`[YouTube Video: "${meta.title}" by ${meta.author}]`);
            }
          }
        }
        if (metaHeaders.length > 0) {
          textToAnalyze = metaHeaders.join("\n") + "\n\n" + content;
        }
      } else if ((inputType === "url" || inputType === "transcript") && urls.length > 0) {
        // Fetch and extract content from all URLs
        const parts: string[] = [];
        for (let i = 0; i < urls.length; i++) {
          const u = urls[i];
          try {
            if (isYouTubeUrl(u)) {
              // For YouTube URLs without pasted transcript, note metadata
              const meta = await getYouTubeMetadata(u);
              const label = meta
                ? `[YouTube Video ${i + 1}: "${meta.title}" by ${meta.author} — ${u}]`
                : `[YouTube Video ${i + 1}: ${u}]`;
              // Try to fetch page content for context
              try {
                const pageContent = await extractUrlContent(u);
                parts.push(`${label}\n${pageContent}`);
              } catch {
                parts.push(label);
              }
            } else {
              const pageContent = await extractUrlContent(u);
              parts.push(`[Source ${i + 1}: ${u}]\n${pageContent}`);
            }
          } catch (fetchErr: any) {
            parts.push(`[Source ${i + 1}: ${u} — Error: ${fetchErr.message}]`);
          }
        }
        textToAnalyze = parts.join("\n\n---\n\n");
        inputSource = urls.join(", ");
      } else if (content) {
        // Use provided text content
        textToAnalyze = content;
        inputSource = urls.join(", ") || "";
      } else {
        return jsonResponse(
          { error: "Provide either 'content' (text) or 'urls' / 'url'" },
          400
        );
      }

      // Create analysis record (status: analyzing)
      const { data: record, error: insertErr } = await supabase
        .from("forge_analyses")
        .insert({
          user_id: userId === "env-key" ? null : userId,
          input_type: inputType,
          input_source: inputSource,
          input_text: textToAnalyze.substring(0, 50000), // Cap storage
          status: "analyzing",
        })
        .select()
        .single();

      if (insertErr) {
        return jsonResponse({ error: "Failed to create analysis record", details: insertErr.message }, 500);
      }

      // Run AI analysis
      try {
        const analysis = await analyzeWithAI(textToAnalyze, inputType);

        // Update record with results
        await supabase
          .from("forge_analyses")
          .update({
            analysis,
            status: "complete",
            updated_at: new Date().toISOString(),
          })
          .eq("id", record.id);

        return jsonResponse({
          id: record.id,
          status: "complete",
          analysis,
        });
      } catch (aiErr: any) {
        // Update record with error
        await supabase
          .from("forge_analyses")
          .update({
            status: "failed",
            error_message: aiErr.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", record.id);

        return jsonResponse(
          { id: record.id, status: "failed", error: aiErr.message },
          500
        );
      }
    }

    // --- LIST ---
    if (action === "list") {
      const limit = body.limit || 20;
      const query = supabase
        .from("forge_analyses")
        .select("id, input_type, input_source, status, analysis, tasks_created, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (userId !== "env-key") {
        query.eq("user_id", userId);
      }

      const { data, error: listErr } = await query;
      if (listErr) {
        return jsonResponse({ error: listErr.message }, 500);
      }

      return jsonResponse({ analyses: data || [] });
    }

    // --- GET ---
    if (action === "get") {
      const analysisId = body.analysis_id;
      if (!analysisId) {
        return jsonResponse({ error: "analysis_id is required" }, 400);
      }

      const { data, error: getErr } = await supabase
        .from("forge_analyses")
        .select("*")
        .eq("id", analysisId)
        .single();

      if (getErr || !data) {
        return jsonResponse({ error: "Analysis not found" }, 404);
      }

      return jsonResponse({ analysis: data });
    }

    // --- VIDEO_INFO (get YouTube video metadata) ---
    if (action === "video_info") {
      const url = body.url as string;
      if (!url) {
        return jsonResponse({ error: "url is required" }, 400);
      }
      const meta = await getYouTubeMetadata(url);
      if (!meta) {
        return jsonResponse({ error: "Could not extract video info" }, 400);
      }
      return jsonResponse(meta);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error("Forge analyzer error:", err);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
