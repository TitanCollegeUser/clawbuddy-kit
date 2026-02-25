import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Play, Loader2 } from 'lucide-react';
import type { Skill } from '@/hooks/useSkills';
import type { InputField } from './InputSchemaBuilder';

interface RunSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: Skill;
}

export const RunSkillModal = ({ open, onOpenChange, skill }: RunSkillModalProps) => {
  const inputSchema = Array.isArray(skill.input_schema) ? (skill.input_schema as unknown as InputField[]) : [];
  const [args, setArgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('ai-tasks', {
        body: {
          type: 'queue',
          action: 'create',
          task_type: 'skill',
          payload: {
            skill_name: skill.name,
            skill_id: skill.id,
            args,
            skill_markdown: skill.skill_markdown,
          },
        },
      });
      if (error) throw error;
      toast({ title: 'Skill execution queued', description: `${skill.title} has been queued for execution.` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error queuing skill', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-['Orbitron'] text-lg">Run: {skill.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {inputSchema.length === 0 && (
            <p className="text-sm text-muted-foreground italic">This skill has no input fields. Click Execute to run it.</p>
          )}
          {inputSchema.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label className="text-xs">
                {field.name}{field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
              <Input
                type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                value={args[field.name] || ''}
                onChange={(e) => setArgs((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.name}
                className="bg-background/60 border-border/30"
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={handleExecute} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Execute
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
