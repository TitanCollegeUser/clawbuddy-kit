import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData } from '@/hooks/useOpsData';

interface Props { block: OpsBlock; appId: string }

function simpleDiff(a: string, b: string): { left: React.ReactNode; right: React.ReactNode } {
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  const bSet = new Set(bWords);
  const aSet = new Set(aWords);

  const left = aWords.map((w, i) => (
    <span key={i} className={bSet.has(w) ? '' : 'bg-red-500/20 text-red-300 rounded px-0.5'}>
      {w}{' '}
    </span>
  ));
  const right = bWords.map((w, i) => (
    <span key={i} className={aSet.has(w) ? '' : 'bg-emerald-500/20 text-emerald-300 rounded px-0.5'}>
      {w}{' '}
    </span>
  ));
  return { left: <>{left}</>, right: <>{right}</> };
}

export const OpsComparisonBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const leftLabel = (config.left_label as string) || 'Version A';
  const rightLabel = (config.right_label as string) || 'Version B';
  const showDiff = config.show_diff !== false;
  const showVerdict = config.show_verdict === true;

  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id, itemType: 'comparison_item' });

  const { leftItem, rightItem } = useMemo(() => {
    const l = items.find(i => (i.data as Record<string, unknown>)?.side === 'left');
    const r = items.find(i => (i.data as Record<string, unknown>)?.side === 'right');
    return { leftItem: l || items[0], rightItem: r || items[1] };
  }, [items]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="glass-strong rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!leftItem && !rightItem) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[leftLabel, rightLabel].map(label => (
          <div key={label} className="rounded-xl border border-dashed border-white/[0.08] p-8 flex flex-col items-center gap-2">
            <div className="h-16 w-full bg-white/[0.02] rounded-lg" />
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{label}</span>
          </div>
        ))}
        <p className="col-span-2 text-xs text-muted-foreground/60 text-center mt-2">Add two items to compare. Great for hook variants, script revisions, or thumbnail options.</p>
      </div>
    );
  }

  const leftContent = (leftItem?.data as Record<string, unknown>)?.content as string || '';
  const rightContent = (rightItem?.data as Record<string, unknown>)?.content as string || '';
  const diff = showDiff && leftContent && rightContent ? simpleDiff(leftContent, rightContent) : null;

  // Check for verdict
  const verdictConfig = config.verdict as Record<string, unknown> | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Verdict badge */}
      {showVerdict && verdictConfig && (
        <div className="flex justify-center mb-4">
          <div className="glass-strong rounded-full px-4 py-1.5 flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">{(verdictConfig.winner as string) || 'Winner'}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { item: leftItem, label: leftLabel, diffContent: diff?.left },
          { item: rightItem, label: rightLabel, diffContent: diff?.right },
        ].map(({ item, label, diffContent }, idx) => {
          const d = (item?.data || {}) as Record<string, unknown>;
          const author = d.author as string;
          const content = d.content as string;
          const metrics = d.metrics as Record<string, unknown>;

          return (
            <div key={idx} className="glass-strong rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-muted-foreground">{label}</span>
                {author && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">{author}</span>
                )}
              </div>
              <div className="p-4">
                {item ? (
                  <>
                    <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                    {(diffContent || content) && (
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {diffContent || content}
                      </div>
                    )}
                    {metrics && Object.keys(metrics).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(metrics).map(([k, v]) => (
                          <span key={k} className="text-[10px] bg-white/[0.06] rounded-full px-2 py-0.5 text-muted-foreground">
                            {k}: {String(v ?? '—')}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground/40 italic">No item</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
