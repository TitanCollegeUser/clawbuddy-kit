import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FlaskConical, Play } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Props { block: OpsBlock; appId: string; }

const DEFAULT_COLUMNS = ['longlist', 'shortlist', 'in_production', 'scripted', 'published'];

const COLUMN_LABELS: Record<string, string> = {
  longlist: 'Longlist', shortlist: 'Shortlist', in_production: 'In Production', scripted: 'Scripted', published: 'Published',
};

const COLUMN_COLORS: Record<string, { border: string; dot: string; glow: string; cardAccent: string }> = {
  longlist: {
    border: 'border-l-cyan-500',
    dot: 'bg-cyan-500',
    glow: 'shadow-[0_0_15px_hsl(187_92%_50%/0.2),inset_0_0_15px_hsl(187_92%_50%/0.03)]',
    cardAccent: 'border-l-cyan-500/40',
  },
  shortlist: {
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_15px_hsl(38_92%_50%/0.2),inset_0_0_15px_hsl(38_92%_50%/0.03)]',
    cardAccent: 'border-l-amber-500/40',
  },
  in_production: {
    border: 'border-l-orange-500',
    dot: 'bg-orange-500',
    glow: 'shadow-[0_0_15px_hsl(24_94%_53%/0.2),inset_0_0_15px_hsl(24_94%_53%/0.03)]',
    cardAccent: 'border-l-orange-500/40',
  },
  scripted: {
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_15px_hsl(160_84%_39%/0.2),inset_0_0_15px_hsl(160_84%_39%/0.03)]',
    cardAccent: 'border-l-emerald-500/40',
  },
  published: {
    border: 'border-l-emerald-400',
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_15px_hsl(160_84%_50%/0.2),inset_0_0_15px_hsl(160_84%_50%/0.03)]',
    cardAccent: 'border-l-emerald-400/40',
  },
};

const SOURCE_BADGES: Record<string, { emoji: string; label: string }> = {
  ai_generated: { emoji: '🤖', label: 'AI' },
  manual: { emoji: '👤', label: 'Manual' },
  competitor_inspired: { emoji: '🔍', label: 'Competitor' },
  video_inspired: { emoji: '🎬', label: 'Video' },
};

export const OpsYtPipelineBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const rawColumns = (config.columns as Array<string | { id: string; color?: string; title?: string }>) || DEFAULT_COLUMNS;
  const columns = rawColumns.map(col => typeof col === 'string' ? col : col.id);
  const columnTitleOverrides: Record<string, string> = {};
  rawColumns.forEach(col => {
    if (typeof col === 'object' && col.title) columnTitleOverrides[col.id] = col.title;
  });

  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [selected, setSelected] = useState<OpsDataItem | null>(null);

  const queryClient = useQueryClient();
  const moveIdea = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from('ops_data').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops-data', appId] }),
  });

  const getIdeasForColumn = (status: string) => {
    if (!items) return [];
    return items.filter(i => i.status === status);
  };

  const liveSelected = selected ? items?.find(i => i.id === selected.id) ?? selected : null;

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-shrink-0 w-[320px]">
            <Skeleton className="h-12 w-full rounded-t-xl bg-card/30" />
            <div className="space-y-3 p-3">
              <Skeleton className="h-32 w-full bg-card/30" />
              <Skeleton className="h-24 w-full bg-card/30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-custom">
        {columns.map((status, colIndex) => {
          const columnIdeas = getIdeasForColumn(status);
          const colors = COLUMN_COLORS[status] || COLUMN_COLORS.longlist;
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.1 }}
              className={cn(
                "flex-shrink-0 w-[320px] glass rounded-xl border-l-4 overflow-hidden",
                colors.border,
                colors.glow,
              )}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                    <h3 className="font-orbitron font-semibold uppercase tracking-wider text-foreground text-sm">
                      {columnTitleOverrides[status] || COLUMN_LABELS[status] || status}
                    </h3>
                  </div>
                  <motion.span
                    key={columnIdeas.length}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-foreground"
                  >
                    {columnIdeas.length}
                  </motion.span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-custom">
                {columnIdeas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg border-transparent">
                    No ideas yet
                  </div>
                ) : (
                  columnIdeas.map((item, cardIndex) => {
                    const d = item.data as Record<string, unknown>;
                    const isBanger = Boolean(d.is_banger);
                    const source = SOURCE_BADGES[String(d.source_type || 'manual')] || SOURCE_BADGES.manual;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: cardIndex * 0.05 }}
                        className={cn(
                          "p-3 rounded-lg glass-strong border-l-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group",
                          isBanger
                            ? 'border-l-amber-500 bg-amber-500/[0.06] shadow-[0_0_16px_rgba(234,179,8,0.06)]'
                            : colors.cardAccent,
                        )}
                        onClick={() => setSelected(item)}
                      >
                        <h4 className="text-sm font-medium text-foreground line-clamp-2">{item.title}</h4>
                        {d.topic && <p className="text-xs text-muted-foreground mt-1 truncate">{String(d.topic)}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{source.emoji} {source.label}</span>
                          {isBanger && <span className="text-[10px] text-amber-400">✨ Banger</span>}
                          {status === 'published' && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0 px-1.5">LIVE</Badge>}
                        </div>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status === 'longlist' && (
                            <Button size="sm" variant="ghost" className="w-full h-6 text-[10px] gap-1 text-cyan-400"
                              onClick={e => { e.stopPropagation(); moveIdea.mutate({ id: item.id, newStatus: 'banger_lab' }); }}>
                              <FlaskConical className="h-3 w-3" /> Send to Banger Lab
                            </Button>
                          )}
                          {status === 'shortlist' && (
                            <Button size="sm" variant="ghost" className="w-full h-6 text-[10px] gap-1 text-orange-400"
                              onClick={e => { e.stopPropagation(); moveIdea.mutate({ id: item.id, newStatus: 'in_production' }); }}>
                              <Play className="h-3 w-3" /> Start Production
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!liveSelected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/[0.08] overflow-y-auto">
          {liveSelected && (() => {
            const d = liveSelected.data as Record<string, unknown>;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="font-orbitron">{liveSelected.title}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{liveSelected.status}</Badge>
                    {d.category && <Badge variant="secondary" className="text-xs">{String(d.category)}</Badge>}
                    {Boolean(d.is_banger) && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px]">✨ Banger</Badge>}
                  </div>
                  {d.topic && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Topic</p>
                      <p className="text-sm text-foreground">{String(d.topic)}</p>
                    </div>
                  )}
                  {d.angle && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Angle</p>
                      <p className="text-sm text-foreground">{String(d.angle)}</p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-white/[0.06]">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Move to</p>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.filter(s => s !== liveSelected.status).map(s => (
                        <Button key={s} size="sm" variant="ghost" onClick={() => moveIdea.mutate({ id: liveSelected.id, newStatus: s })} className="h-7 text-xs">
                          {COLUMN_LABELS[s] || s}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};
