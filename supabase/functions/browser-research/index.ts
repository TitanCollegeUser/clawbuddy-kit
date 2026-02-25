import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Research Hub app + settings block IDs
const RESEARCH_HUB_APP_ID = "6149611f-1c3b-4906-9c5b-1fa58d0cd7ce";
const SETTINGS_BLOCK_ID = "c5ba5149-1258-4aa2-9eb8-dfa4d566fc37";
const RESEARCH_BLOCK_ID = "fb8e532a-f343-4bcc-b4d1-79ba29ca240e";

interface AIConfig {
  provider: string;
  model: string;
  api_base_url: string;
  api_key_env: string;
  temperature: number;
}

interface ResearchRequest {
  action: "research_url" | "research_topic";
  url?: string;
  topic?: string;
  context?: string;
  store?: boolean;
  app_id?: string;
  block_id?: string;
}

async function getAIConfig(): Promise<AIConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data } = await supabase
    .from("ops_data")
    .select("data")
    .eq("app_id", RESEARCH_HUB_APP_ID)
    .eq("block_id", SETTINGS_BLOCK_ID)
    .eq("item_type", "config")
    .limit(1)
    .maybeSingle();

  if (data?.data?.provider) {
    return {
      provider: data.data.provider,
      model: data.data.model || "gpt-4o-mini",
      api_base_url: data.data.api_base_url || "https://api.openai.com/v1",
      api_key_env: data.data.api_key_env || "OPENAI_API_KEY",
      temperature: data.data.temperature ?? 0.3,
    };
  }

  // Fallback defaults
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    api_base_url: "https://api.openai.com/v1",
    api_key_env: "OPENAI_API_KEY",
    temperature: 0.3,
  };
}

interface ResearchResult {
  title: string;
  source: string;
  summary: string;
  key_points: string[];
  raw_text_length: number;
  researched_at: string;
}

async function fetchAndExtract(url: string): Promise<{ title: string; text: string }> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const html = await resp.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : url;

  // Strip HTML to plain text
  let text = html
    // Remove script/style/nav/header/footer blocks
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    // Convert block elements to newlines
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote)[^>]*>/gi, "\n")
    // Remove remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Clean whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Truncate to ~12K chars for API limits
  if (text.length > 12000) text = text.substring(0, 12000) + "\n\n[...truncated]";

  return { title, text };
}

