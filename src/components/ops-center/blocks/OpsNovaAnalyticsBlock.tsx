import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./nova/GlassCard";
import { KPICard } from "./nova/KPICard";
import { PeriodSelector } from "./nova/PeriodSelector";
import { useNovaDailyMetrics, useTemplates } from "@/hooks/useNova";
import {
  BarChart3, Send, Eye, MessageSquare, Calendar, AlertTriangle,
  Clock, MousePointer, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const periodDays: Record<string, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90, all: 365 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const tooltipStyle = {
  background: "hsl(222, 47%, 8%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, fontSize: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
};

const replyTimeBuckets = [
  { label: "< 1h", count: 12, color: "hsl(263, 70%, 68%)" },
  { label: "1-3h", count: 18, color: "hsl(263, 65%, 65%)" },
  { label: "3-6h", count: 15, color: "hsl(263, 55%, 60%)" },
  { label: "6-12h", count: 8, color: "hsl(263, 45%, 55%)" },
  { label: "12-24h", count: 5, color: "hsl(263, 35%, 50%)" },
  { label: "24-48h", count: 3, color: "hsl(220, 20%, 45%)" },
  { label: "48h+", count: 2, color: "hsl(220, 15%, 40%)" },
];

export const OpsNovaAnalyticsBlock = ({ block, appId }: Props) => {
  const [period, setPeriod] = useState("30d");
  const { data: metrics = [] } = useNovaDailyMetrics(periodDays[period] || 30);
  const { data: templates = [] } = useTemplates();

  const totals = metrics.reduce((acc, m) => ({
    sent: acc.sent + m.emails_sent,
    delivered: acc.delivered + m.emails_delivered,
    opened: acc.opened + m.emails_opened,
    clicked: acc.clicked + m.emails_clicked,
    replied: acc.replied + m.emails_replied,
    bounced: acc.bounced + m.emails_bounced,
    meetings: acc.meetings + m.meetings_booked,
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, meetings: 0 });

  const openRate = totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0;
  const replyRate = totals.delivered > 0 ? (totals.replied / totals.delivered) * 100 : 0;
  const bounceRate = totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;
  const clickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;
  const hasData = metrics.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Analytics</h1>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {!hasData ? (
        <GlassCard glow="violet">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent font-semibold">Need more data</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Send at least 50 emails to unlock analytics</p>
          </div>
        </GlassCard>
      ) : (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <motion.div variants={item}><KPICard title="Total Emails" value={totals.sent} icon={Send} color="violet" /></motion.div>
            <motion.div variants={item}><KPICard title="Open Rate" value={openRate} format="percent" icon={Eye} color="purple" /></motion.div>
            <motion.div variants={item}><KPICard title="Reply Rate" value={replyRate} format="percent" icon={MessageSquare} color="success" /></motion.div>
            <motion.div variants={item}><KPICard title="Meetings Booked" value={totals.meetings} icon={Calendar} color="cyan" /></motion.div>
          </motion.div>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <motion.div variants={item}><KPICard title="Bounce Rate" value={bounceRate} format="percent" icon={AlertTriangle} color="orange" /></motion.div>
            <motion.div variants={item}><KPICard title="Avg Open Time" value={3.2} format="decimal" icon={Clock} color="blue" suffix="h" /></motion.div>
            <motion.div variants={item}><KPICard title="Click-Through" value={clickRate} format="percent" icon={MousePointer} color="cyan" /></motion.div>
            <motion.div variants={item}><KPICard title="Unsubscribe" value={0.2} format="percent" icon={TrendingUp} color="danger" /></motion.div>
          </motion.div>

          <GlassCard glow="violet">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-semibold">Email Volume Trends</span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="novaAnalyticsVolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(263, 70%, 68%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(263, 70%, 68%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="hsl(220, 9%, 46%)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(220, 9%, 46%)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="emails_sent" stroke="hsl(263, 70%, 68%)" fill="url(#novaAnalyticsVolGrad)" strokeWidth={2} name="Sent" />
                  <Area type="monotone" dataKey="emails_opened" stroke="hsl(263, 55%, 75%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" name="Opened" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard glow="blue">
              <h3 className="text-sm font-semibold mb-3">Engagement Over Time</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ ...tooltipStyle, fontSize: 11 }} />
                    <Area type="monotone" dataKey="emails_delivered" stackId="1" fill="hsl(217, 91%, 68%)" fillOpacity={0.3} stroke="hsl(217, 91%, 68%)" strokeWidth={1} />
                    <Area type="monotone" dataKey="emails_opened" stackId="1" fill="hsl(263, 70%, 68%)" fillOpacity={0.3} stroke="hsl(263, 70%, 68%)" strokeWidth={1} />
                    <Area type="monotone" dataKey="emails_replied" stackId="1" fill="hsl(160, 64%, 52%)" fillOpacity={0.3} stroke="hsl(160, 64%, 52%)" strokeWidth={1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard glow="violet">
              <h3 className="text-sm font-semibold mb-3">Reply Time Distribution</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={replyTimeBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" stroke="hsl(220, 9%, 46%)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ ...tooltipStyle, fontSize: 11 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {replyTimeBuckets.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard glow="cyan">
              <h3 className="text-sm font-semibold mb-3">Best Send Times</h3>
              <div className="space-y-1">
                <div className="flex gap-0.5 pl-8">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <div key={d} className="flex-1 text-center text-[8px] text-muted-foreground">{d}</div>
                  ))}
                </div>
                {Array.from({ length: 7 }, (_, h) => {
                  const hour = h + 7;
                  return (
                    <div key={h} className="flex items-center gap-0.5">
                      <span className="w-8 text-right text-[8px] text-muted-foreground pr-1">{hour}:00</span>
                      {Array.from({ length: 7 }, (_, d) => {
                        const intensity = Math.random();
                        return (
                          <div
                            key={d}
                            className="flex-1 h-5 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-pointer"
                            style={{
                              backgroundColor: `hsla(263, 70%, 68%, ${intensity * 0.7})`,
                              boxShadow: intensity > 0.5 ? `0 0 8px hsla(263, 70%, 68%, ${intensity * 0.3})` : "none",
                            }}
                            title={`${Math.round(intensity * 20)} emails`}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {templates.length > 0 && (
            <GlassCard glow="green">
              <h3 className="text-sm font-semibold mb-3">Template Performance</h3>
              <div className="space-y-2">
                {templates.slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center gap-3 group">
                    <span className="w-32 text-xs truncate">{t.name}</span>
                    <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(t.avg_reply_rate * 10, 100)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-violet-500"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 font-mono">{t.usage_count} sends</span>
                    <span className="text-xs w-12 text-right font-mono">{t.avg_open_rate}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </motion.div>
  );
};
