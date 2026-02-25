import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from './MarkdownEditor';
import { InputSchemaBuilder, type InputField } from './InputSchemaBuilder';
import { useCreateSkill } from '@/hooks/useSkills';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AVAILABLE_TOOLS = ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebSearch', 'WebFetch'];

export const ClaudeCodeSkillEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agents } = useAiStatus();
  const createSkill = useCreateSkill();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentName, setAgentName] = useState('');
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [outputFormat, setOutputFormat] = useState('text');
  const [markdown, setMarkdown] = useState('');

  const toggleTool = (tool: string) => {
    setAllowedTools((prev) => prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]);
  };

  const handleSave = async () => {
    if (!name || !title || !user) {
      toast({ title: 'Name and title are required', variant: 'destructive' });
      return;
    }
    try {
      await createSkill.mutateAsync({
        name,
        title,
        description: description || undefined,
        api_base_url: '',
        created_by: user.id,
        status: 'draft',
        agent_name: agentName || undefined,
        agent_type: 'claude-code',
        skill_markdown: markdown || undefined,
        allowed_tools: allowedTools,
        input_schema: inputFields as any,
        output_format: outputFormat,
      } as any);
      navigate('/skills/factory');
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/skills/factory')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-['Orbitron'] font-bold text-foreground">New Claude Code Skill</h2>
      </div>

      <div className="grid gap-5">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Skill Name (slug)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="youtube-researcher" className="bg-background/60 border-border/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="YouTube Researcher" className="bg-background/60 border-border/30" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this skill do?" className="bg-background/60 border-border/30 min-h-[60px]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Agent</Label>
            <Select value={agentName} onValueChange={setAgentName}>
              <SelectTrigger className="bg-background/60 border-border/30">
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.agent_name} value={a.agent_name}>
                    {a.agent_emoji} {a.agent_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Output Format</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger className="bg-background/60 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">text</SelectItem>
                <SelectItem value="json">json</SelectItem>
                <SelectItem value="html">html</SelectItem>
                <SelectItem value="csv">csv</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Allowed Tools */}
        <div className="space-y-2">
          <Label className="text-xs">Allowed Tools</Label>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_TOOLS.map((tool) => (
              <label key={tool} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={allowedTools.includes(tool)}
                  onCheckedChange={() => toggleTool(tool)}
                  className="border-border/50"
                />
                <span className="text-sm text-muted-foreground">{tool}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Input Schema */}
        <InputSchemaBuilder fields={inputFields} onChange={setInputFields} />

        {/* Markdown Editor */}
        <div className="space-y-1.5">
          <Label className="text-xs">Skill Instructions (Markdown)</Label>
          <MarkdownEditor value={markdown} onChange={setMarkdown} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate('/skills/factory')} className="border-border/40">Cancel</Button>
          <Button onClick={handleSave} disabled={createSkill.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {createSkill.isPending ? 'Saving...' : 'Save as Draft'}
          </Button>
        </div>
      </div>
    </div>
  );
};
