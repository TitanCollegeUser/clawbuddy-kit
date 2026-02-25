import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOKKODO = [
  "Accept everything just the way it is.",
  "Do not seek pleasure for its own sake.",
  "Do not, under any circumstances, depend on a partial feeling.",
  "Think lightly of yourself and deeply of the world.",
  "Be detached from desire your whole life long.",
  "Do not regret what you have done.",
  "Never be jealous.",
  "Never let yourself be saddened by a separation.",
  "Resentment and complaint are appropriate neither for oneself nor others.",
  "Do not let yourself be guided by the feeling of lust or love.",
  "In all things have no preferences.",
  "Be indifferent to where you live.",
  "Do not pursue the taste of good food.",
  "Do not hold on to possessions you no longer need.",
  "Do not act following customary beliefs.",
  "Do not collect weapons or practice with weapons beyond what is useful.",
  "Do not fear death.",
  "Do not seek to possess either goods or fiefs for your old age.",
  "Respect Buddha and the gods without counting on their help.",
  "You may abandon your own body but you must preserve your honour.",
  "Never stray from the Way.",
];

const DAY_FOCUS: Record<number, { theme: string; emoji: string; tasks: string[] }> = {
  0: { theme: "Rest & Reflect", emoji: "🧘", tasks: ["Review week's wins", "Plan coming week", "Rest and recharge"] },
  1: { theme: "Strategic Planning", emoji: "🗺️", tasks: ["Set weekly priorities", "Review pipeline", "Plan content calendar"] },
  2: { theme: "Deep Work", emoji: "🔬", tasks: ["Tackle hardest task first", "Script writing session", "Research block"] },
  3: { theme: "Content Creation", emoji: "🎬", tasks: ["Film/edit content", "Thumbnail work", "Post production"] },
  4: { theme: "Outreach & Growth", emoji: "🚀", tasks: ["Collaboration outreach", "Community engagement", "Analytics review"] },
  5: { theme: "Execution & Ship", emoji: "⚡", tasks: ["Ship something today", "Clear backlog", "Quick wins"] },
  6: { theme: "Learning & Exploration", emoji: "📚", tasks: ["Study competitors", "Learn new skill", "Experiment freely"] },
};

