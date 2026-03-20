import { useState, useMemo } from "react";
import { Calendar, LayoutDashboard, Building2, Send, CalendarDays, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpsData } from "@/hooks/useOpsData";
import { Skeleton } from "@/components/ui/skeleton";

import MetricCards from "@/components/meetup/MetricCards";
import Countdown from "@/components/meetup/Countdown";
import Timeline from "@/components/meetup/Timeline";
import DataTable from "@/components/meetup/DataTable";
import KanbanBoard from "@/components/meetup/KanbanBoard";
import Feed from "@/components/meetup/Feed";
import EventCalendar from "@/components/meetup/EventCalendar";

import type {
  VenueRecord,
  SponsorRecord,
  EventRecord,
  OutreachRecord,
  TimelineEvent,
  OutreachLogEntry,
  DashboardMetrics,
} from "@/components/meetup/types";

// ── App & Block IDs ──────────────────────────────────────────────
const APP_ID = "ac28f2c0-0285-4620-ad09-5883ffba92e5";

// ── Tab definitions ──────────────────────────────────────────────
const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "venues", label: "Venues & Sponsors", icon: Building2 },
  { id: "outreach", label: "Pipeline", icon: Send },
  { id: "events", label: "Events", icon: CalendarDays },
];

// ── Column / color configs (from Lovable Index.tsx) ──────────────
const venueColumns = [
  { key: "title", label: "Venue", width: "160px", bold: true },
  { key: "data.contact_name", label: "Contact", width: "130px" },
  { key: "data.email", label: "Email", width: "180px", mono: true },
  { key: "data.phone", label: "Phone", width: "120px" },
  { key: "data.address", label: "Location", width: "200px" },
  { key: "status", label: "Status", width: "110px", type: "badge" as const },
  { key: "data.capacity", label: "Cap", width: "60px", type: "number" as const },
  { key: "data.cost", label: "Cost", width: "110px" },
  { key: "data.last_contact", label: "Last Contact", width: "100px", type: "date" as const },
];

const venueStatusColors: Record<string, string> = {
  contacted: "#3b82f6",
  touring: "#f59e0b",
  negotiating: "#a855f7",
  confirmed: "#10b981",
  rejected: "#ef4444",
  no_response: "#6b7280",
  to_contact: "#6b7280",
};

const sponsorColumns = [
  { key: "title", label: "Company", width: "160px", bold: true },
  { key: "data.contact_name", label: "Contact", width: "130px" },
  { key: "data.channel", label: "Channel", width: "90px", type: "badge" as const },
  { key: "data.tier", label: "Tier", width: "100px", type: "badge" as const },
  { key: "data.ask_amount", label: "Ask (CAD)", width: "100px", type: "currency" as const },
  { key: "status", label: "Status", width: "120px", type: "badge" as const },
  { key: "data.reason", label: "Angle", width: "240px" },
  { key: "data.last_contact", label: "Last Contact", width: "100px", type: "date" as const },
];

const sponsorStatusColors: Record<string, string> = {
  identified: "#6b7280",
  outreach_sent: "#3b82f6",
  in_conversation: "#f59e0b",
  proposal_sent: "#a855f7",
  confirmed: "#10b981",
  declined: "#ef4444",
};

const tierColors: Record<string, string> = {
  venue: "#3b82f6",
  refreshment: "#f59e0b",
  presenting: "#f97316",
  monthly: "#a855f7",
};

const kanbanColumns = [
  { id: "to_contact", label: "Prospects", color: "#6b7280" },
  { id: "outreach_sent", label: "Contacted", color: "#3b82f6" },
  { id: "follow_up", label: "Follow-Up", color: "#f59e0b" },
  { id: "in_conversation", label: "In Conversation", color: "#a855f7" },
  { id: "closed", label: "Closed", color: "#10b981" },
];

const eventHistoryColumns = [
  { key: "title", label: "Event", width: "220px", bold: true },
  { key: "data.date", label: "Date", width: "100px", type: "date" as const },
  { key: "data.event_type", label: "Format", width: "130px", type: "badge" as const },
  { key: "data.venue", label: "Venue", width: "140px" },
  { key: "data.actual_attendees", label: "Attended", width: "80px", type: "number" as const },
  { key: "data.skool_signups", label: "Leads", width: "60px", type: "number" as const },
  { key: "data.discovery_calls", label: "Discovery Calls", width: "90px", type: "number" as const },
  { key: "data.content_pieces", label: "Content", width: "60px", type: "number" as const },
  { key: "status", label: "Status", width: "90px", type: "badge" as const },
];

const eventStatusColors: Record<string, string> = {
  planned: "#3b82f6",
  confirmed: "#10b981",
  completed: "#10b981",
  canceled: "#ef4444",
};

const eventTypeColors: Record<string, string> = {
  openclaw_connect: "#f97316",
  ai_for_business: "#3b82f6",
  live_build: "#a855f7",
  workshop: "#10b981",
};

