import { motion } from 'framer-motion';
import { AgentAvatar } from './AgentAvatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAgentNames } from '@/contexts/AgentNamesContext';

interface AgentBadgeProps {
  className?: string;
}

export const AgentBadge = ({ className }: AgentBadgeProps) => {
  const { agentNames } = useAgentNames();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className={className}
        >
          <AgentAvatar size="sm" showStatus={false} />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border-primary/30">
        <p className="text-xs">Created by {agentNames.primaryName}</p>
      </TooltipContent>
    </Tooltip>
  );
};
