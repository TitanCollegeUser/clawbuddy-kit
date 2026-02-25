import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, X, Save, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { SubAgent, useUpdateSubAgent } from '@/hooks/useSubAgents';
import { toast } from 'sonner';

interface AgentSettingsPanelProps {
  agent: SubAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
];

const AVAILABLE_TOOLS = [
  'write_file',
  'read_file',
  'execute_command',
  'search_codebase',
  'search_web',
  'create_pr',
  'run_tests',
  'deploy',
  'send_message',
  'schedule_task',
];

export const AgentSettingsPanel = ({
  agent,
  open,
  onOpenChange,
}: AgentSettingsPanelProps) => {
  const updateAgent = useUpdateSubAgent();
  
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState([3]);
  const [timeoutMinutes, setTimeoutMinutes] = useState([60]);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tokenBudget, setTokenBudget] = useState('');
  const [costBudget, setCostBudget] = useState('');

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setDisplayName(agent.display_name);
      setDescription(agent.description || '');
      setModel(agent.model);
      setWorkspace(agent.workspace);
      setMaxConcurrentTasks([agent.max_concurrent_tasks]);
      setTimeoutMinutes([agent.timeout_minutes]);
      setAllowedTools(agent.allowed_tools);
      setSystemPrompt(agent.system_prompt || '');
      setTokenBudget(agent.monthly_token_budget.toString());
      setCostBudget(agent.monthly_cost_budget.toString());
    }
  }, [agent]);

  const handleReset = () => {
    if (!agent) return;
    setDisplayName(agent.display_name);
    setDescription(agent.description || '');
    setModel(agent.model);
    setWorkspace(agent.workspace);
    setMaxConcurrentTasks([agent.max_concurrent_tasks]);
    setTimeoutMinutes([agent.timeout_minutes]);
    setAllowedTools(agent.allowed_tools);
    setSystemPrompt(agent.system_prompt || '');
    setTokenBudget(agent.monthly_token_budget.toString());
    setCostBudget(agent.monthly_cost_budget.toString());
    toast.info('Settings reset');
  };

  const handleSave = async () => {
    if (!agent) return;

    try {
      await updateAgent.mutateAsync({
        id: agent.id,
        display_name: displayName,
        description: description || undefined,
        model,
        workspace,
        max_concurrent_tasks: maxConcurrentTasks[0],
        timeout_minutes: timeoutMinutes[0],
        allowed_tools: allowedTools,
        system_prompt: systemPrompt || undefined,
        monthly_token_budget: parseInt(tokenBudget) || 1000000,
        monthly_cost_budget: parseFloat(costBudget) || 50,
      });
      toast.success('Settings saved');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const toggleTool = (tool: string) => {
    setAllowedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg glass-strong border-primary/20 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-orbitron flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Agent Settings
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Display Name */}
          <div>
            <Label className="text-muted-foreground">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="futuristic-input mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="futuristic-input mt-1.5 min-h-[80px] resize-none"
              placeholder="What does this agent do?"
            />
          </div>

          {/* Model Input */}
          <div>
            <Label className="text-muted-foreground">Model</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="futuristic-input mt-1.5 font-mono"
              placeholder="provider/model-name"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_MODELS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-primary/20 transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div>
            <Label className="text-muted-foreground">Workspace Path</Label>
            <Input
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="futuristic-input mt-1.5 font-mono text-sm"
              placeholder="/path/to/workspace"
            />
          </div>

          {/* Max Concurrent Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Max Concurrent Tasks</Label>
              <span className="text-sm font-medium">{maxConcurrentTasks[0]}</span>
            </div>
            <Slider
              value={maxConcurrentTasks}
              onValueChange={setMaxConcurrentTasks}
              min={1}
              max={10}
              step={1}
            />
          </div>

          {/* Timeout */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Timeout (minutes)</Label>
              <span className="text-sm font-medium">{timeoutMinutes[0]}m</span>
            </div>
            <Slider
              value={timeoutMinutes}
              onValueChange={setTimeoutMinutes}
              min={15}
              max={180}
              step={15}
            />
          </div>

          {/* Allowed Tools */}
          <div>
            <Label className="text-muted-foreground mb-3 block">Allowed Tools</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <div key={tool} className="flex items-center gap-2">
                  <Checkbox
                    id={`tool-${tool}`}
                    checked={allowedTools.includes(tool)}
                    onCheckedChange={() => toggleTool(tool)}
                  />
                  <label
                    htmlFor={`tool-${tool}`}
                    className="text-sm cursor-pointer"
                  >
                    {tool}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <Label className="text-muted-foreground">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="futuristic-input mt-1.5 min-h-[120px] resize-none font-mono text-xs"
              placeholder="Custom instructions for this agent..."
            />
          </div>

          {/* Budget Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Monthly Token Budget</Label>
              <Input
                type="number"
                value={tokenBudget}
                onChange={(e) => setTokenBudget(e.target.value)}
                className="futuristic-input mt-1.5"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Monthly Cost Budget ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={costBudget}
                onChange={(e) => setCostBudget(e.target.value)}
                className="futuristic-input mt-1.5"
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateAgent.isPending}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {updateAgent.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
