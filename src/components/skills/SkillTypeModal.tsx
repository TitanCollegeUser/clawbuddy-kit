import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Puzzle, FileCode } from 'lucide-react';

interface SkillTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOpenClaw: () => void;
  onSelectClaudeCode: () => void;
}

export const SkillTypeModal = ({ open, onOpenChange, onSelectOpenClaw, onSelectClaudeCode }: SkillTypeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="font-['Orbitron'] text-lg">Create New Skill</DialogTitle>
          <DialogDescription>Choose the skill type to create</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex items-start gap-4 border-border/40 hover:border-primary/40 hover:bg-primary/5 justify-start"
            onClick={onSelectOpenClaw}
          >
            <Puzzle className="h-8 w-8 text-primary shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-semibold text-foreground">OpenClaw Skill</p>
              <p className="text-xs text-muted-foreground mt-1">API integration with endpoints, auth, and operations. Uses the existing 3-step wizard.</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 flex items-start gap-4 border-border/40 hover:border-primary/40 hover:bg-primary/5 justify-start"
            onClick={onSelectClaudeCode}
          >
            <FileCode className="h-8 w-8 text-primary shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Claude Code Skill</p>
              <p className="text-xs text-muted-foreground mt-1">Markdown-based skill with instructions, input schema, and allowed tools for Claude Code agents.</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