// ── MeetupLaunchPage ─────────────────────────────────────────────
export const MeetupLaunchPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  // Fetch ALL app data in one query
  const { data: allData, isLoading } = useOpsData({ appId: APP_ID });

  // ── Partition data by item_type ────────────────────────────────
  const { venues, sponsors, events, outreachItems, timelineEvents, outreachLog, metrics } = useMemo(() => {
    if (!allData) return { venues: [], sponsors: [], events: [], outreachItems: [], timelineEvents: [], outreachLog: [], metrics: null };

    const v: VenueRecord[] = [];
    const s: SponsorRecord[] = [];
    const e: EventRecord[] = [];
    const o: OutreachRecord[] = [];
    const tl: TimelineEvent[] = [];
    const ol: OutreachLogEntry[] = [];
    let overview: Record<string, unknown> | null = null;

    for (const item of allData) {
      const d = item.data as Record<string, unknown>;
      const t = item.item_type;

      if (t === "overview" || d?.type === "overview") {
        overview = d;
      } else if (t === "venue") {
        v.push({ id: item.id, title: item.title, status: item.status, data: d as VenueRecord["data"] });
      } else if (t === "sponsor") {
        s.push({ id: item.id, title: item.title, status: item.status, data: d as SponsorRecord["data"] });
      } else if (t === "calendar_event" || t === "event") {
        e.push({ id: item.id, title: item.title, status: item.status, data: d as EventRecord["data"] });
      } else if (t === "outreach") {
        o.push({ id: item.id, title: item.title, status: item.status, data: d as OutreachRecord["data"] });
      } else if (t === "timeline") {
        tl.push({
          id: item.id,
          title: item.title,
          event_type: (d?.event_type as string) || "follow_up",
          agent: (d?.agent as string) || "",
          timestamp: (d?.timestamp as string) || item.created_at,
          contact: d?.contact as string | undefined,
          org: d?.org as string | undefined,
        });
      } else if (t === "outreach_log") {
        ol.push({
          id: item.id,
          title: item.title,
          type: (d?.type as string) || "email",
          contact: (d?.contact as string) || "",
          org: (d?.org as string) || "",
          detail: (d?.detail as string) || "",
          agent: (d?.agent as string) || "",
          timestamp: (d?.timestamp as string) || item.created_at,
        });
      }
    }

    // Sort timeline by timestamp descending
    tl.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    ol.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Build metrics from overview record or compute from data
    const m: DashboardMetrics = overview
      ? {
          events_completed: (overview.events_completed as number) || 0,
          venues_contacted: (overview.venues_contacted as number) || v.length,
          sponsors_contacted: (overview.sponsors_contacted as number) || s.length,
          sponsors_confirmed: (overview.sponsors_confirmed as number) || s.filter(sp => sp.status === "confirmed").length,
          skool_signups: (overview.skool_signups as number) || 0,
          pipeline_value: (overview.pipeline_value as number) || 0,
        }
      : {
          events_completed: e.filter(ev => ev.status === "completed").length,
          venues_contacted: v.length,
          sponsors_contacted: s.length,
          sponsors_confirmed: s.filter(sp => sp.status === "confirmed").length,
          skool_signups: 0,
          pipeline_value: 0,
        };

    return { venues: v, sponsors: s, events: e, outreachItems: o, timelineEvents: tl, outreachLog: ol, metrics: m };
  }, [allData]);

  // ── Metric card configs ────────────────────────────────────────
  const metricCards = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: "Events Completed", value: metrics.events_completed, icon: "calendar-check", color: "#10b981" },
      { label: "Venues Contacted", value: metrics.venues_contacted, icon: "map-pin", color: "#60a5fa" },
      { label: "Sponsors Contacted", value: metrics.sponsors_contacted, icon: "handshake", color: "#f97316" },
      { label: "Sponsors Confirmed", value: metrics.sponsors_confirmed, icon: "check-circle", color: "#34d399" },
      { label: "Leads Generated", value: metrics.skool_signups, icon: "users", color: "#c084fc" },
      { label: "Pipeline Value", value: metrics.pipeline_value, icon: "dollar-sign", color: "#fbbf24", format: "currency" },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="meetup-scope min-h-screen bg-background noise-bg scan-lines grid-bg relative">
      {/* Header */}
      <header className="glass-header border-b border-border sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ops-center")} className="mr-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center glow-hover border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-heading font-bold text-gradient-orange tracking-wide">OPENCLAW CONNECT</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-heading">AI for Your Business — Vancouver</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] px-2.5 py-1 rounded-full border font-heading font-medium tracking-wide"
              style={{ backgroundColor: "#10b98115", color: "#34d399", borderColor: "#10b98125" }}
            >
              ● ACTIVE
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full surface-card-static text-foreground/70 font-mono-data tracking-wider">
              SHERLOCK
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="glass-header border-b border-border px-4 sm:px-6 lg:px-8 sticky top-14 z-40">
        <div className="max-w-[1400px] mx-auto flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-glow flex items-center gap-2 px-5 py-3.5 text-sm font-heading font-medium border-b-2 transition-all duration-300 whitespace-nowrap tracking-wide ${
                  active
                    ? "tab-active border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 transition-all duration-300 ${active ? "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <MetricCards cards={metricCards} />
                <Countdown
                  targetDate="2026-03-19T18:00:00-07:00"
                  label="EVENT 1 — OPENCLAW CONNECT: AI FOR YOUR BUSINESS"
                />
                <Timeline events={timelineEvents} />
              </motion.div>
            )}

            {activeTab === "venues" && (
              <motion.div
                key="venues"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <DataTable title="Venue Pipeline" columns={venueColumns} data={venues} statusColors={venueStatusColors} />
                <DataTable title="Sponsor Pipeline" columns={sponsorColumns} data={sponsors} statusColors={sponsorStatusColors} tierColors={tierColors} />
              </motion.div>
            )}

            {activeTab === "outreach" && (
              <motion.div
                key="outreach"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <KanbanBoard columns={kanbanColumns} items={outreachItems} />
                <Feed entries={outreachLog} />
              </motion.div>
            )}

            {activeTab === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <EventCalendar events={events} />
                <DataTable title="Event History" columns={eventHistoryColumns} data={events} statusColors={{ ...eventStatusColors, ...eventTypeColors }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default MeetupLaunchPage;
