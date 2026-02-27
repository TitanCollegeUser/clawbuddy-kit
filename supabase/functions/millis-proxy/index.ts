import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const MILLIS_API_BASE = "https://api-west.millis.ai";
const MILLIS_API_KEY = Deno.env.get("MILLIS_API_KEY") || "";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { method = "GET", path, body: requestBody } = body;

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing 'path' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Millis AI request
    const url = `${MILLIS_API_BASE}${path}`;
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        "authorization": MILLIS_API_KEY,
        "Content-Type": "application/json",
      },
    };

    if (requestBody && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    console.log(`[millis-proxy] ${method} ${url}`);

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[millis-proxy] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
