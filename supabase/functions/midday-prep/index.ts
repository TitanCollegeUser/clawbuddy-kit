import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUESTIONS = [
  "What's the ONE thing you want to accomplish before end of day?",
  "Any wins from this morning worth celebrating?",
  "What's blocking you right now?",
  "Rate your energy 1-10. What would bump it up?",
  "What's one thing you're grateful for today?",
  "Is there anything you need from the agents?",
  "Any competitor moves you noticed today?",
  "What content idea has been on your mind?",
  "Who should you reach out to today?",
  "What would make today a 10/10 day?",
  "Any insights from this morning's work?",
  "What's the most important email you need to send?",
  "Is there a decision you've been putting off?",
  "What would Musashi do right now?",
  "What's one process you could automate or delegate?",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const userId = body.user_id;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    // Fetch calendar for rest of day + tomorrow
    let calendarHtml = '<p style="color:#888;">Calendar unavailable</p>';
    let calendarText = "";
    try {
      const calResp = await fetch(`${supabaseUrl}/functions/v1/calendar-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ action: "search" }),
      });
      const calData = await calResp.json();
      const calEvents = (calData.events || []).filter((e: { start: string; status: string }) => {
        const eventDate = new Date(e.start);
        return eventDate >= now && e.status !== "cancelled";
      });
      if (calEvents.length > 0) {
        calendarHtml = calEvents.map((e: { start: string; end: string; summary: string; attendees?: Array<{ email: string }> }) => {
          const s = new Date(e.start);
          const time = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Vancouver" });
          const day = s.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Vancouver" });
          const attendeeCount = e.attendees ? ` · ${e.attendees.length} attendees` : "";
          return `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">
            <span style="color:#e94560;font-weight:bold;">${day} ${time}</span> ${e.summary}
            <span style="font-size:12px;color:#888;">${attendeeCount}</span>
          </div>`;
        }).join("");
        calendarText = calEvents.map((e: { start: string; summary: string }) => {
          const s = new Date(e.start);
          const time = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Vancouver" });
          return `${time}: ${e.summary}`;
        }).join("\n");
      } else {
        calendarHtml = '<p style="color:#888;">No more events today</p>';
        calendarText = "No more events today";
      }
    } catch { /* calendar fetch failed, use defaults */ }

    // Pick 5 random questions
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    // Create a Kanban task
    let taskCreated = false;
    if (userId) {
      // Get the "To Do" column
      const { data: columns } = await supabase.from("board_columns").select("id").eq("name", "To Do").limit(1);
      const columnId = columns?.[0]?.id;

      const { error: taskErr } = await supabase.from("tasks").insert({
        title: `📋 Midday check-in — ${dateStr}`,
        description: `Sherlock's midday prep:\n\n${selected.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nReply in the evening report or update this task with your answers.`,
        priority: "Medium",
        created_by: userId,
        created_by_bujji: true,
        board_column_id: columnId || null,
      });
      taskCreated = !taskErr;
    }

    const questionsHtml = selected.map((q, i) =>
      `<div style="padding:12px 16px;margin:8px 0;background:#1a1a2e;border-left:3px solid #4ecca3;border-radius:6px;">
        <span style="color:#4ecca3;font-weight:bold;">${i + 1}.</span>
        <span style="color:#eee;margin-left:8px;">${q}</span>
      </div>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:20px 0;">
    <h1 style="color:#4ecca3;margin:0;font-size:28px;">☀️ Midday Check-in</h1>
    <p style="color:#888;margin:8px 0 0;">${dateStr}</p>
  </div>

  <div style="margin:20px 0;padding:12px 16px;background:#16213e;border-radius:8px;color:#ccc;font-size:14px;">
    ${taskCreated ? '✅ A task has been created on your Kanban board for this check-in.' : '📋 Quick check-in from Sherlock — your input helps shape the evening report.'}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#e94560;font-size:16px;text-transform:uppercase;letter-spacing:2px;">📅 Remaining Schedule</h2>
    ${calendarHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#e94560;font-size:16px;text-transform:uppercase;letter-spacing:2px;">Your Questions</h2>
    ${questionsHtml}
  </div>

  <div style="margin:24px 0;padding:16px;background:#1a1a2e;border-radius:8px;text-align:center;">
    <p style="color:#888;font-size:13px;margin:0;">Reply to this email or update the Kanban task with your answers. Sherlock will incorporate them into your evening report. 🔍</p>
  </div>

  <div style="text-align:center;padding:20px 0;color:#555;font-size:12px;">
    Sent by Sherlock 🔍 via ClawBuddy Automations
  </div>
</div></body></html>`;

    const subject = `☀️ Midday Check-in — ${dateStr} | Sherlock needs your input`;
    const text = `Midday Check-in — ${dateStr}\n\nRemaining Schedule:\n${calendarText}\n\n${selected.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\n${taskCreated ? "A task has been created on your Kanban board." : "Reply with your answers."}`;

    return new Response(JSON.stringify({ html, subject, text, side_effects: { task_created: taskCreated } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Midday prep error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
