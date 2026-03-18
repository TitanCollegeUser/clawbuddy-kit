import { cn } from '@/lib/utils';
import type { CouncilParticipant } from '@/types/command-center';

interface Props {
  participant: CouncilParticipant;
}

export function CouncilParticipantChip({ participant }: Props) {
  const { agent_name, agent_emoji, messages_sent, message_limit, status } = participant;
  const isDone = status === 'done' || messages_sent >= message_limit;
  const isActive = status === 'active';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300',
        isDone && 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        isActive && 'bg-primary/15 border-primary/30 text-primary animate-pulse',
        !isDone && !isActive && 'bg-muted/30 border-border/40 text-muted-foreground',
      )}
    >
      <span className="text-sm">{agent_emoji || '🤖'}</span>
      <span>{agent_name}</span>
      <span className={cn(
        'font-mono text-[10px] px-1.5 py-0.5 rounded-full',
        isDone ? 'bg-emerald-500/20' : 'bg-background/40'
      )}>
        {messages_sent}/{message_limit}
      </span>
    </div>
  );
}
