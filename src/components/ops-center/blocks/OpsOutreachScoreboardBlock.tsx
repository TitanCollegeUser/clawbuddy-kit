import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Phone, Mail, Trophy, Zap, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';

interface ScoreboardState {
  status: string;
  calls_placed?: number;
  calls_answered?: number;
  conversations?: number;
  meetings_booked?: number;
  revenue?: number;
  cost?: number;
  emails_sent?: number;
  emails_opened?: number;
  links_clicked?: number;
  replies?: number;
}

interface ActivityItem {
  agent: string;
  event: string;
  lead_name: string;
  lead_location?: string;
  detail: string;
  duration?: string;
  timestamp: string;
  is_conversion?: boolean;
}

const StatCounter = ({ label, value, color, glow }: { label: string; value: number | string; color: string; glow?: boolean }) => (
  <div className="flex justify-between items-center py-1.5 px-2 -mx-2 rounded-md hover:bg-white/[0.03] transition-colors duration-200">
    <span className="text-sm text-muted-foreground">{label}</span>
    <motion.span
      key={String(value)}
      initial={{ scale: 1.2, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`font-mono text-sm font-bold ${color}`}
      style={glow ? { textShadow: '0 0 8px currentColor' } : undefined}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </motion.span>
  </div>
);

const StatusDot = ({ status }: { status: string }) => {
  const color = status === 'active' ? 'bg-emerald-500' : status === 'paused' ? 'bg-amber-500' : 'bg-muted-foreground';
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
};

const ConfettiParticle = ({ delay, left, color }: { delay: number; left: number; color: string }) => (
  <div
    className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
    style={{
      left: `${left}%`,
      top: 0,
      backgroundColor: color,
      animationDelay: `${delay}s`,
    }}
  />
);

const ConversionBell = () => (
  <div className="relative flex flex-col items-center">
    <Bell className="w-6 h-6 text-amber-400 animate-bell-shake" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-16 pointer-events-none">
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7].map((d, i) => (
        <ConfettiParticle
          key={i}
          delay={d}
          left={10 + i * 10}
          color={['#FCD34D', '#F59E0B', '#3B82F6', '#8B5CF6', '#22C55E', '#FCD34D', '#F59E0B', '#8B5CF6'][i]}
        />
      ))}
    </div>
  </div>
);

export const OpsOutreachScoreboardBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });

  const { stateRow, activities } = useMemo(() => {
    const allItems = items || [];
    const sr = allItems.find(i => (i.data as Record<string, unknown>)?.type === 'scoreboard_state');
    const acts = allItems
      .filter(i => (i.data as Record<string, unknown>)?.type === 'activity')
      .sort((a, b) => {
        const ta = (a.data as Record<string, unknown>)?.timestamp as string || '';
        const tb = (b.data as Record<string, unknown>)?.timestamp as string || '';
        return tb.localeCompare(ta);
      })
      .slice(0, 20);
    return { stateRow: sr, activities: acts };
  }, [items]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const d = (stateRow?.data || {}) as Record<string, unknown>;
  const lex = (d.lex || {}) as ScoreboardState;
  const nova = (d.nova || {}) as ScoreboardState;
  const totalRevenue = (d.total_revenue as number) || 0;
  const totalCost = (d.total_cost as number) || 0;
  const campaignStarted = d.campaign_started_at as string;
  const totalMeetings = ((lex.meetings_booked || 0) + (nova.meetings_booked || 0));

  const lexRevenue = lex.revenue || 0;
  const novaRevenue = nova.revenue || 0;
  const lexLeading = lexRevenue > novaRevenue;
  const novaLeading = novaRevenue > lexRevenue;
  const lexActive = lex.status === 'active';
  const novaActive = nova.status === 'active';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {block.title && (
        <h3 className="font-orbitron text-xl font-semibold uppercase tracking-wider text-foreground mb-4">{block.title}</h3>
      )}

      {/* Main Scoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 rounded-xl overflow-hidden backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]">
        {/* Lex Side */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(59,130,246,0.04)' }}
          className={`p-5 transition-shadow duration-500 ${lexLeading ? 'shadow-[inset_0_0_40px_rgba(59,130,246,0.12)]' : ''}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center transition-shadow duration-300 ${lexActive ? 'shadow-[0_0_14px_rgba(59,130,246,0.5)]' : ''}`}
            >
              <Phone className={`w-5 h-5 text-blue-400 ${lexActive ? 'animate-phone-rock' : ''}`} />
            </div>
            <div>
              <h4 className="font-orbitron text-base font-bold text-blue-400">LEX</h4>
              <StatusDot status={lex.status || 'idle'} />
            </div>
            {lexLeading && (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="ml-auto">
                <Trophy className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }} />
              </motion.div>
            )}
          </div>
          <div className="space-y-0.5">
            <StatCounter label="Calls Placed" value={lex.calls_placed || 0} color="text-blue-400" />
            <StatCounter label="Answered" value={lex.calls_answered || 0} color="text-blue-400" />
            <StatCounter label="Conversations" value={lex.conversations || 0} color="text-blue-400" />
            <StatCounter label="Meetings" value={lex.meetings_booked || 0} color="text-emerald-400" glow />
            <StatCounter label="Revenue" value={`$${(lex.revenue || 0).toLocaleString()}`} color="text-emerald-400" glow />
            <StatCounter label="Cost" value={`$${(lex.cost || 0).toFixed(2)}`} color="text-muted-foreground" />
          </div>
        </motion.div>

        {/* Center Divider */}
        <div className="relative flex flex-col items-center justify-center px-6 gap-3">
          <div className="absolute inset-0 w-px left-1/2 -translate-x-1/2 bg-gradient-to-b from-blue-500/40 via-white/[0.08] to-violet-500/40" />
          
          {totalMeetings > 0 && (
            <div className="relative z-10">
              <ConversionBell />
            </div>
          )}

          <div className="relative z-10 backdrop-blur-sm bg-white/[0.04] rounded-lg px-3 py-1">
            <p className="font-orbitron text-xs font-bold text-muted-foreground tracking-widest">VS</p>
          </div>

          <div className="relative text-center z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
            <p className="font-mono text-lg font-bold text-emerald-400" style={{ textShadow: '0 0 10px rgba(52,211,153,0.4)' }}>
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="relative text-center z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Runtime</p>
            <p className="font-mono text-sm text-foreground">
              {campaignStarted ? formatDistanceToNow(new Date(campaignStarted)) : '—'}
            </p>
          </div>
          <div className="relative text-center z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Cost</p>
            <p className="font-mono text-sm text-foreground">${totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Nova Side */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(139,92,246,0.04)' }}
          className={`p-5 transition-shadow duration-500 ${novaLeading ? 'shadow-[inset_0_0_40px_rgba(139,92,246,0.12)]' : ''}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center transition-shadow duration-300 ${novaActive ? 'shadow-[0_0_14px_rgba(139,92,246,0.5)]' : ''}`}
            >
              <Mail className={`w-5 h-5 text-violet-400 ${novaActive ? 'animate-envelope-fly' : ''}`} />
            </div>
            <div>
              <h4 className="font-orbitron text-base font-bold text-violet-400">NOVA</h4>
              <StatusDot status={nova.status || 'idle'} />
            </div>
            {novaLeading && (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="ml-auto">
                <Trophy className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }} />
              </motion.div>
            )}
          </div>
          <div className="space-y-0.5">
            <StatCounter label="Emails Sent" value={nova.emails_sent || 0} color="text-violet-400" />
            <StatCounter label="Opened" value={nova.emails_opened || 0} color="text-violet-400" />
            <StatCounter label="Clicked" value={nova.links_clicked || 0} color="text-violet-400" />
            <StatCounter label="Replies" value={nova.replies || 0} color="text-violet-400" />
            <StatCounter label="Meetings" value={nova.meetings_booked || 0} color="text-emerald-400" glow />
            <StatCounter label="Revenue" value={`$${(nova.revenue || 0).toLocaleString()}`} color="text-emerald-400" glow />
            <StatCounter label="Cost" value={`$${(nova.cost || 0).toFixed(2)}`} color="text-muted-foreground" />
          </div>
        </motion.div>
      </div>

      {/* Activity Ticker */}
      {activities.length > 0 && (
        <div className="mt-3 backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 max-h-64 overflow-y-auto scrollbar-custom">
          <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3">Live Activity</h4>
          <div className="space-y-1.5">
            {activities.map((item, i) => {
              const ad = item.data as unknown as ActivityItem & { type: string };
              const isLex = ad.agent === 'lex';
              const isConversion = ad.is_conversion;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-2 text-sm rounded-md p-2 -mx-1.5 transition-colors border-l-2 ${
                    isConversion
                      ? 'bg-amber-500/[0.08] border-l-amber-500/60 hover:bg-amber-500/[0.12]'
                      : isLex
                      ? 'border-l-blue-500/50 hover:bg-white/[0.03]'
                      : 'border-l-violet-500/50 hover:bg-white/[0.03]'
                  }`}
                >
                  {isConversion ? (
                    <Bell className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  ) : (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${isLex ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'}`}>
                      {isLex ? 'LEX' : 'NOVA'}
                    </span>
                  )}
                  <span className="text-muted-foreground flex-1">
                    {ad.lead_name && <span className="text-foreground">{ad.lead_name}</span>}
                    {ad.lead_location && <span className="text-muted-foreground/70"> ({ad.lead_location})</span>}
                    {ad.detail && <> — {ad.detail}</>}
                    {ad.duration && <span className="text-muted-foreground/60"> [{ad.duration}]</span>}
                  </span>
                  {ad.timestamp && (
                    <span className="text-xs text-muted-foreground/50 shrink-0 font-mono">
                      {new Date(ad.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {!stateRow && activities.length === 0 && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-dashed border-white/[0.08] rounded-xl py-12 text-center mt-3"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)' }}
        >
          <Zap className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
          <p className="text-base text-muted-foreground">Waiting for scoreboard data…</p>
        </div>
      )}
    </motion.div>
  );
};
