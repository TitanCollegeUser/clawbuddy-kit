import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Send, Eye, MousePointerClick, MessageSquare, CalendarCheck,
  TrendingUp, Activity, Zap, Clock, BarChart3,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DailyMetric {
  date: string;
  sent: number;
  opened: number;
  replied: number;
  meetings: number;
}

interface CampaignPerf {
  name: string;
  sent: number;
  opened: number;
  replied: number;
  meetings: number;
}

interface HeatmapEntry {
  hour: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
}

interface AnalyticsData {
  type?: string;
  kpis?: Record<string, number | string>;
  daily_metrics?: DailyMetric[];
  funnel?: Record<string, number>;
  campaign_performance?: CampaignPerf[];
  hourly_heatmap?: HeatmapEntry[];
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const GlassTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string; stroke?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="backdrop-blur-xl bg-background/90 border border-white/[0.1] rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.color || p.stroke || '#fff' }}
          />
          <span className="text-foreground font-mono text-xs">{p.value}</span>
          <span className="text-muted-foreground text-xs">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Config Arrays ─── */

const KPI_CONFIG = [
  {
    key: 'total_emails_sent',
    icon: Send,
    label: 'Emails Sent',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    glow: 'rgba(59,130,246,0.15)',
  },
  {
    key: 'open_rate',
    icon: Eye,
    label: 'Open Rate',
    color: 'text-violet-400',
    bg: 'bg-violet-500/20',
    glow: 'rgba(139,92,246,0.15)',
    suffix: '%',
  },
  {
    key: 'reply_rate',
    icon: MessageSquare,
    label: 'Reply Rate',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    glow: 'rgba(6,182,212,0.15)',
    suffix: '%',
  },
  {
    key: 'meetings_booked',
    icon: CalendarCheck,
    label: 'Meetings Booked',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    glow: 'rgba(52,211,153,0.2)',
  },
  {
    key: 'conversion_rate',
    icon: TrendingUp,
    label: 'Conversion Rate',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    glow: 'rgba(251,191,36,0.15)',
    suffix: '%',
  },
];

const FUNNEL_STEPS = [
  { key: 'sent', label: 'Sent', icon: Send, gradient: 'from-blue-500 to-blue-600', text: 'text-blue-400', shadow: 'rgba(59,130,246,0.3)' },
  { key: 'opened', label: 'Opened', icon: Eye, gradient: 'from-violet-500 to-violet-600', text: 'text-violet-400', shadow: 'rgba(139,92,246,0.3)' },
  { key: 'clicked', label: 'Clicked', icon: MousePointerClick, gradient: 'from-cyan-500 to-cyan-600', text: 'text-cyan-400', shadow: 'rgba(6,182,212,0.3)' },
  { key: 'replied', label: 'Replied', icon: MessageSquare, gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400', shadow: 'rgba(52,211,153,0.3)' },
  { key: 'meetings', label: 'Meetings', icon: CalendarCheck, gradient: 'from-amber-500 to-amber-600', text: 'text-amber-400', shadow: 'rgba(251,191,36,0.3)' },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const PIPELINE_STATUSES = ['new', 'enriched', 'drafted', 'sent', 'opened', 'replied', 'meeting_booked', 'converted'];
const PIPELINE_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B', '#EC4899', '#22C55E', '#10B981', '#F97316'];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export const OpsEmployeeAnalyticsBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId });

  const { analyticsData, liveLeadCounts, totalLeads } = useMemo(() => {
    const all = items || [];

    // Find dedicated analytics overview record
    const analyticsRow = all.find(
      (i) => i.item_type === 'analytics' && (i.data as Record<string, unknown>)?.type === 'overview'
    );

    // Count live leads by status
    const leads = all.filter((i) => i.item_type === 'lead');
    const statusCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const s = l.status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    return {
      analyticsData: (analyticsRow?.data || {}) as AnalyticsData,
      liveLeadCounts: statusCounts,
      totalLeads: leads.length,
    };
  }, [items]);

  /* ─── Loading skeleton ─── */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const kpis = (analyticsData.kpis || {}) as Record<string, number | string>;
  const dailyMetrics = analyticsData.daily_metrics || [];
  const funnel = analyticsData.funnel || {};
  const campaignPerf = analyticsData.campaign_performance || [];
  const heatmap = analyticsData.hourly_heatmap || [];
  const maxHeat = Math.max(1, ...heatmap.flatMap((h) => DAYS.map((d) => h[d] || 0)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  KPI Hero Strip                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {KPI_CONFIG.map((cfg, i) => {
          const Icon = cfg.icon;
          const val = kpis[cfg.key] ?? 0;
          return (
            <motion.div
              key={cfg.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${cfg.glow}` }}
              className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center overflow-hidden group transition-all duration-300 hover:border-white/[0.15]"
            >
              {/* Hover radial glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 80%, ${cfg.glow} 0%, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div
                  className={`w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center ${cfg.bg}`}
                >
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <p
                  className={`font-mono text-2xl font-bold ${cfg.color}`}
                  style={{ textShadow: `0 0 16px ${cfg.glow.replace('0.15', '0.5').replace('0.2', '0.5')}` }}
                >
                  {typeof val === 'number' ? val.toLocaleString() : val}
                  {cfg.suffix || ''}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                  {cfg.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Daily Outreach Volume (Area Chart)                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {dailyMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity
              className="w-4 h-4 text-blue-400"
              style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' }}
            />
            <h4 className="font-orbitron text-xs uppercase tracking-widest text-muted-foreground">
              Daily Outreach Volume
            </h4>
          </div>
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.06))' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyMetrics}>
                <defs>
                  <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(0 0% 100% / 0.2)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(0 0% 100% / 0.2)" />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="sent" stroke="#3B82F6" fill="url(#gradSent)" strokeWidth={2} name="Sent" />
                <Area type="monotone" dataKey="opened" stroke="#8B5CF6" fill="url(#gradOpened)" strokeWidth={2} name="Opened" />
                <Area type="monotone" dataKey="replied" stroke="#22C55E" fill="url(#gradReplied)" strokeWidth={2} name="Replied" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2">
            {[
              { label: 'Sent', color: '#3B82F6' },
              { label: 'Opened', color: '#8B5CF6' },
              { label: 'Replied', color: '#22C55E' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Funnel + Heatmap (side-by-side)                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Engagement Funnel ── */}
        {Object.keys(funnel).length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap
                className="w-4 h-4 text-amber-400"
                style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }}
              />
              <h4 className="font-orbitron text-xs uppercase tracking-widest text-muted-foreground">
                Engagement Funnel
              </h4>
            </div>
            <div className="space-y-2.5">
              {FUNNEL_STEPS.map((step, i) => {
                const val = funnel[step.key] || 0;
                const maxVal = funnel.sent || 1;
                const pct = Math.round((val / maxVal) * 100);
                const barWidth = Math.max(8, pct);
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <Icon className={`w-4 h-4 ${step.text} shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-muted-foreground">{step.label}</span>
                        <span className={`text-xs font-mono font-bold ${step.text}`}>
                          {val.toLocaleString()}{' '}
                          <span className="text-muted-foreground/60">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${step.gradient}`}
                          style={{ boxShadow: `0 0 8px ${step.shadow}` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Best Send Times (compact heatmap) ── */}
        {heatmap.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-orbitron">Best Send Times</span>
            </div>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: '40px repeat(5, 1fr)' }}>
              <div />
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-[9px] text-muted-foreground/60 text-center font-mono leading-none pb-1">{d}</div>
              ))}
              {heatmap.map((row, ri) => (
                <React.Fragment key={ri}>
                  <div className="text-[9px] text-muted-foreground/60 font-mono flex items-center leading-none">{row.hour}</div>
                  {DAYS.map((day) => {
                    const intensity = (row[day] || 0) / maxHeat;
                    return (
                      <div key={day} className="h-6 rounded cursor-default"
                        style={{ backgroundColor: intensity > 0.7 ? `rgba(59,130,246,${0.2 + intensity * 0.4})` : intensity > 0.4 ? `rgba(139,92,246,${0.12 + intensity * 0.25})` : intensity > 0 ? `rgba(255,255,255,${0.03 + intensity * 0.07})` : 'rgba(255,255,255,0.02)' }}
                        title={`${row.hour} ${day}: ${row[day] || 0} opens`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Campaign Performance (Bar Chart)                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {campaignPerf.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3
              className="w-4 h-4 text-violet-400"
              style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.5))' }}
            />
            <h4 className="font-orbitron text-xs uppercase tracking-widest text-muted-foreground">
              Campaign Performance
            </h4>
          </div>
          <div style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.06))' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={campaignPerf} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(0 0% 100% / 0.2)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(0 0% 100% / 0.2)" />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="sent" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Sent" />
                <Bar dataKey="opened" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Opened" />
                <Bar dataKey="replied" fill="#22C55E" radius={[4, 4, 0, 0]} name="Replied" />
                <Bar dataKey="meetings" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Meetings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2">
            {[
              { label: 'Sent', color: '#3B82F6' },
              { label: 'Opened', color: '#8B5CF6' },
              { label: 'Replied', color: '#22C55E' },
              { label: 'Meetings', color: '#F59E0B' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Lead Pipeline (live from ops_data)                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {totalLeads > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4 text-emerald-400"
                style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' }}
              />
              <h4 className="font-orbitron text-xs uppercase tracking-widest text-muted-foreground">
                Lead Pipeline
              </h4>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{totalLeads} total</span>
          </div>
          {/* Stacked progress bar */}
          <div className="h-5 rounded-full overflow-hidden flex bg-white/[0.04]">
            {PIPELINE_STATUSES.map((status, i) => {
              const count = liveLeadCounts[status] || 0;
              if (count === 0) return null;
              const pct = (count / totalLeads) * 100;
              return (
                <motion.div
                  key={status}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.7 + i * 0.05, duration: 0.6 }}
                  className="h-full"
                  style={{
                    backgroundColor: PIPELINE_COLORS[i],
                    minWidth: pct > 0 ? 4 : 0,
                  }}
                  title={`${status}: ${count}`}
                />
              );
            })}
          </div>
          {/* Pipeline legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {PIPELINE_STATUSES.map((status, i) => {
              const count = liveLeadCounts[status] || 0;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIPELINE_COLORS[i] }}
                  />
                  <span className="text-muted-foreground capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Empty State                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!analyticsData.type && totalLeads === 0 && (
        <div
          className="backdrop-blur-xl bg-white/[0.03] border border-dashed border-white/[0.08] rounded-xl py-16 text-center"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)',
          }}
        >
          <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3 animate-pulse" />
          <p className="text-base text-muted-foreground">
            Analytics will populate as Jason runs campaigns
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Daily metrics, engagement funnels, and heatmaps
          </p>
        </div>
      )}
    </motion.div>
  );
};
