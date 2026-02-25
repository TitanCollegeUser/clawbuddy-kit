import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAiSettings } from '@/contexts/AiSettingsContext';

interface AiAssistantAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  ringColor?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5',
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

const statusDotSizes = {
  xs: 'h-1.5 w-1.5 -right-0.5 -bottom-0.5',
  sm: 'h-2 w-2 -right-0.5 -bottom-0.5',
  md: 'h-3 w-3 -right-0.5 -bottom-0.5',
  lg: 'h-4 w-4 -right-1 -bottom-1',
  xl: 'h-5 w-5 -right-1 -bottom-1',
};

const innerSizes = {
  xs: 12,
  sm: 16,
  md: 28,
  lg: 40,
  xl: 56,
};

export const AiAssistantAvatar = ({
  size = 'md',
  isOnline = false,
  showStatus = true,
  ringColor,
  className,
}: AiAssistantAvatarProps) => {
  const borderColor = ringColor || (isOnline ? 'hsl(var(--primary))' : 'hsl(var(--muted))');
  const glowColor = ringColor || 'hsl(var(--primary))';

  return (
    <div className={cn('relative', className)}>
      <motion.div
        animate={
          isOnline
            ? {
                boxShadow: [
                  `0 0 0 0 ${glowColor}66`,
                  `0 0 0 ${size === 'xl' ? '12px' : '8px'} ${glowColor}00`,
                ],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: isOnline ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{ borderColor }}
        className={cn('rounded-full overflow-hidden border-2 flex items-center justify-center bg-card', sizeClasses[size])}
      >
        {/* Mini Lobster Avatar */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body */}
          <ellipse cx="50" cy="55" rx="25" ry="30" fill="hsl(var(--primary))" />
          
          {/* Head */}
          <ellipse cx="50" cy="28" rx="15" ry="12" fill="hsl(var(--primary))" />
          
          {/* Eyes */}
          <circle cx="42" cy="24" r="5" fill="hsl(var(--background))" />
          <circle cx="58" cy="24" r="5" fill="hsl(var(--background))" />
          <circle cx="43" cy="23" r="2.5" fill="hsl(var(--foreground))" />
          <circle cx="59" cy="23" r="2.5" fill="hsl(var(--foreground))" />
          
          {/* Claws */}
          <ellipse cx="15" cy="45" rx="10" ry="6" fill="hsl(var(--primary))" />
          <ellipse cx="85" cy="45" rx="10" ry="6" fill="hsl(var(--primary))" />
        </svg>
      </motion.div>

      {showStatus && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute rounded-full border-2 border-background',
            statusDotSizes[size],
            isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
          )}
        >
          {isOnline && (
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full bg-emerald-500"
            />
          )}
        </motion.div>
      )}
    </div>
  );
};
