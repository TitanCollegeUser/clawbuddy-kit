import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority } from '@/hooks/useTasks';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, AlertCircle, Minus, ChevronUp, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { AiAssistantBadge } from '@/components/ai-assistant/AiAssistantBadge';
import { useAssignableEntities } from '@/hooks/useAssignableEntities';

interface TaskCardProps {
  task: Task;
  columnName: string;
  index: number;
  onClick: () => void;
}

const getCardBorderColor = (columnName: string) => {
  const name = columnName.toLowerCase();
  if (name.includes('to do')) return 'border-column-todo/30 hover:border-column-todo/60';
  if (name.includes('doing')) return 'border-column-doing/30 hover:border-column-doing/60';
  if (name.includes('needs')) return 'border-column-needs-input/30 hover:border-column-needs-input/60';
  if (name.includes('cancel')) return 'border-column-canceled/30 hover:border-column-canceled/60';
  if (name.includes('done')) return 'border-column-done/30 hover:border-column-done/60';
  return 'border-primary/30 hover:border-primary/60';
};

const getPriorityConfig = (priority: TaskPriority | null) => {
  switch (priority) {
    case 'Urgent':
      return {
        label: 'Urgent',
        className: 'bg-destructive/20 text-destructive border-destructive/30',
        icon: AlertCircle,
      };
    case 'High':
      return {
        label: 'High',
        className: 'bg-column-doing/20 text-column-doing border-column-doing/30',
        icon: ChevronUp,
      };
    case 'Medium':
      return {
        label: 'Medium',
        className: 'bg-primary/20 text-primary border-primary/30',
        icon: Minus,
      };
    case 'Low':
      return {
        label: 'Low',
        className: 'bg-muted text-muted-foreground border-muted-foreground/30',
        icon: Minus,
      };
    default:
      return null;
  }
};

export const TaskCard = ({ task, columnName, index, onClick }: TaskCardProps) => {
  const { entityMap } = useAssignableEntities();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const assignees = task.task_assignees || [];

  const getDueDateStatus = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) return 'overdue';
    if (isToday(dueDate)) return 'today';
    return 'upcoming';
  };

  const dueDateStatus = getDueDateStatus();
  const priorityConfig = getPriorityConfig(task.priority);

  // Get assignee names for display
  const getAssigneeDisplay = () => {
    if (assignees.length === 0) return null;
    const names = assignees.slice(0, 2).map((a) => {
      const entity = entityMap.get(a.user_id);
      return entity?.name?.split(' ')[0] || 'Unknown';
    });
    if (assignees.length > 2) {
      return `${names.join(', ')} +${assignees.length - 2}`;
    }
    return names.join(', ');
  };

  const assigneeDisplay = getAssigneeDisplay();

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "glass-strong rounded-lg p-4 cursor-pointer transition-all duration-300 border group",
        getCardBorderColor(columnName),
        isDragging && "shadow-2xl ring-2 ring-primary/50 z-50"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Main content area - clickable */}
      <div onClick={onClick}>
        {/* Header with priority badge */}
        <div className="flex items-start justify-between gap-2 mb-2 pr-6">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {task.created_by_bujji && (
              <AiAssistantBadge className="flex-shrink-0 mt-0.5" />
            )}
            <h4 className="font-exo font-medium text-foreground line-clamp-2">
              {task.title}
            </h4>
          </div>
          {priorityConfig && (
            <Badge 
              variant="outline" 
              className={cn("flex-shrink-0 text-[10px] px-1.5 py-0.5 gap-0.5", priorityConfig.className)}
            >
              <priorityConfig.icon className="h-3 w-3" />
              {priorityConfig.label}
            </Badge>
          )}
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Subtasks progress */}
        {subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Subtasks
              </span>
              <span>{completedSubtasks}/{subtasks.length}</span>
            </div>
            <Progress value={subtaskProgress} className="h-1.5" />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          {/* Assignees - show names */}
          <div className="flex items-center gap-1 min-w-0">
            {assigneeDisplay ? (
              <span className="text-xs text-muted-foreground truncate">
                {assigneeDisplay}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50 italic">
                Unassigned
              </span>
            )}
          </div>

          {/* Due date */}
          {task.due_date && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                dueDateStatus === 'overdue' && "bg-destructive/20 text-destructive",
                dueDateStatus === 'today' && "bg-column-doing/20 text-column-doing",
                dueDateStatus === 'upcoming' && "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
