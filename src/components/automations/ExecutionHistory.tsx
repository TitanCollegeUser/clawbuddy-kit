import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, RotateCcw, CheckCircle2, XCircle, Clock, Loader2, Play, Bot, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Automation, AutomationExecution, useAutomationExecutions } from '@/hooks/useAutomations';
import { formatDistanceToNow, format } from 'date-fns';
import DOMPurify from 'dompurify';

interface Props {
  automation: Automation;
  onClose: () => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  success: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-400' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  running: { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-primary' },
  skipped: { icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: 'text-amber-400' },
};

export function ExecutionHistory({ automation, onClose }: Props) {
  const { data: executions = [], isLoading } = useAutomationExecutions(automation.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-[600px] z-50 bg-card/95 backdrop-blur-xl border-l border-border/30 flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Execution History</h2>
          <p className="text-sm text-muted-foreground">{automation.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && executions.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No executions yet</p>
            </div>
          )}

          {executions.map((exec) => {
            const st = statusConfig[exec.status] || statusConfig.skipped;
            const isExpanded = expandedId === exec.id;
            const durationStr = exec.duration_ms
              ? exec.duration_ms >= 60000
                ? `${Math.floor(exec.duration_ms / 60000)}m ${Math.round((exec.duration_ms % 60000) / 1000)}s`
                : `${Math.round(exec.duration_ms / 1000)}s`
              : '—';

            return (
              <div key={exec.id} className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                >
                  <span className={st.color}>{st.icon}</span>
                  <span className="text-sm font-medium text-foreground capitalize">{exec.status}</span>
                  {/* Trigger source badge */}
                  {exec.trigger_source && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {exec.trigger_source === 'scheduled' && <Clock className="h-2.5 w-2.5" />}
                      {exec.trigger_source === 'manual' && <Play className="h-2.5 w-2.5 text-blue-400" />}
                      {exec.trigger_source === 'agent' && <Bot className="h-2.5 w-2.5 text-purple-400" />}
                      {exec.trigger_source === 'webhook' && <Webhook className="h-2.5 w-2.5 text-cyan-400" />}
                      {exec.trigger_source}
                      {exec.triggered_by && exec.trigger_source === 'agent' && ` · ${exec.triggered_by}`}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true })}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{durationStr}</Badge>
                  {exec.tokens_used > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{exec.tokens_used} tok</Badge>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/20"
                    >
                      <div className="p-3 space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Started: {format(new Date(exec.started_at), 'PPpp')}
                          {exec.finished_at && <> • Finished: {format(new Date(exec.finished_at), 'PPpp')}</>}
                        </p>

                        {exec.error && (
                          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                            <p className="text-sm text-destructive">{exec.error}</p>
                          </div>
                        )}

                        {exec.output_html && (
                          <div
                            className="rounded-md bg-muted/30 p-3 prose prose-sm prose-invert max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(exec.output_html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'code', 'pre', 'a', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody'] }) }}
                          />
                        )}

                        {!exec.output_html && exec.output && (
                          <pre className="rounded-md bg-muted/30 p-3 text-xs text-foreground whitespace-pre-wrap font-mono">{exec.output}</pre>
                        )}

                        {(exec.deliveries as any[])?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Deliveries:</p>
                            {(exec.deliveries as any[]).map((d: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {d.status === 'sent' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-destructive" />}
                                <span className="text-foreground capitalize">{d.channel}</span>
                                {d.error && <span className="text-destructive">— {d.error}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        <Button variant="ghost" size="sm" className="text-xs" disabled>
                          <RotateCcw className="h-3 w-3 mr-1" /> Re-run
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
