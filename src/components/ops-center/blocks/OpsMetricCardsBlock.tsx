import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { icons } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface MetricCardConfig {
  label: string;
  value_path: string;
  icon?: string;
  color?: string;
  format?: string;
}

const resolveIcon = (name?: string) => {
  if (!name) return null;
  const key = name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return (icons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[key] || null;
};

const formatVal = (v: number, format?: string) => {
  if (format === 'percent') return `${Math.round(v)}%`;
  if (format === 'number') return v.toLocaleString();
  return String(v);
};

export const OpsMetricCardsBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const cards = (block.config.cards as MetricCardConfig[]) || [];
  const { data: items, isLoading } = useOpsData({ appId });

  if (isLoading) return <div className="flex gap-3"><Skeleton className="h-24 flex-1 rounded-xl" /><Skeleton className="h-24 flex-1 rounded-xl" /></div>;

  const computeValue = (path: string): number => {
    if (!items) return 0;
    if (path.startsWith('count:')) {
      const parts = path.split(':');
      const type = parts[1];
      const status = parts[2];
      let filtered = items.filter(i => i.item_type === type);
      if (status) filtered = filtered.filter(i => i.status === status || i.column_id === status);
      return filtered.length;
    }
    if (path.startsWith('data.')) {
      const field = path.replace('data.', '');
      for (const item of items) {
        const val = item.data?.[field];
        if (val !== undefined) return Number(val) || 0;
      }
    }
    return 0;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const Icon = resolveIcon(card.icon);
        const value = computeValue(card.value_path);
        const accentColor = card.color || 'hsl(var(--primary))';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="glass-strong rounded-xl p-4 border-l-2"
            style={{ borderLeftColor: accentColor }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">{card.label}</span>
              {Icon && (
                <Icon
                  className="h-4 w-4"
                  style={{ color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor}60)` }}
                />
              )}
            </div>
            <p className="text-2xl font-bold text-foreground" style={{ color: accentColor }}>
              {formatVal(value, card.format)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
