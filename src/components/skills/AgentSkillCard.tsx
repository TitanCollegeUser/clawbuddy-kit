import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AgentSkillCardProps {
  name: string;
  emoji: string;
  skillCount: number;
  selected: boolean;
  onClick: () => void;
}

export const AgentSkillCard = ({ name, emoji, skillCount, selected, onClick }: AgentSkillCardProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 min-w-[180px]',
        'bg-card/80 backdrop-blur-sm',
        selected
          ? 'border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)] bg-primary/10'
          : 'border-border/30 hover:border-primary/30 hover:shadow-[0_0_10px_hsl(var(--primary)/0.15)]'
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <div className="text-left">
        <p className={cn('font-semibold text-sm', selected ? 'text-primary' : 'text-foreground')}>{name}</p>
        <p className="text-xs text-muted-foreground">{skillCount} skill{skillCount !== 1 ? 's' : ''}</p>
      </div>
    </motion.button>
  );
};