const QUOTES = [
  "The obstacle is the way. — Marcus Aurelius",
  "We suffer more in imagination than in reality. — Seneca",
  "Action is the foundational key to all success. — Pablo Picasso",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You miss 100% of the shots you don't take. — Wayne Gretzky",
  "Done is better than perfect.",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Fall seven times, stand up eight. — Japanese Proverb",
  "Discipline equals freedom. — Jocko Willink",
  "Ship it.",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const userId = body.user_id;

    // Get/update musashi state
    let { data: state } = await supabase.from("musashi_state").select("*").eq("user_id", userId).maybeSingle();
    const usedNumbers = state?.last_used_numbers || [];
    const available = Array.from({ length: 21 }, (_, i) => i).filter(i => !usedNumbers.includes(i));
    if (available.length < 3) available.push(...Array.from({ length: 21 }, (_, i) => i));

    const selected: number[] = [];
    const pool = [...available];
    for (let i = 0; i < Math.min(3, pool.length); i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }

    const newUsed = [...usedNumbers, ...selected].slice(-18);
    if (state) {
      await supabase.from("musashi_state").update({ last_used_numbers: newUsed, last_updated: new Date().toISOString() }).eq("id", state.id);
    } else if (userId) {
      await supabase.from("musashi_state").insert({ user_id: userId, last_used_numbers: newUsed });
    }

    // Fetch calendar + last 24h activity in parallel
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const calendarPromise = fetch(`${supabaseUrl}/functions/v1/calendar-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
      body: JSON.stringify({ action: "search" }),
    }).then(r => r.json()).catch(() => ({ events: [], agenda_text: "" }));

    const [tasksRes, logsRes, calendarData] = await Promise.all([
      supabase.from("tasks").select("title, priority, board_column_id").gte("updated_at", since).limit(20),
      supabase.from("ai_log").select("message, category, agent_name").gte("created_at", since).eq("user_id", userId).limit(15),
      calendarPromise,
    ]);

    const tasks = tasksRes.data || [];
    const logs = logsRes.data || [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayFocus = DAY_FOCUS[dayOfWeek];
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const principlesHtml = selected.map(i =>
      `<div style="padding:12px 16px;margin:8px 0;background:#1a1a2e;border-left:3px solid #e94560;border-radius:6px;">
        <span style="color:#e94560;font-weight:bold;">Principle ${i + 1}:</span>
        <span style="color:#eee;margin-left:8px;">${DOKKODO[i]}</span>
      </div>`
    ).join("");

    const tasksHtml = tasks.length > 0
      ? tasks.slice(0, 8).map(t =>
        `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">
          <span style="color:${t.priority === "High" || t.priority === "Urgent" ? "#e94560" : "#4ecca3"};">●</span> ${t.title}
          <span style="float:right;font-size:12px;color:#888;">${t.priority}</span>
        </div>`
      ).join("")
      : '<p style="color:#888;">No recent task activity</p>';

    // Calendar agenda
    const calEvents = (calendarData.events || [])
      .filter((e: { start: string; status: string }) => {
        const eventDate = new Date(e.start);
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(todayStart); tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
        return eventDate >= todayStart && eventDate <= tomorrowEnd && e.status !== "cancelled";
      });
    const calendarHtml = calEvents.length > 0
      ? calEvents.map((e: { start: string; end: string; summary: string; location?: string; attendees?: Array<{ email: string }> }) => {
        const s = new Date(e.start);
        const end = new Date(e.end);
        const time = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Vancouver" });
        const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Vancouver" });
        const day = s.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Vancouver" });
        const attendeeCount = e.attendees ? ` · ${e.attendees.length} attendees` : "";
        return `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">
          <span style="color:#e94560;font-weight:bold;">${day} ${time}–${endTime}</span> ${e.summary}
          <span style="font-size:12px;color:#888;">${attendeeCount}</span>
        </div>`;
      }).join("")
      : '<p style="color:#888;">No events in the next 48 hours</p>';

    const agentHtml = logs.length > 0
      ? logs.slice(0, 5).map(l =>
        `<div style="padding:6px 12px;margin:4px 0;color:#aaa;font-size:13px;">
          <span style="color:#4ecca3;">${l.agent_name || "Ray"}</span>: ${(l.message || "").substring(0, 100)}
        </div>`
      ).join("")
      : '<p style="color:#888;">Agents were quiet</p>';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:20px 0;">
    <h1 style="color:#e94560;margin:0;font-size:28px;">🔍 Morning Digest</h1>
    <p style="color:#888;margin:8px 0 0;">${dateStr}</p>
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">⚔️ Musashi's Dokkōdō</h2>
    ${principlesHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">${dayFocus.emoji} Today's Focus: ${dayFocus.theme}</h2>
    ${dayFocus.tasks.map(t => `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">→ ${t}</div>`).join("")}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">📅 Today's Calendar</h2>
    ${calendarHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">📋 Recent Tasks</h2>
    ${tasksHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">🤖 Agent Activity (24h)</h2>
    ${agentHtml}
  </div>

  <div style="margin:32px 0;padding:16px;background:#1a1a2e;border-radius:8px;text-align:center;">
    <p style="color:#e94560;font-style:italic;margin:0;font-size:14px;">"${quote}"</p>
  </div>

  <div style="text-align:center;padding:20px 0;color:#555;font-size:12px;">
    Sent by Sherlock 🔍 via ClawBuddy Automations
  </div>
</div></body></html>`;

    const subject = `🔍 Morning Digest — ${dateStr}`;
    const calendarText = calEvents.length > 0
      ? calEvents.map((e: { start: string; end: string; summary: string }) => {
        const s = new Date(e.start);
        const time = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Vancouver" });
        const day = s.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Vancouver" });
        return `${day} ${time}: ${e.summary}`;
      }).join("\n")
      : "No events in the next 48 hours";
    const text = `Morning Digest — ${dateStr}\n\nMusashi Principles:\n${selected.map(i => `${i + 1}. ${DOKKODO[i]}`).join("\n")}\n\nToday's Focus: ${dayFocus.theme}\n${dayFocus.tasks.join("\n")}\n\nCalendar:\n${calendarText}\n\n"${quote}"`;

    return new Response(JSON.stringify({ html, subject, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Morning digest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
