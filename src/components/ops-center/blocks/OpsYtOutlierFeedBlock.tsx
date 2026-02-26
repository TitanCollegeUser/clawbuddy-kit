import { useState, useMemo } from 'react';
import { useOpsData, type OpsDataItem } from '@/hooks/useOpsData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OutlierVideoDetailPanel } from './OutlierVideoDetailPanel';
import { Flame, Eye, ThumbsUp, MessageSquare, BarChart3, Clock, Search, ArrowUpDown, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import type { OpsBlock } from '@/hooks/useOpsBlocks';

interface Props { block: OpsBlock; appId: string; }

const fmtCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const sentimentColor = (s: string) => {
  const l = s?.toLowerCase();
  if (l === 'positive') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (l === 'negative') return 'bg-red-500/20 text-red-400 border-red-500/30';
  return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
};

const DATE_RANGES = [
  { label: 'All time', value: 'all' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

const SCORE_OPTIONS = [
  { label: 'Any', value: '0' },
  { label: '≥ 1x', value: '1' },
  { label: '≥ 1.5x', value: '1.5' },
  { label: '≥ 2x', value: '2' },
  { label: '≥ 3x', value: '3' },
  { label: '≥ 5x', value: '5' },
];

const SORT_OPTIONS = [
  { label: 'Outlier Score', value: 'outlier_score' },
  { label: 'Views', value: 'view_count' },
  { label: 'Recent', value: 'published_at' },
  { label: 'Most Comments', value: 'comment_count' },
];

export const OpsYtOutlierFeedBlock = ({ block, appId }: Props) => {
  const { data: allItems = [] } = useOpsData({ appId, blockId: block.id });
  const queryClient = useQueryClient();

  const [selectedVideo, setSelectedVideo] = useState<OpsDataItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [minScore, setMinScore] = useState('0');
  const [sortBy, setSortBy] = useState('outlier_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [insightFilter, setInsightFilter] = useState<'all' | 'with' | 'without'>('all');
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const videos = useMemo(() => {
    let items = allItems.filter(i => {
      const d = i.data as Record<string, unknown>;
      return d?.type === 'outlier_video' || i.item_type === 'yt_outlier_feed';
    });

    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => {
        const d = i.data as Record<string, unknown>;
        return i.title.toLowerCase().includes(q) || String(d.channel_title || '').toLowerCase().includes(q);
      });
    }

    // Date range
    if (dateRange !== 'all') {
      const cutoff = subDays(new Date(), Number(dateRange));
      items = items.filter(i => {
        const d = i.data as Record<string, unknown>;
        const pub = d.published_at as string | undefined;
        return pub && isAfter(new Date(pub), cutoff);
      });
    }

    // Min score
    const ms = Number(minScore);
    if (ms > 0) {
      items = items.filter(i => Number((i.data as Record<string, unknown>).outlier_score || 0) >= ms);
    }

    // Insight filter
    if (insightFilter === 'with') {
      items = items.filter(i => !!(i.data as Record<string, unknown>).ai_insights);
    } else if (insightFilter === 'without') {
      items = items.filter(i => !(i.data as Record<string, unknown>).ai_insights);
    }

    // Sort
    items.sort((a, b) => {
      const da = a.data as Record<string, unknown>;
      const db = b.data as Record<string, unknown>;
      let va: number | string = 0, vb: number | string = 0;
      if (sortBy === 'published_at') {
        va = String(da.published_at || '');
        vb = String(db.published_at || '');
      } else {
        va = Number(da[sortBy] || 0);
        vb = Number(db[sortBy] || 0);
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    return items;
  }, [allItems, search, dateRange, minScore, sortBy, sortAsc, insightFilter]);

  const handleGenerateInsights = async (video: OpsDataItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingIds(prev => new Set(prev).add(video.id));
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { toast.error('Not authenticated'); return; }
      const d = video.data as Record<string, unknown>;
      const { error } = await supabase.from('pending_tasks').insert({
        user_id: userData.user.id,
        task_type: 'video_analysis',
        action: 'generate_outlier_insights',
        payload: {
          ops_data_id: video.id, video_id: d.video_id, title: video.title,
          view_count: d.view_count, outlier_score: d.outlier_score,
          channel_title: d.channel_title, app_id: appId,
        } as unknown as Record<string, never>,
      });
      if (error) throw error;
      toast.success('Insight generation queued');
      queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
    } catch (err: unknown) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(video.id); return n; });
    }
  };

  const toggleSummary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSummaries(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  if (videos.length === 0 && !search && dateRange === 'all' && minScore === '0') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Flame className="h-12 w-12 text-orange-400 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No outlier videos found</h3>
        <p className="text-sm text-muted-foreground max-w-md">Your AI agent needs to sync outlier video data. Once seeded, videos will appear here with filtering and AI insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        {/* Insight filter toggle */}
        <div className="flex items-center rounded-lg border border-white/[0.08] overflow-hidden">
          {(['all', 'with', 'without'] as const).map(val => (
            <button
              key={val}
              onClick={() => setInsightFilter(val)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                insightFilter === val
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              {val === 'all' ? 'All' : val === 'with' ? 'With Insights' : 'Without Insights'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search title or channel..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-white/[0.03] border-white/[0.08] text-sm" />
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px] h-9 bg-white/[0.03] border-white/[0.08] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={minScore} onValueChange={setMinScore}>
          <SelectTrigger className="w-[110px] h-9 bg-white/[0.03] border-white/[0.08] text-sm"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>{SCORE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] h-9 bg-white/[0.03] border-white/[0.08] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setSortAsc(!sortAsc)} className="h-9 px-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-xs ml-1">{sortAsc ? 'ASC' : 'DESC'}</span>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{videos.length} video{videos.length !== 1 ? 's' : ''} found</p>

      {/* Video cards */}
      <div className="space-y-4">
        {videos.map(video => {
          const d = video.data as Record<string, unknown>;
          const videoId = d.video_id as string | undefined;
          const thumb = (d.thumbnail_url as string) || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
          const views = Number(d.view_count || 0);
          const vph = Number(d.views_per_hour || 0);
          const likes = Number(d.like_count || 0);
          const comments = Number(d.comment_count || 0);
          const score = Number(d.outlier_score || 0);
          const publishedAt = d.published_at as string | undefined;
          const channel = String(d.channel_title || d.channel_name || '');
          const sentiment = d.comment_sentiment as string | undefined;
          const summary = d.youtube_summary as string | undefined;
          const whyOutlier = d.why_outlier as string | undefined;
          const aiInsights = d.ai_insights as string | undefined;
          const isExpanded = expandedSummaries.has(video.id);
          const isGenerating = generatingIds.has(video.id);

          return (
            <div
              key={video.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer overflow-hidden"
              onClick={() => { setSelectedVideo(video); setDetailOpen(true); }}
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                {thumb && (
                  <div className="flex-shrink-0 w-48 h-28 rounded-lg overflow-hidden bg-black/20">
                    <img src={thumb} alt={video.title} className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{video.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {channel && <span>{channel}</span>}
                    {publishedAt && (
                      <span title={new Date(publishedAt).toLocaleDateString()}>
                        • {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {views > 0 && <span className="flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" />{fmtCount(views)}</span>}
                    {vph > 0 && <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{fmtCount(vph)}/hr</span>}
                    {likes > 0 && <span className="flex items-center gap-1 text-muted-foreground"><ThumbsUp className="h-3 w-3" />{fmtCount(likes)}</span>}
                    {comments > 0 && <span className="flex items-center gap-1 text-muted-foreground"><MessageSquare className="h-3 w-3" />{fmtCount(comments)}</span>}
                    {score > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                        <BarChart3 className="h-3 w-3 mr-1" />{score.toFixed(1)}x
                      </Badge>
                    )}
                    {sentiment && (
                      <Badge className={`text-[10px] ${sentimentColor(sentiment)}`}>{sentiment}</Badge>
                    )}
                  </div>

                  {/* More/Less toggle */}
                  {(summary || whyOutlier || aiInsights || !aiInsights) && (
                    <button onClick={e => toggleSummary(video.id, e)} className="text-primary text-[10px] flex items-center gap-0.5 hover:underline">
                      {isExpanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
                    </button>
                  )}

                  {/* Collapsible content */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      {/* YouTube Summary */}
                      <div className="text-xs text-muted-foreground italic p-2 rounded-lg bg-white/[0.03]">
                        {summary || <span className="text-muted-foreground/60">Generating...</span>}
                      </div>

                      {/* Why Outlier callout */}
                      {whyOutlier && (
                        <div className="p-2 rounded-lg bg-orange-500/[0.06] border border-orange-500/[0.12] text-xs text-orange-300/90">
                          <span className="font-medium text-orange-400">Why Outlier:</span> {whyOutlier}
                        </div>
                      )}

                      {/* AI Insights */}
                      {aiInsights ? (
                        <div
                          className="p-2 rounded-lg bg-primary/[0.04] border border-primary/[0.12] text-xs text-foreground"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiInsights, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'], ALLOWED_ATTR: [] }) }}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-white/[0.08]" onClick={e => handleGenerateInsights(video, e)} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          {isGenerating ? 'Queuing…' : 'Generate Insights'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <Flame className="h-8 w-8 text-orange-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No videos match your filters</p>
        </div>
      )}

      <OutlierVideoDetailPanel video={selectedVideo} open={detailOpen} onOpenChange={setDetailOpen} appId={appId} />
    </div>
  );
};
