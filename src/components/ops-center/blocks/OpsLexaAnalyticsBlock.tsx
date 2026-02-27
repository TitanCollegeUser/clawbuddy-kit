import { useState, useMemo } from "react";
import { BarChart3, Phone, TrendingUp, Clock, DollarSign, Zap, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { KPICard } from "./lexa/KPICard";
import { GlassCard } from "./lexa/GlassCard";
import { formatDuration, formatCost } from "@/lib/lexa-utils";
import { useCalls, useDailyMetrics, useCallStats } from "@/hooks/useLexa";
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

export const OpsLexaAnalyticsBlock = ({ block, appId }: Props) => {
  const [period, setPeriod] = useState("30 Days");

  const { data: metricsData, isLoading: metricsLoading } = useDailyMetrics(periodDays[period] || 30);
  const { data: callsData, isLoading: callsLoading } = useCalls({ limit: 500 });
  const { data: stats, isLoading: statsLoading } = useCallStats();

  const metrics = metricsData || [];
  const calls = callsData?.calls || [];
  const isLoading = metricsLoading || callsLoading || statsLoading;

  const durationBuckets = useMemo(() => {
    const buckets = [
      { label: '0-15s', min: 0, max: 15, count: 0 },
      { label: '15-30s', min: 15, max: 30, count: 0 },
      { label: '30-60s', min: 30, max: 60, count: 0 },
      { label: '1-2m', min: 60, max: 120, count: 0 },
      { label: '2-5m', min: 120, max: 300, count: 0 },
      { label: '5-10m', min: 300, max: 600, count: 0 },
      { label: '10m+', min: 600, max: Infinity, count: 0 },
    ];
    calls.forEach(c => {
      const b = buckets.find(b => c.duration_seconds >= b.min && c.duration_seconds < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [calls]);

  const costByType = useMemo(() => {
    const totals = { stt: 0, tts: 0, llm: 0, millis: 0 };
    calls.forEach(c => {
      const breakdown = Array.isArray(c.cost_breakdown) ? c.cost_breakdown : [];
      breakdown.forEach(cb => {
        if (cb.type in totals) totals[cb.type as keyof typeof totals] += cb.credit;
      });
    });
    return [
      { name: 'STT', value: +totals.stt.toFixed(2), color: 'hsl(217, 91%, 69%)' },
      { name: 'TTS', value: +totals.tts.toFixed(2), color: 'hsl(263, 70%, 76%)' },
      { name: 'LLM', value: +totals.llm.toFixed(2), color: 'hsl(160, 60%, 52%)' },
      { name: 'Millis', value: +totals.millis.toFixed(2), color: 'hsl(187, 82%, 53%)' },
    ];
  }, [calls]);

  const avgLatency = stats?.avgLatency || 0;
  const latencyRating = avgLatency < 500 ? { label: 'Excellent', color: 'text-emerald-400' } :
    avgLatency < 1000 ? { label: 'Good', color: 'text-blue-400' } :
    avgLatency < 1500 ? { label: 'Fair', color: 'text-amber-400' } :
    { label: 'Needs Improvement', color: 'text-red-400' };

  if (isLoading) {
    return <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={28} /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 size={22} className="text-cyan-400" />
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1.5">
        {periods.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${period === p ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-white/[0.05] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Calls" value={stats?.totalCalls || 0} icon={Phone} color="hsl(187, 82%, 53%)" />
        <KPICard label="Answer Rate" value={stats?.answerRate || 0} format={n => `${n.toFixed(1)}%`} icon={TrendingUp} color="hsl(160, 60%, 52%)" />
        <KPICard label="Avg Duration" value={stats?.avgDuration || 0} format={n => formatDuration(n)} icon={Clock} color="hsl(43, 96%, 56%)" />
        <KPICard label="Total Cost" value={stats?.totalCost || 0} format={n => formatCost(n)} icon={DollarSign} color="hsl(27, 97%, 62%)" />
      </div>

      {/* Call Volume Trends */}
      <GlassCard title="Call Volume Trends" icon={TrendingUp}>
        <div className="h-[320px]">
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="lexaAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(187, 82%, 53%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(187, 82%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={axisTickStyle} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="total_calls" stroke="hsl(187, 82%, 53%)" fill="url(#lexaAnalyticsGrad)" strokeWidth={2.5} dot={false} name="Calls" />
                <Line type="monotone" dataKey="avg_duration_seconds" stroke="hsl(172, 66%, 50%)" strokeWidth={2} dot={false} name="Avg Duration (s)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No metrics data yet</div>}
        </div>
      </GlassCard>

      {/* 3 Column: Duration, Cost, Latency */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard title="Duration Distribution">
          <div className="h-[260px]">
            {calls.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationBuckets}>
                  <defs>
                    <linearGradient id="lexaBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(187, 82%, 53%)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(263, 70%, 76%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" strokeOpacity={0.5} />
                  <XAxis dataKey="label" tick={{ ...axisTickStyle, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ ...axisTickStyle, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="url(#lexaBarGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </GlassCard>

        <GlassCard title="Cost Breakdown">
          {calls.length > 0 ? (
            <div className="flex items-center gap-5">
              <div className="w-[150px] h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={costByType} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none">{costByType.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                {costByType.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} /><span className="text-muted-foreground">{c.name}</span></div>
                    <span className="text-foreground font-mono font-semibold">${c.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">No cost data</div>}
        </GlassCard>

        <GlassCard title="Latency Performance" icon={Zap}>
          <div className="text-center py-6">
            <div className="text-4xl font-extrabold text-foreground font-mono">{Math.round(avgLatency)}ms</div>
            <div className={`text-sm font-bold mt-2 ${latencyRating.color}`}>{latencyRating.label}</div>
            <div className="mt-6 space-y-2.5">
              {[['< 500ms', 'Excellent', 'bg-emerald-500'], ['500-1000ms', 'Good', 'bg-blue-500'], ['1000-1500ms', 'Fair', 'bg-amber-500'], ['> 1500ms', 'Poor', 'bg-red-500']].map(([range, label, bg]) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className={`w-2.5 h-2.5 rounded-full ${bg}`} /><span>{range}</span><span className="ml-auto font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Latency Over Time */}
      <GlassCard title="Response Latency Over Time" icon={Zap}>
        <div className="h-[280px]">
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={axisTickStyle} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickStyle} domain={[0, 'auto']} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="avg_latency_ms" stroke="hsl(187, 82%, 53%)" strokeWidth={2.5} dot={false} name="Avg Latency (ms)" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No latency data</div>}
        </div>
      </GlassCard>
    </div>
  );
};
