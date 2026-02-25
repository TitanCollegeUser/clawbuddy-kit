import { useState } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { Rocket, Users, DollarSign, CalendarCheck, Phone, Mail, Clock, AlertCircle } from 'lucide-react';

const campaignStatusPill = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-white/[0.06] text-muted-foreground',
    scheduled: 'bg-amber-500/20 text-amber-400',
    active: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
    paused: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-blue-500/20 text-blue-400',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full transition-shadow ${colors[status] || colors.draft}`}>{status}</span>;
};

const LiveBadge = () => (
  <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
    LIVE
  </span>
);

const agentBadges = (agents: string[]) => (
  <div className="flex gap-1">
    {agents.map(a => (
      <span key={a} className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${a === 'lex' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'}`}>
        {a === 'lex' ? <><Phone className="w-3 h-3" /> LEX</> : <><Mail className="w-3 h-3" /> NOVA</>}
      </span>
    ))}
  </div>
);

export const OpsOutreachCampaignsBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const campaigns = (items || []).filter(i => (i.data as Record<string, unknown>)?.type === 'campaign');
  const selCampaign = campaigns.find(c => c.id === selectedCampaign);
  const cd = selCampaign ? (selCampaign.data as Record<string, unknown>) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {block.title && (
        <h3 className="font-orbitron text-xl font-semibold uppercase tracking-wider text-foreground mb-4">{block.title}</h3>
      )}

      {campaigns.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-dashed border-white/[0.08] rounded-xl py-12 text-center"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 70%)' }}
        >
          <Rocket className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
          <p className="text-base text-muted-foreground">No campaigns configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp, i) => {
            const d = camp.data as Record<string, unknown>;
            const segments = (d.segments || []) as Array<Record<string, unknown>>;
            const results = (d.results || {}) as Record<string, unknown>;
            const schedule = (d.schedule || {}) as Record<string, unknown>;
            const totalLeads = segments.reduce((sum, s) => sum + ((s.lead_count as number) || 0), 0);
            const status = d.status as string || 'draft';
            const isActive = status === 'active';
            const isDraft = status === 'draft';
            const agents = (d.agents || []) as string[];
            const hasLex = agents.includes('lex');
            const hasNova = agents.includes('nova');

            const totalSent = (results.total_sent as number || 0) + (results.total_calls as number || 0);
            const progress = totalLeads > 0 ? Math.min(100, Math.round((totalSent / totalLeads) * 100)) : 0;

            const glowColor = hasLex && hasNova
              ? 'hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]'
              : hasLex ? 'hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]'
              : 'hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]';

            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.005 }}
                onClick={() => setSelectedCampaign(camp.id)}
                className={`group/card backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 ${glowColor}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-muted-foreground group-hover/card:bg-white/[0.1] transition-colors">
                      <Rocket className="w-4 h-4 group-hover/card:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground group-hover/card:text-primary transition-colors">{d.name as string}</h4>
                      {d.description && <p className="text-xs text-muted-foreground mt-0.5">{(d.description as string).slice(0, 120)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && <LiveBadge />}
                    {agentBadges(agents)}
                    {campaignStatusPill(status)}
                  </div>
                </div>

                {/* Draft banner */}
                {isDraft && (
                  <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 mb-3 text-xs text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Campaign not yet launched
                  </div>
                )}

                {/* Total leads */}
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="font-mono text-3xl font-bold text-foreground" style={isActive ? { textShadow: '0 0 12px rgba(255,255,255,0.08)' } : undefined}>
                      {totalLeads.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">total leads</p>
                  </div>
                  <div className="flex-1" />
                  {/* Schedule info */}
                  {(schedule.lex_hours || schedule.nova_send_limit) && (
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {schedule.lex_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {schedule.lex_hours as string}</span>}
                      {schedule.nova_send_limit && <span>Nova: {schedule.nova_send_limit as number}/day</span>}
                      {schedule.lex_call_limit && <span>Lex: {schedule.lex_call_limit as number}/day</span>}
                    </div>
                  )}
                </div>

                {/* Segments list */}
                {segments.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {segments.slice(0, 6).map((seg, si) => {
                      const segProgress = (seg.contacted as number || 0) > 0 && (seg.lead_count as number) > 0
                        ? Math.min(100, Math.round(((seg.contacted as number) / (seg.lead_count as number)) * 100))
                        : 0;
                      return (
                        <div key={si} className="flex items-center gap-2 text-xs bg-white/[0.02] rounded-lg p-2 hover:bg-white/[0.03] transition-colors">
                          <span className="text-foreground flex-1 truncate">{seg.segment_name as string}</span>
                          <span className="font-mono text-muted-foreground w-10 text-right">{((seg.lead_count as number) || 0).toLocaleString()}</span>
                          {seg.agent && (
                            <span className={`px-1.5 py-0.5 rounded font-mono ${(seg.agent as string) === 'lex' ? 'bg-blue-500/15 text-blue-400' : 'bg-violet-500/15 text-violet-400'}`}>
                              {(seg.agent as string).toUpperCase()}
                            </span>
                          )}
                          {seg.sending_tool && <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground">{seg.sending_tool as string}</span>}
                          {isActive && (
                            <div className="w-16 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${segProgress}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                    {isActive && progress < 100 && (
                      <div
                        className="absolute inset-y-0 left-0 w-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                          animation: 'shimmer 2s infinite',
                        }}
                      />
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
                </div>

                {/* Key Metrics */}
                <div className={`grid grid-cols-4 gap-2 ${isDraft ? 'opacity-40' : ''}`}>
                  <div className="text-center bg-white/[0.02] rounded-lg p-2">
                    <p className="font-mono text-sm font-bold text-foreground">{(results.total_sent as number || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center bg-white/[0.02] rounded-lg p-2">
                    <p className="font-mono text-sm font-bold text-foreground">{(results.total_calls as number || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Calls</p>
                  </div>
                  <div className="text-center bg-white/[0.02] rounded-lg p-2">
                    <p className="font-mono text-sm font-bold text-emerald-400" style={{ textShadow: '0 0 6px rgba(52,211,153,0.3)' }}>{results.meetings_booked as number || 0}</p>
                    <p className="text-xs text-muted-foreground">Meetings</p>
                  </div>
                  <div className="text-center bg-white/[0.02] rounded-lg p-2">
                    <p className="font-mono text-sm font-bold text-emerald-400" style={{ textShadow: '0 0 6px rgba(52,211,153,0.3)' }}>${(results.revenue as number || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-background border-white/[0.08]">
          <SheetHeader>
            <SheetTitle>{cd?.name as string || 'Campaign'}</SheetTitle>
            <SheetDescription>{cd?.description as string || ''}</SheetDescription>
          </SheetHeader>
          {cd && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(cd.status as string) === 'active' && <LiveBadge />}
                {agentBadges((cd.agents || []) as string[])}
                {campaignStatusPill(cd.status as string || 'draft')}
              </div>

              {/* Schedule */}
              {cd.schedule && (
                <div>
                  <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Schedule</h4>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 space-y-1 text-sm">
                    {(cd.schedule as Record<string, unknown>).start && <p className="text-muted-foreground">Start: {(cd.schedule as Record<string, unknown>).start as string}</p>}
                    {(cd.schedule as Record<string, unknown>).end && <p className="text-muted-foreground">End: {(cd.schedule as Record<string, unknown>).end as string}</p>}
                    {(cd.schedule as Record<string, unknown>).lex_hours && <p className="text-muted-foreground">Lex hours: {(cd.schedule as Record<string, unknown>).lex_hours as string}</p>}
                    {(cd.schedule as Record<string, unknown>).nova_send_limit && <p className="text-muted-foreground">Nova limit: {(cd.schedule as Record<string, unknown>).nova_send_limit as number}/day</p>}
                    {(cd.schedule as Record<string, unknown>).lex_call_limit && <p className="text-muted-foreground">Lex limit: {(cd.schedule as Record<string, unknown>).lex_call_limit as number}/day</p>}
                  </div>
                </div>
              )}

              {/* Segments */}
              <div>
                <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Segments</h4>
                <div className="space-y-2">
                  {((cd.segments || []) as Array<Record<string, unknown>>).map((seg, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{seg.segment_name as string}</span>
                        <span className="font-mono text-sm text-foreground">{((seg.lead_count as number) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        {seg.agent && <span>Agent: {seg.agent as string}</span>}
                        {seg.sending_tool && <span>Tool: {seg.sending_tool as string}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              {cd.results && (
                <div>
                  <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Results</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(cd.results as Record<string, unknown>).map(([k, v]) => (
                      <div key={k} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2 text-center hover:bg-white/[0.04] transition-colors">
                        <p className="font-mono text-sm font-bold text-foreground">{typeof v === 'number' ? v.toLocaleString() : String(v)}</p>
                        <p className="text-xs text-muted-foreground">{k.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};
