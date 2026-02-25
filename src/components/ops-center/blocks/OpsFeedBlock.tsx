import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export const OpsFeedBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const maxItems = (block.config.max_items as number) || 50;
  const showAgent = block.config.show_agent_badge !== false;
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
              <p className="text-base text-muted-foreground">No activity yet</p>
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
                className="px-5 py-3 flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-base text-foreground">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {showAgent && item.metadata?.agent && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 border-primary/20 text-primary">
                        {String(item.metadata.agent)}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground bg-white/[0.06] rounded-full px-2.5 py-0.5">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
