const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const MAKE_BASE = "https://hook.us1.make.com";
// Make.com scenario IDs for Google Calendar
const MAKE_SEARCH_SCENARIO_ID = 3890482;
const MAKE_CREATE_SCENARIO_ID = 3885541;
// Make.com API token from env
const MAKE_API_TOKEN = Deno.env.get("MAKE_API_TOKEN")!;

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  status: string;
  location?: string | null;
  description?: string | null;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }> | null;
  htmlLink?: string;
}

async function runMakeScenario(scenarioId: number, data?: Record<string, unknown>): Promise<unknown> {
  const url = `https://us1.make.com/api/v2/scenarios/${scenarioId}/run`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${MAKE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ responsive: true, data: data || {} }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Make.com API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

function cleanEvents(raw: string): CalendarEvent[] {
  try {
    const events: CalendarEvent[] = JSON.parse(raw);
    return events
      .filter((e) => e.status !== "cancelled")
      .map((e) => ({
        id: e.id,
        summary: e.summary || "(No title)",
        start: e.start,
        end: e.end,
        status: e.status,
        location: e.location || null,
        description: e.description
          ? e.description.replace(/<[^>]*>/g, "").substring(0, 200)
          : null,
        attendees: e.attendees
          ? e.attendees.map((a) => ({
              email: a.email,
              displayName: a.displayName || undefined,
              responseStatus: a.responseStatus || undefined,
            }))
          : null,
        htmlLink: e.htmlLink,
      }))
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
  } catch {
    return [];
  }
}

function formatAgenda(events: CalendarEvent[]): string {
  if (events.length === 0) return "No upcoming events in the next 48 hours.";

  return events
    .map((e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      const timeStr = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Vancouver",
      });
      const endStr = end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Vancouver",
      });
      const dateStr = start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/Vancouver",
      });
      const attendeeStr = e.attendees
        ? ` (${e.attendees.length} attendees)`
        : "";
      const locationStr = e.location ? ` @ ${e.location.substring(0, 60)}` : "";
      return `${dateStr} ${timeStr}–${endStr}: ${e.summary}${attendeeStr}${locationStr}`;
    })
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action || "search";

    if (action === "search") {
      // Fetch upcoming 48h events via Make.com
      const result = (await runMakeScenario(MAKE_SEARCH_SCENARIO_ID)) as {
        outputs?: { appointments?: string };
      };
      const rawAppointments =
        result?.outputs?.appointments || "[]";
      const events = cleanEvents(rawAppointments);
      const agenda = formatAgenda(events);

      return new Response(
        JSON.stringify({
          success: true,
          action: "search",
          event_count: events.length,
          events,
          agenda_text: agenda,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "create") {
      const { event_name, start_date, duration } = body;
      if (!event_name || !start_date) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: event_name, start_date",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await runMakeScenario(MAKE_CREATE_SCENARIO_ID, {
        event_name,
        start_date,
        duration: duration || "00:30",
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: "create",
          event_name,
          start_date,
          duration: duration || "00:30",
          make_result: result,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Use "search" or "create".` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("calendar-sync error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