async function searchWeb(topic: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // Try DuckDuckGo HTML search for broad coverage
  const encoded = encodeURIComponent(topic);
  const resp = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await resp.text();

  // Extract result links and snippets from DDG HTML
  const resultRegex =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < 6) {
    let url = match[1];
    // DDG wraps URLs in a redirect — extract the actual URL
    const uddgMatch = url.match(/uddg=([^&]+)/);
    if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    const snippet = match[3].replace(/<[^>]+>/g, "").trim();
    if (url.startsWith("http") && title) {
      results.push({ title: title.substring(0, 150), url, snippet: snippet.substring(0, 300) });
    }
  }

  // Fallback: DuckDuckGo instant answer API
  if (results.length === 0) {
    const iaResp = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`
    );
    const data = await iaResp.json();
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || topic,
        url: data.AbstractURL,
        snippet: data.AbstractText.substring(0, 300),
      });
    }
    if (data.RelatedTopics) {
      for (const rt of data.RelatedTopics.slice(0, 5)) {
        if (rt.FirstURL && rt.Text) {
          results.push({
            title: rt.Text.substring(0, 100),
            url: rt.FirstURL,
            snippet: rt.Text.substring(0, 300),
          });
        }
      }
    }
  }

  return results;
}

async function summarizeWithAI(
  text: string,
  context: string,
  source: string
): Promise<{ summary: string; key_points: string[]; model_used: string }> {
  const config = await getAIConfig();
  const apiKey = Deno.env.get(config.api_key_env) || Deno.env.get("OPENAI_API_KEY")!;

  const systemPrompt = `You are a research assistant for a busy entrepreneur. Analyze the provided content and return a JSON object with:
- "summary": A concise 2-3 paragraph summary of the most important information
- "key_points": An array of 3-7 bullet points with the most actionable/notable takeaways

Be direct, factual, and focus on what matters for business decisions.${
    context ? `\n\nAdditional context: ${context}` : ""
  }`;

  const userContent = `Source: ${source}\n\nContent:\n${text}`;

  // Anthropic uses a different API format
  if (config.provider === "anthropic") {
    const resp = await fetch(`${config.api_base_url}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2048,
        system: systemPrompt + "\n\nRespond with ONLY a JSON object, no markdown.",
        messages: [{ role: "user", content: userContent }],
        temperature: config.temperature,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await resp.json();
    const content = data.content?.[0]?.text || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

    return {
      summary: parsed.summary || "No summary generated.",
      key_points: parsed.key_points || [],
      model_used: `${config.provider}/${config.model}`,
    };
  }

  // OpenAI-compatible API (OpenAI, Kimi, Groq, etc.)
  const resp = await fetch(`${config.api_base_url}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: config.temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`${config.provider} API error: ${err}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary || "No summary generated.",
    key_points: parsed.key_points || [],
    model_used: `${config.provider}/${config.model}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const body: ResearchRequest = await req.json();
    const action = body.action || "research_url";

    if (action === "research_url") {
      if (!body.url) {
        return new Response(
          JSON.stringify({ error: "Missing required field: url" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch and extract content
      const { title, text } = await fetchAndExtract(body.url);

      // Summarize with AI (uses configured provider from OpsCenter settings)
      const { summary, key_points, model_used } = await summarizeWithAI(
        text,
        body.context || "",
        body.url
      );

      const result: ResearchResult = {
        title,
        source: body.url,
        summary,
        key_points,
        raw_text_length: text.length,
        researched_at: new Date().toISOString(),
      };

      // Always store in Research Hub feed + optionally in custom block
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      await supabase.from("ops_data").insert({
        app_id: RESEARCH_HUB_APP_ID,
        block_id: RESEARCH_BLOCK_ID,
        item_type: "research_result",
        title: result.title,
        status: "active",
        data: {
          type: "research",
          source: result.source,
          summary: result.summary,
          key_points: result.key_points,
          model_used,
          researched_at: result.researched_at,
        },
      });

      // Also store in custom block if specified
      if (body.store && body.app_id && body.block_id) {
        await supabase.from("ops_data").insert({
          app_id: body.app_id,
          block_id: body.block_id,
          item_type: "research_result",
          title: result.title,
          data: {
            type: "research",
            source: result.source,
            summary: result.summary,
            key_points: result.key_points,
            model_used,
            researched_at: result.researched_at,
          },
        });
      }

      return new Response(JSON.stringify({ success: true, model_used, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "research_topic") {
      if (!body.topic) {
        return new Response(
          JSON.stringify({ error: "Missing required field: topic" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Search for the topic
      const searchResults = await searchWeb(body.topic);

      if (searchResults.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            topic: body.topic,
            results: [],
            message: "No results found. Try a more specific topic or provide a URL directly.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch and summarize the top result
      let topResult: ResearchResult | null = null;
      for (const sr of searchResults) {
        try {
          const { title, text } = await fetchAndExtract(sr.url);
          if (text.length < 200) continue; // skip thin pages
          const { summary, key_points } = await summarizeWithAI(
            text,
            body.context || "",
            sr.url
          );
          topResult = {
            title,
            source: sr.url,
            summary,
            key_points,
            raw_text_length: text.length,
            researched_at: new Date().toISOString(),
          };
          break;
        } catch {
          continue; // try next result
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          topic: body.topic,
          search_results: searchResults,
          detailed_result: topResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: `Unknown action: ${action}. Use "research_url" or "research_topic".`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("browser-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
