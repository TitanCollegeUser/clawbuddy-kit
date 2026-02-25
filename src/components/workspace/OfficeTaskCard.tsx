import { Progress } from '@/components/ui/progress';
import type { OfficeTask } from '@/hooks/useOfficeTasks';

interface OfficeTaskCardProps {
  task: OfficeTask | null;
}

export const OfficeTaskCard = ({ task }: OfficeTaskCardProps) => {
  if (!task) {
    return (
      <div className="glass rounded-lg p-3 border border-border/20">
        <p className="text-xs text-muted-foreground font-mono text-center py-2">No active task</p>
      </div>
    );
  }

  const completedCount = task.completed_agents?.length || 0;
  const totalCount = task.total_agents || task.assigned_agents?.length || 1;

  return (
    <div className="glass rounded-lg p-3 border border-border/20 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-foreground truncate">{task.title}</h4>
          {task.client_name && (
            <p className="text-[10px] text-muted-foreground mt-0.5">Client: {task.client_name}</p>
          )}
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
          {task.status}
        </span>
      </div>
      <Progress value={task.progress * 100} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground font-mono">
        {completedCount}/{totalCount} agents completed
      </p>
    </div>
  );
};
