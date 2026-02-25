import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Phone, PhoneCall, Clock, DollarSign, CalendarCheck, Bell, Users } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const OUTCOME_COLORS: Record<string, string> = {
  answered: '#3B82F6',
  voicemail: '#8B5CF6',
  no_answer: '#6B7280',
  busy: '#F59E0B',
  meeting_booked: '#22C55E',
  disconnected: '#EF4444',
  converted: '#22C55E',
};

const OUTCOME_BORDER: Record<string, string> = {
  answered: 'border-l-blue-500/50',
  voicemail: 'border-l-violet-500/50',
  no_answer: 'border-l-white/[0.1]',
  busy: 'border-l-amber-500/50',
  meeting_booked: 'border-l-emerald-500/50',
  disconnected: 'border-l-red-500/50',
  converted: 'border-l-emerald-500/50',
};

const statusPill = (status: string) => {
  const colors: Record<string, string> = {
    ringing: 'bg-amber-500/20 text-amber-400',
    connected: 'bg-emerald-500/20 text-emerald-400',
    voicemail: 'bg-violet-500/20 text-violet-400',
    ended: 'bg-white/[0.06] text-muted-foreground',
    completed: 'bg-white/[0.06] text-muted-foreground',
    queued: 'bg-amber-500/20 text-amber-400',
    meeting_booked: 'bg-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || colors.ended}`}>{status.replace(/_/g, ' ')}</span>;
};

const TopStat = ({ icon, label, value, glow }: { icon: React.ReactNode; label: string; value: string | number; glow?: boolean }) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">{icon}</div>
    <p className="font-mono text-lg font-bold text-foreground" style={glow ? { textShadow: '0 0 8px currentColor' } : undefined}>{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const FunnelStep = ({ label, value, total, index }: { label: string; value: number; total: number; index: number }) => {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  const widthPct = total > 0 ? Math.max(20, (value / total) * 100) : 20;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 text-right">{label}</span>
      <div className="flex-1 flex justify-center">
        <div
          className="h-5 rounded-sm flex items-center justify-center transition-all duration-500"
          style={{
            width: `${widthPct}%`,
            background: `linear-gradient(90deg, rgba(59,130,246,${0.6 - index * 0.08}), rgba(59,130,246,${0.3 - index * 0.04}))`,
          }}
        >
          <span className="text-xs font-mono text-foreground">{value}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground w-10">{pct}%</span>
    </div>
  );
};

export const OpsOutreachPhoneBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const allItems = items || [];
  const queueState = allItems.find(i => (i.data as Record<string, unknown>)?.type === 'phone_queue_state');
  const calls = allItems.filter(i => (i.data as Record<string, unknown>)?.type === 'call');

  const qs = (queueState?.data || {}) as Record<string, unknown>;
  const queuedCalls = calls.filter(c => (c.data as Record<string, unknown>)?.status === 'queued');
  const activeCalls = calls.filter(c => {
    const s = (c.data as Record<string, unknown>)?.status as string;
    return s && s !== 'queued';
  }).sort((a, b) => {
    const ta = (a.data as Record<string, unknown>)?.called_at as string || '';
    const tb = (b.data as Record<string, unknown>)?.called_at as string || '';
    return tb.localeCompare(ta);
  });

  const outcomeCounts: Record<string, number> = {};
  calls.forEach(c => {
    const outcome = (c.data as Record<string, unknown>)?.outcome as string;
    if (outcome) outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
  });
  const pieData = Object.entries(outcomeCounts).map(([name, value]) => ({ name, value }));
  const totalCalls = (qs.calls_placed_today as number) || calls.length;

  const avgDuration = qs.avg_duration_seconds ? `${Math.round(qs.avg_duration_seconds as number / 60)}m ${Math.round(qs.avg_duration_seconds as number % 60)}s` : '—';

  // Funnel data
  const funnelSteps = [
    { label: 'Placed', value: totalCalls },
    { label: 'Answered', value: outcomeCounts.answered || 0 },
    { label: 'Conversation', value: (qs.conversations as number) || Math.round((outcomeCounts.answered || 0) * 0.7) },
    { label: 'Interest', value: (qs.interested as number) || Math.round((outcomeCounts.answered || 0) * 0.3) },
    { label: 'Meeting', value: (qs.meetings_booked as number) || outcomeCounts.meeting_booked || 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {block.title && (
        <h3 className="font-orbitron text-xl font-semibold uppercase tracking-wider text-foreground mb-4">{block.title}</h3>
      )}

      {/* Top Stats — 5 cards */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] border-t-white/[0.06] rounded-xl p-4 mb-4 shadow-[inset_0_1px_0_rgba(59,130,246,0.08)]">
        <div className="grid grid-cols-5 gap-4">
          <TopStat icon={<Phone className="w-3.5 h-3.5" />} label="Calls Today" value={totalCalls} />
          <TopStat icon={<PhoneCall className="w-3.5 h-3.5" />} label="Connected" value={`${qs.connected_rate || 0}%`} />
          <TopStat icon={<Clock className="w-3.5 h-3.5" />} label="Avg Duration" value={avgDuration} />
          <TopStat icon={<CalendarCheck className="w-3.5 h-3.5" />} label="Meetings" value={qs.meetings_booked as number || 0} glow />
          <TopStat icon={<DollarSign className="w-3.5 h-3.5" />} label="Total Cost" value={`$${(qs.total_cost as number || 0).toFixed(2)}`} />
        </div>
      </div>

      {/* Three Column Layout: 30% / 45% / 25% */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_4.5fr_2.5fr] gap-3">
        {/* Queue */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.12] transition-colors duration-300">
          <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Queue
            <span className="ml-auto font-mono text-foreground bg-white/[0.06] px-2 py-0.5 rounded-full">{qs.total_in_queue as number || queuedCalls.length}</span>
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-custom">
            {queuedCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Queue empty</p>
            ) : queuedCalls.slice(0, 15).map((call, i) => {
              const cd = call.data as Record<string, unknown>;
              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ delay: i * 0.03, repeat: Infinity, duration: 3 }}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
                >
                  <p className="text-sm font-semibold text-foreground">{cd.lead_name as string}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {cd.location && <span>{cd.location as string}</span>}
                    {cd.segment && <span className="px-1.5 py-0.5 rounded bg-white/[0.06]">{cd.segment as string}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Call Feed */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.12] transition-colors duration-300">
          <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5" /> Calls
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-custom">
            {activeCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No calls yet</p>
            ) : activeCalls.slice(0, 20).map((call, i) => {
              const cd = call.data as Record<string, unknown>;
              const durSec = cd.duration_seconds as number || 0;
              const durStr = durSec > 0 ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : '';
              const outcome = cd.outcome as string || '';
              const isMeeting = outcome === 'meeting_booked';
              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 border-l-2 ${OUTCOME_BORDER[outcome] || 'border-l-white/[0.06]'} ${isMeeting ? 'bg-amber-500/[0.04]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isMeeting && <Bell className="w-3.5 h-3.5 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />}
                      <span className="text-sm font-semibold text-foreground">{cd.lead_name as string}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cd.cost != null && <span className="text-xs text-muted-foreground font-mono">${(cd.cost as number).toFixed(2)}</span>}
                      {statusPill(cd.status as string || 'ended')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {cd.company && <span>{cd.company as string}</span>}
                    {cd.location && <span>· {cd.location as string}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {cd.outcome && (
                      <span className={`px-1.5 py-0.5 rounded ${isMeeting ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.06] text-muted-foreground'}`}>
                        {(cd.outcome as string).replace(/_/g, ' ')}
                      </span>
                    )}
                    {durStr && <span className="text-muted-foreground">{durStr}</span>}
                  </div>
                  {cd.summary && <p className="text-xs text-muted-foreground mt-1 italic">{(cd.summary as string).slice(0, 100)}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-3">
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.12] transition-colors duration-300">
            <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3">Outcomes</h4>
            {pieData.length > 0 ? (
              <div style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.15))' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={OUTCOME_COLORS[entry.name] || '#6B7280'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(0 0% 100% / 0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map(d => (
                <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OUTCOME_COLORS[d.name] || '#6B7280' }} />
                  {d.name.replace(/_/g, ' ')} ({d.value})
                </span>
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3">Funnel</h4>
            <div className="space-y-1.5">
              {funnelSteps.map((step, i) => (
                <FunnelStep key={step.label} label={step.label} value={step.value} total={funnelSteps[0].value} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] border-t-blue-500/10 rounded-xl p-3 mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Total: ${(qs.total_cost as number || 0).toFixed(2)}</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {qs.total_in_queue as number || 0} remaining</span>
        {qs.est_completion && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Est: {qs.est_completion as string}</span>}
        <span className="flex items-center gap-1.5">
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400" style={{ textShadow: '0 0 6px rgba(52,211,153,0.4)' }}>{qs.meetings_booked as number || 0} meetings</span>
        </span>
      </div>

      {!queueState && calls.length === 0 && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-dashed border-white/[0.08] rounded-xl py-12 text-center mt-3"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)' }}
        >
          <Phone className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
          <p className="text-base text-muted-foreground">Waiting for phone data…</p>
        </div>
      )}
    </motion.div>
  );
};
