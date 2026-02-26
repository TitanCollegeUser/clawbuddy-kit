import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Users, Video, Flame, FileText, Clock, Pin, Check, Lightbulb, Target, AlertTriangle, TrendingUp, Trophy, Search, Sparkles, RefreshCw, Eye, BarChart3, Activity, ExternalLink, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { OutlierVideoDetailPanel } from './OutlierVideoDetailPanel';

interface Props { block: OpsBlock; appId: string; }

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatDuration = (iso: string): string => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return iso;
  const h = m[1] ? `${m[1]}:` : '';
  const min = (m[2] || '0').padStart(h ? 2 : 1, '0');
  const sec = (m[3] || '0').padStart(2, '0');
  return `${h}${min}:${sec}`;
};

const METRIC_ICONS: Record<string, typeof Users> = { competitors: Users, videos: Video, outliers: Flame, bangers: FileText };
const METRIC_COLORS: Record<string, string> = { competitors: 'hsl(200 80% 60%)', videos: 'hsl(var(--primary))', outliers: 'hsl(30 90% 55%)', bangers: 'hsl(45 90% 55%)' };

const INSIGHT_TYPE_CONFIG: Record<string, { icon: typeof Lightbulb; color: string; hue: string }> = {
  observation: { icon: Lightbulb, color: 'text-blue-400', hue: 'border-blue-500/10 bg-blue-500/[0.03]' },
  recommendation: { icon: Target, color: 'text-emerald-400', hue: 'border-emerald-500/10 bg-emerald-500/[0.03]' },
  alert: { icon: AlertTriangle, color: 'text-red-400', hue: 'border-red-500/10 bg-red-500/[0.03]' },
  trend: { icon: TrendingUp, color: 'text-purple-400', hue: 'border-purple-500/10 bg-purple-500/[0.03]' },
  opportunity: { icon: Trophy, color: 'text-amber-400', hue: 'border-amber-500/10 bg-amber-500/[0.03]' },
};

const QUICK_ACTIONS = [
  { id: 'search', label: 'Search Videos', icon: Search },
  { id: 'generate_ideas', label: 'Generate Ideas', icon: Sparkles },
  { id: 'research_competitor', label: 'Research Competitor', icon: Users },
  { id: 'new_script', label: 'New Script', icon: FileText },
  { id: 'sync', label: 'Sync Data', icon: RefreshCw },
];

interface VirtualMetric {
  id: string;
  title: string;
  metricKey: string;
  value: number;
  subtitle?: string;
}

const extractSummaryMetrics = (item: OpsDataItem): VirtualMetric[] => {
  const d = item.data as Record<string, unknown>;
  const results: VirtualMetric[] = [];
  const map: [string, string, string][] = [
    ['total_competitors_tracked', 'competitors', 'Competitors Tracked'],
    ['outlier_count', 'outliers', 'Outlier Videos'],
    ['total_ideas_in_banger_lab', 'bangers', 'Banger Lab Ideas'],
    ['ideas_ready_to_film', 'videos', 'Ready to Film'],
  ];
  for (const [key, metricKey, title] of map) {
    if (d[key] !== undefined) {
      results.push({ id: `${item.id}-${metricKey}`, title, metricKey, value: Number(d[key]) });
    }
  }
  return results;
};

const getThumbnailUrl = (d: Record<string, unknown>): string | null => {
  if (d.thumbnail_url) return String(d.thumbnail_url);
  if (d.video_id) return `https://img.youtube.com/vi/${d.video_id}/mqdefault.jpg`;
  return null;
};

