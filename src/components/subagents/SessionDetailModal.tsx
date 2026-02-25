import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Clock,
  DollarSign,
  MessageSquare,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { SubAgentSession } from '@/hooks/useSubAgents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SessionDetailModalProps {
  session: SubAgentSession | null;
  onClose: () => void;
  onRerun?: (session: SubAgentSession) => void;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', label: 'Pending' },
  running: { icon: Loader2, color: 'text-primary', label: 'Running' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
};

export const SessionDetailModal = ({
  session,
  onClose,
  onRerun,
}: SessionDetailModalProps) => {
  const [inputParamsOpen, setInputParamsOpen] = useState(false);
  const [fullOutputOpen, setFullOutputOpen] = useState(false);

  if (!session) return null;

  const statusInfo = statusConfig[session.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const formatDuration = (ms: number | null): string => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const copyToClipboard = (text: string | null | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadLog = () => {
    const logData = {
      session_id: session.id,
      session_key: session.session_key,
      task: session.task_description,
      status: session.status,
      started_at: session.started_at,
      completed_at: session.completed_at,
      duration_ms: session.duration_ms,
      input_params: session.input_params,
      result_summary: session.result_summary,
      result_full: session.result_full,
      tokens: {
        total: session.tokens_used,
        input: session.input_tokens,
        output: session.output_tokens,
      },
      cost: session.cost,
      tools_used: session.tools_used,
      messages_count: session.messages_count,
      error: session.error_message ? {
        message: session.error_message,
        code: session.error_code,
      } : null,
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.session_key}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Log downloaded');
  };

  return (
    <Dialog open={!!session} onOpenChange={() => onClose()}>
      <DialogContent className="glass-strong border-primary/20 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            Session Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn('gap-1.5', statusInfo.color)}
                >
                  <StatusIcon className={cn('h-3.5 w-3.5', session.status === 'running' && 'animate-spin')} />
                  {statusInfo.label}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">
                  {session.session_key}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>

            {/* Task Description */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Task Description</h4>
              <div className="glass rounded-lg p-4 text-sm">
                {session.task_description}
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="glass rounded-lg p-3 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="font-medium">{formatDuration(session.duration_ms)}</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Tokens</div>
                <div className="font-medium">{(session.tokens_used || 0).toLocaleString()}</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Cost</div>
                <div className="font-medium">${(session.cost || 0).toFixed(4)}</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Messages</div>
                <div className="font-medium">{session.messages_count || 0}</div>
              </div>
            </div>

            {/* Token Breakdown */}
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Input: </span>
                <span className="font-mono">{(session.input_tokens || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Output: </span>
                <span className="font-mono">{(session.output_tokens || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Tools Used */}
            {session.tools_used && session.tools_used.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tools Used</h4>
                <div className="flex flex-wrap gap-2">
                  {session.tools_used.map((tool, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Input Parameters (Collapsible) */}
            {session.input_params && Object.keys(session.input_params).length > 0 && (
              <Collapsible open={inputParamsOpen} onOpenChange={setInputParamsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="text-sm font-medium">Input Parameters</span>
                    {inputParamsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="glass rounded-lg p-4 text-xs overflow-x-auto mt-2">
                    {JSON.stringify(session.input_params, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Result Summary */}
            {session.result_summary && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Result Summary</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(session.result_summary)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="glass rounded-lg p-4 text-sm">
                  {session.result_summary}
                </div>
              </div>
            )}

            {/* Full Output (Collapsible) */}
            {session.result_full && (
              <Collapsible open={fullOutputOpen} onOpenChange={setFullOutputOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="text-sm font-medium">Full Output</span>
                    {fullOutputOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="relative mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(session.result_full)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <ScrollArea className="h-64">
                      <pre className="glass rounded-lg p-4 text-xs whitespace-pre-wrap">
                        {session.result_full}
                      </pre>
                    </ScrollArea>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Error Details */}
            {session.error_message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-destructive/30 rounded-lg p-4 bg-destructive/5"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <div className="font-medium text-destructive">Error</div>
                    {session.error_code && (
                      <div className="text-xs text-muted-foreground mb-1">
                        Code: {session.error_code}
                      </div>
                    )}
                    <div className="text-sm">{session.error_message}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
              {onRerun && session.status !== 'running' && session.status !== 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => onRerun(session)}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rerun
                </Button>
              )}
              <Button
                variant="outline"
                onClick={downloadLog}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Log
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
