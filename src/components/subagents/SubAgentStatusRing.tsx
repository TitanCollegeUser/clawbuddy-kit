import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SubAgentStatusRingProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<string, { color: string; animation: 'pulse' | 'spin' | 'blink' | 'none' }> = {
  running: { color: 'hsl(var(--primary))', animation: 'spin' },
  active: { color: 'hsl(var(--primary))', animation: 'pulse' },
  idle: { color: 'hsl(45 93% 47%)', animation: 'none' }, // amber
  paused: { color: 'hsl(25 95% 53%)', animation: 'none' }, // orange
  error: { color: 'hsl(0 84% 60%)', animation: 'blink' }, // red
  offline: { color: 'hsl(var(--muted-foreground))', animation: 'none' },
};

const sizeConfig = {
  sm: { ring: 32, stroke: 2, icon: 16 },
  md: { ring: 48, stroke: 3, icon: 24 },
  lg: { ring: 64, stroke: 4, icon: 32 },
};

export const SubAgentStatusRing = ({ status, size = 'md', className }: SubAgentStatusRingProps) => {
  const config = statusConfig[status] || statusConfig.offline;
  const sizeValues = sizeConfig[size];
  const radius = (sizeValues.ring - sizeValues.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn('relative', className)} style={{ width: sizeValues.ring, height: sizeValues.ring }}>
      {/* Background ring */}
      <svg
        className="absolute inset-0"
        width={sizeValues.ring}
        height={sizeValues.ring}
        viewBox={`0 0 ${sizeValues.ring} ${sizeValues.ring}`}
      >
        <circle
          cx={sizeValues.ring / 2}
          cy={sizeValues.ring / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={sizeValues.stroke}
        />
      </svg>

      {/* Animated status ring */}
      <motion.svg
        className="absolute inset-0"
        width={sizeValues.ring}
        height={sizeValues.ring}
        viewBox={`0 0 ${sizeValues.ring} ${sizeValues.ring}`}
        animate={config.animation === 'spin' ? { rotate: 360 } : undefined}
        transition={config.animation === 'spin' ? { duration: 2, repeat: Infinity, ease: 'linear' } : undefined}
      >
        <motion.circle
          cx={sizeValues.ring / 2}
          cy={sizeValues.ring / 2}
          r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth={sizeValues.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={config.animation === 'spin' ? circumference * 0.75 : 0}
          animate={
            config.animation === 'pulse'
              ? { opacity: [1, 0.5, 1] }
              : config.animation === 'blink'
              ? { opacity: [1, 0.2, 1] }
              : undefined
          }
          transition={
            config.animation === 'pulse' || config.animation === 'blink'
              ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
          style={{
            filter: `drop-shadow(0 0 ${sizeValues.stroke * 2}px ${config.color})`,
          }}
        />
      </motion.svg>

      {/* Center glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at center, ${config.color}20 0%, transparent 70%)`,
        }}
        animate={config.animation === 'pulse' ? { scale: [1, 1.1, 1] } : undefined}
        transition={config.animation === 'pulse' ? { duration: 2, repeat: Infinity } : undefined}
      />

      {/* Status dot in center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: sizeValues.icon / 2,
          height: sizeValues.icon / 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: config.color,
          boxShadow: `0 0 ${sizeValues.stroke * 3}px ${config.color}`,
        }}
        animate={config.animation === 'blink' ? { scale: [1, 1.3, 1] } : undefined}
        transition={config.animation === 'blink' ? { duration: 0.5, repeat: Infinity } : undefined}
      />
    </div>
  );
};
