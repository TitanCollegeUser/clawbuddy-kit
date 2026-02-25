import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BoardColumn } from '@/hooks/useBoardColumns';
import { Task, TaskPriority, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useCreateSubtask, useToggleSubtask, useDeleteSubtask } from '@/hooks/useSubtasks';
import { useAssignableEntities } from '@/hooks/useAssignableEntities';
import { useAssignUser, useUnassignUser } from '@/hooks/useTaskAssignees';
import { Loader2, Trash2, Plus, X, CheckCircle2, Circle, AlertCircle, ChevronUp, Minus, UserPlus, Calendar as CalendarIcon, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SpawnTaskModal } from '@/components/subagents/SpawnTaskModal';

interface TaskDetailModalProps {
  task: Task | null;
  columns: BoardColumn[];
  onClose: () => void;
}

const priorityOptions: { value: TaskPriority; label: string; icon: typeof AlertCircle; className: string }[] = [
  { value: 'Urgent', label: 'Urgent', icon: AlertCircle, className: 'text-destructive' },
  { value: 'High', label: 'High', icon: ChevronUp, className: 'text-column-doing' },
  { value: 'Medium', label: 'Medium', icon: Minus, className: 'text-primary' },
  { value: 'Low', label: 'Low', icon: Minus, className: 'text-muted-foreground' },
];

export const TaskDetailModal = ({ task, columns, onClose }: TaskDetailModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [newSubtask, setNewSubtask] = useState('');
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [spawnModalOpen, setSpawnModalOpen] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();
  const { entities, entityMap } = useAssignableEntities();
  const assignUser = useAssignUser();
  const unassignUser = useUnassignUser();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setColumnId(task.board_column_id);
      setPriority(task.priority || 'Medium');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    await updateTask.mutateAsync({
      id: task.id,
      title,
      description: description || null,
      board_column_id: columnId,
      priority,
      due_date: dueDate?.toISOString() || null,
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    onClose();
  };

  const handleAddSubtask = async () => {
    if (newSubtask.trim()) {
      await createSubtask.mutateAsync({
        task_id: task.id,
        title: newSubtask.trim(),
      });
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    await toggleSubtask.mutateAsync({ id: subtaskId, completed: !completed });
  };

  const handleAssignUser = async (userId: string) => {
    await assignUser.mutateAsync({ taskId: task.id, userId });
    setAssigneePopoverOpen(false);
  };

  const handleUnassignUser = async (assigneeId: string) => {
    await unassignUser.mutateAsync(assigneeId);
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const assignees = task.task_assignees || [];
  const assignedIds = new Set(assignees.map((a) => a.user_id));
  const availableEntities = entities.filter((e) => !assignedIds.has(e.id));
  const availableUsers = availableEntities.filter((e) => e.type === 'user');
  const availableAiAgents = availableEntities.filter((e) => e.type === 'ai_agent');
  const availableAgents = availableEntities.filter((e) => e.type === 'sub_agent');

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="glass-strong border-primary/20 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl text-glow">
            Task Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="edit-title" className="text-muted-foreground">
              Task Title
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="futuristic-input mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="edit-description" className="text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="futuristic-input mt-1.5 min-h-[100px] resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <Label className="text-muted-foreground">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="futuristic-input mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/10 bg-popover">
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className={cn("h-4 w-4", option.className)} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <Label className="text-muted-foreground">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full futuristic-input mt-1.5 justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-strong border-white/10" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Column */}
          <div>
            <Label className="text-muted-foreground">Move to Column</Label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger className="futuristic-input mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/10 bg-popover">
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignees - Interactive */}
          <div>
            <Label className="text-muted-foreground">Assignees</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {assignees.map((assignee) => {
                const entity = entityMap.get(assignee.user_id || '');
                const isBot = entity?.type === 'sub_agent';
                const isAiAgent = entity?.type === 'ai_agent';
                const displayName = entity?.name || 'Unknown';
                return (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-2 glass rounded-full px-3 py-1 text-sm group"
                  >
                    {isAiAgent && <span className="text-sm">{entity?.emoji || '⚡'}</span>}
                    {isBot && <Bot className="h-3.5 w-3.5 text-primary" />}
                    <span>{displayName}</span>
                    <button
                      onClick={() => handleUnassignUser(assignee.id)}
                      disabled={unassignUser.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add assignee button */}
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto rounded-full px-3 py-1 text-sm border border-dashed border-muted-foreground/30 hover:border-primary/50"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 glass-strong border-white/10 bg-popover" align="start">
                  {availableEntities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      All users & agents assigned
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {availableUsers.length > 0 && (
                        <>
                          <p className="text-xs text-muted-foreground px-3 pt-1 pb-0.5 font-medium uppercase tracking-wider">Users</p>
                      {availableUsers.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => handleAssignUser(entity.id)}
                          disabled={assignUser.isPending}
                          className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                            {entity.name.charAt(0)}
                          </span>
                          {entity.name}
                        </button>
                      ))}
                    </>
                  )}
                  {availableAiAgents.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground px-3 pt-2 pb-0.5 font-medium uppercase tracking-wider">AI Agents</p>
                      {availableAiAgents.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => handleAssignUser(entity.id)}
                          disabled={assignUser.isPending}
                          className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <span className="text-base">{entity.emoji || '⚡'}</span>
                          <span>{entity.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {availableAgents.length > 0 && (
                        <>
                          <p className="text-xs text-muted-foreground px-3 pt-2 pb-0.5 font-medium uppercase tracking-wider">Sub-Agents</p>
                          {availableAgents.map((entity) => (
                            <button
                              key={entity.id}
                              onClick={() => handleAssignUser(entity.id)}
                              disabled={assignUser.isPending}
                              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              <Bot className="h-4 w-4 text-primary" />
                              <span>{entity.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{entity.model?.split('/').pop()}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">
                Subtasks ({completedSubtasks}/{subtasks.length})
              </Label>
            </div>

            {/* Add subtask */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="futuristic-input"
                placeholder="Add a subtask..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
              />
              <Button
                type="button"
                onClick={handleAddSubtask}
                size="icon"
                disabled={createSubtask.isPending}
                className="bg-primary/20 hover:bg-primary/30 text-primary"
              >
                {createSubtask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Subtask list */}
            <AnimatePresence>
              {subtasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {subtasks.map((subtask) => (
                    <motion.div
                      key={subtask.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 glass rounded-md px-3 py-2 group"
                    >
                      <button
                        onClick={() => handleToggleSubtask(subtask.id, subtask.completed)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {subtask.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-column-done" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <span
                        className={cn(
                          "flex-1 text-sm transition-all",
                          subtask.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask.mutate(subtask.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <Button
              onClick={handleDelete}
              variant="outline"
              disabled={deleteTask.isPending}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {deleteTask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSpawnModalOpen(true)}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Bot className="h-4 w-4 mr-2" />
              Spawn to Agent
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateTask.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {updateTask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* Spawn Task Modal */}
        <SpawnTaskModal
          open={spawnModalOpen}
          onOpenChange={setSpawnModalOpen}
          taskTitle={task.title}
          taskDescription={task.description || undefined}
          kanbanTaskId={task.id}
        />
      </DialogContent>
    </Dialog>
  );
};