export const OpsYtDashboardBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const showDigest = config.show_digest !== false;
  const showInsights = config.show_insights !== false;
  const showQuickActions = config.show_quick_actions !== false;

  const [selectedVideo, setSelectedVideo] = useState<OpsDataItem | null>(null);

  const { data: allBlockData, isLoading: metricsLoading } = useOpsData({ appId, blockId: block.id });

  const categorized = (() => {
    const items = allBlockData ?? [];
    const metrics: OpsDataItem[] = [];
    const summaryMetrics: VirtualMetric[] = [];
    let channelSummary: OpsDataItem | null = null;
    const digests: OpsDataItem[] = [];
    const insights: OpsDataItem[] = [];
    const outlierVideos: OpsDataItem[] = [];
    const uncategorized: OpsDataItem[] = [];

    for (const item of items) {
      const d = item.data as Record<string, unknown>;
      if (d.type === 'channel_summary') { channelSummary = item; summaryMetrics.push(...extractSummaryMetrics(item)); continue; }
      if (d.metric_key || d.value !== undefined) { metrics.push(item); continue; }
      if (d.summary_html || d.digest_date || item.item_type?.includes('digest')) { digests.push(item); continue; }
      if (d.insight_type || d.is_pinned !== undefined || item.item_type?.includes('insight')) { insights.push(item); continue; }
      if (d.type === 'outlier_video' || d.youtube_url) { outlierVideos.push(item); continue; }
      uncategorized.push(item);
    }

    return { metrics, summaryMetrics, channelSummary, digests, insights, outlierVideos, uncategorized };
  })();

  const queryClient = useQueryClient();

  const toggleField = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const item = categorized.insights?.find(i => i.id === id);
      if (!item) return;
      const newData = { ...(item.data as Record<string, unknown>), [field]: value };
      const { error } = await supabase.from('ops_data').update({ data: newData as unknown as Record<string, never> }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops-data', appId] }),
  });

  const latestDigest = categorized.digests?.[0];

  const allMetricCards = [
    ...categorized.metrics.map(m => {
      const d = m.data as Record<string, unknown>;
      const metricKey = String(d.metric_key || '');
      return { id: m.id, title: m.title, metricKey, value: String(d.value ?? m.description ?? 0), subtitle: d.subtitle as string | undefined, trend: d.trend as { value: string; positive: boolean } | undefined };
    }),
    ...categorized.summaryMetrics.map(vm => ({
      id: vm.id, title: vm.title, metricKey: vm.metricKey, value: formatCount(vm.value), subtitle: undefined as string | undefined, trend: undefined as { value: string; positive: boolean } | undefined,
    })),
  ];

  if (metricsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channel Summary Banner */}
      {categorized.channelSummary && (() => {
        const sd = categorized.channelSummary.data as Record<string, unknown>;
        const channelName = sd.channel_name as string | undefined;
        const niche = sd.niche as string | undefined;
        const topOutlier = sd.top_outlier_score as number | undefined;
        const seriesConcepts = sd.series_concepts as number | undefined;
        const ideasApproved = sd.ideas_approved as number | undefined;
        const lastUpdated = sd.last_updated as string | undefined;
        return (
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="min-w-0">
              {channelName && <h2 className="text-lg font-bold font-orbitron text-foreground truncate">{channelName}</h2>}
              {niche && <p className="text-xs text-muted-foreground">{niche}</p>}
            </div>
            <div className="flex items-center gap-3 flex-wrap ml-auto">
              {topOutlier != null && (
                <Badge variant="secondary" className="bg-orange-500/15 text-orange-400 border-orange-500/20 text-xs">
                  <Flame className="h-3 w-3 mr-1" /> Top Outlier {topOutlier}x
                </Badge>
              )}
              {seriesConcepts != null && (
                <Badge variant="secondary" className="bg-purple-500/15 text-purple-400 border-purple-500/20 text-xs">
                  {seriesConcepts} Series
                </Badge>
              )}
              {ideasApproved != null && (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
                  <Check className="h-3 w-3 mr-1" /> {ideasApproved} Approved
                </Badge>
              )}
              {lastUpdated && (
                <span className="text-[10px] text-muted-foreground">
                  Synced {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Metric Cards */}
      {allMetricCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allMetricCards.map((m, idx) => {
            const Icon = METRIC_ICONS[m.metricKey] || FileText;
            const accentColor = METRIC_COLORS[m.metricKey] || 'hsl(var(--primary))';
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx * 0.1 }}>
                <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] hover:-translate-y-0.5 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.title}</p>
                      <p className="text-3xl font-bold mt-1 font-mono" style={{ color: accentColor }}>{m.value}</p>
                      {m.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{m.subtitle}</p>}
                      {m.trend && (
                        <p className={`text-xs mt-1 ${m.trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {m.trend.positive ? '↑' : '↓'} {m.trend.value}
                        </p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.06]" style={{ color: accentColor }}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Digest Card */}
      {showDigest && (
        latestDigest ? (
          <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">{latestDigest.title}</h3>
              </div>
              {!(latestDigest.data as Record<string, unknown>)?.is_read && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">New</Badge>
              )}
            </div>
            {latestDigest.description && (
              <div
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(latestDigest.description, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'span'], ALLOWED_ATTR: ['class', 'href', 'target'] }) }}
              />
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium text-foreground">Digest pending</p>
                <p className="text-sm">Agent will generate the daily digest when ready.</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Outlier Videos — Enhanced */}
      {categorized.outlierVideos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-foreground">Top Outlier Videos</h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{categorized.outlierVideos.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-custom">
            {categorized.outlierVideos.map((v, idx) => {
              const d = v.data as Record<string, unknown>;
              const viewCount = Number(d.view_count || 0);
              const outlierScore = Number(d.outlier_score || 0);
              const channelTitle = String(d.channel_title || d.channel_name || '');
              const thumbnailUrl = getThumbnailUrl(d);
              const duration = d.duration as string | undefined;
              const publishedAt = d.published_at as string | undefined;
              const searchQuery = d.search_query as string | undefined;
              const videoId = d.video_id as string | undefined;
              const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

              return (
                <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }}>
                  <div
                    className="flex gap-3 p-3 rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
                    onClick={() => setSelectedVideo(v)}
                  >
                    {/* Thumbnail with play overlay */}
                    <div className="relative flex-shrink-0">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="w-28 h-16 rounded-lg object-cover bg-white/[0.05]" />
                      ) : (
                        <div className="w-28 h-16 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                          <Video className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                      {duration && (
                        <span className="absolute bottom-0.5 right-0.5 text-[9px] px-1 py-px rounded bg-black/70 text-white font-mono">
                          {formatDuration(duration)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{v.title}</p>
                      {channelTitle && <p className="text-xs text-muted-foreground mt-0.5">{channelTitle}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {viewCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {formatCount(viewCount)}
                          </span>
                        )}
                        {outlierScore > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-400 border-orange-500/20">
                            <BarChart3 className="h-2.5 w-2.5 mr-0.5" /> {outlierScore.toFixed(1)}x
                          </Badge>
                        )}
                        {publishedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {searchQuery && (
                        <div className="flex items-center gap-1 mt-1">
                          <Search className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground truncate">{searchQuery}</span>
                        </div>
                      )}
                    </div>

                    {/* External link */}
                    {youtubeUrl && (
                      <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 self-start mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showInsights && (
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Insights</h3>
            {categorized.insights?.length ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-custom">
                {categorized.insights.slice(0, 10).map(item => {
                  const d = item.data as Record<string, unknown>;
                  const insightType = String(d.insight_type || 'observation');
                  const cfg = INSIGHT_TYPE_CONFIG[insightType] || INSIGHT_TYPE_CONFIG.observation;
                  const InsightIcon = cfg.icon;
                  const isPinned = Boolean(d.is_pinned);
                  const isRead = Boolean(d.is_read);
                  return (
                    <div key={item.id} className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${cfg.hue} ${!isRead ? 'border-l-2 border-l-primary/60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${cfg.color}`}><InsightIcon className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${cfg.color}`}>{insightType}</span>
                            {isPinned && <Pin className="h-3 w-3 text-amber-400 fill-amber-400" />}
                            {!isRead && <span className="text-[9px] px-1.5 py-0 rounded-full bg-primary/20 text-primary font-medium">NEW</span>}
                          </div>
                          <h4 className="text-sm font-semibold text-foreground mt-0.5">{item.title}</h4>
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
            ) : (
              <p className="text-sm text-muted-foreground">No insights yet. Agent will push intelligence as it arrives.</p>
            )}
          </div>
        )}

        {showQuickActions && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {QUICK_ACTIONS.map(a => {
                const Icon = a.icon;
                return (
                  <Button key={a.id} variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    onClick={() => toast.info(`${a.label} — trigger via agent`)}>
                    <Icon className="h-4 w-4" /> {a.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Uncategorized / Recent Activity */}
      {categorized.uncategorized.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {categorized.uncategorized.slice(0, 8).map(item => (
              <div key={item.id} className="p-3 rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <OutlierVideoDetailPanel
        video={selectedVideo}
        open={!!selectedVideo}
        onOpenChange={open => { if (!open) setSelectedVideo(null); }}
        appId={appId}
      />
    </div>
  );
};
