import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Clock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubAgents, SubAgent } from '@/hooks/useSubAgents';
import { SubAgentStatusRing } from './SubAgentStatusRing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpawnTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle?: string;
  taskDescription?: string;
  kanbanTaskId?: string;
  onSuccess?: (session: unknown) => void;
}

export const SpawnTaskModal = ({
  open,
  onOpenChange,
  taskTitle,
  taskDescription,
  kanbanTaskId,
  onSuccess,
}: SpawnTaskModalProps) => {
  const { data: agents = [], isLoading: agentsLoading } = useSubAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [instructions, setInstructions] = useState(taskDescription || '');
  const [timeout, setTimeout] = useState([60]);
  const [isSpawning, setIsSpawning] = useState(false);

  // Filter available agents (not paused or error)
  const availableAgents = agents.filter(
    (a) => a.status !== 'paused' && a.status !== 'error'
  );

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleSpawn = async () => {
    if (!selectedAgentId || !instructions.trim()) {
      toast.error('Please select an agent and provide instructions');
      return;
    }

    setIsSpawning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tasks', {
        body: {
          type: 'subagent',
          action: 'spawn',
          agent_id: selectedAgentId,
          task: instructions.trim(),
          kanban_task_id: kanbanTaskId || null,
          timeout_minutes: timeout[0],
        },
      });

      if (error) throw error;

      toast.success('Task spawned to agent');
      onSuccess?.(data.session);
      onOpenChange(false);
      
      // Reset form
      setSelectedAgentId('');
      setInstructions('');
      setTimeout([60]);
    } catch (err) {
      console.error('Error spawning task:', err);
      toast.error('Failed to spawn task');
    } finally {
      setIsSpawning(false);
    }
  };

  // Reset form when opening with task data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && taskDescription) {
      setInstructions(taskDescription);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-strong border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Spawn to Sub-Agent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Task Context (if provided) */}
          {taskTitle && (
            <div className="glass rounded-lg px-3 py-2 text-sm">
              <span className="text-muted-foreground">Linked Task: </span>
              <span className="font-medium">{taskTitle}</span>
            </div>
          )}

          {/* Agent Selection */}
          <div>
            <Label className="text-muted-foreground">Select Agent</Label>
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
              disabled={agentsLoading}
            >
              <SelectTrigger className="futuristic-input mt-1.5">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/10 bg-popover">
                {availableAgents.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No agents available
                  </div>
                ) : (
                  availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <SubAgentStatusRing status={agent.status} size="sm" />
                        <span>{agent.display_name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({agent.model.split('/').pop()})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Task Instructions */}
          <div>
            <Label className="text-muted-foreground">
              Task Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="futuristic-input mt-1.5 min-h-[120px] resize-none"
              placeholder="Describe the task you want the agent to perform..."
            />
          </div>

          {/* Timeout Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeout
              </Label>
              <span className="text-sm font-medium">{timeout[0]} minutes</span>
            </div>
            <Slider
              value={timeout}
              onValueChange={setTimeout}
              min={15}
              max={180}
              step={15}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15m</span>
              <span>180m</span>
            </div>
          </div>

          {/* Agent Preview */}
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SubAgentStatusRing status={selectedAgent.status} size="md" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="font-medium">{selectedAgent.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAgent.model}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Success</div>
                  <div className="font-medium text-green-500">
                    {selectedAgent.success_rate.toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Sessions</div>
                  <div className="font-medium">{selectedAgent.total_sessions}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Budget</div>
                  <div className="font-medium">
                    ${(selectedAgent.monthly_cost_budget - selectedAgent.cost_this_month).toFixed(0)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSpawning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSpawn}
            disabled={isSpawning || !selectedAgentId || !instructions.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSpawning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Spawning...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Spawn Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
