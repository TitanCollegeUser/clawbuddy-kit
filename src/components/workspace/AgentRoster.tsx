import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AgentSprite } from './canvas/types';
import { AgentSkillCardModal } from './AgentSkillCardModal';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';

interface AgentRosterProps {
  sprites: AgentSprite[];
  dbAgents: OfficeAgent[];
}

const speciesEmoji: Record<string, string> = {
  fox: '🦊', wolf: '🐺', owl: '🦉', bear: '🐻',
  cat: '🐱', rabbit: '🐰', hamster: '🐹', bird: '🐦',
};

const statusDot: Record<string, string> = {
  idle: 'bg-muted-foreground',
  working: 'bg-green-500',
  walking: 'bg-yellow-500',
  delegating: 'bg-blue-500',
  collecting: 'bg-purple-500',
  coffee: 'bg-amber-600',
  water: 'bg-cyan-500',
  meeting: 'bg-pink-500',
};

export const AgentRoster = ({ sprites, dbAgents }: AgentRosterProps) => {
  const [open, setOpen] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<OfficeAgent | null>(null);

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Agents ({sprites.length})
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1.5 space-y-0.5">
          {sprites.map(sprite => {
            const dbAgent = dbAgents.find(a => a.id === sprite.id);
            return (
              <div
                key={sprite.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors group"
              >
                <span className="text-sm">{speciesEmoji[sprite.species] || '🐱'}</span>
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[sprite.status] || statusDot.idle}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{sprite.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sprite.role}</p>
                </div>
                {sprite.thought && (
                  <p className="text-[10px] text-muted-foreground italic truncate max-w-[80px]">
                    "{sprite.thought}"
                  </p>
                )}
                {dbAgent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedAgent(dbAgent)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      <AgentSkillCardModal
        agent={selectedAgent}
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
};
