import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { Users, Eye, Video, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Props { block: OpsBlock; appId: string; }

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const OutlierBadge = ({ score }: { score: number }) => {
  if (score >= 8) return <span title="Viral outlier">💎</span>;
  if (score >= 5) return <span title="Strong outlier">⚡</span>;
  if (score >= 3) return <span title="Above average">🔥</span>;
  return null;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const },
  }),
};

export const OpsYtCompetitorsBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const defaultView = (config.default_view as string) || 'grid';
  const columns = Number(config.columns || 4);

  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(defaultView as 'grid' | 'table');
  const [selected, setSelected] = useState<OpsDataItem | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div>
    );
  }

  const competitors = items ?? [];
  const selectedData = selected?.data as Record<string, unknown> | undefined;
  const videos = (selectedData?.videos as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron font-semibold uppercase tracking-wider text-foreground">
          {competitors.length} Competitors
        </h2>
        <div className="flex items-center gap-2">
          <Button size="icon" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={viewMode === 'table' ? 'secondary' : 'ghost'} onClick={() => setViewMode('table')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!competitors.length && (
        <div className="p-8 glass rounded-2xl text-center">
          <p className="text-muted-foreground">No competitors tracked yet.</p>
        </div>
      )}

      {viewMode === 'grid' && competitors.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(columns, 4)} gap-4`}>
          {competitors.map((c, i) => {
            const d = c.data as Record<string, unknown>;
            return (
              <motion.div
                key={c.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => setSelected(c)}
                className="p-4 rounded-2xl glass-strong cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/[0.15] group/card"
              >
                <div className="flex items-center gap-3 mb-3">
                  {d.thumbnail_url ? (
                    <img src={String(d.thumbnail_url)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/[0.08]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-lg font-orbitron">
                      {c.title.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate group-hover/card:text-primary transition-colors">{c.title}</h4>
                    {d.handle && <p className="text-xs text-muted-foreground">@{String(d.handle)}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /></div>
                    <p className="text-sm font-mono font-semibold text-foreground">{formatCount(Number(d.subscriber_count || 0))}</p>
                    <p className="text-[10px] text-muted-foreground">Subs</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" /></div>
                    <p className="text-sm font-mono font-semibold text-foreground">{formatCount(Number(d.view_count || 0))}</p>
                    <p className="text-[10px] text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground"><Video className="h-3 w-3" /></div>
                    <p className="text-sm font-mono font-semibold text-foreground">{formatCount(Number(d.video_count || 0))}</p>
                    <p className="text-[10px] text-muted-foreground">Videos</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {viewMode === 'table' && competitors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl glass overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead className="font-orbitron text-xs uppercase tracking-wider">Channel</TableHead>
                <TableHead className="text-right font-orbitron text-xs uppercase tracking-wider">Subscribers</TableHead>
                <TableHead className="text-right font-orbitron text-xs uppercase tracking-wider">Videos</TableHead>
                <TableHead className="text-right font-orbitron text-xs uppercase tracking-wider">Total Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map(c => {
                const d = c.data as Record<string, unknown>;
                return (
                  <TableRow key={c.id} className="cursor-pointer border-white/[0.04] hover:bg-white/[0.03] transition-colors" onClick={() => setSelected(c)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {d.thumbnail_url ? (
                          <img src={String(d.thumbnail_url)} alt="" className="w-6 h-6 rounded-full ring-1 ring-white/[0.08]" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-xs">{c.title.charAt(0)}</div>
                        )}
                        <div>
                          <span className="font-medium">{c.title}</span>
                          {d.handle && <span className="text-xs text-muted-foreground ml-1">@{String(d.handle)}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCount(Number(d.subscriber_count || 0))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCount(Number(d.video_count || 0))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCount(Number(d.view_count || 0))}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/[0.08] overflow-y-auto">
          {selected && selectedData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-orbitron">
                  {selectedData.thumbnail_url ? (
                    <img src={String(selectedData.thumbnail_url)} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/[0.08]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">{selected.title.charAt(0)}</div>
                  )}
                  {selected.title}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { val: Number(selectedData.subscriber_count || 0), label: 'Subscribers' },
                    { val: Number(selectedData.view_count || 0), label: 'Total Views' },
                    { val: Number(selectedData.video_count || 0), label: 'Videos' },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl glass">
                      <p className="text-lg font-mono font-bold text-foreground">{formatCount(m.val)}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>

                <h4 className="text-sm font-orbitron font-semibold text-foreground mt-4">Recent Videos</h4>
                {videos.length > 0 ? (
                  <div className="space-y-2">
                    {videos.slice(0, 20).map((v, i) => (
                      <div key={i} className="p-3 rounded-xl glass">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{String(v.title || '')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {v.published_at ? format(new Date(String(v.published_at)), 'MMM d, yyyy') : '—'} · {formatCount(Number(v.view_count || 0))} views
                            </p>
                          </div>
                          {v.outlier_score != null && Number(v.outlier_score) >= 3 && (
                            <span className="text-sm ml-2"><OutlierBadge score={Number(v.outlier_score)} /></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No videos data available.</p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
