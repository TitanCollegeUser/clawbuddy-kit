import { Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { usePendingQueue } from '@/hooks/useOrchestration';

const priorityStyles: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  normal: 'bg-primary/20 text-primary border-primary/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30 glow-border-amber',
  urgent: 'bg-red-500/30 text-red-300 border-red-500/40 animate-pulse glow-border-red',
};

export function QueuePanel() {
  const { data: queue, isLoading } = usePendingQueue();

  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!queue?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Inbox className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">Queue clear — no pending dispatches</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-card/60 to-card/30 border-b border-border/30">
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Priority</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Task</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Type</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Age</th>
          </tr>
        </thead>
        <tbody>
          {queue.map(item => (
            <tr key={item.id} className="border-b border-border/20 transition-all duration-200 hover:bg-primary/5 hover:border-l-2 hover:border-l-primary/50">
              <td className="px-4 py-3">
                <Badge className={cn('text-xs border', priorityStyles[item.priority])}>
                  {item.priority.toUpperCase()}
                </Badge>
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {(item.payload?.title as string) || item.action}
              </td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.task_type}</td>
              <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
