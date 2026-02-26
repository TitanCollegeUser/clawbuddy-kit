import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { automation_id } = await req.json();
    if (!automation_id) {
      return new Response(JSON.stringify({ error: "automation_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: accept service role Bearer token, x-api-key, or x-webhook-secret
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("x-api-key");
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedKey = Deno.env.get("AI_TASKS_API_KEY");
    const expectedWebhookSecret = Deno.env.get("WEBHOOK_SECRET");
    const isServiceRole = authHeader?.includes(serviceRoleKey);
    const isApiKey = apiKey && apiKey === expectedKey;
    const isWebhookAuth = webhookSecret && (webhookSecret === expectedWebhookSecret || webhookSecret === expectedKey);
    // Also accept if the Bearer token ends with the service role key (pg_cron sends full key)
    const bearerToken = authHeader?.replace("Bearer ", "");
    const isBearerMatch = bearerToken === serviceRoleKey;
    if (!isServiceRole && !isApiKey && !isWebhookAuth && !isBearerMatch) {
      console.error("Auth failed. authHeader present:", !!authHeader, "serviceRoleKey length:", serviceRoleKey?.length, "bearerToken length:", bearerToken?.length);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch automation
    const { data: automation, error: fetchErr } = await supabase
      .from("automations").select("*").eq("id", automation_id).single();
    if (fetchErr || !automation) {
      return new Response(JSON.stringify({ error: "Automation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: check for existing running execution
    const { data: running } = await supabase
      .from("automation_executions")
      .select("id")
      .eq("automation_id", automation_id)
      .eq("status", "running")
      .limit(1);
    if (running && running.length > 0) {
      return new Response(JSON.stringify({ error: "Already running", execution_id: running[0].id }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert execution row
    const startTime = Date.now();
    const { data: execution, error: execErr } = await supabase
      .from("automation_executions")
      .insert({
        automation_id,
        status: "running",
        started_at: new Date().toISOString(),
        trigger_source: "scheduled",
        triggered_by: "pg_cron",
      })
      .select()
      .single();
    if (execErr) {
      console.error("Failed to create execution:", execErr);
      return new Response(JSON.stringify({ error: "Failed to create execution" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let output = "";
    let outputHtml = "";
    let status = "success";
    let error: string | null = null;

    try {
      // Execute: call function_name or skip (no Anthropic key)
      if (automation.function_name) {
        const fnUrl = `${supabaseUrl}/functions/v1/${automation.function_name}`;
        const webhookSecretVal = Deno.env.get("WEBHOOK_SECRET") || Deno.env.get("AI_TASKS_API_KEY") || "";
        const fnResponse = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
            "x-webhook-secret": webhookSecretVal,
          },
          body: JSON.stringify({
            automation_id,
            automation_name: automation.name,
            user_id: automation.user_id,
            function_config: automation.function_config || {},
          }),
        });

        if (!fnResponse.ok) {
          const errText = await fnResponse.text();
          throw new Error(`Function ${automation.function_name} failed (${fnResponse.status}): ${errText}`);
        }

        const fnResult = await fnResponse.json();
        output = fnResult.text || fnResult.subject || "";
        outputHtml = fnResult.html || "";

        // Use subject from function result if available
        if (fnResult.subject) {
          output = fnResult.subject + "\n\n" + (fnResult.text || "");
        }
      } else {
        // No function_name and no Anthropic key — graceful skip
        output = "Prompt execution not configured (no Anthropic API key). Set function_name to use a dedicated edge function.";
        outputHtml = `<p>${output}</p>`;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
      console.error("Execution error:", error);
    }

    // Deliver to channels
    const deliveries: { channel: string; status: string; error?: string }[] = [];
    const channels = (automation.channels || []) as { type: string; config: Record<string, string> }[];

    for (const channel of channels) {
      try {
        if (channel.type === "dashboard") {
          await supabase.from("ai_insights").insert({
            title: automation.name,
            content: output || "Automation completed",
            insight_type: "automation",
            target_user_id: automation.user_id,
            data: { automation_id, execution_id: execution.id },
          });
          deliveries.push({ channel: "dashboard", status: "sent" });
        } else if (channel.type === "agentmail") {
          const agentmailKey = channel.config?.api_key || Deno.env.get("AGENTMAIL_API_KEY");
          const inboxId = channel.config?.inbox_id || "sherlockbot@agentmail.to";
          const toEmail = channel.config?.to_email;
          const subjectTemplate = channel.config?.subject_template || "{{automation_name}}";

          if (!agentmailKey || !toEmail) {
            deliveries.push({ channel: "agentmail", status: "failed", error: "Missing API key or to_email" });
            continue;
          }

          const now = new Date();
          const renderedSubject = subjectTemplate
            .replace("{{automation_name}}", automation.name)
            .replace("{{date}}", now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
            .replace("{{day}}", now.toLocaleDateString("en-US", { weekday: "long" }))
            .replace("{{status}}", status);

          const mailRes = await fetch(`https://api.agentmail.to/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${agentmailKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: [toEmail],
              subject: renderedSubject,
              html: outputHtml || `<pre>${output}</pre>`,
              text: output,
            }),
          });

          if (mailRes.ok) {
            deliveries.push({ channel: "agentmail", status: "sent" });
          } else {
            const errText = await mailRes.text();
            deliveries.push({ channel: "agentmail", status: "failed", error: errText });
          }
        } else if (channel.type === "email") {
          const apiKey = channel.config?.api_key;
          const fromEmail = channel.config?.from_email;
          const toEmails = channel.config?.to_emails;
          const subjectTemplate = channel.config?.subject_template || automation.name;

          if (!apiKey || !fromEmail || !toEmails) {
            deliveries.push({ channel: "email", status: "failed", error: "Missing email config" });
            continue;
          }

          const mailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: fromEmail,
              to: toEmails.split(",").map((e: string) => e.trim()),
              subject: subjectTemplate,
              html: outputHtml || `<pre>${output}</pre>`,
            }),
          });

          deliveries.push({ channel: "email", status: mailRes.ok ? "sent" : "failed", error: mailRes.ok ? undefined : await mailRes.text() });
        } else if (channel.type === "telegram") {
          const botToken = channel.config?.bot_token;
          const chatId = channel.config?.chat_id;
          if (!botToken || !chatId) {
            deliveries.push({ channel: "telegram", status: "failed", error: "Missing bot_token or chat_id" });
            continue;
          }
          const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: output?.substring(0, 4000) || "Automation completed", parse_mode: "HTML" }),
          });
          deliveries.push({ channel: "telegram", status: tgRes.ok ? "sent" : "failed", error: tgRes.ok ? undefined : await tgRes.text() });
        } else if (channel.type === "discord") {
          const webhookUrl = channel.config?.webhook_url;
          if (!webhookUrl) {
            deliveries.push({ channel: "discord", status: "failed", error: "Missing webhook_url" });
            continue;
          }
          const dcRes = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: output?.substring(0, 2000) || "Automation completed" }),
          });
          deliveries.push({ channel: "discord", status: dcRes.ok ? "sent" : "failed", error: dcRes.ok ? undefined : await dcRes.text() });
        }
      } catch (chErr) {
        deliveries.push({ channel: channel.type, status: "failed", error: chErr instanceof Error ? chErr.message : String(chErr) });
      }
    }

    const durationMs = Date.now() - startTime;

    // Update execution
    await supabase.from("automation_executions").update({
      status,
      error,
      output,
      output_html: outputHtml,
      duration_ms: durationMs,
      finished_at: new Date().toISOString(),
      deliveries,
    }).eq("id", execution.id);

    // Update automation stats
    const updatePayload: Record<string, unknown> = {
      last_run_at: new Date().toISOString(),
      last_status: status,
      run_count: (automation.run_count || 0) + 1,
    };
    if (status === "failed") {
      updatePayload.fail_count = (automation.fail_count || 0) + 1;
    }
    await supabase.from("automations").update(updatePayload).eq("id", automation_id);

    return new Response(JSON.stringify({
      execution_id: execution.id,
      status,
      duration_ms: durationMs,
      deliveries,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Automation runner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
