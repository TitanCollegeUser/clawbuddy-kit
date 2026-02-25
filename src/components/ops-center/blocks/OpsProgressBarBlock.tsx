import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { motion } from 'framer-motion';

interface Segment {
  label: string;
  current: number;
  target: number;
  color: string;
}

export const OpsProgressBarBlock = ({ block }: { block: OpsBlock; appId: string }) => {
  const segments = (block.config.segments as Segment[]) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {block.title && (
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">{block.title}</h3>
        </div>
      )}
      <div className="px-5 pb-5 space-y-4">
        {segments.map((seg, i) => {
          const pct = seg.target > 0 ? Math.min((seg.current / seg.target) * 100, 100) : 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-foreground font-medium">{seg.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{seg.current} / {seg.target}</span>
                  <span className="font-orbitron text-xs font-semibold" style={{ color: seg.color }}>{Math.round(pct)}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{
                    backgroundColor: seg.color,
                    backgroundImage: `linear-gradient(90deg, ${seg.color}, ${seg.color}CC, ${seg.color})`,
                    boxShadow: `0 0 8px ${seg.color}50`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
