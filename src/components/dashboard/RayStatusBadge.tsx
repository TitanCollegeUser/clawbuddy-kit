import { motion } from 'framer-motion';
import { useRayConnection, formatLastSeen } from '@/hooks/useRayConnection';
import { usePendingTasksCount, useProcessingTasksCount } from '@/hooks/usePendingTasks';
import { useAiStatus, AiAgentStatus } from '@/hooks/useAiStatus';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ONLINE_THRESHOLD_MINUTES = 3;
const RECENT_THRESHOLD_MINUTES = 10;

const getAgentState = (agent: AiAgentStatus & { isActuallyOnline: boolean }) => {
  const lastSeen = agent.last_seen ? new Date(agent.last_seen) : null;
  const minutesAgo = lastSeen ? (Date.now() - lastSeen.getTime()) / (1000 * 60) : Infinity;

  if (minutesAgo < ONLINE_THRESHOLD_MINUTES) return 'online' as const;
  if (minutesAgo < RECENT_THRESHOLD_MINUTES) return 'recent' as const;
  return 'offline' as const;
};

const dotColorMap = {
  online: 'bg-emerald-500',
  recent: 'bg-amber-500',
  offline: 'bg-muted-foreground/50',
} as const;

const pulseColorMap = {
  online: 'bg-emerald-500/50',
  recent: 'bg-amber-500/50',
  offline: 'bg-muted-foreground/30',
} as const;

const textColorMap = {
  online: 'text-emerald-500',
  recent: 'text-amber-500',
  offline: 'text-muted-foreground',
} as const;

interface AgentPillProps {
  agent: AiAgentStatus & { isActuallyOnline: boolean };
}

const AgentPill = ({ agent }: AgentPillProps) => {
  const state = getAgentState(agent);
  const lastSeen = agent.last_seen ? new Date(agent.last_seen) : null;

  // Use ring_color for custom dot color when online
  const ringColor = agent.ring_color;
  const useCustomColor = state === 'online' && ringColor && ringColor !== 'gray';
  const dotBg = useCustomColor
    ? ringColor === 'green' ? 'bg-emerald-500'
      : ringColor === 'yellow' ? 'bg-amber-500'
      : ringColor === 'red' ? 'bg-destructive'
      : dotColorMap[state]
    : dotColorMap[state];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
              'bg-muted/30 border border-border/50',
              'cursor-default transition-colors hover:bg-muted/50'
            )}
          >
            {/* Status dot */}
            <div className="relative">
              <span className={cn('h-2 w-2 rounded-full block', dotBg)} />
              {state === 'online' && (
                <motion.span
                  className={cn('h-2 w-2 rounded-full absolute inset-0', pulseColorMap[state])}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Emoji + Name */}
            <span className={cn('text-xs font-medium', textColorMap[state])}>
              {agent.agent_emoji} {agent.agent_name}
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {agent.agent_emoji} {agent.agent_name} — {state === 'online' ? 'Online' : state === 'recent' ? 'Recently seen' : 'Offline'}
            </p>
            {agent.status_message && (
              <p className="text-xs text-muted-foreground">{agent.status_message}</p>
            )}
            {lastSeen && (
              <p className="text-xs text-muted-foreground">
                Last seen: {formatLastSeen(lastSeen)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface RayStatusBadgeProps {
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const RayStatusBadge = ({ showLabel: _showLabel = true, size: _size = 'md' }: RayStatusBadgeProps) => {
  const { connectionStatus } = useRayConnection();
  const pendingCount = usePendingTasksCount();
  const processingCount = useProcessingTasksCount();
  const { agents } = useAiStatus();

  // If we have multi-agent data, show pills
  if (agents.length > 0) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Processing indicator */}
        {processingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30"
          >
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
            <span className="text-xs font-medium text-primary">
              {processingCount} task{processingCount > 1 ? 's' : ''}
            </span>
          </motion.div>
        )}

        {/* Agent pills */}
        {agents.map((agent) => (
          <AgentPill key={agent.id} agent={agent} />
        ))}

        {/* Status legend */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors h-5 w-5 rounded-full border border-border/30 flex items-center justify-center hover:border-border/60">
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1.5 text-xs">
                <p className="font-medium mb-2">Agent Status Colors</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Green — Working / Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Yellow — Waiting / Thinking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                  <span>Red — Error / Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 shrink-0" />
                  <span>Gray — Offline</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Queued tasks badge */}
        {pendingCount > 0 && connectionStatus.connectionState !== 'online' && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-[10px] font-bold"
          >
            {pendingCount} queued
          </motion.span>
        )}
      </div>
    );
  }

  // Fallback: no agents yet — show simple offline indicator
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 border border-border/50"
    >
      <span className="h-2 w-2 rounded-full block bg-muted-foreground/50" />
      <span className="text-xs font-medium text-muted-foreground">Offline</span>
    </motion.div>
  );
};
