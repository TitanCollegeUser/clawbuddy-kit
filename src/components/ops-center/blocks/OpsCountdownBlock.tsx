import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OpsBlock } from '@/hooks/useOpsBlocks';

interface Props { block: OpsBlock; appId: string }

function getColor(pct: number): string {
  if (pct < 0.25) return '#10b981'; // green
  if (pct < 0.5) return '#f59e0b';  // yellow
  if (pct < 0.75) return '#f97316'; // orange
  return '#ef4444';                  // red
}

export const OpsCountdownBlock = ({ block }: Props) => {
  const config = block.config as Record<string, unknown>;
  const targetDate = new Date(config.target_date as string);
  const startDate = config.start_date ? new Date(config.start_date as string) : new Date();
  const label = (config.label as string) || 'Countdown';
  const mode = (config.mode as string) || 'countdown';
  const showHours = config.show_hours === true;
  const size = (config.size as string) === 'large' ? 180 : 140;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const { daysRemaining, hoursRemaining, minutesRemaining, progress, color } = useMemo(() => {
    const totalMs = targetDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const remainingMs = targetDate.getTime() - now.getTime();

    const pct = totalMs > 0 ? Math.min(Math.max(elapsedMs / totalMs, 0), 1) : 1;
    const days = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const minutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

    return {
      daysRemaining: mode === 'elapsed' ? Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) : days,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      progress: mode === 'elapsed' ? pct : pct,
      color: getColor(pct),
    };
  }, [now, targetDate, startDate, mode]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl p-6 flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth={8} />
          {/* Progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-orbitron text-3xl font-bold" style={{ color }}>{daysRemaining}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-orbitron">
            {mode === 'elapsed' ? 'days elapsed' : 'days left'}
          </span>
        </div>
      </div>

      {showHours && (
        <div className="flex gap-4 mt-3">
          <div className="text-center">
            <span className="font-orbitron text-lg font-semibold text-foreground">{hoursRemaining}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">hrs</span>
          </div>
          <div className="text-center">
            <span className="font-orbitron text-lg font-semibold text-foreground">{minutesRemaining}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">min</span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3 font-medium">{label}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
        {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </motion.div>
  );
};
