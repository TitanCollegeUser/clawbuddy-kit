import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send, Eye, MessageSquare, Calendar, AlertTriangle, Clock,
  TrendingUp, BarChart3, Activity, Star, Mail,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "./nova/GlassCard";
import { KPICard } from "./nova/KPICard";
import { PeriodSelector } from "./nova/PeriodSelector";
import { StatusBadge } from "./nova/StatusBadge";
import { timeAgo } from "@/lib/nova-utils";
import { useNovaDailyMetrics, useEmails, useEmailsRealtime } from "@/hooks/useNova";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const periodDays: Record<string, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90, all: 365 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const tooltipStyle = {
  background: "hsl(222, 47%, 8%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, fontSize: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
};

const statusBorderMap: Record<string, string> = {
  delivered: "border-l-blue-400",
  opened: "border-l-purple-400",
  clicked: "border-l-cyan-400",
  replied: "border-l-green-400",
  bounced: "border-l-orange-400",
  failed: "border-l-red-400",
  sending: "border-l-violet-400",
  queued: "border-l-zinc-400",
};

export const OpsNovaDashboardBlock = ({ block, appId }: Props) => {
  const [period, setPeriod] = useState("30d");
  const queryClient = useQueryClient();
  const { data: metrics = [] } = useNovaDailyMetrics(periodDays[period] || 30);
  const { data: recentData } = useEmails({ limit: 10 });
  const recentEmails = recentData?.emails || [];

  useEffect(() => {
    const unsub = useEmailsRealtime(() => {
      queryClient.invalidateQueries({ queryKey: ["nova-emails"] });
      queryClient.invalidateQueries({ queryKey: ["nova-daily-metrics"] });
    });
    return unsub;
  }, [queryClient]);

  const totals = metrics.reduce(
    (acc, m) => ({
      sent: acc.sent + m.emails_sent,
      delivered: acc.delivered + m.emails_delivered,
      opened: acc.opened + m.emails_opened,
      clicked: acc.clicked + m.emails_clicked,
      replied: acc.replied + m.emails_replied,
      bounced: acc.bounced + m.emails_bounced,
      meetings: acc.meetings + m.meetings_booked,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, meetings: 0 }
  );

  const openRate = totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0;
  const replyRate = totals.delivered > 0 ? (totals.replied / totals.delivered) * 100 : 0;
  const bounceRate = totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;

  const funnelData = [
    { label: "Sent", value: totals.sent, pct: 100, color: "from-blue-500 to-indigo-500" },
    { label: "Delivered", value: totals.delivered, pct: totals.sent > 0 ? (totals.delivered / totals.sent) * 100 : 0, color: "from-indigo-500 to-purple-500" },
    { label: "Opened", value: totals.opened, pct: totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0, color: "from-violet-500 to-purple-500" },
    { label: "Clicked", value: totals.clicked, pct: totals.sent > 0 ? (totals.clicked / totals.sent) * 100 : 0, color: "from-cyan-500 to-blue-500" },
    { label: "Replied", value: totals.replied, pct: totals.sent > 0 ? (totals.replied / totals.sent) * 100 : 0, color: "from-green-500 to-cyan-500" },
    { label: "Meetings", value: totals.meetings, pct: totals.sent > 0 ? (totals.meetings / totals.sent) * 100 : 0, color: "from-green-500 to-green-500/50" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Mail className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Nova Command Center
            </h1>
            <p className="text-sm text-muted-foreground">AI Email Employee</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={recentEmails.some((e) => e.status === "sending") ? "sending" : "active"} />
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground">{totals.sent}/50 today</span>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <motion.div variants={item}><KPICard title="Emails Sent" value={totals.sent} icon={Send} color="violet" /></motion.div>
        <motion.div variants={item}><KPICard title="Open Rate" value={openRate} format="percent" icon={Eye} color="purple" /></motion.div>
        <motion.div variants={item}><KPICard title="Reply Rate" value={replyRate} format="percent" icon={MessageSquare} color="success" /></motion.div>
        <motion.div variants={item}><KPICard title="Meetings Booked" value={totals.meetings} icon={Calendar} color="cyan" /></motion.div>
        <motion.div variants={item}><KPICard title="Bounce Rate" value={bounceRate} format="percent" icon={AlertTriangle} color="orange" /></motion.div>
        <motion.div variants={item}><KPICard title="Queue Depth" value={0} icon={Clock} color="blue" /></motion.div>
      </motion.div>

      {/* Email Volume Chart */}
      <GlassCard glow="violet">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold">Email Volume</span>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        {metrics.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="novaSentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263,70%,68%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(263,70%,68%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="novaOpenedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263,55%,75%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(263,55%,75%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="novaRepliedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160,64%,52%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(160,64%,52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="hsl(220,9%,46%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220,9%,46%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="emails_sent" stroke="hsl(263,70%,68%)" fill="url(#novaSentGrad)" strokeWidth={2} name="Sent" />
                <Area type="monotone" dataKey="emails_opened" stroke="hsl(263,55%,75%)" fill="url(#novaOpenedGrad)" strokeWidth={2} name="Opened" />
                <Area type="monotone" dataKey="emails_replied" stroke="hsl(160,64%,52%)" fill="url(#novaRepliedGrad)" strokeWidth={2} name="Replied" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-sm text-muted-foreground">
            <BarChart3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
            No data yet — send emails to populate charts
          </div>
        )}
      </GlassCard>

      {/* Funnel + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard glow="cyan">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold">Engagement Funnel</span>
          </div>
          <div className="space-y-3">
            {funnelData.map((f, i) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground">{f.label}</span>
                <div className="flex-1 h-7 rounded-full bg-white/5 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${f.color}`}
                  />
                </div>
                <span className="w-12 text-right text-xs font-medium font-mono">{f.value.toLocaleString()}</span>
                <span className="w-12 text-right text-[10px] text-muted-foreground">{f.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard glow="green">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold">Recent Activity</span>
          </div>
          <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
            {recentEmails.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No recent activity</p>
            ) : (
              recentEmails.map((email) => (
                <div
                  key={email.id}
                  className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 transition-all hover:bg-white/5 cursor-pointer ${statusBorderMap[email.status] || "border-l-zinc-400"}`}
                >
                  <StatusBadge status={email.status as any} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{email.to_name || email.to_address}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{email.subject}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(email.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard glow="violet">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold">Top Performers</span>
          </div>
          <div className="space-y-2">
            {recentEmails.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No data yet</p>
            ) : (
              recentEmails.filter((e) => e.open_count > 0).slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-all group">
                  <span className="text-sm font-bold text-violet-400 font-mono w-12">{e.open_count}×</span>
                  <span className="flex-1 text-xs text-muted-foreground truncate">{e.subject}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard glow="blue">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold">Peak Hours</span>
          </div>
          <div className="space-y-2">
            <div className="flex gap-1 pl-20">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="flex-1 text-center text-[10px] text-muted-foreground">{d}</div>
              ))}
            </div>
            {["Morning", "Afternoon", "Evening"].map((block) => (
              <div key={block} className="flex items-center gap-1">
                <span className="w-20 text-right text-[10px] text-muted-foreground pr-2">{block}</span>
                {Array.from({ length: 7 }, (_, i) => {
                  const intensity = Math.random();
                  return (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded-md transition-all hover:scale-110 hover:z-10 cursor-pointer"
                      style={{
                        backgroundColor: `hsla(263, 70%, 68%, ${intensity * 0.6})`,
                        boxShadow: intensity > 0.5 ? `0 0 12px hsla(263, 70%, 68%, ${intensity * 0.3})` : "none",
                      }}
                      title={`${Math.round(intensity * 30)} emails`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};
