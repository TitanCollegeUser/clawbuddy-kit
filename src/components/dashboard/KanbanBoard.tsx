import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useBoardColumns } from '@/hooks/useBoardColumns';
import { useTasks, Task, useMoveTask } from '@/hooks/useTasks';
import { KanbanColumn } from './KanbanColumn';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { WelcomeSection } from './WelcomeSection';
import { DashboardStats } from './DashboardStats';
import { AgentPresence } from './AgentPresence';
import { ActivityLogPanel } from './ActivityLogPanel';

export const KanbanBoard = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: columns = [], isLoading: columnsLoading } = useBoardColumns();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const moveTask = useMoveTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter((task) => task.board_column_id === columnId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if dropped over a column
    const targetColumnId = over.id as string;
    const isColumn = columns.some((col) => col.id === targetColumnId);

    if (isColumn && task.board_column_id !== targetColumnId) {
      moveTask.mutate({ taskId, newColumnId: targetColumnId });
    }
  };

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex gap-6 overflow-x-auto pb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-[320px]">
              <Skeleton className="h-12 w-full rounded-t-xl bg-card/30" />
              <div className="space-y-3 p-3">
                <Skeleton className="h-32 w-full bg-card/30" />
                <Skeleton className="h-24 w-full bg-card/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
        {/* Top Section: Agent Presence + Welcome + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          {/* Agent Presence - Left side */}
          <div className="lg:w-[200px]">
            <AgentPresence />
          </div>
          
          {/* Right side - Welcome + Stats */}
          <div className="flex flex-col gap-4">
            <WelcomeSection />
            <DashboardStats />
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-custom flex-1 min-h-0">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksForColumn(column.id)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        {/* Activity Log Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityLogPanel />
          {/* Placeholder for future AI Insights panel */}
          <div className="hidden lg:block" />
        </div>

        {/* Floating Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="fixed bottom-8 right-8"
        >
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 pulse-glow shadow-2xl"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="glass-strong rounded-lg p-4 border border-primary/50 shadow-2xl opacity-90 w-[300px]">
              <h4 className="font-exo font-medium text-foreground line-clamp-2">
                {activeTask.title}
              </h4>
            </div>
          )}
        </DragOverlay>

        {/* Modals */}
        <CreateTaskModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          columns={columns}
        />

        <TaskDetailModal
          task={selectedTask}
          columns={columns}
          onClose={() => setSelectedTask(null)}
        />
      </div>
    </DndContext>
  );
};
