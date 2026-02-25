import { useState } from 'react';
import { Webhook, ChevronDown, ChevronUp, Trash2, Clock, Server, Send, Loader2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { RawReport, RawReportStatus } from '@/hooks/useRawReports';
import type { WebhookFunction } from '@/hooks/useWebhookFunctions';

interface RawReportCardProps {
  report: RawReport;
  onDelete: (reportId: string) => void;
  onSubmitToAi: (reportId: string, functionId?: string) => void;
  onAssignFunction?: (reportId: string, functionId: string) => void;
  isSubmitting?: boolean;
  functions?: WebhookFunction[];
}

const statusConfig: Record<RawReportStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  processing: { label: 'Processing', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Completed', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  failed: { label: 'Failed', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export const RawReportCard = ({ report, onDelete, onSubmitToAi, onAssignFunction, isSubmitting, functions = [] }: RawReportCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const status = statusConfig[report.status];
  const canSubmit = report.status === 'pending' || report.status === 'failed';
  const linkedFunction = functions.find(f => f.id === report.function_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm',
        'border-border/50 hover:border-primary/50',
        'hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]'
      )}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-xl transition-all duration-300',
                'bg-gradient-to-br from-primary/20 to-primary/5',
                'group-hover:from-primary/30 group-hover:to-primary/10'
              )}>
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Badge className={cn('text-[10px] uppercase font-bold', status.className)}>
                  {status.label}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(report.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Source:</span>
              <span className="font-medium text-foreground">{report.source}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground ml-6">Type:</span>
              <Badge variant="outline" className="text-[10px]">{report.report_type}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Received:</span>
              <span className="text-foreground">{format(new Date(report.created_at), 'MMM d, HH:mm')}</span>
            </div>
            {linkedFunction && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Function:</span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Zap className="h-3 w-3" />{linkedFunction.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Error message if failed */}
          {report.status === 'failed' && report.error_message && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{report.error_message}</p>
            </div>
          )}

          {/* Function selector + Submit */}
          {canSubmit && (
            <div className="space-y-2 mb-4">
              {functions.length > 0 && !report.function_id && (
                <Select onValueChange={(v) => onAssignFunction?.(report.id, v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Assign a function…" />
                  </SelectTrigger>
                  <SelectContent>
                    {functions.map(fn => (
                      <SelectItem key={fn.id} value={fn.id}>{fn.name} ({fn.report_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => onSubmitToAi(report.id, report.function_id || undefined)}
                disabled={isSubmitting}
                className="w-full gap-2"
                variant="default"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit to AI for Processing'}
              </Button>
            </div>
          )}

          {/* Collapsible JSON */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                <span>View Raw JSON</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="p-3 rounded-lg bg-muted/50 text-xs overflow-auto max-h-60 font-mono">
                {JSON.stringify(report.raw_data, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </motion.div>
  );
};
