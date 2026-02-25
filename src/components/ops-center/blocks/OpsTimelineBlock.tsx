import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flag, Zap, MessageCircle, AlertTriangle, Circle } from 'lucide-react';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData } from '@/hooks/useOpsData';
import { format } from 'date-fns';

interface Props { block: OpsBlock; appId: string }

const iconMap: Record<string, React.ElementType> = {
  flag: Flag,
  zap: Zap,
  'message-circle': MessageCircle,
  'alert-triangle': AlertTriangle,
};

const defaultEventTypes: Record<string, { icon: string; color: string }> = {
  milestone: { icon: 'flag', color: '#10b981' },
  action: { icon: 'zap', color: '#3b82f6' },
  note: { icon: 'message-circle', color: '#f59e0b' },
  alert: { icon: 'alert-triangle', color: '#ef4444' },
};

export const OpsTimelineBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const eventTypes = (config.event_types as Record<string, { icon: string; color: string }>) || defaultEventTypes;
  const maxItems = (config.max_items as number) || 50;

  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id, itemType: 'timeline_event' });
  const sorted = useMemo(() => [...items].sort((a, b) => {
    const tA = (a.data as Record<string, unknown>)?.timestamp as string || a.created_at;
    const tB = (b.data as Record<string, unknown>)?.timestamp as string || b.created_at;
    return new Date(tB).getTime() - new Date(tA).getTime();
  }).slice(0, maxItems), [items, maxItems]);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-muted animate-pulse mt-1.5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center gap-3">
        <div className="relative h-24 w-px bg-white/[0.08]">
          {[0, 8, 16].map(t => (
            <div key={t} className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white/[0.1] bg-transparent" style={{ top: `${t * 4 + 4}px` }} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">No events yet. Activity will appear here as your agents work.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/[0.1]" />

        {sorted.map((item, i) => {
          const d = item.data as Record<string, unknown>;
          const eventType = (d?.event_type as string) || item.status || 'action';
          const et = eventTypes[eventType] || defaultEventTypes.action;
          const Icon = iconMap[et.icon] || Circle;
          const agent = d?.agent as string;
          const ts = (d?.timestamp as string) || item.created_at;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="relative mb-5 last:mb-0"
            >
              {/* Dot */}
              <div
                className="absolute -left-8 top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2"
                style={{ borderColor: et.color, backgroundColor: `${et.color}20` }}
              >
                <Icon size={10} style={{ color: et.color }} />
              </div>

              {/* Content card */}
              <div className="glass-strong rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-orbitron uppercase tracking-wider text-muted-foreground">
                    {format(new Date(ts), 'MMM d, HH:mm')}
                  </span>
                  {agent && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${et.color}20`, color: et.color }}
                    >
                      {agent}
                    </span>
                  )}
                  <span
                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color: et.color }}
                  >
                    {eventType}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
