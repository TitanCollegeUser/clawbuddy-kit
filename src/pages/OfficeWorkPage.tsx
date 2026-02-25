import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOfficeTasks, type OfficeTask } from '@/hooks/useOfficeTasks';
import { useOfficeDeliverables } from '@/hooks/useOfficeDeliverables';
import { DeliverableRow } from '@/components/workspace/DeliverableRow';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export const OfficeWorkPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useOfficeTasks(id || '');
  const { data: allDeliverables = [] } = useOfficeDeliverables(id || '');
  const [selectedTask, setSelectedTask] = useState<OfficeTask | null>(null);

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const allTasks = [...inProgressTasks, ...completedTasks];

  const handleDeleteDeliverable = async (deliverableId: string) => {
    const { error } = await supabase
      .from('office_deliverables')
      .delete()
      .eq('id', deliverableId);
    if (error) {
      toast.error('Failed to delete deliverable');
    } else {
      toast.success('Deliverable deleted');
      queryClient.invalidateQueries({ queryKey: ['office-deliverables'] });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Delete deliverables first
    await supabase
      .from('office_deliverables')
      .delete()
      .eq('task_id', taskId);
    // Delete task
    const { error } = await supabase
      .from('office_tasks')
      .delete()
      .eq('id', taskId);
    if (error) {
      toast.error('Failed to delete task');
    } else {
      toast.success('Task and deliverables deleted');
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ['office-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['office-deliverables'] });
    }
  };

  const getTaskDeliverables = (taskId: string) =>
    allDeliverables.filter(d => d.task_id === taskId);

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/workspace/office/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Briefcase className="h-4 w-4 text-primary" />
        <h1 className="text-sm font-bold text-foreground uppercase tracking-wider">Office Work</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          {allTasks.length} task{allTasks.length !== 1 ? 's' : ''}
          {' • '}
          {allDeliverables.length} deliverable{allDeliverables.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-custom p-4">
        {allTasks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs mt-1">Tasks and deliverables will appear here once created via the API</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTasks.map(task => {
              const deliverables = getTaskDeliverables(task.id);
              return (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors overflow-hidden group"
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Accent bar */}
                  <div
                    className="h-1"
                    style={{
                      background: task.status === 'completed'
                        ? 'linear-gradient(90deg, hsl(160 84% 39%), hsl(160 84% 55%))'
                        : 'linear-gradient(90deg, hsl(38 92% 50%), hsl(38 92% 65%))',
                    }}
                  />
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-semibold truncate">{task.title}</CardTitle>
                    {task.client_name && (
                      <p className="text-[10px] text-muted-foreground">Client: {task.client_name}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-2">
                    <Progress value={task.progress * 100} className="h-1" />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{(task.completed_agents?.length || 0)}/{task.total_agents} agents</span>
                      <span>{deliverables.length} files</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={v => !v && setSelectedTask(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto glass">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm flex items-center gap-2">
                  {selectedTask.title}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    {selectedTask.status}
                  </span>
                </DialogTitle>
                {selectedTask.client_name && (
                  <p className="text-xs text-muted-foreground">Client: {selectedTask.client_name}</p>
                )}
                {selectedTask.description && (
                  <p className="text-xs text-foreground/80 mt-1">{selectedTask.description}</p>
                )}
              </DialogHeader>

              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Deliverables ({getTaskDeliverables(selectedTask.id).length})
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete Task
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete entire task?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the task and all its deliverables.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTask(selectedTask.id)}>
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {getTaskDeliverables(selectedTask.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No deliverables yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {getTaskDeliverables(selectedTask.id).map(d => (
                      <DeliverableRow
                        key={d.id}
                        deliverable={d}
                        onDelete={handleDeleteDeliverable}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
