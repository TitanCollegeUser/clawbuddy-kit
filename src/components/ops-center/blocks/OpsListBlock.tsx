import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  archived: 'bg-white/[0.06] text-muted-foreground border-white/[0.08]',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  draft: 'bg-white/[0.06] text-muted-foreground border-white/[0.08]',
};

export const OpsListBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const showTimestamp = block.config.show_timestamp !== false;
  const showStatus = block.config.show_status_badge !== false;
  const maxItems = (block.config.max_items as number) || 20;
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const limited = items?.slice(0, maxItems) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {block.title && (
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">{block.title}</h3>
        </div>
      )}
      <div className="max-h-[400px] overflow-y-auto scrollbar-custom">
        {limited.length === 0 ? (
          <div className="px-5 pb-5">
            <div className="border border-dashed border-white/[0.08] rounded-lg py-6 text-center">
              <p className="text-base text-muted-foreground">No items yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {limited.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground truncate">{item.title}</p>
                  {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
                </div>
                {showStatus && item.status && (
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 shrink-0 ${statusColors[item.status] || statusColors.active}`}>
                    {item.status}
                  </Badge>
                )}
                {showTimestamp && (
                  <span className="text-sm text-muted-foreground shrink-0 bg-white/[0.06] rounded-full px-2.5 py-0.5">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
