import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { AgentComm } from '@/types/command-center';

interface Props {
  message: AgentComm;
  isLatest?: boolean;
}

export function CouncilMessage({ message, isLatest = false }: Props) {
  const turnOrder = (message.metadata as Record<string, unknown>)?.turn_order as number | undefined;
  const messageNumber = (message.metadata as Record<string, unknown>)?.message_number as number | undefined;

  return (
    <div
      className={cn(
        'glass-card p-4 transition-all duration-300 border-l-2 border-l-primary/40',
        'hover:border-border/60 hover:shadow-[0_0_20px_hsl(var(--glow-primary))]',
        isLatest && 'border-l-cyan-500/60 bg-cyan-500/5',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          {message.from_emoji || '🤖'}
        </span>
        <span className="font-semibold text-foreground">{message.from_agent}</span>
        {messageNumber && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
            #{messageNumber}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Body */}
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
        {message.message}
      </p>
    </div>
  );
}
