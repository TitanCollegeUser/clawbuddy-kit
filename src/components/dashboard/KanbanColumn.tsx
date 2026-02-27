import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardColumn } from '@/hooks/useBoardColumns';
import { Task } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const getColumnGlowClass = (columnName: string) => {
  const name = columnName.toLowerCase();
  if (name.includes('to do')) return 'border-glow-todo';
  if (name.includes('doing')) return 'border-glow-doing';
  if (name.includes('needs')) return 'border-glow-needs-input';
  if (name.includes('cancel')) return 'border-glow-canceled';
  if (name.includes('done')) return 'border-glow-done';
  return '';
};

const getColumnBorderColor = (columnName: string) => {
  const name = columnName.toLowerCase();
  if (name.includes('to do')) return 'border-l-column-todo';
  if (name.includes('doing')) return 'border-l-column-doing';
  if (name.includes('needs')) return 'border-l-column-needs-input';
  if (name.includes('cancel')) return 'border-l-column-canceled';
  if (name.includes('done')) return 'border-l-column-done';
  return 'border-l-primary';
};

const getColumnDotColor = (columnName: string) => {
  const name = columnName.toLowerCase();
  if (name.includes('to do')) return 'bg-column-todo';
  if (name.includes('doing')) return 'bg-column-doing';
  if (name.includes('needs')) return 'bg-column-needs-input';
  if (name.includes('cancel')) return 'bg-column-canceled';
  if (name.includes('done')) return 'bg-column-done';
  return 'bg-primary';
};

const getColumnDropHighlight = (columnName: string) => {
  const name = columnName.toLowerCase();
  if (name.includes('to do')) return 'ring-column-todo/50 bg-column-todo/10';
  if (name.includes('doing')) return 'ring-column-doing/50 bg-column-doing/10';
  if (name.includes('needs')) return 'ring-column-needs-input/50 bg-column-needs-input/10';
  if (name.includes('cancel')) return 'ring-column-canceled/50 bg-column-canceled/10';
  if (name.includes('done')) return 'ring-column-done/50 bg-column-done/10';
  return 'ring-primary/50 bg-primary/10';
};

export const KanbanColumn = ({ column, tasks, onTaskClick }: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: column.position * 0.1 }}
      className={cn(
        "flex-shrink-0 w-[320px] glass rounded-xl border-l-4 overflow-hidden transition-all duration-200",
        getColumnBorderColor(column.name),
        getColumnGlowClass(column.name),
        isOver && `ring-2 ${getColumnDropHighlight(column.name)}`
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={cn("w-2.5 h-2.5 rounded-full", getColumnDotColor(column.name))} />
              {column.name.toLowerCase().includes('needs') && tasks.length > 0 && (
                <motion.div
                  className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-column-needs-input/50"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <h3 className="font-orbitron font-semibold uppercase tracking-wider text-foreground">
              {column.name}
            </h3>
          </div>
          <motion.span
            key={tasks.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-foreground"
          >
            {tasks.length}
          </motion.span>
        </div>
      </div>

      {/* Task List */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-custom">
          {tasks.length === 0 ? (
            <div className={cn(
              "text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg transition-colors",
              isOver ? "border-primary/50 bg-primary/5" : "border-transparent"
            )}>
              {isOver ? "Drop here" : "No tasks yet"}
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                columnName={column.name}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
};
