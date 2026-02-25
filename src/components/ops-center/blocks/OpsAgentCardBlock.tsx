import { motion } from 'framer-motion';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData } from '@/hooks/useOpsData';
import { format } from 'date-fns';

interface Props { block: OpsBlock; appId: string }

const statusColors: Record<string, string> = {
  active: '#10b981',
  waiting: '#f59e0b',
  error: '#ef4444',
  offline: '#6b7280',
  idle: '#6b7280',
};

export const OpsAgentCardBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const showCapabilities = config.show_capabilities !== false;
  const showModel = config.show_model !== false;
  const showCurrentTask = config.show_current_task !== false;
  const showLastActive = config.show_last_active !== false;

  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id, itemType: 'agent' });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-strong rounded-xl p-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-20 bg-muted rounded" />
                <div className="h-2.5 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="h-3 w-3/4 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center gap-3">
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border border-dashed border-white/[0.1]" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">No agents registered. Agents will appear here when they connect to this op.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => {
        const d = item.data as Record<string, unknown>;
        const emoji = (d?.avatar_emoji as string) || '⚡';
        const avatarColor = (d?.avatar_color as string) || '#3b82f6';
        const model = d?.model as string;
        const currentTask = d?.current_task as string;
        const capabilities = (d?.capabilities as string[]) || [];
        const lastActive = d?.last_active as string;
        const tasksCompleted = d?.tasks_completed as number;
        const statusColor = statusColors[item.status] || statusColors.offline;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="glass-strong rounded-xl p-5 hover:border-white/[0.12] transition-colors"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${avatarColor}20`, boxShadow: `0 0 12px ${avatarColor}30` }}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'active' ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                  />
                </div>
                {showModel && model && (
                  <p className="text-[10px] text-muted-foreground truncate">{model}</p>
                )}
              </div>
              {tasksCompleted != null && (
                <span className="text-[10px] font-orbitron text-muted-foreground bg-white/[0.06] px-2 py-0.5 rounded-full shrink-0">
                  {tasksCompleted} done
                </span>
              )}
            </div>

            {/* Current task */}
            {showCurrentTask && currentTask && (
              <div className="text-xs text-muted-foreground bg-white/[0.04] rounded-lg px-3 py-2 mb-3 border border-white/[0.06]">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 block mb-0.5">Current task</span>
                {currentTask}
              </div>
            )}

            {/* Capabilities */}
            {showCapabilities && capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {capabilities.map(c => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground border border-white/[0.06]">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Last active */}
            {showLastActive && lastActive && (
              <p className="text-[10px] text-muted-foreground/60">
                Last active {format(new Date(lastActive), 'MMM d, HH:mm')}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
