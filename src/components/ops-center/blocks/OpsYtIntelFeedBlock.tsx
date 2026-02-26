import { useState, useMemo } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pin, Check, Lightbulb, Target, AlertTriangle, TrendingUp, Trophy } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Props { block: OpsBlock; appId: string; }

const INSIGHT_TYPE_CONFIG: Record<string, { icon: typeof Lightbulb; label: string; color: string; hue: string }> = {
  observation: { icon: Lightbulb, label: 'Observation', color: 'text-blue-400', hue: 'border-blue-500/10 bg-blue-500/[0.03]' },
  recommendation: { icon: Target, label: 'Recommendation', color: 'text-emerald-400', hue: 'border-emerald-500/10 bg-emerald-500/[0.03]' },
  alert: { icon: AlertTriangle, label: 'Alert', color: 'text-red-400', hue: 'border-red-500/10 bg-red-500/[0.03]' },
  trend: { icon: TrendingUp, label: 'Trend', color: 'text-purple-400', hue: 'border-purple-500/10 bg-purple-500/[0.03]' },
  opportunity: { icon: Trophy, label: 'Opportunity', color: 'text-amber-400', hue: 'border-amber-500/10 bg-amber-500/[0.03]' },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-amber-400', low: 'text-muted-foreground',
};

export const OpsYtIntelFeedBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const showFilters = config.show_filters !== false;

  // Query by blockId only — no itemType filter, so any naming convention works
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const queryClient = useQueryClient();

  const toggleField = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const item = items?.find(i => i.id === id);
      if (!item) return;
      const newData = { ...(item.data as Record<string, unknown>), [field]: value };
      const { error } = await supabase.from('ops_data').update({ data: newData as unknown as Record<string, never> }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops-data', appId] }),
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    let result = items;
    if (typeFilter !== 'all') result = result.filter(i => (i.data as Record<string, unknown>).insight_type === typeFilter);
    if (priorityFilter !== 'all') result = result.filter(i => (i.data as Record<string, unknown>).priority === priorityFilter);
    if (showUnreadOnly) result = result.filter(i => !(i.data as Record<string, unknown>).is_read);
    if (showPinnedOnly) result = result.filter(i => Boolean((i.data as Record<string, unknown>).is_pinned));
    return result;
  }, [items, typeFilter, priorityFilter, showUnreadOnly, showPinnedOnly]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-white/[0.03] border-white/[0.08]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(INSIGHT_TYPE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white/[0.03] border-white/[0.08]">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${showUnreadOnly ? 'bg-primary/10 border-primary/30 text-primary' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'}`}>
            Unread only
          </button>
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${showPinnedOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'}`}>
            Pinned only
          </button>
        </div>
      )}

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No intelligence items yet.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-custom">
          {filtered.map(item => {
            const d = item.data as Record<string, unknown>;
            const insightType = String(d.insight_type || 'observation');
            const priority = String(d.priority || 'medium');
            const isPinned = Boolean(d.is_pinned);
            const isRead = Boolean(d.is_read);
            const cfg = INSIGHT_TYPE_CONFIG[insightType] || INSIGHT_TYPE_CONFIG.observation;
            const Icon = cfg.icon;

            return (
              <div key={item.id} className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${cfg.hue} ${!isRead ? 'border-l-2 border-l-primary/60' : ''} ${isPinned ? 'shadow-[0_0_12px_rgba(234,179,8,0.06)]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${cfg.color}`}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      <span className={`text-[10px] font-medium ${PRIORITY_COLORS[priority]}`}>{priority}</span>
                      {isPinned && <Pin className="h-3 w-3 text-amber-400 fill-amber-400" />}
                      {!isRead && <span className="text-[9px] px-1.5 py-0 rounded-full bg-primary/20 text-primary font-medium">NEW</span>}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mt-0.5">{item.title}</h4>
                    {d.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{String(d.content)}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                          onClick={() => toggleField.mutate({ id: item.id, field: 'is_pinned', value: !isPinned })}>
                          <Pin className={`h-3 w-3 ${isPinned ? 'text-amber-400' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                          onClick={() => toggleField.mutate({ id: item.id, field: 'is_read', value: !isRead })}>
                          <Check className={`h-3 w-3 ${isRead ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
