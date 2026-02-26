import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import {
  Eye, Clock, UserPlus, Timer, Heart,
  Globe, Search, BarChart3, Video, ChevronDown, ChevronUp,
  Sparkles, TrendingUp, TrendingDown, ExternalLink, LayoutGrid, List,
  BarChart, Target, Upload, Zap, ArrowUpRight, ArrowDownRight,
  MapPin, Monitor, Smartphone, Tablet, Tv,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart as RechartsBarChart,
  Bar, LineChart, Line,
} from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';
import DOMPurify from 'dompurify';

// ─── Constants ──────────────────────────────────────────────────────
const SOURCE_NAMES: Record<string, string> = {
  YT_SEARCH: 'YouTube Search',
  RELATED_VIDEO: 'Suggested Videos',
  BROWSE: 'Browse Features',
  EXT_URL: 'External',
  SUBSCRIBER: 'Subscribers',
  NOTIFICATION: 'Notifications',
  PLAYLIST: 'Playlists',
  END_SCREEN: 'End Screens',
  NO_LINK_EMBEDDED: 'Embedded',
  SHORTS: 'Shorts Feed',
};

const ACCENT_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6',
  '#fb923c', '#67e8f9', '#f87171', '#818cf8', '#4ade80',
];

const GLASS = 'bg-[rgba(17,24,39,0.7)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.06)] rounded-2xl hover:border-[rgba(255,255,255,0.12)] transition-all duration-300';

const COUNTRY_FLAGS: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', IN: '\u{1F1EE}\u{1F1F3}', GB: '\u{1F1EC}\u{1F1E7}',
  CA: '\u{1F1E8}\u{1F1E6}', AU: '\u{1F1E6}\u{1F1FA}', DE: '\u{1F1E9}\u{1F1EA}',
  FR: '\u{1F1EB}\u{1F1F7}', BR: '\u{1F1E7}\u{1F1F7}', MX: '\u{1F1F2}\u{1F1FD}',
  JP: '\u{1F1EF}\u{1F1F5}', KR: '\u{1F1F0}\u{1F1F7}', PH: '\u{1F1F5}\u{1F1ED}',
  ID: '\u{1F1EE}\u{1F1E9}', NG: '\u{1F1F3}\u{1F1EC}', PK: '\u{1F1F5}\u{1F1F0}',
  ZA: '\u{1F1FF}\u{1F1E6}', ES: '\u{1F1EA}\u{1F1F8}', IT: '\u{1F1EE}\u{1F1F9}',
  NL: '\u{1F1F3}\u{1F1F1}', SE: '\u{1F1F8}\u{1F1EA}', RU: '\u{1F1F7}\u{1F1FA}',
  TR: '\u{1F1F9}\u{1F1F7}', SA: '\u{1F1F8}\u{1F1E6}', AE: '\u{1F1E6}\u{1F1EA}',
  EG: '\u{1F1EA}\u{1F1EC}', KE: '\u{1F1F0}\u{1F1EA}', TH: '\u{1F1F9}\u{1F1ED}',
  VN: '\u{1F1FB}\u{1F1F3}', PL: '\u{1F1F5}\u{1F1F1}', AR: '\u{1F1E6}\u{1F1F7}',
  CO: '\u{1F1E8}\u{1F1F4}', CL: '\u{1F1E8}\u{1F1F1}', MY: '\u{1F1F2}\u{1F1FE}',
  SG: '\u{1F1F8}\u{1F1EC}', NZ: '\u{1F1F3}\u{1F1FF}', IE: '\u{1F1EE}\u{1F1EA}',
};
const getFlag = (code: string) => COUNTRY_FLAGS[code] || code;

const DEVICE_NAMES: Record<string, string> = {
  MOBILE: 'Mobile', DESKTOP: 'Desktop', TABLET: 'Tablet',
  TV: 'TV', GAME_CONSOLE: 'Console',
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  MOBILE: <Smartphone className="w-3.5 h-3.5" />,
  DESKTOP: <Monitor className="w-3.5 h-3.5" />,
  TABLET: <Tablet className="w-3.5 h-3.5" />,
  TV: <Tv className="w-3.5 h-3.5" />,
};

