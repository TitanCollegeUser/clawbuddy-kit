import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ClawBuddyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export const ClawBuddyLogo = ({
  size = 'md',
  animated = true,
  showText = false,
  className,
}: ClawBuddyLogoProps) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        className={cn('relative', sizeClasses[size])}
        animate={animated ? { rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Lobster SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body */}
          <motion.ellipse
            cx="50"
            cy="55"
            rx="25"
            ry="30"
            fill="hsl(var(--primary))"
            animate={animated ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Shell segments */}
          <path
            d="M30 45 Q50 40 70 45"
            stroke="hsl(var(--primary-foreground) / 0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M28 55 Q50 50 72 55"
            stroke="hsl(var(--primary-foreground) / 0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M30 65 Q50 60 70 65"
            stroke="hsl(var(--primary-foreground) / 0.3)"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Head */}
          <ellipse
            cx="50"
            cy="28"
            rx="15"
            ry="12"
            fill="hsl(var(--primary))"
          />
          
          {/* Eyes */}
          <motion.g
            animate={animated ? { y: [0, -1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <circle cx="42" cy="24" r="5" fill="hsl(var(--background))" />
            <circle cx="58" cy="24" r="5" fill="hsl(var(--background))" />
            <circle cx="43" cy="23" r="2.5" fill="hsl(var(--foreground))" />
            <circle cx="59" cy="23" r="2.5" fill="hsl(var(--foreground))" />
            <circle cx="44" cy="22" r="1" fill="white" />
            <circle cx="60" cy="22" r="1" fill="white" />
          </motion.g>
          
          {/* Antennae */}
          <motion.g
            animate={animated ? { rotate: [-5, 5, -5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: '50px 20px' }}
          >
            <path
              d="M45 20 Q35 5 30 0"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M55 20 Q65 5 70 0"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
          
          {/* Left Claw */}
          <motion.g
            animate={animated ? { rotate: [-10, 10, -10] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            style={{ transformOrigin: '25px 50px' }}
          >
            <ellipse cx="15" cy="45" rx="12" ry="8" fill="hsl(var(--primary))" />
            <path
              d="M8 38 L3 30 M8 38 L15 32"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </motion.g>
          
          {/* Right Claw */}
          <motion.g
            animate={animated ? { rotate: [10, -10, 10] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            style={{ transformOrigin: '75px 50px' }}
          >
            <ellipse cx="85" cy="45" rx="12" ry="8" fill="hsl(var(--primary))" />
            <path
              d="M92 38 L97 30 M92 38 L85 32"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </motion.g>
          
          {/* Legs */}
          <g stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round">
            <motion.path
              d="M30 60 L18 70"
              animate={animated ? { d: ['M30 60 L18 70', 'M30 60 L20 72', 'M30 60 L18 70'] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.path
              d="M70 60 L82 70"
              animate={animated ? { d: ['M70 60 L82 70', 'M70 60 L80 72', 'M70 60 L82 70'] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
            />
            <motion.path
              d="M28 70 L15 82"
              animate={animated ? { d: ['M28 70 L15 82', 'M28 70 L17 84', 'M28 70 L15 82'] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            />
            <motion.path
              d="M72 70 L85 82"
              animate={animated ? { d: ['M72 70 L85 82', 'M72 70 L83 84', 'M72 70 L85 82'] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
            />
          </g>
          
          {/* Tail */}
          <motion.path
            d="M40 85 Q50 95 60 85"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            animate={animated ? { d: ['M40 85 Q50 95 60 85', 'M40 85 Q50 92 60 85', 'M40 85 Q50 95 60 85'] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </svg>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full -z-10" />
      </motion.div>
      
      {showText && (
        <div>
          <h1 className={cn('font-orbitron font-bold text-glow', textSizeClasses[size])}>
            Claw<span className="text-primary">Buddy</span>
          </h1>
          <p className="text-xs text-muted-foreground font-exo">Mission Control for AI Agents</p>
        </div>
      )}
    </div>
  );
};
