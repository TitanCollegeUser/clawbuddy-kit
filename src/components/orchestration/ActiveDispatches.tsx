import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useActiveDispatches } from '@/hooks/useOrchestration';

const priorityStyles: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  normal: 'bg-primary/20 text-primary border-primary/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  urgent: 'bg-red-500/30 text-red-300 border-red-500/40 animate-pulse',
};

export function ActiveDispatches() {
  const { data: dispatches, isLoading } = useActiveDispatches();

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    );
  }

  if (!dispatches?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Zap className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">No active dispatches</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {dispatches.map((d, i) => {
        const title = (d.payload?.title as string) || d.action;
        const dispatcher = (d.payload?.dispatcher as string) || '—';
        const executor = (d.payload?.executor as string) || '—';
        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-accent p-4 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--glow-primary))] hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="font-semibold text-sm text-foreground line-clamp-1">{title}</span>
              </div>
              <Badge className={cn('text-xs border shrink-0', priorityStyles[d.priority])}>
                {d.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {dispatcher} <span className="text-primary mx-1 icon-glow">→</span> <span className="font-medium text-foreground">{executor}</span>
            </div>
            {d.started_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Started {formatDistanceToNow(new Date(d.started_at), { addSuffix: true })}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
