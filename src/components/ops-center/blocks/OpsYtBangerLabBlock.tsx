import { useState, useMemo } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MarkdownMessage } from '@/components/ui/MarkdownMessage';
import { Search, FlaskConical, Sparkles, ArrowRight, MessageCircle, Send, Loader2, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Props { block: OpsBlock; appId: string; }

const SOURCE_BADGES: Record<string, { emoji: string; label: string }> = {
  ai_generated: { emoji: '🤖', label: 'AI' },
  manual: { emoji: '👤', label: 'Manual' },
  competitor_inspired: { emoji: '🔍', label: 'Competitor' },
  video_inspired: { emoji: '🎬', label: 'Video' },
};

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'Money Proof': { bg: 'bg-red-500/5', border: 'border-red-500/15', text: 'text-red-400' },
  'Challenges': { bg: 'bg-teal-500/5', border: 'border-teal-500/15', text: 'text-teal-400' },
  'Tutorials': { bg: 'bg-blue-500/5', border: 'border-blue-500/15', text: 'text-blue-400' },
  'Contrarian': { bg: 'bg-orange-500/5', border: 'border-orange-500/15', text: 'text-orange-400' },
  'Civilian Expansion': { bg: 'bg-purple-500/5', border: 'border-purple-500/15', text: 'text-purple-400' },
  'Series & Recurring': { bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', text: 'text-emerald-400' },
};

const DEFAULT_CATEGORIES = ['Money Proof', 'Challenges', 'Tutorials', 'Contrarian', 'Civilian Expansion', 'Series & Recurring'];

const COLUMN_LABELS: Record<string, string> = {
  longlist: 'Longlist',
  banger_lab: 'Banger Lab',
  shortlist: 'Shortlist',
  in_production: 'In Production',
  scripted: 'Scripted',
  published: 'Published',
};

const STATUS_COLORS: Record<string, string> = {
  longlist: 'bg-cyan-500/15 text-cyan-400',
  banger_lab: 'bg-purple-500/15 text-purple-400',
  shortlist: 'bg-amber-500/15 text-amber-400',
  in_production: 'bg-orange-500/15 text-orange-400',
  scripted: 'bg-emerald-500/15 text-emerald-400',
  published: 'bg-emerald-400/15 text-emerald-300',
};

const PIPELINE_STAGES = ['longlist', 'banger_lab', 'shortlist', 'in_production', 'scripted', 'published'];

const QUICK_ACTIONS = [
  { label: 'Is this really a banger?', text: "Honestly evaluate this idea. Is this really a banger or am I being generous? Check against competitor data and outlier patterns." },
  { label: 'Improve the title', text: "The title needs work. Make it more specific, more compelling, and impossible to scroll past." },
  { label: 'Check competitors', text: "Have any competitors done something similar? What performed best and what can we learn from it?" },
  { label: 'Thumbnail feedback', text: "Let's rework the thumbnail concept. What would make this impossible to NOT click?" },
];

const EVOLVABLE_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'thumbnail_concept', label: 'Thumbnail Concept' },
  { key: 'angle', label: 'Angle' },
  { key: 'sherlock_insights', label: "Why It's a Banger" },
  { key: 'community_gate', label: 'Community Gate' },
] as const;

interface EvolutionEntry {
  field: string;
  old_value: string | null;
  new_value: string;
  reason: string;
  changed_by: string;
  timestamp: string;
}

interface FeedbackEntry {
  from: string;
  message: string;
  timestamp: string;
}

// --- Sub-components for the detail panel ---

interface EditableFieldProps {
  fieldKey: string;
  label: string;
  value: string | null;
  itemId: string;
  itemData: Record<string, unknown>;
  appId: string;
}

