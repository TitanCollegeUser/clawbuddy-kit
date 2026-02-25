import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BoardColumn } from '@/hooks/useBoardColumns';
import { useCreateTask } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Calendar as CalendarIcon, X, Plus, AlertCircle, ChevronUp, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskPriority } from '@/hooks/useTasks';

const priorityOptions: { value: TaskPriority; label: string; icon: typeof AlertCircle; className: string }[] = [
  { value: 'Urgent', label: 'Urgent', icon: AlertCircle, className: 'text-destructive' },
  { value: 'High', label: 'High', icon: ChevronUp, className: 'text-column-doing' },
  { value: 'Medium', label: 'Medium', icon: Minus, className: 'text-primary' },
  { value: 'Low', label: 'Low', icon: Minus, className: 'text-muted-foreground' },
];

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: BoardColumn[];
}

export const CreateTaskModal = ({ open, onOpenChange, columns }: CreateTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const { user } = useAuth();
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !columnId || !user) return;

    await createTask.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      board_column_id: columnId,
      priority,
      due_date: dueDate?.toISOString(),
      created_by: user.id,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setColumnId('');
    setPriority('Medium');
    setDueDate(undefined);
    setSubtasks([]);
    setNewSubtask('');
    onOpenChange(false);
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/20 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl text-glow">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-muted-foreground">
              Task Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="futuristic-input mt-1.5"
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="futuristic-input mt-1.5 min-h-[100px] resize-none"
              placeholder="Add a description..."
            />
          </div>

          {/* Column */}
          <div>
            <Label className="text-muted-foreground">Column</Label>
            <Select value={columnId} onValueChange={setColumnId} required>
              <SelectTrigger className="futuristic-input mt-1.5">
                <SelectValue placeholder="Select a column" />
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

          {/* Subtasks */}
          <div>
            <Label className="text-muted-foreground">Subtasks</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="futuristic-input"
                placeholder="Add a subtask..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <Button
                type="button"
                onClick={addSubtask}
                size="icon"
                className="bg-primary/20 hover:bg-primary/30 text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <AnimatePresence>
              {subtasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mt-3"
                >
                  {subtasks.map((subtask, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 glass rounded-md px-3 py-2"
                    >
                      <span className="flex-1 text-sm">{subtask}</span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createTask.isPending || !title.trim() || !columnId}
            className="w-full h-12 font-orbitron bg-primary hover:bg-primary/90 pulse-glow"
          >
            {createTask.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Create Task'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
