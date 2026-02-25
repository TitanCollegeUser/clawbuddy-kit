import { motion } from 'framer-motion';
import { AiAssistantAvatar } from './AiAssistantAvatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AiAssistantBadgeProps {
  className?: string;
}

export const AiAssistantBadge = ({ className }: AiAssistantBadgeProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className={className}
        >
          <AiAssistantAvatar size="sm" showStatus={false} />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border-primary/30">
        <p className="text-xs">Created by AI</p>
      </TooltipContent>
    </Tooltip>
  );
};