const DEVICE_COLORS: Record<string, string> = {
  MOBILE: '#60a5fa', DESKTOP: '#34d399', TABLET: '#fbbf24',
  TV: '#a78bfa', GAME_CONSOLE: '#f472b6',
};

type PeriodKey = '7d' | '30d' | '90d' | '365d' | 'lifetime';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days',
  '365d': 'Last 365 days', 'lifetime': 'All Time',
};

const PERIOD_PILLS: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '365d', label: '365 Days' },
  { key: 'lifetime', label: 'Lifetime' },
];

const PERIOD_DAYS: Record<PeriodKey, number> = {
  '7d': 7, '30d': 30, '90d': 90, '365d': 365, 'lifetime': Infinity,
};

const NEXT_PERIOD: Record<PeriodKey, PeriodKey | null> = {
  '7d': '30d', '30d': '90d', '90d': '365d', '365d': 'lifetime', 'lifetime': null,
};

const fmt = (n: number | undefined | null): string => {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const fmtFull = (n: number | undefined | null): string =>
  n != null ? n.toLocaleString() : '0';

const fmtDuration = (secs: number | undefined | null): string => {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// ─── Sub-components ─────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delta?: number | null;
  index: number;
  periodLabel: string;
}

const KpiCard = ({ icon, label, value, color, delta, index, periodLabel }: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
    className={`${GLASS} p-5 hover:-translate-y-0.5`}
  >
    <div className="flex items-center gap-2 mb-3" style={{ color }}>
      {icon}
      <span className="text-[11px] uppercase tracking-wider text-[#6b7280]">{label}</span>
    </div>
    <p
      className="text-2xl font-bold"
      style={{ color, textShadow: `0 0 20px ${color}40` }}
    >
      {value}
    </p>
    {delta != null && (
      <div className={`flex items-center gap-1 mt-1 text-xs ${delta >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
        {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(delta).toFixed(1)}% vs prev period
      </div>
    )}
    <p className="text-[10px] text-[#6b7280] mt-1">{periodLabel}</p>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#9ca3af] mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#f9fafb]">{p.name}: {fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Delta Calculation ──────────────────────────────────────────────
const calcDelta = (periods: any, currentPeriod: PeriodKey, field: string): number | null => {
  if (!periods) return null;
  const nextPeriod = NEXT_PERIOD[currentPeriod];
  if (!nextPeriod || !periods[nextPeriod]) return null;
  const currentVal = periods[currentPeriod]?.[field] ?? 0;
  const nextVal = periods[nextPeriod]?.[field] ?? 0;
  if (nextVal === 0) return null;
  const currentDays = PERIOD_DAYS[currentPeriod];
  const nextDays = PERIOD_DAYS[nextPeriod];
  if (!isFinite(currentDays) || !isFinite(nextDays)) return null;
  const scaledNext = nextVal * (currentDays / nextDays);
  if (scaledNext === 0) return null;
  return ((currentVal - scaledNext) / scaledNext) * 100;
};

// ─── Main Component ─────────────────────────────────────────────────

interface Props {
  block: OpsBlock;
  appId: string;
}

export const OpsYtAnalyticsBlock = ({ block, appId }: Props) => {
  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id });

  // Split data
  const { overview, videos, contentBreakdown } = useMemo(() => {
    const ov = items.find(i => (i.data as any)?.type === 'channel_overview');
    const vids = items.filter(i => (i.data as any)?.type === 'video_analytics');
    const cb = items.find(i => (i.data as any)?.type === 'content_breakdown');
    return { overview: ov?.data as any, videos: vids, contentBreakdown: cb?.data as any };
  }, [items]);

  // State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('30d');
  const [chartLines, setChartLines] = useState({ views: true, watchTime: true, subs: false, likes: false });
  const [videoSearch, setVideoSearch] = useState('');
  const [videoSort, setVideoSort] = useState('views');
  const [contentFilter, setContentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [videoPage, setVideoPage] = useState(1);
  const PAGE_SIZE = 50;

  // Current period stats
  const periodStats = useMemo(() => overview?.periods?.[selectedPeriod] ?? null, [overview, selectedPeriod]);

  // Processed videos
  const sortedVideos = useMemo(() => {
    let list = videos.map(v => v.data as any);
    if (videoSearch) {
      const q = videoSearch.toLowerCase();
      list = list.filter((v: any) => v.title?.toLowerCase().includes(q));
    }
    if (contentFilter !== 'all') {
      list = list.filter((v: any) => v.content_type === contentFilter);
    }
    list.sort((a: any, b: any) => {
      switch (videoSort) {
        case 'views': return (b.views ?? 0) - (a.views ?? 0);
        case 'watch_time': return (b.estimated_minutes_watched ?? 0) - (a.estimated_minutes_watched ?? 0);
        case 'retention': return (b.avg_percentage_viewed ?? 0) - (a.avg_percentage_viewed ?? 0);
        case 'subs': return (b.subscribers_gained ?? 0) - (a.subscribers_gained ?? 0);
        case 'engagement': return (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0);
        case 'recent': return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
        default: return 0;
      }
    });
    return list;
  }, [videos, videoSearch, videoSort, contentFilter]);

  const paginatedVideos = useMemo(() => sortedVideos.slice(0, videoPage * PAGE_SIZE), [sortedVideos, videoPage]);

  // Chart data — filtered by selected period
  const dailyMetrics = useMemo(() => {
    if (!overview?.daily_metrics) return [];
    const all = overview.daily_metrics.map((d: any) => ({
      ...d,
      dayLabel: d.day ? format(parseISO(d.day), 'MMM d') : '',
    }));
    const days = PERIOD_DAYS[selectedPeriod];
    if (!isFinite(days)) return all;
    return all.slice(-days);
  }, [overview, selectedPeriod]);

  // Traffic sources
  const trafficSources = useMemo(() => {
    if (!overview?.traffic_sources) return [];
    return Object.entries(overview.traffic_sources)
      .map(([key, val]: [string, any]) => ({
        name: SOURCE_NAMES[key] || key,
        views: val.views ?? 0,
        percentage: val.percentage ?? 0,
      }))
      .sort((a, b) => b.views - a.views);
  }, [overview]);

  const totalTrafficViews = useMemo(() => trafficSources.reduce((s, t) => s + t.views, 0), [trafficSources]);

  // Geography
  const topGeographies = useMemo(() => {
    if (!overview?.top_geographies) return [];
    return (overview.top_geographies as any[]).slice(0, 10);
  }, [overview]);

  // Device types
  const deviceTypes = useMemo(() => {
    if (!overview?.device_types) return [];
    return (overview.device_types as any[]).sort((a: any, b: any) => (b.views ?? 0) - (a.views ?? 0));
  }, [overview]);

  // Content breakdown
  const breakdownData = useMemo(() => {
    if (!contentBreakdown?.breakdown) return [];
    return Object.entries(contentBreakdown.breakdown)
      .map(([type, val]: [string, any]) => ({
        type,
        count: val.count ?? 0,
        avg_views: val.avg_views ?? 0,
        avg_engagement: val.avg_engagement ?? val.avg_ctr ?? 0,
        avg_retention: val.avg_retention ?? 0,
        total_watch_time: val.total_watch_time ?? 0,
      }))
      .sort((a, b) => b.avg_views - a.avg_views);
  }, [contentBreakdown]);

  // ─── Empty / Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`${GLASS} p-12 flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center gap-3">
          <BarChart3 className="w-10 h-10 text-[#6b7280]" />
          <p className="text-[#6b7280] text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${GLASS} p-16 flex flex-col items-center justify-center gap-4`}>
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          <BarChart3 className="w-12 h-12 text-[#6b7280]" />
        </motion.div>
        <p className="text-[#9ca3af] text-sm text-center">No analytics data yet. Run the YouTube Analytics Pipeline to populate this dashboard.</p>
      </div>
    );
  }

  const maxGeoViews = topGeographies.length > 0 ? (topGeographies[0]?.views ?? 1) : 1;
  const maxDeviceViews = deviceTypes.length > 0 ? (deviceTypes[0]?.views ?? 1) : 1;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Section 1: Channel Header + Period Selector */}
      {overview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${GLASS} p-5`}>
          <div className="flex items-center gap-4 flex-wrap">
            {overview.thumbnail_url && (
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#34d399] ring-offset-2 ring-offset-[#0a0a0f] flex-shrink-0">
                <img src={overview.thumbnail_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#f9fafb] truncate">{overview.channel_name || block.title}</h2>
              <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
                <span>{fmtFull(overview.subscriber_count)} subscribers</span>
                {overview.total_views != null && (
                  <span>• {fmt(overview.total_views)} total views</span>
                )}
              </div>
            </div>
            {/* Period Selector */}
            <div className="flex items-center gap-1 flex-wrap">
              {PERIOD_PILLS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedPeriod === p.key
                      ? 'bg-[#60a5fa] text-white shadow-lg shadow-[#60a5fa]/20'
                      : 'bg-[rgba(255,255,255,0.08)] text-[#9ca3af] hover:bg-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
              Live Data
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 2: KPI Cards */}
      {overview && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          <KpiCard index={0} icon={<Eye className="w-4 h-4" />} label="Views" value={fmt(periodStats?.views)} color="#60a5fa" delta={calcDelta(overview.periods, selectedPeriod, 'views')} periodLabel={PERIOD_LABELS[selectedPeriod]} />
          <KpiCard index={1} icon={<Clock className="w-4 h-4" />} label="Watch Time" value={`${fmt(periodStats?.watch_time_hours)}h`} color="#34d399" delta={calcDelta(overview.periods, selectedPeriod, 'watch_time_hours')} periodLabel={PERIOD_LABELS[selectedPeriod]} />
          <KpiCard index={2} icon={<Heart className="w-4 h-4" />} label="Engagement Rate" value={`${(periodStats?.engagement_rate ?? 0).toFixed(1)}%`} color="#fbbf24" delta={calcDelta(overview.periods, selectedPeriod, 'engagement_rate')} periodLabel={PERIOD_LABELS[selectedPeriod]} />
          <KpiCard index={3} icon={<UserPlus className="w-4 h-4" />} label="Net Subscribers" value={`+${fmtFull(periodStats?.net_subs)}`} color="#a78bfa" delta={calcDelta(overview.periods, selectedPeriod, 'net_subs')} periodLabel={PERIOD_LABELS[selectedPeriod]} />
          <KpiCard index={4} icon={<Timer className="w-4 h-4" />} label="Avg Duration" value={fmtDuration(periodStats?.avg_view_duration_seconds)} color="#f472b6" delta={calcDelta(overview.periods, selectedPeriod, 'avg_view_duration_seconds')} periodLabel={PERIOD_LABELS[selectedPeriod]} />
          <KpiCard index={5} icon={<TrendingUp className="w-4 h-4" />} label="Avg Retention" value={`${(periodStats?.avg_percentage_viewed ?? 0).toFixed(1)}%`} color="#fb923c" delta={calcDelta(overview.periods, selectedPeriod, 'avg_percentage_viewed')} periodLabel={PERIOD_LABELS[selectedPeriod]} />
        </div>
      )}

      {/* Section 3: Engagement Timeline */}
      {dailyMetrics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${GLASS} p-6`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-[#f9fafb]">Engagement Timeline</h3>
            <div className="flex gap-1">
              {[
                { key: 'views', label: 'Views', color: '#60a5fa' },
                { key: 'watchTime', label: 'Watch Time', color: '#34d399' },
                { key: 'subs', label: 'Subs', color: '#a78bfa' },
                { key: 'likes', label: 'Likes', color: '#f472b6' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setChartLines(p => ({ ...p, [t.key]: !p[t.key as keyof typeof p] }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    chartLines[t.key as keyof typeof chartLines]
                      ? 'text-white'
                      : 'text-[#6b7280] hover:text-[#9ca3af]'
                  }`}
                  style={chartLines[t.key as keyof typeof chartLines] ? { background: t.color + '20', color: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              {chartLines.views && (
                <Area type="monotone" dataKey="views" name="Views" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={2} />
              )}
              {chartLines.watchTime && (
                <Area type="monotone" dataKey="estimatedMinutesWatched" name="Watch Time (min)" stroke="#34d399" fill="transparent" strokeWidth={2} />
              )}
              {chartLines.subs && (
                <Area type="monotone" dataKey="subscribersGained" name="Subs Gained" stroke="#a78bfa" fill="transparent" strokeWidth={2} />
              )}
              {chartLines.likes && (
                <Area type="monotone" dataKey="likes" name="Likes" stroke="#f472b6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Section 4: Traffic Sources + Search Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        {trafficSources.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={`${GLASS} p-6`}>
            <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[#60a5fa]" /> Traffic Sources
            </h3>
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficSources}
                      dataKey="views"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      strokeWidth={0}
                    >
                      {trafficSources.map((_, i) => (
                        <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-[#f9fafb]">{fmt(totalTrafficViews)}</span>
                  <span className="text-[10px] text-[#6b7280]">Total Views</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {trafficSources.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
                  <span className="text-[#f9fafb] flex-1 truncate">{s.name}</span>
                  <span className="text-[#9ca3af]">{fmt(s.views)}</span>
                  <div className="w-16 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.percentage}%`, background: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Search Terms */}
        {overview?.top_search_terms?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`${GLASS} p-6`}>
            <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-[#a78bfa]" /> Top Search Terms
            </h3>
            <div className="space-y-2">
              {(overview.top_search_terms as any[]).slice(0, 15).map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors text-xs">
                  <span className="text-[#6b7280] w-5 text-right">{i + 1}</span>
                  <span className="text-[#f9fafb] flex-1 font-medium truncate">{t.insightTrafficSourceDetail || t.term || t.query}</span>
                  <span className="text-[#60a5fa] font-medium">{fmt(t.views)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Section 4b: Geography + Device Types */}
      {(topGeographies.length > 0 || deviceTypes.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Countries */}
          {topGeographies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className={`${GLASS} p-6`}>
              <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[#67e8f9]" /> Top Countries
              </h3>
              <div className="space-y-2.5">
                {topGeographies.map((g: any, i: number) => (
                  <div key={g.country || i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#f9fafb] font-medium">
                        {getFlag(g.country)} {g.country}
                      </span>
                      <div className="flex items-center gap-3 text-[#9ca3af]">
                        <span>{fmt(g.views)} views</span>
                        {g.subscribersGained != null && (
                          <span className="text-[#a78bfa]">+{g.subscribersGained} subs</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((g.views ?? 0) / maxGeoViews) * 100}%` }}
                        transition={{ delay: 0.45 + i * 0.03, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Device Types */}
          {deviceTypes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }} className={`${GLASS} p-6`}>
              <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-[#fb923c]" /> Device Types
              </h3>
              <div className="space-y-3">
                {deviceTypes.map((d: any, i: number) => {
                  const deviceColor = DEVICE_COLORS[d.deviceType] || ACCENT_COLORS[i % ACCENT_COLORS.length];
                  return (
                    <div key={d.deviceType || i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2" style={{ color: deviceColor }}>
                          {DEVICE_ICONS[d.deviceType] || <Monitor className="w-3.5 h-3.5" />}
                          <span className="text-[#f9fafb] font-medium">{DEVICE_NAMES[d.deviceType] || d.deviceType}</span>
                        </div>
                        <span className="text-[#9ca3af]">{fmt(d.views)} views</span>
                      </div>
                      <div className="w-full h-5 rounded bg-[rgba(255,255,255,0.04)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((d.views ?? 0) / maxDeviceViews) * 100}%` }}
                          transition={{ delay: 0.46 + i * 0.04, duration: 0.5 }}
                          className="h-full rounded flex items-center px-2"
                          style={{ background: deviceColor + '50' }}
                        >
                          <span className="text-[10px] font-medium text-[#f9fafb]">
                            {((d.views / (deviceTypes.reduce((s: number, x: any) => s + (x.views ?? 0), 0) || 1)) * 100).toFixed(1)}%
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Section 5: Content Type Breakdown */}
      {breakdownData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className={`${GLASS} p-6`}>
          <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#fbbf24]" /> Performance by Content Type
          </h3>
          <div className="space-y-3">
            {breakdownData.map((b, i) => {
              const maxViews = breakdownData[0].avg_views || 1;
              return (
                <div key={b.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#f9fafb] font-medium">{b.type}</span>
                    <div className="flex items-center gap-3 text-[#9ca3af]">
                      <span>{b.count} videos</span>
                      <span>Engagement {b.avg_engagement.toFixed(1)}%</span>
                      <span>Retention {b.avg_retention.toFixed(1)}%</span>
                      {b.total_watch_time > 0 && <span>{fmt(b.total_watch_time)}m watch</span>}
                    </div>
                  </div>
                  <div className="w-full h-6 rounded bg-[rgba(255,255,255,0.04)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.avg_views / maxViews) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                      className="h-full rounded flex items-center px-2"
                      style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] + '60' }}
                    >
                      <span className="text-[10px] font-medium text-[#f9fafb]">{fmt(b.avg_views)} avg views</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Section 6: Video Performance */}
      {sortedVideos.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`${GLASS} p-6`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2">
              <Video className="w-4 h-4 text-[#f472b6]" /> Video Performance
              <Badge variant="secondary" className="text-[10px]">{sortedVideos.length}</Badge>
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}>
                <List className="w-4 h-4 text-[#9ca3af]" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}>
                <LayoutGrid className="w-4 h-4 text-[#9ca3af]" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Input
              placeholder="Search videos…"
              value={videoSearch}
              onChange={e => setVideoSearch(e.target.value)}
              className="max-w-[200px] h-8 text-xs bg-transparent border-[rgba(255,255,255,0.1)]"
            />
            <Select value={videoSort} onValueChange={setVideoSort}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-transparent border-[rgba(255,255,255,0.1)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="watch_time">Watch Time</SelectItem>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="subs">Subs Gained</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contentFilter} onValueChange={setContentFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-[rgba(255,255,255,0.1)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
                <SelectItem value="Tutorial">Tutorial</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deep Dive">Deep Dive</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-2 px-2 text-[#6b7280] font-medium">Video</th>
                    <th className="text-right py-2 px-2 text-[#6b7280] font-medium">Views</th>
                    <th className="text-right py-2 px-2 text-[#6b7280] font-medium hidden md:table-cell">Duration</th>
                    <th className="text-right py-2 px-2 text-[#6b7280] font-medium hidden lg:table-cell">Retention</th>
                    <th className="text-right py-2 px-2 text-[#6b7280] font-medium hidden lg:table-cell">Subs</th>
                    <th className="text-right py-2 px-2 text-[#6b7280] font-medium hidden lg:table-cell">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVideos.map((v: any) => {
                    const isExp = expandedVideo === v.video_id;
                    return (
                      <tr key={v.video_id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer" onClick={() => setExpandedVideo(isExp ? null : v.video_id)}>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-3">
                            {v.thumbnail_url && (
                              <img src={v.thumbnail_url} alt="" className="w-16 h-9 rounded object-cover flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[#f9fafb] font-medium truncate max-w-[250px]">{v.title}</p>
                              <p className="text-[#6b7280]">{v.published_at ? format(parseISO(v.published_at), 'MMM d, yyyy') : ''}</p>
                            </div>
                          </div>
                          {/* Expanded detail */}
                          {isExp && (
                            <div className="mt-3 space-y-3" onClick={e => e.stopPropagation()}>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Likes</span>
                                  <p className="text-[#f9fafb] font-medium">{fmtFull(v.likes)}</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Comments</span>
                                  <p className="text-[#f9fafb] font-medium">{fmtFull(v.comments)}</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Shares</span>
                                  <p className="text-[#f9fafb] font-medium">{fmtFull(v.shares)}</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Engagement</span>
                                  <p className="text-[#f9fafb] font-medium">{(v.engagement_rate ?? 0).toFixed(2)}%</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Subs Gained</span>
                                  <p className="text-[#f9fafb] font-medium">+{fmtFull(v.subscribers_gained)}</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Subs Lost</span>
                                  <p className="text-[#f9fafb] font-medium">{fmtFull(v.subscribers_lost)}</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Watch Time</span>
                                  <p className="text-[#f9fafb] font-medium">{fmt(v.estimated_minutes_watched)}m</p>
                                </div>
                                <div className="bg-[rgba(255,255,255,0.03)] rounded p-2">
                                  <span className="text-[#6b7280]">Avg Duration</span>
                                  <p className="text-[#f9fafb] font-medium">{v.avg_view_duration_display || fmtDuration(v.avg_view_duration_seconds)}</p>
                                </div>
                              </div>
                              {/* Daily sparkline */}
                              {v.daily_views?.length > 0 && (
                                <div className="h-16">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={v.daily_views}>
                                      <Line type="monotone" dataKey="views" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                              {/* AI Analysis */}
                              {v.ai_analysis && (
                                <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3 border border-[rgba(255,255,255,0.06)]">
                                  <div className="flex items-center gap-1.5 mb-2 text-[10px] text-[#a78bfa] font-medium">
                                    <Sparkles className="w-3 h-3" /> AI Insights
                                  </div>
                                  <div
                                    className="text-[11px] text-[#9ca3af] leading-relaxed [&_strong]:text-[#f9fafb] [&_em]:text-[#fbbf24]"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.ai_analysis) }}
                                  />
                                </div>
                              )}
                              {/* Tags + Link */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {v.tags?.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-[10px] border-[rgba(255,255,255,0.1)]">{tag}</Badge>
                                ))}
                                {v.video_url && (
                                  <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] text-[10px] flex items-center gap-1 hover:underline ml-auto">
                                    Watch <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="text-right py-2 px-2 text-[#f9fafb] font-medium">{fmt(v.views)}</td>
                        <td className="text-right py-2 px-2 text-[#9ca3af] hidden md:table-cell">{v.avg_view_duration_display || v.duration_display || fmtDuration(v.avg_view_duration_seconds)}</td>
                        <td className="text-right py-2 px-2 text-[#34d399] hidden lg:table-cell">{(v.avg_percentage_viewed ?? 0).toFixed(1)}%</td>
                        <td className="text-right py-2 px-2 text-[#a78bfa] hidden lg:table-cell">+{v.subscribers_gained ?? 0}</td>
                        <td className="text-right py-2 px-2 text-[#fbbf24] hidden lg:table-cell">{(v.engagement_rate ?? 0).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedVideos.map((v: any) => (
                <div
                  key={v.video_id}
                  className="bg-[rgba(255,255,255,0.03)] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer hover:-translate-y-0.5"
                  onClick={() => setExpandedVideo(expandedVideo === v.video_id ? null : v.video_id)}
                >
                  <div className="relative aspect-video">
                    {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                    {v.duration_display && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-white">{v.duration_display}</span>
                    )}
                    {v.content_type && (
                      <span className="absolute top-1 left-1 bg-[#60a5fa]/20 text-[#60a5fa] text-[10px] px-1.5 py-0.5 rounded font-medium">{v.content_type}</span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium text-[#f9fafb] line-clamp-2">{v.title}</p>
                    <p className="text-[10px] text-[#6b7280]">{v.published_at ? format(parseISO(v.published_at), 'MMM d, yyyy') : ''}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge className="bg-[#60a5fa]/10 text-[#60a5fa] border-0 text-[10px]">{fmt(v.views)} views</Badge>
                      <Badge className="bg-[#f472b6]/10 text-[#f472b6] border-0 text-[10px]">{v.avg_view_duration_display || fmtDuration(v.avg_view_duration_seconds)}</Badge>
                      <Badge className="bg-[#34d399]/10 text-[#34d399] border-0 text-[10px]">{(v.avg_percentage_viewed ?? 0).toFixed(0)}% ret</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {paginatedVideos.length < sortedVideos.length && (
            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVideoPage(p => p + 1)}
                className="text-xs text-[#9ca3af] hover:text-[#f9fafb]"
              >
                Load more ({sortedVideos.length - paginatedVideos.length} remaining)
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Section 7: AI Channel Intelligence */}
      {overview?.channel_intelligence && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl p-[1px]"
          style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)' }}
        >
          <div className="bg-[rgba(10,10,15,0.95)] backdrop-blur-[16px] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#f9fafb] flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#a78bfa]" />
              <span className="bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">
                AI Channel Intelligence
              </span>
            </h3>
            <div
              className="text-sm leading-relaxed [&_strong]:text-[#f9fafb]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(overview.channel_intelligence) }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
