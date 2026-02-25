import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REFLECTIONS = [
  "What was the single most impactful thing you did today?",
  "What would you do differently if you could redo today?",
  "What pattern are you noticing in your work this week?",
  "What are you avoiding that you know you should tackle?",
  "What gave you energy today? What drained it?",
  "If you could only do 3 things tomorrow, what would they be?",
  "What's one thing you learned today?",
  "Are you working on the right problems?",
];

const TOMORROW_FOCUS: Record<number, string> = {
  0: "Monday — Strategic Planning: Set the week's direction",
  1: "Tuesday — Deep Work: Tackle the hardest problem",
  2: "Wednesday — Content Creation: Create and produce",
  3: "Thursday — Outreach: Connect and grow",
  4: "Friday — Ship: Get things across the finish line",
  5: "Saturday — Learn: Explore and experiment",
  6: "Sunday — Rest: Recharge for the week ahead",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const userId = body.user_id;
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const [tasksRes, logsRes, insightsRes, questionsRes] = await Promise.all([
      supabase.from("tasks").select("title, priority, board_column_id").gte("updated_at", todayIso).limit(30),
      supabase.from("ai_log").select("message, category, agent_name").gte("created_at", todayIso).eq("user_id", userId).limit(30),
      supabase.from("ai_insights").select("title, insight_type").gte("created_at", todayIso).limit(10),
      supabase.from("ai_questions").select("question, status").eq("user_id", userId).eq("status", "pending").limit(5),
    ]);

    const tasks = tasksRes.data || [];
    const logs = logsRes.data || [];
    const insights = insightsRes.data || [];
    const pendingQuestions = questionsRes.data || [];
    const totalActions = tasks.length + logs.length + insights.length;
    const reflection = REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)];
    const tomorrowDay = (now.getDay() + 1) % 7;
    const tomorrowFocus = TOMORROW_FOCUS[tomorrowDay];

    const tasksHtml = tasks.length > 0
      ? tasks.slice(0, 10).map(t =>
        `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">
          <span style="color:#4ecca3;">✓</span> ${t.title}
          <span style="float:right;font-size:12px;color:#888;">${t.priority}</span>
        </div>`
      ).join("")
      : '<p style="color:#888;">No task activity today</p>';

    const pendingHtml = pendingQuestions.length > 0
      ? pendingQuestions.map(q =>
        `<div style="padding:8px 12px;margin:4px 0;background:#2d1b36;border-left:3px solid #e94560;border-radius:4px;color:#ccc;font-size:13px;">
          ❓ ${q.question}
        </div>`
      ).join("")
      : '<p style="color:#888;">No pending items</p>';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:20px 0;">
    <h1 style="color:#e94560;margin:0;font-size:28px;">🌙 Evening Report</h1>
    <p style="color:#888;margin:8px 0 0;">${dateStr}</p>
  </div>

  <div style="margin:24px 0;padding:16px;background:#1a1a2e;border-radius:8px;">
    <h2 style="color:#4ecca3;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-top:0;">📊 Momentum</h2>
    <div style="display:flex;gap:16px;">
      <div style="flex:1;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#4ecca3;">${totalActions}</div>
        <div style="color:#888;font-size:12px;">Total Actions</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#e94560;">${tasks.length}</div>
        <div style="color:#888;font-size:12px;">Tasks Touched</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#4ecca3;">${insights.length}</div>
        <div style="color:#888;font-size:12px;">Insights</div>
      </div>
    </div>
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">📋 Today's Tasks</h2>
    ${tasksHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">⚠️ Pending Items</h2>
    ${pendingHtml}
  </div>

  <div style="margin:24px 0;padding:16px;background:#1a1a2e;border-radius:8px;">
    <h2 style="color:#4ecca3;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-top:0;">🎯 Tomorrow</h2>
    <p style="color:#ccc;margin:0;">${tomorrowFocus}</p>
  </div>

  <div style="margin:32px 0;padding:16px;background:#1a1a2e;border-radius:8px;text-align:center;">
    <p style="color:#e94560;font-style:italic;margin:0;font-size:14px;">"${reflection}"</p>
  </div>

  <div style="text-align:center;padding:20px 0;color:#555;font-size:12px;">
    Sent by Sherlock 🔍 via ClawBuddy Automations
  </div>
</div></body></html>`;

    const subject = `🌙 Evening Report — ${dateStr}`;
    const text = `Evening Report — ${dateStr}\n\nMomentum: ${totalActions} actions, ${tasks.length} tasks, ${insights.length} insights\n\nTomorrow: ${tomorrowFocus}\n\nReflection: "${reflection}"`;

    return new Response(JSON.stringify({ html, subject, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Evening report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
