import { useState } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, ExternalLink, FileText } from 'lucide-react';

interface Props { block: OpsBlock; appId: string; }

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-l-muted-foreground/30',
  outline_ready: 'border-l-blue-500/60',
  script_ready: 'border-l-emerald-500/60',
  review: 'border-l-amber-500/60',
  approved: 'border-l-purple-500/60',
  recording: 'border-l-orange-500/60',
  published: 'border-l-cyan-500/60',
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  outline_ready: 'bg-blue-500/15 text-blue-400',
  script_ready: 'bg-emerald-500/15 text-emerald-400',
  review: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-purple-500/15 text-purple-400',
  recording: 'bg-orange-500/15 text-orange-400',
  published: 'bg-cyan-500/15 text-cyan-400',
};

export const OpsYtScriptsBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const showSubscribr = config.show_subscribr_column !== false;

  // Query by blockId only — no itemType filter, so any naming convention works
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [selected, setSelected] = useState<OpsDataItem | null>(null);
  const selData = selected?.data as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="space-y-2 p-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const scripts = items ?? [];

  return (
    <div className="space-y-4">
      {scripts.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No scripts tracked yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Words</TableHead>
                <TableHead className="text-center">Outline</TableHead>
                <TableHead className="text-center">Script</TableHead>
                {showSubscribr && <TableHead className="text-center">Subscribr</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scripts.map(s => {
                const d = s.data as Record<string, unknown>;
                const status = String(d.status || 'draft');
                const borderColor = STATUS_COLORS[status] || STATUS_COLORS.draft;
                return (
                  <TableRow key={s.id}
                    className={`cursor-pointer border-white/[0.04] hover:bg-white/[0.03] transition-colors border-l-2 ${borderColor}`}
                    onClick={() => setSelected(s)}>
                    <TableCell>
                      <div className="min-w-0">
                        <span className="font-medium text-foreground">{s.title}</span>
                        {d.topic && <p className="text-xs text-muted-foreground truncate">{String(d.topic)}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border-0 ${STATUS_BADGE[status] || STATUS_BADGE.draft}`}>
                        {status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{d.word_count ? Number(d.word_count).toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-center">
                      {d.has_outline ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {d.has_script ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                    </TableCell>
                    {showSubscribr && (
                      <TableCell className="text-center">
                        {d.canvas_url ? (
                          <a href={String(d.canvas_url)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-primary hover:text-primary/80">
                            <ExternalLink className="h-4 w-4 mx-auto" />
                          </a>
                        ) : <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/[0.08] overflow-y-auto">
          {selected && selData && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs border-0 ${STATUS_BADGE[String(selData.status || 'draft')] || STATUS_BADGE.draft}`}>
                    {String(selData.status || 'draft').replace(/_/g, ' ')}
                  </Badge>
                  {selData.word_count && (
                    <span className="text-xs text-muted-foreground font-mono">{Number(selData.word_count).toLocaleString()} words</span>
                  )}
                </div>
                {selData.topic && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Topic</p>
                    <p className="text-sm text-foreground">{String(selData.topic)}</p>
                  </div>
                )}
                {selData.angle && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Angle</p>
                    <p className="text-sm text-foreground">{String(selData.angle)}</p>
                  </div>
                )}
                {selData.content_preview && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Preview</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{String(selData.content_preview)}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Outline</p>
                    {selData.has_outline ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />}
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Script</p>
                    {selData.has_script ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />}
                  </div>
                </div>
                {selData.canvas_url && (
                  <a href={String(selData.canvas_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" /> Open in Subscribr
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
