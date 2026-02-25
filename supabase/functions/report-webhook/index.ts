import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Background task to notify processing
async function notifyBujjiToProcess(supabase: any, reportId: string, source: string) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const apiKey = Deno.env.get("AI_TASKS_API_KEY");
    
    if (!apiKey) {
      console.log("AI_TASKS_API_KEY not configured - will process on next cycle");
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        request_type: "raw_report",
        action: "submit",
        report_id: reportId,
      }),
    });

    if (response.ok) {
      console.log(`✅ Notified to process report ${reportId} from ${source}`);
    } else {
      const error = await response.text();
      console.error(`Failed to notify: ${error}`);
    }
  } catch (error) {
    console.error("Error notifying:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check for slug-based endpoint routing
    const url = new URL(req.url);
    const endpointSlug = url.searchParams.get("endpoint");

    let webhookEndpoint: any = null;
    let linkedFunctionId: string | null = null;
    let autoProcess = false;

    if (endpointSlug) {
      // Look up the webhook endpoint by slug
      const { data: ep, error: epError } = await supabase
        .from("webhook_endpoints")
        .select("*, webhook_functions(id, name, prompt_template, report_type)")
        .eq("slug", endpointSlug)
        .eq("is_active", true)
        .single();

      if (epError || !ep) {
        console.log(`Webhook endpoint not found: ${endpointSlug}`);
        return new Response(
          JSON.stringify({ error: "Webhook endpoint not found or inactive" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      webhookEndpoint = ep;
      linkedFunctionId = ep.function_id;
      autoProcess = ep.auto_process;

      // Validate per-endpoint secret
      const providedSecret = req.headers.get("x-webhook-secret");
      if (providedSecret !== ep.secret) {
        console.log("Per-endpoint secret validation failed");
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid webhook secret" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Legacy: validate global secret if configured
      const expectedSecret = Deno.env.get("REPORT_WEBHOOK_SECRET");
      if (expectedSecret) {
        const providedSecret = req.headers.get("x-webhook-secret");
        if (providedSecret !== expectedSecret) {
          console.log("Webhook secret validation failed");
          return new Response(
            JSON.stringify({ error: "Unauthorized: Invalid webhook secret" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Parse request body
    const body = await req.json();

    const source = body.source?.toString?.().trim() || (webhookEndpoint?.name || "unknown");
    const report_type = webhookEndpoint?.webhook_functions?.report_type
      || (["employee", "insight"].includes(body.report_type) ? body.report_type : "insight");

    const raw_data = (body.data && typeof body.data === "object") ? body.data : body;
    const metadata = body.metadata || null;

    // Insert into raw_reports
    const insertData: any = {
      source,
      report_type,
      raw_data,
      metadata,
      status: "pending",
      webhook_endpoint_id: webhookEndpoint?.id || null,
      function_id: linkedFunctionId,
    };

    const { data: rawReport, error: insertError } = await supabase
      .from("raw_reports")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting raw report:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to queue report", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log to ai_log
    await supabase.from("ai_log").insert({
      message: `📥 Incoming ${report_type} report from "${source}" queued for processing`,
      category: "observation",
      is_read: false,
    });

    console.log(`Raw report queued: ${rawReport.id} from ${source}`);

    // Auto-process if enabled
    if (autoProcess) {
      EdgeRuntime.waitUntil(notifyBujjiToProcess(supabase, rawReport.id, source));
    }

    return new Response(
      JSON.stringify({
        success: true,
        queue_id: rawReport.id,
        message: autoProcess
          ? "Report queued and submitted for automatic processing"
          : "Report queued for manual review",
        status: "pending",
        auto_process: autoProcess,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in report-webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