const EditableField = ({ fieldKey, label, value, itemId, itemData, appId }: EditableFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const evolve = useMutation({
    mutationFn: async () => {
      const oldValue = value ?? '';
      const history: EvolutionEntry[] = Array.isArray(itemData.evolution_history) ? itemData.evolution_history as EvolutionEntry[] : [];
      const newEntry: EvolutionEntry = {
        field: fieldKey,
        old_value: oldValue,
        new_value: editValue.trim(),
        reason: reason.trim() || 'Manual update',
        changed_by: 'user',
        timestamp: new Date().toISOString(),
      };
      const updates: Record<string, unknown> = {
        ...itemData,
        [fieldKey]: editValue.trim(),
        evolution_history: [...history, newEntry],
      };
      // Also update the top-level title if that's what changed
      const topLevel: Record<string, unknown> = { data: updates };
      if (fieldKey === 'title') topLevel.title = editValue.trim();
      const { error } = await supabase.from('ops_data').update(topLevel).eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
      setEditing(false);
    },
  });

  if (!value && !editing) return null;

  const handleStartEdit = () => {
    setEditValue(value ?? '');
    setReason('');
    setEditing(true);
  };

  const handleSave = () => {
    if (!editValue.trim() || editValue === value) { setEditing(false); return; }
    evolve.mutate();
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label === "Why It's a Banger" ? `🔍 ${label}` : label}
        </p>
        {!editing && (
          <button onClick={handleStartEdit} className="text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea value={editValue} onChange={e => setEditValue(e.target.value)}
            className="min-h-[50px] resize-none bg-white/[0.03] border-white/[0.08] text-sm" />
          <Input placeholder="Reason for change..." value={reason} onChange={e => setReason(e.target.value)}
            className="h-7 text-xs bg-white/[0.03] border-white/[0.08]" />
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={evolve.isPending} className="h-6 px-2 text-xs">
              <Check className="h-3 w-3 mr-1" /> Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-6 px-2 text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground">{value}</p>
      )}
    </div>
  );
};

