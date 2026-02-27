import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, Phone, Clock, Timer, PhoneIncoming, Zap, DollarSign, TrendingUp, PieChart as PieChartIcon, Activity, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { KPICard } from "./lexa/KPICard";
import { GlassCard } from "./lexa/GlassCard";
import { StatusDot } from "./lexa/StatusDot";
import { formatDuration, formatCost, formatPhone, timeAgo, statusColors, statusLabels } from "@/lib/lexa-utils";
import { useCalls, useDailyMetrics, useCallStats, useMillisCredits, useCallsRealtime } from "@/hooks/useLexa";
import { useQueryClient } from "@tanstack/react-query";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const periods = ["Today", "7 Days", "30 Days", "90 Days", "All Time"];
const periodDays: Record<string, number> = {
  "Today": 1, "7 Days": 7, "30 Days": 30, "90 Days": 90, "All Time": 365,
};

const chartTooltipStyle = {
  background: 'hsl(220, 47%, 11%)',
  border: '1px solid hsl(0 0% 100% / 0.1)',
  borderRadius: 12, fontSize: 13,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
const axisTickStyle = { fill: 'hsl(218, 11%, 55%)', fontSize: 12 };

export const OpsLexaDashboardBlock = ({ block, appId }: Props) => {
  const [period, setPeriod] = useState("30 Days");
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: callsData, isLoading: callsLoading } = useCalls({ limit: 10, sortBy: "created_at", sortDir: "desc" });
  const { data: metrics, isLoading: metricsLoading } = useDailyMetrics(periodDays[period] || 30);
  const { data: stats, isLoading: statsLoading } = useCallStats();
  const { data: credits } = useMillisCredits();

  useEffect(() => {
    const unsubscribe = useCallsRealtime(() => {
      queryClient.invalidateQueries({ queryKey: ["lexa-calls"] });
      queryClient.invalidateQueries({ queryKey: ["lexa-call-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lexa-daily-metrics"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const calls = callsData?.calls || [];
  const dailyMetrics = metrics || [];
  const isLoading = callsLoading || metricsLoading || statsLoading;

  const statusDistribution = useMemo(() => {
    if (!calls.length) return [];
    const map: Record<string, number> = {};
    calls.forEach(c => { map[c.call_status] = (map[c.call_status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({
      name: statusLabels[status] || status, value: count, color: statusColors[status] || '#666',
    }));
  }, [calls]);

  const costByType = useMemo(() => {
    return dailyMetrics.map(m => ({
      date: m.date.slice(5),
      stt: +(m.total_cost * 0.2).toFixed(2),
      tts: +(m.total_cost * 0.25).toFixed(2),
      llm: +(m.total_cost * 0.4).toFixed(2),
      millis: +(m.total_cost * 0.15).toFixed(2),
    }));
  }, [dailyMetrics]);

  return (
    <div className="space-y-8">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center border border-cyan-500/20">
            <Headphones size={22} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Lexa Command Center</h2>
            <p className="text-sm text-muted-foreground">AI Phone Employee</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 flex items-center gap-2 text-sm">
            <StatusDot color="hsl(160, 60%, 52%)" pulse />
            <span className="text-emerald-400 font-medium">Ready</span>
          </div>
          {credits?.credit_balance !== undefined && (
            <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-mono ${Number(credits.credit_balance) < 100 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {Number(credits.credit_balance).toFixed(0)} credits
            </div>
          )}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground font-mono">+1 (778) 743-9520</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Calls" value={stats?.totalCalls || 0} icon={Phone} color="hsl(187, 82%, 53%)" />
        <KPICard label="Total Minutes" value={stats?.totalMinutes || 0} format={n => `${n.toFixed(1)}m`} icon={Clock} color="hsl(160, 60%, 52%)" />
        <KPICard label="Avg Duration" value={stats?.avgDuration || 0} format={n => formatDuration(n)} icon={Timer} color="hsl(43, 96%, 56%)" />
        <KPICard label="Answer Rate" value={stats?.answerRate || 0} format={n => `${n.toFixed(1)}%`} icon={PhoneIncoming} color="hsl(263, 70%, 76%)" />
        <KPICard label="Avg Latency" value={stats?.avgLatency || 0} format={n => `${Math.round(n)}ms`} icon={Zap} color="hsl(217, 91%, 69%)" />
        <KPICard label="Total Cost" value={stats?.totalCost || 0} format={n => formatCost(n)} icon={DollarSign} color="hsl(27, 97%, 62%)" />
      </div>

      {/* Call Volume Chart */}
      <GlassCard title="Call Volume" icon={TrendingUp}>
        <div className="flex gap-1.5 mb-6">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${period === p ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-white/[0.05] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="h-[300px]">
          {dailyMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyMetrics}>
                <defs>
                  <linearGradient id="lexaCallVolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(187, 82%, 53%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(187, 82%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={axisTickStyle} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'hsl(210, 20%, 98%)' }} />
                <Area type="monotone" dataKey="total_calls" stroke="hsl(187, 82%, 53%)" fill="url(#lexaCallVolGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : "No call data yet"}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Pie Chart + Activity Feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard title="Call Outcomes" icon={PieChartIcon}>
          {statusDistribution.length > 0 ? (
            <div className="flex items-center gap-8">
              <div className="w-[200px] h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                      {statusDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-extrabold text-foreground">{stats?.totalCalls || 0}</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {statusDistribution.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="text-foreground font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "No calls yet"}
            </div>
          )}
        </GlassCard>

        <GlassCard title="Recent Activity" icon={Activity}>
          <div className="space-y-1 max-h-[360px] overflow-auto pr-2">
            {calls.length > 0 ? calls.map((call) => (
              <motion.div key={call.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
                <StatusDot color={statusColors[call.call_status] || '#666'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-medium truncate">{formatPhone(call.caller_number || 'Unknown')}</div>
                  <div className="text-xs text-muted-foreground">{timeAgo(call.created_at)}</div>
                </div>
                <span className="text-sm text-muted-foreground font-mono">{formatDuration(call.duration_seconds)}</span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: call.call_type === 'inbound' ? 'hsl(217, 91%, 69%)' : call.call_type === 'outbound' ? 'hsl(187, 82%, 53%)' : 'hsl(263, 70%, 76%)', color: 'hsl(230, 50%, 4%)' }}>
                  {call.call_type}
                </span>
              </motion.div>
            )) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "No recent calls"}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Cost Analysis */}
      <GlassCard title="Cost Analysis" icon={DollarSign}>
        <div className="h-[280px]">
          {costByType.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="stt" stackId="cost" fill="hsl(217, 91%, 69%)" name="STT" />
                <Bar dataKey="tts" stackId="cost" fill="hsl(263, 70%, 76%)" name="TTS" />
                <Bar dataKey="llm" stackId="cost" fill="hsl(160, 60%, 52%)" name="LLM" />
                <Bar dataKey="millis" stackId="cost" fill="hsl(187, 82%, 53%)" name="Millis" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Cost data will appear after calls are made"}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
