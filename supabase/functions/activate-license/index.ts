import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HMAC-SHA256 signing for license tokens
async function signPayload(payload: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { activation_code, project_ref, owner_email, owner_name } = body;

    if (!activation_code || !project_ref) {
      return new Response(
        JSON.stringify({ error: "activation_code and project_ref are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const signingKey = Deno.env.get("LICENSE_SIGNING_KEY")!;

    if (!signingKey) {
      console.error("LICENSE_SIGNING_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the activation code
    const { data: license, error: lookupError } = await supabase
      .from("licenses")
      .select("*")
      .eq("activation_code", activation_code)
      .maybeSingle();

    if (lookupError || !license) {
      return new Response(
        JSON.stringify({ error: "Invalid activation code. Check your code and try again." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check license status
    if (license.status === "revoked") {
      return new Response(
        JSON.stringify({ error: "This license has been revoked. Contact support." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (license.status === "expired" || (license.expires_at && new Date(license.expires_at) < new Date())) {
      return new Response(
        JSON.stringify({ error: "This license has expired. Renew your membership to reactivate." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already active, check if same project_ref (re-activation is OK for same project)
    if (license.status === "active" && license.project_ref && license.project_ref !== project_ref) {
      return new Response(
        JSON.stringify({
          error: "This license is already activated on a different project. Each license works with one Supabase project.",
          hint: "Contact support if you need to transfer your license."
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the token payload
    const payload = JSON.stringify({
      project_ref,
      activation_code,
      issued_at: new Date().toISOString(),
      expires_at: license.expires_at || null,
      plan: license.plan || "community",
    });

    const payloadB64 = toBase64Url(payload);
    const signature = await signPayload(payloadB64, signingKey);
    const token = `cb_${payloadB64}.${signature}`;

    // Activate the license
    const { error: updateError } = await supabase
      .from("licenses")
      .update({
        status: "active",
        project_ref,
        activated_at: new Date().toISOString(),
        owner_email: owner_email || license.owner_email,
        owner_name: owner_name || license.owner_name,
      })
      .eq("id", license.id);

    if (updateError) {
      console.error("Failed to update license:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to activate license. Try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the signed token
    return new Response(
      JSON.stringify({
        success: true,
        license_token: token,
        message: "License activated! Add this token as CLAWBUDDY_LICENSE_TOKEN in your Supabase secrets.",
        instructions: [
          `Run: supabase secrets set CLAWBUDDY_LICENSE_TOKEN="${token}"`,
          "Then restart your edge functions. Your ClawBuddy is now active.",
        ],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("activate-license error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