const EvolutionTimeline = ({ history }: { history: EvolutionEntry[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:opacity-80 transition-opacity">
        <span className="text-sm font-semibold text-foreground">🧬 Evolution History</span>
        {history.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{history.length}</Badge>
        )}
        <ChevronDown className={`h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No changes tracked yet</p>
        ) : (
          <div className="relative ml-3 mt-2 space-y-4">
            <div className="absolute left-0 top-2 bottom-2 w-px bg-white/[0.08]" />
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="relative pl-5">
                <div className="absolute left-[-3px] top-1.5 w-[7px] h-[7px] rounded-full bg-accent border border-white/[0.15]" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize">{entry.field.replace(/_/g, ' ')}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      by {entry.changed_by === 'agent' || entry.changed_by === 'sherlock' ? '🔍 Agent' : '👤 You'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-through truncate max-w-[90%]">{entry.old_value || '(empty)'}</p>
                  <p className="text-xs text-foreground truncate max-w-[90%]">{entry.new_value}</p>
                  {entry.reason && (
                    <p className="text-[10px] text-muted-foreground/70 italic">{entry.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

// --- Main Component ---

export const OpsYtBangerLabBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const categories = (config.categories as string[]) || DEFAULT_CATEGORIES;
  const showStatsBar = config.show_stats_bar !== false;
  const showSearch = config.show_search !== false;

  // Query by blockId only — no itemType filter, so any naming convention works
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<OpsDataItem | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const queryClient = useQueryClient();

  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('ops_data').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops-data', appId] }),
  });

  const toggleBanger = (item: OpsDataItem) => {
    const d = item.data as Record<string, unknown>;
    const isBanger = Boolean(d.is_banger);
    updateItem.mutate({
      id: item.id,
      updates: { data: { ...d, is_banger: !isBanger, banger_confirmed_at: !isBanger ? new Date().toISOString() : null } },
    });
  };

  const moveToStage = (id: string, newStatus: string) => {
    updateItem.mutate({ id, updates: { status: newStatus, column_id: newStatus } });
  };

  const sendFeedback = () => {
    if (!feedbackText.trim() || !selected) return;
    const d = (items?.find(i => i.id === selected.id)?.data ?? selected.data) as Record<string, unknown>;
    const history = Array.isArray(d.feedback_history) ? d.feedback_history : [];
    const newEntry: FeedbackEntry = { from: 'user', message: feedbackText.trim(), timestamp: new Date().toISOString() };
    updateItem.mutate({
      id: selected.id,
      updates: { data: { ...d, feedback_history: [...history, newEntry], user_feedback: feedbackText.trim() } },
    });
    setFeedbackText('');
  };

  const stats = useMemo(() => {
    if (!items) return { total: 0, bangers: 0 };
    return {
      total: items.length,
      bangers: items.filter(i => Boolean((i.data as Record<string, unknown>).is_banger)).length,
    };
  }, [items]);

  const filteredIdeas = useMemo(() => {
    if (!items) return [];
    let filtered = items;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => (i.data as Record<string, unknown>).category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => i.title.toLowerCase().includes(q));
    }
    return filtered;
  }, [items, categoryFilter, searchQuery]);

  const liveSelected = selected ? items?.find(i => i.id === selected.id) ?? selected : null;
  const selData = liveSelected?.data as Record<string, unknown> | undefined;
  const feedbackHistory = (selData?.feedback_history as FeedbackEntry[]) || [];
  const evolutionHistory = (selData?.evolution_history as EvolutionEntry[]) || [];
  const currentStatus = liveSelected?.status || 'banger_lab';
  const isAwaitingResponse = selData?.user_feedback && !selData?.ai_response;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      {showStatsBar && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <FlaskConical className="h-4 w-4 text-cyan-400" />
            <span className="text-muted-foreground">In Lab:</span>
            <span className="font-semibold text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Bangers:</span>
            <span className="font-semibold text-amber-400">{stats.bangers}</span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setCategoryFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${categoryFilter === 'all' ? 'bg-white/[0.08] border-white/[0.15] text-foreground' : 'bg-transparent border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${categoryFilter === cat ? 'bg-white/[0.08] border-white/[0.15] text-foreground' : 'bg-transparent border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search ideas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.03] border-white/[0.08]" />
        </div>
      )}

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="text-center py-16">
          <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No ideas in the Banger Lab yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map(item => {
            const d = item.data as Record<string, unknown>;
            const isBanger = Boolean(d.is_banger);
            const source = SOURCE_BADGES[String(d.source_type || 'manual')] || SOURCE_BADGES.manual;
            const cat = String(d.category || '');
            const catStyle = Object.entries(CATEGORY_STYLES).find(([key]) =>
              cat.toLowerCase().includes(key.toLowerCase())
            )?.[1];
            const hasFeedback = Array.isArray(d.feedback_history) && (d.feedback_history as unknown[]).length > 0;

            const cardClasses = isBanger
              ? 'relative p-4 rounded-2xl backdrop-blur-xl border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 bg-amber-500/[0.06] border-amber-500/20 shadow-[0_0_24px_rgba(234,179,8,0.08)] hover:shadow-[0_0_32px_rgba(234,179,8,0.12)] hover:border-amber-500/30 group'
              : `relative p-4 rounded-2xl backdrop-blur-xl border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group ${catStyle ? `${catStyle.bg} ${catStyle.border}` : 'bg-card/60 border-white/[0.08]'} hover:border-white/[0.15]`;

            return (
              <div key={item.id} className={cardClasses} onClick={() => setSelected(item)}>
                {d.idea_number && (
                  <span className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground/60">#{String(d.idea_number)}</span>
                )}
                {isBanger && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">✨ BANGER</span>
                )}
                {hasFeedback && !isBanger && (
                  <span className="absolute top-3 right-3"><MessageCircle className="h-3.5 w-3.5 text-cyan-400/60" /></span>
                )}
                <div className="mt-5">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {cat && catStyle && (
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border ${catStyle.border} ${catStyle.text} bg-transparent`}>{cat}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">{source.emoji} {source.label}</span>
                  </div>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isBanger ? (
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={e => { e.stopPropagation(); moveToStage(item.id, 'shortlist'); }}>
                        <ArrowRight className="h-3 w-3" /> Move to Shortlist
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 border-white/10 hover:border-amber-500/30 hover:text-amber-400"
                        onClick={e => { e.stopPropagation(); toggleBanger(item); }}>
                        <Sparkles className="h-3 w-3" /> Confirm Banger
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Panel — matches original BangerDetailPanel */}
      <Sheet open={!!liveSelected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[60vw] bg-background/95 backdrop-blur-xl border-white/[0.08] overflow-y-auto p-0">
          {liveSelected && selData && (
            <>
              {/* Header */}
              <div className="p-6 border-b border-white/[0.06]">
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-1">
                    {selData.idea_number && (
                      <span className="text-xs font-mono text-muted-foreground">#{String(selData.idea_number)}</span>
                    )}
                    <Badge className={`text-[10px] border-0 ${STATUS_COLORS[currentStatus] || 'bg-muted text-muted-foreground'}`}>
                      {COLUMN_LABELS[currentStatus] || currentStatus}
                    </Badge>
                    {Boolean(selData.is_banger) && (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px]">✨ Banger</Badge>
                    )}
                  </div>
                  <SheetTitle className="text-lg leading-tight">{liveSelected.title}</SheetTitle>
                </SheetHeader>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {selData.category && (
                    <Badge variant="outline" className="text-xs">{String(selData.category)}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {(SOURCE_BADGES[String(selData.source_type || 'manual')] || SOURCE_BADGES.manual).emoji}{' '}
                    {(SOURCE_BADGES[String(selData.source_type || 'manual')] || SOURCE_BADGES.manual).label}
                  </span>
                </div>

                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button size="sm" onClick={() => toggleBanger(liveSelected)}
                    className={Boolean(selData.is_banger)
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-400'
                    }>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    {Boolean(selData.is_banger) ? 'Unconfirm' : 'Confirm as Banger'}
                  </Button>
                </div>

                {/* Move to stage controls */}
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Move to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE_STAGES.filter(s => s !== currentStatus).map(s => (
                      <Button key={s} size="sm" variant="ghost"
                        onClick={() => moveToStage(liveSelected.id, s)}
                        className={`h-7 text-xs ${s === 'banger_lab' ? 'text-purple-400' : ''}`}>
                        {s === 'banger_lab' && <FlaskConical className="h-3 w-3 mr-1" />}
                        {COLUMN_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable Details */}
              <div className="p-6 space-y-4 border-b border-white/[0.06]">
                {EVOLVABLE_FIELDS.map(({ key, label }) => (
                  <EditableField
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={key === 'title' ? liveSelected.title : (selData[key] as string | null) ?? null}
                    itemId={liveSelected.id}
                    itemData={selData}
                    appId={appId}
                  />
                ))}
              </div>

              {/* Feedback Thread — with divider */}
              <div className="relative border-t border-white/[0.06]">
                <div className="absolute -top-2.5 left-6">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background px-2">
                    💬 Feedback Thread
                  </span>
                </div>
              </div>

              <div className="p-6 pt-5">
                {/* Chat messages */}
                <div className="space-y-3 max-h-[40vh] overflow-y-auto scrollbar-custom mb-4">
                  {feedbackHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No feedback yet. Start a conversation about this idea.
                    </p>
                  )}
                  {feedbackHistory.map((entry, i) => (
                    <div key={i} className={`flex ${entry.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-xl text-sm ${
                        entry.from === 'user'
                          ? 'max-w-[80%] px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] text-foreground'
                          : 'max-w-[85%] px-5 py-3.5 bg-cyan-500/[0.06] border border-cyan-500/[0.1] text-foreground space-y-2'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {entry.from === 'user' ? 'You' : '🔍 Agent'}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(new Date(entry.timestamp), 'h:mm a')}
                          </span>
                        </div>
                        {entry.from === 'user' ? (
                          <p className="leading-relaxed">{entry.message}</p>
                        ) : (
                          <MarkdownMessage text={entry.message} />
                        )}
                      </div>
                    </div>
                  ))}
                  {isAwaitingResponse && (
                    <div className="flex justify-start">
                      <div className="bg-cyan-500/[0.06] border border-cyan-500/[0.1] rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                          <span>Agent is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick action pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {QUICK_ACTIONS.map(qa => (
                    <button key={qa.label} onClick={() => setFeedbackText(qa.text)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-all">
                      {qa.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea placeholder="Write your feedback here..." value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    className="min-h-[60px] resize-none bg-white/[0.03] border-white/[0.08] focus:border-white/[0.15]"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFeedback(); } }} />
                  <Button size="icon" onClick={sendFeedback} disabled={!feedbackText.trim() || updateItem.isPending}
                    className="shrink-0 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Evolution Timeline */}
              <div className="px-6 pb-6 border-t border-white/[0.06] pt-4">
                <EvolutionTimeline history={evolutionHistory} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
