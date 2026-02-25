import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle, Coins, MessageSquare, Copy, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubAgentSession } from '@/hooks/useSubAgents';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionCardProps {
  session: SubAgentSession;
  onViewDetails?: () => void;
  onRerun?: () => void;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Loader2, color: 'text-muted-foreground', label: 'Pending' },
  running: { icon: Loader2, color: 'text-primary', label: 'Running' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
  timeout: { icon: AlertCircle, color: 'text-orange-500', label: 'Timeout' },
};

export const SessionCard = ({ session, onViewDetails, onRerun }: SessionCardProps) => {
  const config = statusConfig[session.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const formatDuration = (ms: number | null): string => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleCopyOutput = () => {
    if (session.result_full) {
      navigator.clipboard.writeText(session.result_full);
      toast.success('Output copied to clipboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-border transition-colors">
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusIcon 
                className={cn(
                  'h-4 w-4',
                  config.color,
                  session.status === 'running' && 'animate-spin'
                )} 
              />
              <Badge variant="outline" className={cn('text-xs', config.color)}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(session.started_at), 'MMM d, h:mm a')}
              </span>
            </div>
            {session.duration_ms && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(session.duration_ms)}
              </div>
            )}
          </div>

          {/* Task description */}
          <p className="text-sm text-foreground mb-2 line-clamp-2">
            {session.task_description}
          </p>

          {/* Result summary (if completed) */}
          {session.result_summary && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 bg-muted/50 p-2 rounded">
              {session.result_summary}
            </p>
          )}

          {/* Error message (if failed) */}
          {session.error_message && (
            <p className="text-xs text-destructive mb-3 bg-destructive/10 p-2 rounded">
              {session.error_message}
            </p>
          )}

          {/* Metrics row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{session.tokens_used.toLocaleString()} tokens</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              <span>${session.cost.toFixed(4)}</span>
            </div>
            {session.tools_used && session.tools_used.length > 0 && (
              <span className="text-xs">
                Tools: {session.tools_used.slice(0, 3).join(', ')}
                {session.tools_used.length > 3 && ` +${session.tools_used.length - 3}`}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={onViewDetails}
            >
              View Details
            </Button>
            {session.result_full && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCopyOutput}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
            {session.status !== 'running' && session.status !== 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onRerun}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
