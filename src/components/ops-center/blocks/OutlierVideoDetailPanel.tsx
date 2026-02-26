import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink, Eye, ThumbsUp, MessageSquare, Clock, Search, BarChart3, Loader2, FileText, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';

interface Props {
  video: OpsDataItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
}

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

export const OutlierVideoDetailPanel = ({ video, open, onOpenChange, appId }: Props) => {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  if (!video) return null;

  const d = video.data as Record<string, unknown>;
  const videoId = d.video_id as string | undefined;
  const thumbnailUrl = (d.thumbnail_url as string) || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
  const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : (d.youtube_url as string | undefined);
  const viewCount = Number(d.view_count || 0);
  const likeCount = Number(d.like_count || 0);
  const commentCount = Number(d.comment_count || 0);
  const outlierScore = Number(d.outlier_score || 0);
  const duration = d.duration as string | undefined;
  const publishedAt = d.published_at as string | undefined;
  const searchQuery = d.search_query as string | undefined;
  const channelTitle = String(d.channel_title || d.channel_name || '');
  const aiInsights = d.ai_insights as string | undefined;
  const youtubeSummary = d.youtube_summary as string | undefined;
  const whyOutlier = d.why_outlier as string | undefined;

  const handleGenerateInsights = async () => {
    setGenerating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { toast.error('Not authenticated'); return; }

      const { error } = await supabase.from('pending_tasks').insert({
        user_id: userData.user.id,
        task_type: 'video_analysis',
        action: 'generate_outlier_insights',
        payload: {
          ops_data_id: video.id,
          video_id: videoId,
          title: video.title,
          view_count: viewCount,
          outlier_score: outlierScore,
          channel_title: channelTitle,
          duration,
          search_query: searchQuery,
          app_id: appId,
        } as unknown as Record<string, never>,
      });

      if (error) throw error;
      toast.success('Insight generation queued — your AI will analyze this video shortly.');
      queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
    } catch (e: unknown) {
      toast.error(`Failed to queue: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl backdrop-blur-2xl bg-background/95 border-white/[0.08] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-foreground pr-6 leading-tight">{video.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Thumbnail / Embed */}
          {thumbnailUrl && (
            <a href={youtubeUrl || '#'} target="_blank" rel="noopener noreferrer" className="block relative group rounded-xl overflow-hidden">
              <img src={thumbnailUrl} alt={video.title} className="w-full aspect-video object-cover rounded-xl" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
              {duration && (
                <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] border-0">
                  {formatDuration(duration)}
                </Badge>
              )}
            </a>
          )}

          {/* Channel + Link */}
          <div className="flex items-center justify-between">
            <div>
              {channelTitle && <p className="text-sm text-muted-foreground">{channelTitle}</p>}
              {publishedAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
                </p>
              )}
            </div>
            {youtubeUrl && (
              <Button variant="outline" size="sm" asChild className="gap-1.5 border-white/[0.1] text-xs">
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Watch on YouTube
                </a>
              </Button>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {viewCount > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-bold text-foreground">{formatCount(viewCount)}</p>
                <p className="text-[10px] text-muted-foreground">Views</p>
              </div>
            )}
            {likeCount > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <ThumbsUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-bold text-foreground">{formatCount(likeCount)}</p>
                <p className="text-[10px] text-muted-foreground">Likes</p>
              </div>
            )}
            {commentCount > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <MessageSquare className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-bold text-foreground">{formatCount(commentCount)}</p>
                <p className="text-[10px] text-muted-foreground">Comments</p>
              </div>
            )}
            {outlierScore > 0 && (
              <div className="p-3 rounded-xl bg-orange-500/[0.06] border border-orange-500/[0.15] text-center">
                <BarChart3 className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                <p className="text-sm font-bold text-orange-400">{outlierScore.toFixed(1)}x</p>
                <p className="text-[10px] text-muted-foreground">Outlier</p>
              </div>
            )}
          </div>

          {/* Search Query Tag */}
          {searchQuery && (
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Discovered via:</span>
              <Badge variant="secondary" className="text-xs bg-white/[0.05] border-white/[0.08]">{searchQuery}</Badge>
            </div>
          )}

          {/* Video Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Video Summary
            </h3>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              {youtubeSummary ? (
                <p className="text-sm text-muted-foreground italic leading-relaxed">{youtubeSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">Generating...</p>
              )}
            </div>
          </div>

          {/* Why This Is An Outlier */}
          {whyOutlier && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" /> Why This Is An Outlier
              </h3>
              <div className="p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/[0.15]">
                <p className="text-sm text-foreground leading-relaxed">{whyOutlier}</p>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Insights
              </h3>
              {!aiInsights && (
                <Button
                  size="sm"
                  onClick={handleGenerateInsights}
                  disabled={generating}
                  className="gap-1.5 text-xs"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {generating ? 'Queuing…' : 'Generate Insights'}
                </Button>
              )}
            </div>

            {aiInsights ? (
              <div
                className="p-4 rounded-xl bg-primary/[0.04] border border-primary/[0.12] text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(aiInsights, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4', 'span'], ALLOWED_ATTR: ['class'] }) }}
              />
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-muted-foreground">
                <p>No insights generated yet. Click <strong>"Generate Insights"</strong> to have your AI analyze why this video became an outlier, key takeaways, and actionable recommendations.</p>
              </div>
            )}
          </div>

          {/* Duration */}
          {duration && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Duration: {formatDuration(duration)}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
