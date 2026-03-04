import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, History, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useRunHistory, useDeleteRun } from '@/hooks/useOrchestration';
import type { RunGroup } from '@/types/command-center';
import { useToast } from '@/hooks/use-toast';

const outcomeStyles: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 glow-border-emerald',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30 glow-border-red',
  canceled: 'bg-muted text-muted-foreground border-border/40',
  session_close: 'bg-amber-500/20 text-amber-400 border-amber-500/30 glow-border-amber',
  unknown: 'bg-muted text-muted-foreground border-border/40',
};

function RunRow({
  run,
  onDelete,
  isDeleting,
}: {
  run: RunGroup;
  onDelete: (run: RunGroup) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={cn(
          'border-b border-border/20 transition-all duration-200 hover:bg-primary/5 group',
          expanded && 'bg-primary/5',
          isDeleting && 'opacity-40 pointer-events-none'
        )}
      >
        <td className="px-3 py-3 w-8">
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </td>
        <td
          className="px-3 py-3 font-mono text-xs text-muted-foreground cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {run.runId.slice(0, 12)}
        </td>
        <td
          className="px-3 py-3 font-medium text-foreground text-sm cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {run.taskTitle}
        </td>
        <td className="px-3 py-3" onClick={() => setExpanded(!expanded)}>
          <Badge className={cn('text-xs border cursor-pointer', outcomeStyles[run.outcome] || outcomeStyles.unknown)}>
            {run.outcome}
          </Badge>
        </td>
        <td
          className="px-3 py-3 text-xs text-muted-foreground cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {run.duration || '—'}
        </td>
        <td
          className="px-3 py-3 text-xs text-muted-foreground text-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {run.phases ?? '—'}
        </td>
        <td className="px-3 py-3 text-xs text-muted-foreground text-right">
          <div className="flex items-center justify-end gap-2">
            <span
              className="cursor-pointer"
              onClick={() => setExpanded(!expanded)}
            >
              {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(run);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border/20"
                style={{ background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)' }}
              >
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Run Events ({run.events.length})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => onDelete(run)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Run
                    </Button>
                  </div>
                  {run.events.map(evt => (
                    <div key={evt.id} className="flex items-center gap-3 text-xs hover:bg-primary/5 rounded px-2 py-1 transition-colors">
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                        {(evt.data?.event_type as string) || 'event'}
                      </Badge>
                      <span className="text-foreground/80 line-clamp-1 flex-1">{evt.message}</span>
                      <span className="text-muted-foreground shrink-0">
                        {format(new Date(evt.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                  {run.alignment != null && (
                    <div className="pt-2 border-t border-border/20 mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Alignment:</span>
                      <span className="text-sm font-bold text-primary icon-glow">{run.alignment}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export function RunHistory() {
  const { data: rows, isLoading } = useRunHistory();
  const deleteRun = useDeleteRun();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<RunGroup | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const runId = confirmDelete.runId;
    const title = confirmDelete.taskTitle;
    setDeletingRunId(runId);
    setConfirmDelete(null);

    try {
      const result = await deleteRun.mutateAsync(runId);
      toast({
        title: 'Run deleted',
        description: `Removed ${result.logCount} log entries and ${result.insightCount} insights for "${title}"`,
      });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setDeletingRunId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <History className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">No run history yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-card/60 to-card/30 border-b border-border/30">
              <th className="px-3 py-2.5 w-8" />
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Run ID</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Task</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Outcome</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-muted-foreground tracking-wider">Duration</th>
              <th className="px-3 py-2.5 text-center text-xs font-medium uppercase text-muted-foreground tracking-wider">Phases</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase text-muted-foreground tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(run => (
              <RunRow
                key={run.runId}
                run={run}
                onDelete={setConfirmDelete}
                isDeleting={deletingRunId === run.runId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Run?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete all log entries and insights for this run.
              </p>
              {confirmDelete && (
                <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1 mt-2">
                  <p><span className="text-muted-foreground">Run ID:</span> <span className="font-mono">{confirmDelete.runId.slice(0, 12)}</span></p>
                  <p><span className="text-muted-foreground">Task:</span> {confirmDelete.taskTitle}</p>
                  <p><span className="text-muted-foreground">Outcome:</span> {confirmDelete.outcome}</p>
                  <p><span className="text-muted-foreground">Events:</span> {confirmDelete.events.length} entries</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
