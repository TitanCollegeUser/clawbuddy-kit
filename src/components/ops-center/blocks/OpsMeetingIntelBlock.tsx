import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useOpsData, type OpsDataItem } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Phone, Clock, Timer, CheckSquare, Tag, Users, BarChart3,
  Calendar, Globe, FileText, Sparkles, ExternalLink, ChevronDown,
  ChevronUp, Search, Play, Copy, Filter, ArrowUpDown, Zap, Magnet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO, isAfter, subDays } from 'date-fns';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Constants ──────────────────────────────────────────────────────────
const GLASS = 'bg-[rgba(17,24,39,0.7)] backdrop-blur-2xl border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 transition-all duration-300 hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]';

const TYPE_COLORS: Record<string, string> = {
  '1-on-1': '#60a5fa', external: '#a78bfa', sales: '#34d399',
  onboarding: '#67e8f9', content: '#f472b6', review: '#fbbf24',
  team: '#fb923c', workshop: '#f87171', standup: '#818cf8',
  planning: '#2dd4bf', 'all-hands': '#e879f9', interview: '#a3e635',
  group: '#94a3b8',
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PER_PAGE = 25;

const fmt = (n: number) => n.toLocaleString();
const fmtDuration = (mins: number) => {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const INIT_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#67e8f9', '#818cf8'];
const getInitialColor = (name: string) => INIT_COLORS[name.length % INIT_COLORS.length];

// ── Meeting Actions: Send to feature blocks ──────────────────────────
const MEETING_INTEL_APP_ID = 'ef7624be-bdec-4348-8b3c-219c675f4407';
const FEATURE_BLOCKS = {
  action_items: { blockId: 'c64fdaaf-67e5-49b2-94a3-9d0688e3fae0', label: 'Action Items', icon: '📋', itemType: 'action_items' },
  proposal:     { blockId: '0dee583a-84aa-4bd6-88fb-93f998e2bfac', label: 'Proposal',     icon: '📄', itemType: 'proposal' },
  lead_magnet:  { blockId: '8622e572-0e4a-427f-bfc6-4fc689009df3', label: 'Lead Magnet',   icon: '🧲', itemType: 'lead_magnet' },
} as const;
type FeatureKey = keyof typeof FEATURE_BLOCKS;

// Minimal markdown-to-jsx: headers + bullets + links
const renderMarkdown = (md: string) => {
  if (!md) return null;
  return md.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold text-[#f9fafb] mt-4 mb-1">{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-[#f9fafb] mt-4 mb-1">{line.slice(2)}</h2>;
    // Replace markdown links [text](url)
    const withLinks = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-[#60a5fa] hover:underline">$1</a>');
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return <li key={i} className="ml-4 text-sm text-[#9ca3af] list-disc" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(withLinks.replace(/^\s*[-*]\s*/, '')) }} />;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-sm text-[#9ca3af]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(withLinks) }} />;
  });
};

// ── Component ──────────────────────────────────────────────────────────
interface Props { block: OpsBlock; appId: string; }

export const OpsMeetingIntelBlock = ({ block, appId }: Props) => {
  const { data: rawData, isLoading } = useOpsData({ appId, blockId: block.id });

  // Split data
  const overview = useMemo(() => {
    const item = rawData?.find(d => (d.data as any)?.type === 'overview');
    return item ? (item.data as any) : null;
  }, [rawData]);

  const meetings = useMemo(() =>
    (rawData ?? []).filter(d => (d.data as any)?.type === 'meeting'),
  [rawData]);

  // State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<string>('all');
  const [hasActionItems, setHasActionItems] = useState(false);
  const [externalOnly, setExternalOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdownId(null);
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDropdownId(null); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEsc); };
  }, [openDropdownId]);

  // Queue a meeting for a feature pipeline (via ClawBuddy ai-tasks edge function)
  const queueMeetingForFeature = useCallback(async (d: any, feature: FeatureKey) => {
    const fb = FEATURE_BLOCKS[feature];

    // Duplicate check: read is allowed by RLS
    const { data: existing } = await supabase.from('ops_data')
      .select('id, data')
      .eq('block_id', fb.blockId)
      .eq('app_id', MEETING_INTEL_APP_ID)
      .limit(200);

    const isDuplicate = existing?.some(
      (row: any) => (row?.data as any)?.source_recording_id === d.recording_id
    );
    if (isDuplicate) {
      toast({ title: `⚠️ Already queued`, description: `This meeting is already queued for ${fb.label}`, variant: 'destructive' });
      setOpenDropdownId(null);
      return;
    }

    // Insert via ClawBuddy ai-tasks edge function (bypasses RLS)
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': import.meta.env.VITE_CLAWBUDDY_WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          request_type: 'ops',
          action: 'add_data',
          app_id: MEETING_INTEL_APP_ID,
          block_id: fb.blockId,
          item_type: fb.itemType,
          title: `${fb.label} — ${d.title}`,
          data: {
            type: 'queued_job',
            status: 'queued',
            feature: feature,
            source_recording_id: d.recording_id,
            source_meeting_title: d.title,
            source_meeting_date: d.date,
            source_attendees: d.attendees || [],
            source_meeting_type: d.meeting_type || '',
            source_duration: d.duration_display || '',
            queued_at: new Date().toISOString(),
          },
        }),
      });
      const result = await resp.json();
      if (!resp.ok || result?.error) {
        toast({ title: '❌ Error', description: result?.error || `HTTP ${resp.status}`, variant: 'destructive' });
      } else {
        toast({ title: `${fb.icon} Queued for ${fb.label}`, description: `"${d.title}" sent for processing` });
      }
    } catch (err: any) {
      toast({ title: '❌ Network Error', description: err?.message || 'Failed to queue', variant: 'destructive' });
    }
    setOpenDropdownId(null);
  }, [toast]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, typeFilter, dateRange, hasActionItems, externalOnly, sortBy]);

  // Filtered + sorted meetings
  const filteredMeetings = useMemo(() => {
    let list = meetings.map(m => ({ ...m, d: m.data as any }));

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(m => m.d.title?.toLowerCase().includes(q));
    }
    if (typeFilter.length > 0) list = list.filter(m => typeFilter.includes(m.d.meeting_type));
    if (hasActionItems) list = list.filter(m => (m.d.action_item_count ?? 0) > 0);
    if (externalOnly) list = list.filter(m => m.d.has_external_participants);
    if (dateRange !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[dateRange] ?? 9999;
      const cutoff = subDays(new Date(), days);
      list = list.filter(m => m.d.date && isAfter(parseISO(m.d.date), cutoff));
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'duration': return (b.d.duration_minutes ?? 0) - (a.d.duration_minutes ?? 0);
        case 'actions': return (b.d.action_item_count ?? 0) - (a.d.action_item_count ?? 0);
        case 'attendees': return (b.d.attendee_count ?? 0) - (a.d.attendee_count ?? 0);
        default: return new Date(b.d.date ?? 0).getTime() - new Date(a.d.date ?? 0).getTime();
      }
    });
    return list;
  }, [meetings, debouncedSearch, typeFilter, dateRange, hasActionItems, externalOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / PER_PAGE));
  const pageItems = filteredMeetings.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Chart data
  const typeChartData = useMemo(() => {
    if (!overview?.meeting_types) return [];
    return Object.entries(overview.meeting_types as Record<string, number>)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [overview]);

  const monthlyData = useMemo(() => {
    if (!overview?.monthly_counts) return [];
    return Object.entries(overview.monthly_counts as Record<string, number>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [y, m] = key.split('-');
        const month = new Date(+y, +m - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' });
        return { month, value };
      });
  }, [overview]);

  const busiestDays = useMemo(() => {
    if (!overview?.busiest_days) return [];
    const days = overview.busiest_days as Record<string, number>;
    const max = Math.max(...Object.values(days));
    return DAY_ORDER.map(d => ({ name: d.slice(0, 3), value: days[d] ?? 0, pct: ((days[d] ?? 0) / max) * 100 }));
  }, [overview]);

  const topCollabs = useMemo(() => {
    if (!overview?.top_collaborators) return [];
    return Object.entries(overview.top_collaborators as Record<string, number>)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);
  }, [overview]);

  const topDomains = useMemo(() => {
    if (!overview?.top_domains) return [];
    return Object.entries(overview.top_domains as Record<string, number>)
      .filter(([d]) => !d.includes('growthcreators'))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [overview]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    meetings.forEach(m => { const t = (m.data as any)?.meeting_type; if (t) types.add(t); });
    return Array.from(types).sort();
  }, [meetings]);

  const toggleType = (t: string) => {
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // ── Loading / Empty ──
  if (isLoading) return <div className={GLASS + ' text-center'}><p className="text-[#9ca3af] animate-pulse">Loading meeting data…</p></div>;
  if (!overview && meetings.length === 0) {
    return (
      <div className={GLASS + ' text-center py-16'}>
        <Phone className="h-12 w-12 mx-auto text-[#6b7280] mb-4 animate-pulse" />
        <p className="text-[#9ca3af]">No meeting data yet. Run the Meeting Intelligence Pipeline to import from Fathom.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Section 1: Header ── */}
      <div className={GLASS + ' flex flex-wrap items-center justify-between gap-4'}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#60a5fa]/10"><Phone className="h-5 w-5 text-[#60a5fa]" /></div>
          <div>
            <h2 className="text-xl font-bold text-[#f9fafb]">Meeting Intelligence</h2>
            <p className="text-xs text-[#6b7280]">Powered by Fathom AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overview?.last_updated && (
            <span className="text-xs text-[#6b7280]">Updated {format(parseISO(overview.last_updated), 'MMM d, h:mm a')}</span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-[#34d399]">
            <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" /> Live
          </span>
          <Badge className="bg-[#60a5fa]/20 text-[#60a5fa] border-[#60a5fa]/30">{fmt(overview?.total_meetings ?? meetings.length)} meetings</Badge>
        </div>
      </div>

      {/* ── Section 2: KPIs ── */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Meetings', value: fmt(overview.total_meetings ?? 0), icon: Phone, color: '#60a5fa' },
            { label: 'Total Hours', value: `${fmt(Math.round(overview.total_hours ?? 0))}h`, icon: Clock, color: '#34d399' },
            { label: 'Avg Duration', value: fmtDuration(overview.avg_duration ?? 0), icon: Timer, color: '#fbbf24' },
            { label: 'Action Items', value: fmt(overview.total_action_items ?? 0), icon: CheckSquare, color: '#a78bfa', sub: `~${(overview.avg_action_items ?? 0).toFixed(1)} per meeting` },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={GLASS}>
              <kpi.icon className="h-5 w-5 mb-3" style={{ color: kpi.color }} />
              <p className="text-3xl font-bold" style={{ color: kpi.color, textShadow: `0 0 20px ${kpi.color}33` }}>{kpi.value}</p>
              <p className="text-[11px] uppercase text-[#6b7280] mt-1 tracking-wider">{kpi.label}</p>
              {kpi.sub && <p className="text-xs text-[#9ca3af] mt-0.5">{kpi.sub}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Section 3: Types Donut + Collaborators ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Meeting Types */}
        <div className={GLASS}>
          <div className="flex items-center gap-2 mb-4"><Tag className="h-4 w-4 text-[#60a5fa]" /><h3 className="font-semibold text-[#f9fafb]">Meeting Types</h3></div>
          {typeChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {typeChartData.map(e => <Cell key={e.name} fill={TYPE_COLORS[e.name] ?? '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f9fafb' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {typeChartData.map(t => (
              <div key={t.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[t.name] ?? '#94a3b8' }} />
                <span className="text-[#9ca3af] truncate">{t.name}</span>
                <span className="text-[#f9fafb] font-medium ml-auto">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Collaborators */}
        <div className={GLASS}>
          <div className="flex items-center gap-2 mb-4"><Users className="h-4 w-4 text-[#a78bfa]" /><h3 className="font-semibold text-[#f9fafb]">Top Collaborators</h3></div>
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto scrollbar-hide">
            {topCollabs.map(([name, count], i) => {
              const maxCount = topCollabs[0]?.[1] ?? 1;
              return (
                <div key={name} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] relative overflow-hidden group">
                  <div className="absolute inset-0 rounded-lg" style={{ width: `${(count / maxCount) * 100}%`, background: 'rgba(96,165,250,0.06)' }} />
                  <span className="text-xs text-[#6b7280] w-5 text-right relative z-10">{i + 1}</span>
                  <span className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0 relative z-10" style={{ background: getInitialColor(name) }}>{getInitials(name)}</span>
                  <span className="text-sm text-[#f9fafb] font-medium truncate relative z-10">{name}</span>
                  <Badge className="ml-auto bg-[#60a5fa]/15 text-[#60a5fa] border-0 text-xs relative z-10">{count}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 4: Monthly Volume ── */}
      {monthlyData.length > 0 && (
        <div className={GLASS}>
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-4 w-4 text-[#60a5fa]" /><h3 className="font-semibold text-[#f9fafb]">Meeting Volume Over Time</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f9fafb' }} />
              <defs>
                <linearGradient id="meetBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <Bar dataKey="value" fill="url(#meetBarGrad)" radius={[6, 6, 0, 0]} name="Meetings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Section 5: Busiest Days + Domains ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={GLASS}>
          <div className="flex items-center gap-2 mb-4"><Calendar className="h-4 w-4 text-[#fbbf24]" /><h3 className="font-semibold text-[#f9fafb]">Busiest Days</h3></div>
          <div className="space-y-2">
            {busiestDays.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-xs text-[#9ca3af] w-8">{d.name}</span>
                <div className="flex-1 h-6 rounded-md bg-[rgba(255,255,255,0.04)] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.6 }}
                    className="h-full rounded-md" style={{ background: d.pct === 100 ? 'linear-gradient(90deg,#fbbf24,#fb923c)' : 'rgba(251,191,36,0.3)' }}
                  />
                </div>
                <span className="text-sm text-[#f9fafb] font-medium w-10 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={GLASS}>
          <div className="flex items-center gap-2 mb-4"><Globe className="h-4 w-4 text-[#67e8f9]" /><h3 className="font-semibold text-[#f9fafb]">External Organizations</h3></div>
          <div className="space-y-1.5">
            {topDomains.map(([domain, count]) => (
              <div key={domain} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)]">
                <span className="text-sm text-[#9ca3af] font-mono truncate">{domain}</span>
                <Badge className="bg-[#67e8f9]/15 text-[#67e8f9] border-0 text-xs">{count}</Badge>
              </div>
            ))}
            {topDomains.length === 0 && <p className="text-sm text-[#6b7280]">No external domains found</p>}
          </div>
        </div>
      </div>

      {/* ── Section 6: Meeting Feed ── */}
      <div className={GLASS}>
        <div className="flex items-center gap-2 mb-4"><FileText className="h-4 w-4 text-[#f472b6]" /><h3 className="font-semibold text-[#f9fafb]">Meeting Feed</h3></div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings…"
              className="pl-9 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-[#f9fafb] placeholder:text-[#6b7280]" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#9ca3af]">
            <option value="recent">Most Recent</option>
            <option value="duration">Longest</option>
            <option value="actions">Most Action Items</option>
            <option value="attendees">Most Attendees</option>
          </select>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#9ca3af]">
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="365d">Last Year</option>
          </select>
        </div>

        {/* Type + toggle filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTypes.map(t => (
            <button key={t} onClick={() => toggleType(t)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: typeFilter.includes(t) ? (TYPE_COLORS[t] ?? '#94a3b8') : 'rgba(255,255,255,0.06)',
                color: typeFilter.includes(t) ? '#fff' : '#9ca3af',
              }}
            >{t}</button>
          ))}
          <button onClick={() => setHasActionItems(!hasActionItems)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${hasActionItems ? 'bg-[#a78bfa] text-white' : 'bg-[rgba(255,255,255,0.06)] text-[#9ca3af]'}`}>
            📋 Has Actions
          </button>
          <button onClick={() => setExternalOnly(!externalOnly)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${externalOnly ? 'bg-[#67e8f9] text-white' : 'bg-[rgba(255,255,255,0.06)] text-[#9ca3af]'}`}>
            🌐 External Only
          </button>
        </div>

        {/* Meeting List */}
        <div className="space-y-2">
          {pageItems.map(({ id, d }) => (
            <div key={id}>
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer p-4"
                onClick={() => setExpandedId(expandedId === id ? null : id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[#f9fafb] font-medium truncate">{d.title}</h4>
                      <Badge className="text-[10px] px-1.5 py-0 border-0 flex-shrink-0" style={{ background: `${TYPE_COLORS[d.meeting_type] ?? '#94a3b8'}22`, color: TYPE_COLORS[d.meeting_type] ?? '#94a3b8' }}>
                        {d.meeting_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#6b7280]">
                      {d.date ? format(parseISO(d.date), 'EEE, MMM d, yyyy \'at\' h:mm a') : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {(d.attendees as string[] ?? []).slice(0, 5).map((a: string) => (
                        <span key={a} className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-medium text-white" style={{ background: getInitialColor(a) }} title={a}>{getInitials(a)}</span>
                      ))}
                      {(d.attendees?.length ?? 0) > 5 && <span className="text-[10px] text-[#6b7280]">+{d.attendees.length - 5}</span>}
                      {d.has_external_participants && <span className="text-xs text-[#67e8f9]" title="External">🌐 {d.external_domains?.[0]}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-sm font-bold text-[#f9fafb]">{d.duration_display}</p>
                      {/* ⚡ Actions Dropdown */}
                      <div className="relative" ref={openDropdownId === id ? dropdownRef : undefined}>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === id ? null : id); }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[#60a5fa] bg-[rgba(96,165,250,0.12)] hover:bg-[rgba(96,165,250,0.25)] border border-transparent hover:border-[rgba(96,165,250,0.3)] transition-all text-xs font-medium"
                          title="Send to..."
                        >
                          <Zap className="h-3 w-3" />
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <AnimatePresence>
                          {openDropdownId === id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-1 w-[260px] z-50 bg-[rgba(17,24,39,0.97)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                            >
                              <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
                                <span className="text-[10px] uppercase tracking-[1px] text-[#9ca3af] font-medium">⚡ Send To...</span>
                              </div>
                              {([
                                { key: 'action_items' as FeatureKey, icon: '📋', title: 'Extract Action Items', sub: 'Pull action items from transcript' },
                                { key: 'proposal' as FeatureKey, icon: '📄', title: 'Generate Proposal', sub: 'Create proposal from this call' },
                                { key: 'lead_magnet' as FeatureKey, icon: '🧲', title: 'Create Lead Magnet', sub: 'Turn into a lead magnet' },
                              ]).map(opt => (
                                <button
                                  key={opt.key}
                                  onClick={e => { e.stopPropagation(); queueMeetingForFeature(d, opt.key); }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-[rgba(96,165,250,0.08)] transition-colors flex items-start gap-2.5"
                                >
                                  <span className="text-base mt-0.5">{opt.icon}</span>
                                  <div>
                                    <p className="text-sm font-medium text-[#f9fafb]">{opt.title}</p>
                                    <p className="text-[11px] text-[#6b7280]">{opt.sub}</p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {(d.action_item_count ?? 0) > 0 && (
                      <p className="text-xs text-[#a78bfa]">📋 {d.action_item_count} items{d.open_action_items > 0 && ` (${d.open_action_items} open)`}</p>
                    )}
                    {d.fathom_url && (
                      <a href={d.fathom_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-[#60a5fa] hover:underline">
                        <ExternalLink className="h-3 w-3" /> Fathom
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section 7: Detail Panel ── */}
              <AnimatePresence>
                {expandedId === id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-5 border border-t-0 border-[rgba(255,255,255,0.06)] rounded-b-xl bg-[rgba(17,24,39,0.5)] space-y-5">
                      {/* Links */}
                      <div className="flex gap-2">
                        {d.fathom_url && <a href={d.fathom_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="border-[rgba(255,255,255,0.1)] text-[#60a5fa]"><ExternalLink className="h-3 w-3 mr-1" /> Open in Fathom</Button></a>}
                        {d.share_url && <Button size="sm" variant="outline" className="border-[rgba(255,255,255,0.1)] text-[#9ca3af]" onClick={() => copyToClipboard(d.share_url)}><Copy className="h-3 w-3 mr-1" /> Copy Share Link</Button>}
                      </div>

                      {/* Summary */}
                      {d.summary && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-[#60a5fa]" /><h4 className="text-sm font-semibold text-[#f9fafb]">Meeting Summary</h4></div>
                          <div className="space-y-0.5">{renderMarkdown(d.summary)}</div>
                        </div>
                      )}

                      {/* Action Items */}
                      {d.action_items?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><CheckSquare className="h-4 w-4 text-[#a78bfa]" /><h4 className="text-sm font-semibold text-[#f9fafb]">Action Items</h4><Badge className="bg-[#a78bfa]/20 text-[#a78bfa] border-0 text-xs">{d.action_items.length}</Badge></div>
                          <div className="space-y-2">
                            {(d.action_items as any[]).map((ai: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)]">
                                <CheckSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${ai.completed ? 'text-[#34d399]' : 'text-[#6b7280]'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[#f9fafb]">{ai.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {ai.assignee && <Badge className="bg-[rgba(255,255,255,0.06)] text-[#9ca3af] border-0 text-[10px]">{ai.assignee}</Badge>}
                                    {ai.timestamp && <span className="text-[10px] text-[#6b7280]">{ai.timestamp}</span>}
                                  </div>
                                </div>
                                {ai.playback_url && (
                                  <a href={ai.playback_url} target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:text-[#93bbfd]"><Play className="h-4 w-4" /></a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Insights */}
                      {d.ai_insights && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-[#fbbf24]" /><h4 className="text-sm font-semibold text-[#f9fafb]">AI Insights</h4></div>
                          <div className="text-sm text-[#9ca3af]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.ai_insights) }} />
                        </div>
                      )}

                      {/* External Participants */}
                      {d.has_external_participants && d.external_domains?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><Globe className="h-4 w-4 text-[#67e8f9]" /><h4 className="text-sm font-semibold text-[#f9fafb]">External Participants</h4></div>
                          <div className="flex gap-2">
                            {(d.external_domains as string[]).map((dom: string) => (
                              <Badge key={dom} className="bg-[#67e8f9]/15 text-[#67e8f9] border-0">{dom}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filteredMeetings.length > PER_PAGE && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <p className="text-xs text-[#6b7280]">Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filteredMeetings.length)} of {fmt(filteredMeetings.length)}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="border-[rgba(255,255,255,0.1)] text-[#9ca3af] disabled:opacity-30">← Previous</Button>
              <span className="text-xs text-[#6b7280] self-center">Page {currentPage} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="border-[rgba(255,255,255,0.1)] text-[#9ca3af] disabled:opacity-30">Next →</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 8: AI Intelligence Summary ── */}
      {overview?.intelligence && (
        <div className="rounded-2xl p-[1px]" style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)' }}>
          <div className={GLASS + ' rounded-[15px]'}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🧠</span>
              <h3 className="font-bold text-[#f9fafb] bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">Meeting Intelligence</h3>
            </div>
            <div className="text-sm leading-relaxed [&_strong]:text-[#f9fafb]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(overview.intelligence) }} />
          </div>
        </div>
      )}
    </div>
  );
};
