import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Crown, Phone, Mail, Lightbulb, Trophy, Clock, Target, HelpCircle, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

const MetricBox = ({ label, value, sub, glow, color }: { label: string; value: string | number; sub?: string; glow?: boolean; color?: string }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 text-center hover:border-white/[0.15] hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] transition-all duration-300"
  >
    <p
      className={`font-mono text-2xl font-bold ${color || 'text-foreground'}`}
      style={glow ? { textShadow: '0 0 16px rgba(52,211,153,0.6)' } : undefined}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </motion.div>
);

const ConfettiDot = ({ delay, x, color }: { delay: number; x: number; color: string }) => (
  <div
    className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
    style={{ left: `${x}%`, top: '30%', backgroundColor: color, animationDelay: `${delay}s` }}
  />
);

export const OpsOutreachResultsBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const allItems = items || [];
  const resultRow = allItems.find(i => (i.data as Record<string, unknown>)?.type === 'results_summary');

  if (!resultRow) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="backdrop-blur-xl bg-white/[0.03] border border-dashed border-white/[0.08] rounded-xl py-16 text-center"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.04) 0%, transparent 70%)' }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-10 h-10 text-muted-foreground/40" />
            <HelpCircle className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-base text-muted-foreground">Campaign results will appear here once the Lex vs Nova battle concludes.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Stay tuned for the winner reveal</p>
        </div>
      </motion.div>
    );
  }

  const d = resultRow.data as Record<string, unknown>;
  const winner = d.winner as string;
  const isLex = winner === 'lex';
  const lex = (d.lex_results || {}) as Record<string, unknown>;
  const nova = (d.nova_results || {}) as Record<string, unknown>;
  const combined = (d.combined || {}) as Record<string, unknown>;
  const insights = (d.insights || []) as string[];
  const segmentBreakdown = (d.segment_breakdown || []) as Array<Record<string, unknown>>;

  const comparisonData = [
    { metric: isLex ? 'Calls' : 'Emails', Lex: (lex.calls_placed as number) || 0, Nova: (nova.emails_sent as number) || 0 },
    { metric: isLex ? 'Answered' : 'Opened', Lex: (lex.calls_answered as number) || 0, Nova: (nova.emails_opened as number) || 0 },
    { metric: 'Meetings', Lex: (lex.meetings_booked as number) || 0, Nova: (nova.meetings_booked as number) || 0 },
    { metric: 'Revenue', Lex: (lex.revenue as number) || 0, Nova: (nova.revenue as number) || 0 },
    { metric: 'Cost', Lex: (lex.cost as number) || 0, Nova: (nova.cost as number) || 0 },
  ];

  const totalRevenue = (combined.total_revenue as number) || 0;
  const totalCost = (combined.total_cost as number) || 0;
  const roiPercent = (combined.roi_percent as number) || (totalCost > 0 ? Math.round((totalRevenue / totalCost) * 100) : 0);
  const totalMeetings = (combined.total_meetings as number) || 0;
  const costPerMeeting = totalMeetings > 0 ? (totalCost / totalMeetings) : 0;

  const winnerColor = isLex ? 'rgba(59,130,246,0.08)' : 'rgba(139,92,246,0.08)';
  const confettiColors = ['#FCD34D', '#F59E0B', '#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#EC4899', '#6366F1'];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {block.title && (
        <h3 className="font-orbitron text-xl font-semibold uppercase tracking-wider text-foreground mb-4">{block.title}</h3>
      )}

      {/* Hero Winner with confetti */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className={`relative backdrop-blur-xl border rounded-xl p-8 text-center mb-4 overflow-hidden ${isLex ? 'border-blue-500/20' : 'border-violet-500/20'}`}
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${winnerColor} 0%, transparent 70%)` }}
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiColors.map((c, i) => (
            <ConfettiDot key={i} delay={i * 0.15} x={8 + i * 12} color={c} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
          <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 3 }}>
            <Crown className={`w-8 h-8 ${isLex ? 'text-blue-400' : 'text-violet-400'}`} style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} />
          </motion.div>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isLex ? 'bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]'}`}
          >
            {isLex ? <Phone className="w-7 h-7 text-blue-400" /> : <Mail className="w-7 h-7 text-violet-400" />}
          </div>
          <motion.div animate={{ rotate: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 3 }}>
            <Crown className={`w-8 h-8 ${isLex ? 'text-blue-400' : 'text-violet-400'}`} style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} />
          </motion.div>
        </div>
        <motion.h2
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className={`font-orbitron text-3xl font-black uppercase tracking-widest ${isLex ? 'text-blue-400' : 'text-violet-400'}`}
          style={{ textShadow: `0 0 20px ${isLex ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)'}` }}
        >
          {isLex ? 'LEX WINS' : 'NOVA WINS'}
        </motion.h2>
        {d.campaign_name && <p className="text-sm text-muted-foreground mt-2">{d.campaign_name as string}</p>}

        {/* Side-by-side final score */}
        <div className="grid grid-cols-2 gap-4 mt-4 relative z-10">
          <div className="text-center">
            <p className="font-orbitron text-xs text-blue-400 mb-1">LEX</p>
            <p className="font-mono text-lg font-bold text-foreground">{(lex.meetings_booked as number || 0)} meetings</p>
            <p className="font-mono text-sm text-emerald-400">${(lex.revenue as number || 0).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="font-orbitron text-xs text-violet-400 mb-1">NOVA</p>
            <p className="font-mono text-lg font-bold text-foreground">{(nova.meetings_booked as number || 0)} meetings</p>
            <p className="font-mono text-sm text-emerald-400">${(nova.revenue as number || 0).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* ROI Calculator */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricBox label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} glow color="text-emerald-400" />
        <MetricBox label="Total Cost" value={`$${totalCost.toFixed(2)}`} color="text-muted-foreground" />
        <MetricBox label="ROI" value={`${roiPercent.toLocaleString()}%`} glow color="text-emerald-400" />
        <MetricBox label="Cost/Meeting" value={`$${costPerMeeting.toFixed(2)}`} />
      </div>

      {/* Side by Side Agent Scores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="backdrop-blur-xl bg-blue-500/[0.03] border border-blue-500/10 rounded-xl p-4 hover:border-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all duration-300">
          <h4 className="font-orbitron text-sm font-bold text-blue-400 mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> LEX</h4>
          <div className="space-y-1.5 text-sm">
            {([
              ['Calls', lex.calls_placed],
              ['Answered', lex.calls_answered],
              ['Rate', `${lex.connected_rate || 0}%`],
              ['Meetings', lex.meetings_booked],
              ['Revenue', `$${(lex.revenue as number || 0).toLocaleString()}`],
              ['Cost', `$${(lex.cost as number || 0).toFixed(2)}`],
            ] as [string, unknown][]).map(([label, val]) => (
              <div key={label} className="flex justify-between hover:bg-white/[0.02] rounded px-1 -mx-1 transition-colors">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-mono ${label === 'Meetings' || label === 'Revenue' ? 'text-emerald-400' : 'text-foreground'}`}
                  style={label === 'Meetings' || label === 'Revenue' ? { textShadow: '0 0 6px rgba(52,211,153,0.4)' } : undefined}
                >
                  {typeof val === 'number' ? val.toLocaleString() : String(val || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="backdrop-blur-xl bg-violet-500/[0.03] border border-violet-500/10 rounded-xl p-4 hover:border-violet-500/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300">
          <h4 className="font-orbitron text-sm font-bold text-violet-400 mb-3 flex items-center gap-2"><Mail className="w-4 h-4" /> NOVA</h4>
          <div className="space-y-1.5 text-sm">
            {([
              ['Emails', nova.emails_sent],
              ['Opened', nova.emails_opened],
              ['Rate', `${nova.open_rate || 0}%`],
              ['Replies', nova.replies],
              ['Meetings', nova.meetings_booked],
              ['Revenue', `$${(nova.revenue as number || 0).toLocaleString()}`],
              ['Cost', `$${(nova.cost as number || 0).toFixed(2)}`],
            ] as [string, unknown][]).map(([label, val]) => (
              <div key={label} className="flex justify-between hover:bg-white/[0.02] rounded px-1 -mx-1 transition-colors">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-mono ${label === 'Meetings' || label === 'Revenue' ? 'text-emerald-400' : 'text-foreground'}`}
                  style={label === 'Meetings' || label === 'Revenue' ? { textShadow: '0 0 6px rgba(52,211,153,0.4)' } : undefined}
                >
                  {typeof val === 'number' ? val.toLocaleString() : String(val || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Comparison Chart */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4">
        <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3">Agent Comparison</h4>
        <div style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.1))' }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(0 0% 100% / 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 100% / 0.3)" />
              <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(0 0% 100% / 0.1)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="Lex" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Nova" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segment Breakdown */}
      {segmentBreakdown.length > 0 && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4">
          <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3">Segment Breakdown</h4>
          <div className="space-y-2">
            {segmentBreakdown.sort((a, b) => ((b.conversion_rate as number) || 0) - ((a.conversion_rate as number) || 0)).map((seg, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors ${i === 0 ? 'border border-amber-500/20 bg-amber-500/[0.04]' : ''}`}>
                {i === 0 && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />}
                <span className="text-foreground flex-1">{(seg.name as string || '').replace(/_/g, ' ')}</span>
                <span className="font-mono text-emerald-400">{(seg.conversion_rate as number || 0).toFixed(1)}%</span>
                <span className="font-mono text-muted-foreground">${(seg.revenue as number || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4">
          <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.4))' }} />
            Key Insights
          </h4>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 border-l-2 border-l-amber-500/30 pl-3 hover:bg-white/[0.02] rounded-r-md py-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Best Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {d.best_subject_line && (
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 hover:border-violet-500/20 transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5 text-violet-400" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.4))' }} /><span className="text-xs text-muted-foreground">Best Subject</span></div>
            <p className="text-sm text-foreground italic">"{d.best_subject_line as string}"</p>
          </motion.div>
        )}
        {d.best_call_time && (
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.4))' }} /><span className="text-xs text-muted-foreground">Best Call Time</span></div>
            <p className="text-sm text-foreground">{d.best_call_time as string}</p>
          </motion.div>
        )}
        {d.best_segment && (
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.4))' }} /><span className="text-xs text-muted-foreground">Best Segment</span></div>
            <p className="text-sm text-foreground">{(d.best_segment as string).replace(/_/g, ' ')}</p>
          </motion.div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/[0.06] via-violet-500/[0.06] to-emerald-500/[0.06] border border-white/[0.08] rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Want this system?</p>
        <p className="font-orbitron text-base font-bold text-foreground mt-1">Join Agents in a Box</p>
      </div>
    </motion.div>
  );
};
