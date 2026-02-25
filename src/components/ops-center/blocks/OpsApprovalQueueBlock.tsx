import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData } from '@/hooks/useOpsData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props { block: OpsBlock; appId: string }

const priorityColors: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#6b7280',
};

export const OpsApprovalQueueBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const showComments = config.show_comments !== false;
  const categories = (config.categories as string[]) || [];

  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id, itemType: 'approval' });
  const queryClient = useQueryClient();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  const pending = useMemo(() => {
    let filtered = items.filter(i => i.status === 'pending');
    if (filterCategory !== 'all') {
      filtered = filtered.filter(i => (i.data as Record<string, unknown>)?.category === filterCategory);
    }
    return filtered.sort((a, b) => {
      const pa = (a.data as Record<string, unknown>)?.priority as string || 'low';
      const pb = (b.data as Record<string, unknown>)?.priority as string || 'low';
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[pa as keyof typeof order] ?? 3) - (order[pb as keyof typeof order] ?? 3);
    });
  }, [items, filterCategory]);

  const handleAction = async (item: typeof items[0], action: 'approved' | 'rejected') => {
    setActioning(item.id);
    const existingData = (item.data || {}) as Record<string, unknown>;
    const updatedData = {
      ...existingData,
      approval_status: action,
      approved_at: new Date().toISOString(),
      comment: commentText || null,
    };
    await supabase.from('ops_data').update({ status: action, data: updatedData as any }).eq('id', item.id);
    queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
    setCommentOpen(null);
    setCommentText('');
    setTimeout(() => setActioning(null), 300);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-strong rounded-lg p-4 animate-pulse space-y-2">
            <div className="h-3.5 w-3/4 bg-muted rounded" />
            <div className="h-2.5 w-1/2 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle size={24} className="text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-foreground">All clear!</p>
        <p className="text-xs text-muted-foreground">No items waiting for your review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`text-[10px] font-orbitron uppercase tracking-wider px-3 py-1 rounded-full transition ${filterCategory === 'all' ? 'bg-white/[0.1] text-foreground' : 'bg-white/[0.04] text-muted-foreground hover:text-foreground'}`}
          >
            All ({items.filter(i => i.status === 'pending').length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full transition ${filterCategory === cat ? 'bg-white/[0.1] text-foreground' : 'bg-white/[0.04] text-muted-foreground hover:text-foreground'}`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Queue */}
      <AnimatePresence mode="popLayout">
        {pending.map((item, i) => {
          const d = item.data as Record<string, unknown>;
          const priority = (d?.priority as string) || 'medium';
          const agent = d?.submitted_by as string;
          const submittedAt = d?.submitted_at as string;
          const category = d?.category as string;
          const borderColor = priorityColors[priority] || '#6b7280';

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="glass-strong rounded-xl p-4 border-l-4"
              style={{ borderLeftColor: borderColor }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${borderColor}20`, color: borderColor }}>
                      {priority}
                    </span>
                    {category && (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">
                        {category.replace(/_/g, ' ')}
                      </span>
                    )}
                    {agent && (
                      <span className="text-[10px] text-muted-foreground">by {agent}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                  {submittedAt && (
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                      {format(new Date(submittedAt), 'MMM d, HH:mm')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {showComments && (
                    <button
                      onClick={() => setCommentOpen(commentOpen === item.id ? null : item.id)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(item, 'approved')}
                    disabled={actioning === item.id}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleAction(item, 'rejected')}
                    disabled={actioning === item.id}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Comment input */}
              <AnimatePresence>
                {commentOpen === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                      rows={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
