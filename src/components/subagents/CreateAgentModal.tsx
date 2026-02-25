import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateSubAgent, CreateAgentInput } from '@/hooks/useSubAgents';
import { toast } from 'sonner';
import { Bot, Loader2 } from 'lucide-react';

interface CreateAgentModalProps {
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
  { id: 'file_read', name: 'File Read' },
  { id: 'exec', name: 'Execute Commands' },
  { id: 'browser', name: 'Browser' },
  { id: 'web_search', name: 'Web Search' },
  { id: 'image', name: 'Image Processing' },
  { id: 'nodes', name: 'Node Operations' },
];

export const CreateAgentModal = ({ open, onOpenChange }: CreateAgentModalProps) => {
  const createAgent = useCreateSubAgent();
  
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: '',
    display_name: '',
    description: '',
    model: 'google/gemini-3-flash-preview',
    workspace: '',
    allowed_tools: ['file_read', 'web_search'],
    max_concurrent_tasks: 3,
    timeout_minutes: 60,
    system_prompt: '',
    monthly_token_budget: 1000000,
    monthly_cost_budget: 50,
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !/^[a-z][a-z0-9-]{2,49}$/.test(formData.name)) {
      toast.error('Agent name must be lowercase, start with a letter, and be 3-50 characters');
      return;
    }
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (!formData.workspace.trim()) {
      toast.error('Workspace path is required');
      return;
    }

    try {
      await createAgent.mutateAsync(formData);
      toast.success(`Sub-agent "${formData.display_name}" created successfully!`);
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        display_name: '',
        description: '',
        model: 'google/gemini-3-flash-preview',
        workspace: '',
        allowed_tools: ['file_read', 'web_search'],
        max_concurrent_tasks: 3,
        timeout_minutes: 60,
        system_prompt: '',
        monthly_token_budget: 1000000,
        monthly_cost_budget: 50,
      });
    } catch (error) {
      toast.error('Failed to create sub-agent');
      console.error(error);
    }
  };

  const toggleTool = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_tools: prev.allowed_tools?.includes(toolId)
        ? prev.allowed_tools.filter(t => t !== toolId)
        : [...(prev.allowed_tools || []), toolId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Create New Sub-Agent
          </DialogTitle>
          <DialogDescription>
            Configure a new AI sub-agent that can work on tasks autonomously.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                placeholder="my-agent"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Lowercase, hyphens allowed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                placeholder="My Agent"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this agent specialize in?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Model Input */}
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="google/gemini-3-flash-preview"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              className="font-mono"
            />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_MODELS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, model: m.id }))}
                  className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-primary/20 transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace Path *</Label>
            <Input
              id="workspace"
              placeholder="/path/to/workspace"
              value={formData.workspace}
              onChange={(e) => setFormData(prev => ({ ...prev, workspace: e.target.value }))}
              className="font-mono"
            />
          </div>

          {/* Tools */}
          <div className="space-y-2">
            <Label>Allowed Tools</Label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_TOOLS.map(tool => (
                <div key={tool.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tool-${tool.id}`}
                    checked={formData.allowed_tools?.includes(tool.id)}
                    onCheckedChange={() => toggleTool(tool.id)}
                  />
                  <label htmlFor={`tool-${tool.id}`} className="text-sm cursor-pointer">
                    {tool.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Concurrent Tasks: {formData.max_concurrent_tasks}</Label>
              <Slider
                value={[formData.max_concurrent_tasks || 3]}
                onValueChange={([v]) => setFormData(prev => ({ ...prev, max_concurrent_tasks: v }))}
                min={1}
                max={10}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Timeout (minutes): {formData.timeout_minutes}</Label>
              <Slider
                value={[formData.timeout_minutes || 60]}
                onValueChange={([v]) => setFormData(prev => ({ ...prev, timeout_minutes: v }))}
                min={15}
                max={180}
                step={15}
              />
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="system_prompt">Custom System Prompt (Optional)</Label>
            <Textarea
              id="system_prompt"
              placeholder="You are a senior software engineer..."
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createAgent.isPending}>
            {createAgent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
