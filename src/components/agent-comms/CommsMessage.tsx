import { cn } from '@/lib/utils';
import { Eye, CheckCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { AgentComm } from '@/types/command-center';

const priorityStyles: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  normal: 'bg-primary/20 text-primary border-primary/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  urgent: 'bg-red-500/30 text-red-300 border-red-500/40 animate-pulse',
};

const priorityBorderAccent: Record<string, string> = {
  low: 'border-l-emerald-500/50',
  normal: 'border-l-primary/40',
  high: 'border-l-amber-500/50',
  urgent: 'border-l-red-500/60',
};

const messageTypeLabels: Record<string, string> = {
  comment: 'Comment',
  question: 'Question',
  status_request: 'Status Request',
  status_response: 'Status Response',
  directive: 'Directive',
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending': return <Circle className="h-3 w-3 fill-primary text-primary" />;
    case 'read': return <Eye className="h-3 w-3 text-muted-foreground" />;
    case 'replied': return <CheckCircle className="h-3 w-3 text-emerald-400" />;
    case 'archived': return <CheckCircle className="h-3 w-3 text-muted-foreground" />;
    default: return null;
  }
}

export interface CommsMessageProps {
  message: AgentComm;
  isReply?: boolean;
}

export function CommsMessage({ message, isReply = false }: CommsMessageProps) {
  const isUrgent = message.priority === 'urgent';
  const isHigh = message.priority === 'high';

  return (
    <div
      className={cn(
        'glass-card p-4 transition-all duration-300 border-l-2',
        priorityBorderAccent[message.priority] || 'border-l-primary/40',
        'hover:border-border/60 hover:shadow-[0_0_20px_hsl(var(--glow-primary))]',
        isReply && 'ml-8',
        isUrgent && 'border-red-500/40 bg-red-500/5 glow-border-red animate-glow-pulse',
        isHigh && !isUrgent && 'border-amber-500/30',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          {message.from_emoji || '🤖'}
        </span>
        <span className="font-semibold text-foreground">{message.from_agent}</span>
        <span className="text-primary">→</span>
        <span className="text-muted-foreground">{message.to_agent}</span>
        <StatusIcon status={message.status} />
        <span className="ml-auto text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Body */}
      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-3">
        {message.message}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-mono">
          {messageTypeLabels[message.message_type] || message.message_type}
        </Badge>
        {message.priority !== 'normal' && (
          <Badge className={cn('text-xs border', priorityStyles[message.priority])}>
            {message.priority.toUpperCase()}
          </Badge>
        )}
      </div>
    </div>
  );
}
