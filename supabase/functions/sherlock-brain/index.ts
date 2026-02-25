import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ──────────────────────────────────────────────────────
interface AutomationHealth {
  automation_id: string;
  name: string;
  health_score: number;
  success_rate_24h: number;
  success_rate_7d: number;
  avg_duration_24h: number;
  avg_duration_7d: number;
  duration_trend: "faster" | "slower" | "stable";
  total_runs_24h: number;
  failures_24h: number;
  last_failure_error: string | null;
}

interface Discovery {
  type: string;
  description: string;
  action_taken: boolean;
  action_details: string | null;
  source_id: string | null;
}

interface TuneDecision {
  automation_id: string;
  automation_name: string;
  field: string;
  old_value: unknown;
  new_value: unknown;
  reason: string;
  auto_applied: boolean;
}

// ── Main ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const userId = body.user_id;

    const now = new Date();
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ════════════════════════════════════════════════════════════
    // PASS 1: Execution Learning
    // ════════════════════════════════════════════════════════════

    // Fetch all automations with learning enabled
    const { data: automations } = await supabase
      .from("automations")
      .select("*")
      .eq("learning_enabled", true);

    if (!automations || automations.length === 0) {
      return respond({ text: "No automations with learning enabled.", html: "<p>No automations to analyze.</p>", subject: "Brain Report: Nothing to analyze" });
    }

    // Fetch 24h executions
    const { data: execs24h } = await supabase
      .from("automation_executions")
      .select("*")
      .gte("started_at", h24ago)
      .order("started_at", { ascending: false });

    // Fetch 7d executions (for baseline)
    const { data: execs7d } = await supabase
      .from("automation_executions")
      .select("id, automation_id, status, duration_ms, started_at")
      .gte("started_at", d7ago)
      .order("started_at", { ascending: false });

    const healthResults: AutomationHealth[] = [];
    const tuneDecisions: TuneDecision[] = [];
    const learningEntries: Record<string, unknown>[] = [];

    for (const auto of automations) {
      const runs24h = (execs24h || []).filter(e => e.automation_id === auto.id);
      const runs7d = (execs7d || []).filter(e => e.automation_id === auto.id);

      const successes24h = runs24h.filter(e => e.status === "success").length;
      const failures24h = runs24h.filter(e => e.status === "failed").length;
      const successRate24h = runs24h.length > 0 ? (successes24h / runs24h.length) * 100 : 100;

      const successes7d = runs7d.filter(e => e.status === "success").length;
      const successRate7d = runs7d.length > 0 ? (successes7d / runs7d.length) * 100 : 100;

      const durations24h = runs24h.filter(e => e.duration_ms).map(e => e.duration_ms);
      const durations7d = runs7d.filter(e => e.duration_ms).map(e => e.duration_ms);
      const avgDuration24h = durations24h.length > 0 ? durations24h.reduce((a: number, b: number) => a + b, 0) / durations24h.length : 0;
      const avgDuration7d = durations7d.length > 0 ? durations7d.reduce((a: number, b: number) => a + b, 0) / durations7d.length : 0;

      let durationTrend: "faster" | "slower" | "stable" = "stable";
      if (avgDuration7d > 0 && avgDuration24h > 0) {
        const ratio = avgDuration24h / avgDuration7d;
        if (ratio > 1.3) durationTrend = "slower";
        else if (ratio < 0.7) durationTrend = "faster";
      }

      // Health score: weighted success rate (70%) + duration stability (15%) + recency (15%)
      let healthScore = successRate24h * 0.7;

      // Duration stability: penalize if trending slower
      if (durationTrend === "stable") healthScore += 15;
      else if (durationTrend === "faster") healthScore += 15;
      else healthScore += 5;

      // Recency: bonus if ran recently
      if (runs24h.length > 0) healthScore += 15;
      else if (auto.last_run_at) {
        const hoursSince = (now.getTime() - new Date(auto.last_run_at).getTime()) / (60 * 60 * 1000);
        healthScore += Math.max(0, 15 - hoursSince * 0.5);
      }

      healthScore = Math.min(100, Math.max(0, Math.round(healthScore * 10) / 10));

      const lastFailure = runs24h.find(e => e.status === "failed");

      healthResults.push({
        automation_id: auto.id,
        name: auto.name,
        health_score: healthScore,
        success_rate_24h: Math.round(successRate24h * 10) / 10,
        success_rate_7d: Math.round(successRate7d * 10) / 10,
        avg_duration_24h: Math.round(avgDuration24h),
        avg_duration_7d: Math.round(avgDuration7d),
        duration_trend: durationTrend,
        total_runs_24h: runs24h.length,
        failures_24h: failures24h,
        last_failure_error: lastFailure?.error || null,
      });

      // Update health_score on automation
      await supabase.from("automations").update({ health_score: healthScore }).eq("id", auto.id);

      // Log execution analysis
      learningEntries.push({
        user_id: userId,
        agent_name: "Sherlock",
        entry_type: "execution_analysis",
        source_automation_id: auto.id,
        source_execution_ids: runs24h.map(e => e.id),
        analysis: {
          health_score: healthScore,
          success_rate_24h: successRate24h,
          success_rate_7d: successRate7d,
          avg_duration_24h: avgDuration24h,
          avg_duration_7d: avgDuration7d,
          duration_trend: durationTrend,
          total_runs_24h: runs24h.length,
          failures_24h: failures24h,
        },
        action_taken: true,
        action_details: `Updated health_score to ${healthScore}`,
      });

      // ── Auto-tune decisions ──
      // If health < 70 and there are failures, check if timeout should be increased
      if (healthScore < 70 && failures24h > 0) {
        const timeoutFailures = runs24h.filter(
          e => e.status === "failed" && e.error?.toLowerCase().includes("timeout")
        );
        if (timeoutFailures.length > 0 && auto.timeout_seconds < 300) {
          const newTimeout = Math.min(300, auto.timeout_seconds * 2);
          tuneDecisions.push({
            automation_id: auto.id,
            automation_name: auto.name,
            field: "timeout_seconds",
            old_value: auto.timeout_seconds,
            new_value: newTimeout,
            reason: `${timeoutFailures.length} timeout failures in 24h. Doubling timeout.`,
            auto_applied: true,
          });

          await supabase.from("automations").update({
            timeout_seconds: newTimeout,
            auto_tuned_at: now.toISOString(),
            tune_history: [...(auto.tune_history || []), {
              field: "timeout_seconds",
              old: auto.timeout_seconds,
              new: newTimeout,
              reason: "Auto-tune: timeout failures detected",
              at: now.toISOString(),
            }],
          }).eq("id", auto.id);

          learningEntries.push({
            user_id: userId,
            agent_name: "Sherlock",
            entry_type: "tune_decision",
            source_automation_id: auto.id,
            analysis: { field: "timeout_seconds", old: auto.timeout_seconds, new: newTimeout },
            action_taken: true,
            action_details: `Auto-increased timeout from ${auto.timeout_seconds}s to ${newTimeout}s due to ${timeoutFailures.length} timeout failures.`,
          });
        }

        // If 100% failure rate in 24h with 3+ runs, disable
        if (successRate24h === 0 && runs24h.length >= 3) {
          tuneDecisions.push({
            automation_id: auto.id,
            automation_name: auto.name,
            field: "enabled",
            old_value: true,
            new_value: false,
            reason: `0% success rate across ${runs24h.length} runs. Disabling to prevent waste.`,
            auto_applied: true,
          });

          await supabase.from("automations").update({
            enabled: false,
            auto_tuned_at: now.toISOString(),
            tune_history: [...(auto.tune_history || []), {
              field: "enabled",
              old: true,
              new: false,
              reason: "Auto-tune: 0% success rate, 3+ consecutive failures",
              at: now.toISOString(),
            }],
          }).eq("id", auto.id);

          learningEntries.push({
            user_id: userId,
            agent_name: "Sherlock",
            entry_type: "tune_decision",
            source_automation_id: auto.id,
            analysis: { field: "enabled", old: true, new: false, failure_count: runs24h.length },
            action_taken: true,
            action_details: `Auto-disabled due to 0% success rate across ${runs24h.length} runs.`,
          });
        }
      }
    }

    // ════════════════════════════════════════════════════════════
    // PASS 2: Autonomous Task Discovery
    // ════════════════════════════════════════════════════════════

    const discoveries: Discovery[] = [];

    // 1. Stale tasks: in "doing" > 48h
    const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const doingColumnId = "a886c067-d4d3-4e77-9ac3-5cc231dddc35";
    const needsInputColumnId = "9d39bd42-cd5f-4c46-a440-ce54b671d0ae";

    const { data: staleTasks } = await supabase
      .from("ai_tasks")
      .select("id, title, updated_at")
      .eq("board_column_id", doingColumnId)
      .lt("updated_at", h48ago);

    if (staleTasks && staleTasks.length > 0) {
      for (const task of staleTasks) {
        await supabase.from("ai_tasks").update({ board_column_id: needsInputColumnId }).eq("id", task.id);
        discoveries.push({
          type: "stale_task",
          description: `Moved "${task.title}" to Needs Input — stuck in Doing for 48+ hours.`,
          action_taken: true,
          action_details: `Moved task ${task.id} from Doing to Needs Input`,
          source_id: task.id,
        });
      }
    }

    // 2. Unanswered questions > 12h
    const h12ago = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const { data: unanswered } = await supabase
      .from("ai_questions")
      .select("id, question, created_at")
      .is("answer", null)
      .lt("created_at", h12ago);

    if (unanswered && unanswered.length > 0) {
      discoveries.push({
        type: "unanswered_questions",
        description: `${unanswered.length} question(s) pending for 12+ hours.`,
        action_taken: false,
        action_details: null,
        source_id: null,
      });
    }

    // 3. Orphaned executions: running > 30 min
    const m30ago = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const { data: orphaned } = await supabase
      .from("automation_executions")
      .select("id, automation_id, started_at")
      .eq("status", "running")
      .lt("started_at", m30ago);

    if (orphaned && orphaned.length > 0) {
      for (const exec of orphaned) {
        await supabase.from("automation_executions").update({
          status: "failed",
          error: "Auto-cleaned by Sherlock Brain: running > 30 minutes",
          finished_at: now.toISOString(),
          duration_ms: now.getTime() - new Date(exec.started_at).getTime(),
        }).eq("id", exec.id);
        discoveries.push({
          type: "orphaned_execution",
          description: `Cleaned orphaned execution ${exec.id} (running > 30 min).`,
          action_taken: true,
          action_details: `Marked execution ${exec.id} as failed`,
          source_id: exec.id,
        });
      }
    }

    // 4. Failed critical automations — auto-retry morning/evening digest
    const criticalNames = ["Morning Digest", "Evening Report"];
    for (const auto of automations) {
      if (!criticalNames.includes(auto.name)) continue;
      const recentRuns = (execs24h || []).filter(e => e.automation_id === auto.id);
      const lastRun = recentRuns[0];
      if (lastRun && lastRun.status === "failed") {
        // Check if there was already a retry
        const retries = recentRuns.filter(e => e.trigger_source === "autonomous");
        if (retries.length === 0) {
          // Trigger retry via automation-runner
          try {
            const retryRes = await fetch(`${supabaseUrl}/functions/v1/automation-runner`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({ automation_id: auto.id }),
            });
            const retryResult = await retryRes.json();
            discoveries.push({
              type: "auto_retry",
              description: `Auto-retried failed "${auto.name}". Result: ${retryResult.status || "triggered"}.`,
              action_taken: true,
              action_details: `Triggered retry for ${auto.name} (execution: ${retryResult.execution_id || "unknown"})`,
              source_id: auto.id,
            });
          } catch (retryErr) {
            discoveries.push({
              type: "auto_retry",
              description: `Failed to auto-retry "${auto.name}": ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
              action_taken: false,
              action_details: null,
              source_id: auto.id,
            });
          }
        }
      }
    }

    // 5. Overdue automations: last_run_at older than expected based on cron
    for (const auto of automations) {
      if (!auto.enabled || !auto.last_run_at) continue;
      const expectedIntervalMs = estimateCronIntervalMs(auto.cron_expression);
      if (!expectedIntervalMs) continue;
      const overdueThreshold = expectedIntervalMs * 2;
      const timeSinceLastRun = now.getTime() - new Date(auto.last_run_at).getTime();
      if (timeSinceLastRun > overdueThreshold) {
        discoveries.push({
          type: "overdue_automation",
          description: `"${auto.name}" is overdue — last ran ${Math.round(timeSinceLastRun / (60 * 60 * 1000))}h ago (expected every ${Math.round(expectedIntervalMs / (60 * 60 * 1000))}h).`,
          action_taken: false,
          action_details: null,
          source_id: auto.id,
        });
      }
    }

    // Log discoveries
    for (const disc of discoveries) {
      learningEntries.push({
        user_id: userId,
        agent_name: "Sherlock",
        entry_type: "task_discovery",
        analysis: disc,
        action_taken: disc.action_taken,
        action_details: disc.action_details,
      });
    }

    // Batch insert learning entries
    if (learningEntries.length > 0) {
      await supabase.from("agent_learning_log").insert(learningEntries);
    }

    // ════════════════════════════════════════════════════════════
    // PASS 3: LLM Synthesis — Brain Report
    // ════════════════════════════════════════════════════════════

    const reportData = {
      timestamp: now.toISOString(),
      automations_analyzed: healthResults.length,
      health_results: healthResults,
      tune_decisions: tuneDecisions,
      discoveries,
      learning_entries_created: learningEntries.length,
    };

    let summaryText = "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (openaiKey) {
      try {
        const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 500,
            messages: [{
              role: "system",
              content: "You are Sherlock, an AI operations analyst. Write a brief, punchy Brain Report summarizing automation health, any actions taken, and discoveries. Use bullet points. Be concise — max 200 words. Start with an overall health emoji (🟢 all good, 🟡 some issues, 🔴 critical). No headers, just the summary.",
            }, {
              role: "user",
              content: JSON.stringify(reportData),
            }],
          }),
        });
        const llmData = await llmRes.json();
        summaryText = llmData.choices?.[0]?.message?.content || "";
      } catch (llmErr) {
        console.error("LLM synthesis failed:", llmErr);
        summaryText = "";
      }
    }

    // Fallback: deterministic summary if LLM unavailable
    if (!summaryText) {
      const avgHealth = healthResults.length > 0
        ? Math.round(healthResults.reduce((s, h) => s + h.health_score, 0) / healthResults.length)
        : 0;
      const emoji = avgHealth >= 80 ? "🟢" : avgHealth >= 60 ? "🟡" : "🔴";
      const lines: string[] = [
        `${emoji} Brain Report — ${now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
        ``,
        `• ${healthResults.length} automations analyzed, avg health: ${avgHealth}/100`,
      ];
      const unhealthy = healthResults.filter(h => h.health_score < 70);
      if (unhealthy.length > 0) {
        lines.push(`• ${unhealthy.length} below threshold: ${unhealthy.map(h => `${h.name} (${h.health_score})`).join(", ")}`);
      }
      if (tuneDecisions.length > 0) {
        lines.push(`• ${tuneDecisions.length} auto-tune action(s) taken`);
      }
      if (discoveries.length > 0) {
        const acted = discoveries.filter(d => d.action_taken).length;
        lines.push(`• ${discoveries.length} discovery(ies), ${acted} auto-resolved`);
      }
      summaryText = lines.join("\n");
    }

    // Build HTML report
    const html = buildHtmlReport(healthResults, tuneDecisions, discoveries, summaryText, now);

    // Push insight card
    await supabase.from("ai_insights").insert({
      title: "Brain Report",
      content: summaryText,
      insight_type: "performance",
      target_user_id: userId,
      data: reportData,
    });

    return respond({
      subject: `🧠 Brain Report — ${now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
      text: summaryText,
      html,
    });
  } catch (e) {
    console.error("Sherlock Brain error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helpers ────────────────────────────────────────────────────

function respond(data: { text: string; html: string; subject: string }) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function estimateCronIntervalMs(cron: string): number | null {
  if (!cron) return null;
  const parts = cron.split(" ");
  if (parts.length < 5) return null;
  const [min, hour] = parts;

  // Every N minutes: */N * * * *
  if (min.startsWith("*/")) {
    return parseInt(min.slice(2)) * 60 * 1000;
  }
  // Every N hours: 0 */N * * *
  if (hour.startsWith("*/")) {
    return parseInt(hour.slice(2)) * 60 * 60 * 1000;
  }
  // Specific hour: M H * * * → assume daily
  if (!hour.includes("*") && !hour.includes("/")) {
    return 24 * 60 * 60 * 1000;
  }
  return null;
}

function buildHtmlReport(
  health: AutomationHealth[],
  tunes: TuneDecision[],
  discoveries: Discovery[],
  summary: string,
  now: Date,
): string {
  const avgHealth = health.length > 0
    ? Math.round(health.reduce((s, h) => s + h.health_score, 0) / health.length)
    : 0;
  const statusColor = avgHealth >= 80 ? "#22c55e" : avgHealth >= 60 ? "#f59e0b" : "#ef4444";

  const healthRows = health.map(h => {
    const color = h.health_score >= 80 ? "#22c55e" : h.health_score >= 60 ? "#f59e0b" : "#ef4444";
    const trend = h.duration_trend === "faster" ? "⚡" : h.duration_trend === "slower" ? "🐢" : "→";
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #333">${h.name}</td>
      <td style="padding:8px;border-bottom:1px solid #333;color:${color};font-weight:bold">${h.health_score}</td>
      <td style="padding:8px;border-bottom:1px solid #333">${h.success_rate_24h}%</td>
      <td style="padding:8px;border-bottom:1px solid #333">${h.total_runs_24h}</td>
      <td style="padding:8px;border-bottom:1px solid #333">${Math.round(h.avg_duration_24h / 1000)}s ${trend}</td>
    </tr>`;
  }).join("");

  const tuneSection = tunes.length > 0 ? `
    <h3 style="color:#f59e0b;margin-top:24px">⚙️ Auto-Tune Actions (${tunes.length})</h3>
    <ul style="margin:0;padding-left:20px">
      ${tunes.map(t => `<li><strong>${t.automation_name}</strong>: ${t.field} ${t.old_value} → ${t.new_value} — ${t.reason}</li>`).join("")}
    </ul>` : "";

  const discoverySection = discoveries.length > 0 ? `
    <h3 style="color:#8b5cf6;margin-top:24px">🔍 Discoveries (${discoveries.length})</h3>
    <ul style="margin:0;padding-left:20px">
      ${discoveries.map(d => `<li>${d.action_taken ? "✅" : "⚠️"} ${d.description}</li>`).join("")}
    </ul>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;margin:0">
  <div style="max-width:640px;margin:0 auto">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;width:60px;height:60px;border-radius:50%;background:${statusColor};line-height:60px;font-size:28px;text-align:center">🧠</div>
      <h1 style="margin:12px 0 4px;font-size:22px">Sherlock Brain Report</h1>
      <p style="color:#888;margin:0">${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} • Average Health: <strong style="color:${statusColor}">${avgHealth}/100</strong></p>
    </div>

    <div style="background:#1a1a1a;border-radius:12px;padding:16px;margin-bottom:16px;white-space:pre-wrap">${summary}</div>

    <h3 style="color:#3b82f6;margin-top:24px">📊 Automation Health</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="color:#888;text-align:left">
        <th style="padding:8px;border-bottom:2px solid #333">Name</th>
        <th style="padding:8px;border-bottom:2px solid #333">Score</th>
        <th style="padding:8px;border-bottom:2px solid #333">24h Rate</th>
        <th style="padding:8px;border-bottom:2px solid #333">Runs</th>
        <th style="padding:8px;border-bottom:2px solid #333">Avg Time</th>
      </tr>
      ${healthRows}
    </table>

    ${tuneSection}
    ${discoverySection}

    <p style="color:#555;margin-top:24px;font-size:12px;text-align:center">Generated by Sherlock Brain • ${now.toISOString()}</p>
  </div>
</body>
</html>`;
}
