import { useState } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { Users, Layers, CheckCircle, UserPlus, Linkedin, MessageCircle, Mail, GraduationCap, Video, Ban, Tag } from 'lucide-react';

const sourceIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-4 h-4" />,
  discord: <MessageCircle className="w-4 h-4" />,
  convertkit: <Mail className="w-4 h-4" />,
  skool: <GraduationCap className="w-4 h-4" />,
  webinar: <Video className="w-4 h-4" />,
};

const agentBadge = (agent: string) => {
  if (agent === 'lex') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">Lex</span>;
  if (agent === 'nova') return <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-mono">Nova</span>;
  if (agent === 'both') return <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-foreground font-mono">Both</span>;
  if (agent === 'none') return <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/60 font-mono">Excluded</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground font-mono">Unassigned</span>;
};

const statusIndicator = (status: string) => {
  const cfg: Record<string, { dot: string; text: string; label: string }> = {
    draft: { dot: 'bg-white/30', text: 'text-muted-foreground', label: 'Draft' },
    ready: { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Ready' },
    active: { dot: 'bg-blue-500 animate-pulse', text: 'text-blue-400', label: 'Active' },
    completed: { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Done' },
    paused: { dot: 'bg-amber-500', text: 'text-amber-400', label: 'Paused' },
    excluded: { dot: 'bg-red-500', text: 'text-red-400', label: 'Excluded' },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span className={`flex items-center gap-1.5 text-xs ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const enrichmentColor = (rate: number) => {
  if (rate >= 100) return 'from-emerald-500 to-emerald-400';
  if (rate >= 50) return 'from-amber-500 to-amber-400';
  return 'from-red-500 to-red-400';
};

const SummaryCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] border-t-white/[0.06] rounded-lg p-3 flex items-center gap-3 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] hover:border-white/[0.12] transition-all duration-300"
  >
    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-muted-foreground">{icon}</div>
    <div>
      <p className="font-mono text-lg font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </motion.div>
);

export const OpsOutreachLeadsBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;

  const allItems = items || [];
  const segments = allItems.filter(i => (i.data as Record<string, unknown>)?.type === 'segment');
  const leads = allItems.filter(i => (i.data as Record<string, unknown>)?.type === 'lead');

  const totalLeads = segments.reduce((sum, s) => sum + ((s.data as Record<string, unknown>)?.lead_count as number || 0), 0);
  const totalEnriched = segments.reduce((sum, s) => {
    const sd = s.data as Record<string, unknown>;
    const rate = (sd.enrichment_rate as number || 0) / 100;
    const count = sd.lead_count as number || 0;
    return sum + Math.round(count * rate);
  }, 0);
  const enrichmentRate = totalLeads > 0 ? Math.round((totalEnriched / totalLeads) * 100) : 0;

  const statusCounts = segments.reduce((acc, s) => {
    const st = (s.data as Record<string, unknown>)?.status as string || 'draft';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const selectedSeg = segments.find(s => s.id === selectedSegment);
  const segData = selectedSeg ? (selectedSeg.data as Record<string, unknown>) : null;
  const segLeads = selectedSegment ? leads.filter(l => (l.data as Record<string, unknown>)?.segment_id === selectedSegment) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {block.title && (
        <h3 className="font-orbitron text-xl font-semibold uppercase tracking-wider text-foreground mb-4">{block.title}</h3>
      )}

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <SummaryCard icon={<Users className="w-4 h-4" />} label="Total Leads" value={totalLeads} />
        <SummaryCard icon={<Layers className="w-4 h-4" />} label="Segments" value={segments.length} />
        <SummaryCard icon={<CheckCircle className="w-4 h-4" />} label="Enrichment" value={`${enrichmentRate}%`} />
        <SummaryCard icon={<UserPlus className="w-4 h-4" />} label="Assigned" value={segments.filter(s => {
          const a = (s.data as Record<string, unknown>)?.assigned_agent as string;
          return a && a !== 'unassigned' && a !== 'none';
        }).length} />
      </div>

      {/* Status breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(statusCounts).map(([st, count]) => (
            <span key={st} className="text-xs px-2 py-1 rounded-full bg-white/[0.04] text-muted-foreground">
              {count} {st}
            </span>
          ))}
        </div>
      )}

      {/* Segment Grid — 2 cols */}
      {segments.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-dashed border-white/[0.08] rounded-xl py-12 text-center"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 70%)' }}
        >
          <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
          <p className="text-base text-muted-foreground">No lead segments yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {segments.map((seg, i) => {
            const sd = seg.data as Record<string, unknown>;
            const stats = (sd.stats || {}) as Record<string, number>;
            const agent = sd.assigned_agent as string || 'unassigned';
            const status = sd.status as string || 'draft';
            const isExcluded = status === 'excluded' || agent === 'none';
            const eRate = sd.enrichment_rate as number || 0;
            const glowClass = agent === 'lex'
              ? 'hover:shadow-[0_0_18px_rgba(59,130,246,0.1)]'
              : agent === 'nova'
              ? 'hover:shadow-[0_0_18px_rgba(139,92,246,0.1)]'
              : '';

            return (
              <motion.div
                key={seg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: isExcluded ? 1 : 1.01 }}
                onClick={() => setSelectedSegment(seg.id)}
                className={`group/card backdrop-blur-xl border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                  isExcluded
                    ? 'bg-white/[0.01] border-white/[0.05] opacity-60'
                    : `bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] ${glowClass}`
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-muted-foreground group-hover/card:bg-white/[0.1] transition-colors">
                      {sourceIcons[sd.source as string] || <Users className="w-4 h-4" />}
                    </div>
                    <h4 className={`text-sm font-semibold transition-colors ${isExcluded ? 'text-muted-foreground line-through' : 'text-foreground group-hover/card:text-primary'}`}>
                      {sd.name as string}
                    </h4>
                  </div>
                  {statusIndicator(status)}
                </div>

                {isExcluded && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-red-400">
                    <Ban className="w-3.5 h-3.5" />
                    <span className="font-mono uppercase tracking-wider">Do Not Contact</span>
                  </div>
                )}

                <p className="font-mono text-2xl font-bold text-foreground mb-2" style={!isExcluded ? { textShadow: '0 0 12px rgba(255,255,255,0.06)' } : undefined}>
                  {((sd.lead_count as number) || 0).toLocaleString()}
                </p>

                {/* Enrichment bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Enrichment</span>
                    <span>{eRate}%</span>
                  </div>
                  <div className="relative h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${enrichmentColor(eRate)} transition-all duration-500`}
                      style={{ width: `${eRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {agentBadge(agent)}
                  {sd.sending_tool && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">{sd.sending_tool as string}</span>
                  )}
                </div>

                {/* Mini stats for active/completed */}
                {!isExcluded && (stats.sent > 0 || stats.opened > 0 || stats.replied > 0) && (
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground border-t border-white/[0.04] pt-2">
                    {stats.sent > 0 && <span>{stats.sent} sent</span>}
                    {stats.opened > 0 && <span>{stats.opened} opened</span>}
                    {stats.replied > 0 && <span className="text-emerald-400">{stats.replied} replied</span>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Segment Detail Sheet */}
      <Sheet open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-background border-white/[0.08]">
          <SheetHeader>
            <SheetTitle>{segData?.name as string || 'Segment'}</SheetTitle>
            <SheetDescription>{segData?.description as string || 'Lead segment details'}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {agentBadge(segData?.assigned_agent as string || 'unassigned')}
              {statusIndicator(segData?.status as string || 'draft')}
              {segData?.sending_tool && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">{segData.sending_tool as string}</span>
              )}
            </div>

            {/* Personalization level */}
            {segData?.personalization_level && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Personalization</p>
                <p className="text-sm text-violet-400 font-semibold">{segData.personalization_level as string}</p>
              </div>
            )}

            {/* Tags */}
            {segData?.tags && (
              <div className="flex flex-wrap gap-1.5">
                {(segData.tags as string[]).map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Sub-segments */}
            {segData?.sub_segments && (
              <div>
                <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Sub-Segments</h4>
                <div className="space-y-1.5">
                  {(segData.sub_segments as Array<Record<string, unknown>>).map((sub, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2 flex justify-between text-sm">
                      <span className="text-foreground">{sub.name as string}</span>
                      <span className="font-mono text-muted-foreground">{(sub.count as number || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {segData?.notes && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{segData.notes as string}</p>
              </div>
            )}

            <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mt-4">Sample Leads ({segLeads.length})</h4>
            {segLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No individual lead records loaded</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-custom">
                {segLeads.slice(0, 20).map(lead => {
                  const ld = lead.data as Record<string, unknown>;
                  const personalization = (ld.personalization || {}) as Record<string, unknown>;
                  return (
                    <div key={lead.id} className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
                      <p className="text-sm font-semibold text-foreground">{ld.name as string}</p>
                      <p className="text-xs text-muted-foreground">{ld.email as string}</p>
                      {ld.company && <p className="text-xs text-muted-foreground">{ld.company as string}{ld.title ? ` · ${ld.title}` : ''}</p>}
                      {personalization.opening_line && (
                        <p className="text-xs text-violet-400 mt-1 italic">"{(personalization.opening_line as string).slice(0, 100)}…"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};
