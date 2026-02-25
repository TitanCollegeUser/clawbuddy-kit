import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';

interface AgentSkillCardModalProps {
  agent: OfficeAgent | null;
  open: boolean;
  onClose: () => void;
}

const speciesEmoji: Record<string, string> = {
  fox: '🦊', wolf: '🐺', owl: '🦉', bear: '🐻',
  cat: '🐱', rabbit: '🐰', hamster: '🐹', bird: '🐦',
};

export const AgentSkillCardModal = ({ agent, open, onClose }: AgentSkillCardModalProps) => {
  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">
              {speciesEmoji[agent.species] || '🐱'}
            </span>
            {agent.name}
            <span className="text-xs text-muted-foreground font-normal">— {agent.role}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 text-sm pr-3">
            {/* Bio / Soul - the main ID card content */}
            {agent.bio && (
              <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Soul</p>
                <div className="text-foreground/90 text-xs leading-relaxed whitespace-pre-wrap">
                  {agent.bio}
                </div>
              </div>
            )}

            {agent.persona && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Persona</p>
                <p className="text-foreground/90 text-xs leading-relaxed">{agent.persona}</p>
              </div>
            )}

            {agent.skills && agent.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-[10px]">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {agent.secret_sauce && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Secret Sauce</p>
                <p className="text-foreground/90 text-xs leading-relaxed italic">{agent.secret_sauce}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: agent.neon_color, borderColor: agent.neon_color }}
              />
              <span className="text-[10px] text-muted-foreground font-mono">Status: {agent.status}</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
