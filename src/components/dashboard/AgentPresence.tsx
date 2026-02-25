import { motion } from 'framer-motion';
import { useRayConnection, formatLastSeen } from '@/hooks/useRayConnection';
import { useAiStatus } from '@/hooks/useAiStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ONLINE_THRESHOLD_MINUTES = 3;

export const AgentPresence = () => {
  const { agents, isLoading: statusLoading } = useAiStatus();
  const { isLoading: connectionLoading } = useRayConnection();

  if (statusLoading || connectionLoading) {
    return (
      <div className="flex flex-col gap-3 p-6 bg-card/30 rounded-2xl border border-border/30 backdrop-blur-sm">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-card/30 rounded-2xl border border-border/30 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">No agents registered</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 p-6 bg-card/30 rounded-2xl border border-border/30 backdrop-blur-sm"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        AI Agents
      </h3>

      <div className="flex flex-col gap-2">
        {agents.map((agent) => {
          const lastSeen = agent.last_seen ? new Date(agent.last_seen) : null;
          const minutesAgo = lastSeen ? (Date.now() - lastSeen.getTime()) / (1000 * 60) : Infinity;
          const isOnline = minutesAgo < ONLINE_THRESHOLD_MINUTES;

          return (
            <div key={agent.id} className="flex items-start gap-2.5">
              {/* Status dot */}
              <div className="relative mt-1.5 shrink-0">
                <span
                  className={cn(
                    'block h-2 w-2 rounded-full',
                    isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/50'
                  )}
                />
                {isOnline && (
                  <motion.span
                    className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500/50"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {agent.agent_emoji} {agent.agent_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isOnline
                    ? agent.status_message || 'Online'
                    : lastSeen
                      ? `Last seen ${formatLastSeen(lastSeen)}`
                      : 'Never connected'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
