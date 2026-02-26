import { useState, useMemo, useCallback } from 'react';
import { useOpsData, type OpsDataItem } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useAgentNames } from '@/contexts/AgentNamesContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckSquare, FileText, Clock, AlertTriangle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, ExternalLink, Users, Sparkles, XCircle, Trash2, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReportViewerModal } from '@/components/reports/ReportViewerModal';
import type { Report } from '@/hooks/useReports';

// ── Constants ──────────────────────────────────────────────────────────
const GLASS = 'bg-[rgba(17,24,39,0.7)] backdrop-blur-2xl border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 transition-all duration-300 hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]';
const MEETING_INTEL_APP_ID = 'ef7624be-bdec-4348-8b3c-219c675f4407';

const FEATURE_META: Record<string, { label: string; icon: string; color: string; emptyMsg: string }> = {
  'c64fdaaf-67e5-49b2-94a3-9d0688e3fae0': {
    label: 'Action Items',
    icon: '📋',
    color: '#a78bfa',
    emptyMsg: 'No meetings queued for action item extraction yet.\nUse the ⚡ menu on any meeting card to send one here.',
  },
  '0dee583a-84aa-4bd6-88fb-93f998e2bfac': {
    label: 'Proposals',
    icon: '📄',
    color: '#34d399',
    emptyMsg: 'No meetings queued for proposal generation yet.\nUse the ⚡ menu on any meeting card to send one here.',
  },
  '8622e572-0e4a-427f-bfc6-4fc689009df3': {
    label: 'Lead Magnets',
    icon: '🧲',
    color: '#f472b6',
    emptyMsg: 'No meetings queued for lead magnet creation yet.\nUse the ⚡ menu on any meeting card to send one here.',
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  queued:      { label: 'Queued',        color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: Clock },
  processing:  { label: 'Processing',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: Loader2 },
  complete:    { label: 'Complete',       color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: CheckSquare },
  processed:   { label: 'Processed',     color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: CheckSquare },
  ready:       { label: 'Ready',         color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: Sparkles },
  needs_input: { label: 'Needs Input',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: AlertTriangle },
  answered:    { label: 'Generating...',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: Loader2 },
  error:       { label: 'Error',         color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: XCircle },
};

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const INIT_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#67e8f9', '#818cf8'];
const getInitialColor = (name: string) => INIT_COLORS[name.length % INIT_COLORS.length];

// ── Component ──────────────────────────────────────────────────────────
interface Props { block: OpsBlock; appId: string; }

export const OpsMeetingFeatureBlock = ({ block, appId }: Props) => {
  const { agentNames } = useAgentNames();
  const { data: rawData, isLoading } = useOpsData({ appId, blockId: block.id });
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  const meta = FEATURE_META[block.id] ?? { label: block.title ?? 'Feature', icon: '🔧', color: '#60a5fa', emptyMsg: 'No items yet.' };

  // Sort items: processing first, then queued, then needs_input, then complete, then error
  const items = useMemo(() => {
    const order: Record<string, number> = { processing: 0, queued: 1, needs_input: 2, answered: 2.5, ready: 3, processed: 3, complete: 4, error: 5 };
    let list = (rawData ?? []).map(item => ({
      ...item,
      d: item.data as any,
    }));

    if (statusFilter !== 'all') {
      list = list.filter(m => {
        const s = m.d?.status ?? '';
        if (statusFilter === 'active') return ['queued', 'processing', 'answered'].includes(s);
        if (statusFilter === 'done') return ['complete', 'processed', 'ready'].includes(s);
        if (statusFilter === 'needs_input') return s === 'needs_input';
        if (statusFilter === 'error') return s === 'error';
        return true;
      });
    }

    list.sort((a, b) => {
      const oa = order[a.d?.status ?? ''] ?? 6;
      const ob = order[b.d?.status ?? ''] ?? 6;
      if (oa !== ob) return oa - ob;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [rawData, statusFilter]);

  // Status counts for the filter bar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, active: 0, done: 0, needs_input: 0, error: 0 };
    (rawData ?? []).forEach(item => {
      const s = (item.data as any)?.status ?? '';
      counts.all++;
      if (['queued', 'processing', 'answered'].includes(s)) counts.active++;
      if (['complete', 'processed', 'ready'].includes(s)) counts.done++;
      if (s === 'needs_input') counts.needs_input++;
      if (s === 'error') counts.error++;
    });
    return counts;
  }, [rawData]);

  // Helper: call ClawBuddy ai-tasks edge function (bypasses RLS)
  const callApi = useCallback(async (payload: Record<string, unknown>) => {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': import.meta.env.VITE_CLAWBUDDY_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });
    return resp.json();
  }, []);

  // Retry: reset status to queued
  const retryItem = useCallback(async (itemId: string) => {
    try {
      const result = await callApi({
        request_type: 'ops',
        action: 'update_data',
        data_id: itemId,
        data: { status: 'queued', retried_at: new Date().toISOString() },
      });
      if (result?.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: '🔄 Retrying', description: 'Item re-queued for processing' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    }
  }, [callApi, toast]);

  // Delete an item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const result = await callApi({
        request_type: 'ops',
        action: 'delete_data',
        app_id: MEETING_INTEL_APP_ID,
        data_id: itemId,
      });
      if (result?.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: '🗑️ Removed', description: 'Item removed from queue' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    }
    setConfirmDeleteId(null);
  }, [callApi, toast]);

  // View Report: fetch by report_id or by title match
  const openReport = useCallback(async (d: any, itemId: string) => {
    setLoadingReportId(itemId);
    try {
      let report: Report | null = null;

      // Strategy 1: Try fetching by report_id stored in ops_data
      if (d?.report_id) {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', d.report_id)
          .single();
        if (!error && data) report = data as Report;
      }

      // Strategy 2: Fall back to title match
      if (!report && d?.report_title) {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('title', d.report_title)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!error && data?.[0]) report = data[0] as Report;
      }

      // Strategy 3: Broader title search using meeting title (skip pipeline status reports)
      if (!report) {
        const meetingTitle = d?.source_meeting_title || d?.meeting_title || '';
        if (meetingTitle) {
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .ilike('title', `%${meetingTitle}%`)
            .order('created_at', { ascending: false })
            .limit(5);
          if (!error && data?.length) {
            // Prefer actual output reports over pipeline status reports
            const output = data.find((r: any) => !r.title?.includes('Pipeline'));
            report = (output || data[0]) as Report;
          }
        }
      }

      if (report) {
        setViewingReport(report);
      } else {
        toast({ title: 'Report not found', description: 'The report may not have been generated yet.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    }
    setLoadingReportId(null);
  }, [toast]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={GLASS + ' text-center'}>
        <Loader2 className="h-8 w-8 mx-auto text-[#6b7280] animate-spin mb-3" />
        <p className="text-[#9ca3af] animate-pulse">Loading {meta.label}...</p>
      </div>
    );
  }

  // ── Empty State ──
  if (!rawData || rawData.length === 0) {
    return (
      <div className={GLASS + ' text-center py-16'}>
        <span className="text-4xl mb-4 block">{meta.icon}</span>
        <h3 className="text-lg font-semibold text-[#f9fafb] mb-2">{meta.label}</h3>
        <p className="text-[#6b7280] text-sm whitespace-pre-line max-w-md mx-auto">{meta.emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header with stats ── */}
      <div className={GLASS + ' flex flex-wrap items-center justify-between gap-4'}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: `${meta.color}15` }}>
            <span className="text-xl">{meta.icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f9fafb]">{meta.label}</h2>
            <p className="text-xs text-[#6b7280]">
              {statusCounts.all} total &middot; {statusCounts.active} active &middot; {statusCounts.done} done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusCounts.active > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[#fbbf24]">
              <Loader2 className="h-3 w-3 animate-spin" /> {statusCounts.active} in pipeline
            </span>
          )}
          <Badge style={{ background: `${meta.color}20`, color: meta.color, borderColor: `${meta.color}30` }}>
            {statusCounts.all} items
          </Badge>
        </div>
      </div>

      {/* ── Status Filter Bar ── */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { key: 'all', label: 'All', count: statusCounts.all },
          { key: 'active', label: '⏳ Active', count: statusCounts.active },
          { key: 'done', label: '✅ Done', count: statusCounts.done },
          { key: 'needs_input', label: '⚠️ Needs Input', count: statusCounts.needs_input },
          { key: 'error', label: '❌ Errors', count: statusCounts.error },
        ] as const).filter(f => f.count > 0 || f.key === 'all').map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: statusFilter === f.key ? `${meta.color}22` : 'rgba(255,255,255,0.05)',
              color: statusFilter === f.key ? meta.color : '#9ca3af',
              border: `1px solid ${statusFilter === f.key ? `${meta.color}40` : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
          </button>
        ))}
      </div>

      {/* ── Item Cards ── */}
      <div className="space-y-2">
        {items.map(({ id, d, created_at }) => {
          const status = d?.status ?? 'queued';
          const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
          const StatusIcon = sc.icon;
          const isExpanded = expandedId === id;
          const isComplete = ['complete', 'processed', 'ready'].includes(status);
          const hasReport = isComplete;

          return (
            <div key={id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border transition-all cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: isExpanded ? `${sc.color}40` : 'rgba(255,255,255,0.04)',
                }}
                onClick={() => setExpandedId(isExpanded ? null : id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon
                          className={`h-4 w-4 flex-shrink-0 ${status === 'processing' || status === 'answered' ? 'animate-spin' : ''}`}
                          style={{ color: sc.color }}
                        />
                        <h4 className="text-[#f9fafb] font-medium truncate">
                          {d?.source_meeting_title || d?.meeting_title || 'Untitled meeting'}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 ml-6">
                        <Badge
                          className="text-[10px] px-1.5 py-0 border-0"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.label}
                        </Badge>
                        {d?.source_meeting_type && (
                          <span className="text-[10px] text-[#6b7280]">{d.source_meeting_type}</span>
                        )}
                        {d?.source_meeting_date ? (
                          <span className="text-[10px] text-[#6b7280]">
                            {format(parseISO(d.source_meeting_date), 'MMM d, yyyy')}
                          </span>
                        ) : d?.meeting_date ? (
                          <span className="text-[10px] text-[#6b7280]">
                            {format(parseISO(d.meeting_date), 'MMM d, yyyy')}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-[#6b7280]">
                          queued {formatDistanceToNow(new Date(d?.queued_at || created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {/* Attendees */}
                      {(d?.source_attendees?.length > 0 || d?.attendees?.length > 0) && (
                        <div className="flex items-center gap-1.5 ml-6 mt-2">
                          {(d?.source_attendees ?? d?.attendees ?? []).slice(0, 6).map((a: string) => (
                            <span
                              key={a}
                              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-medium text-white"
                              style={{ background: getInitialColor(a) }}
                              title={a}
                            >
                              {getInitials(a)}
                            </span>
                          ))}
                          {((d?.source_attendees ?? d?.attendees ?? []).length > 6) && (
                            <span className="text-[10px] text-[#6b7280]">
                              +{(d?.source_attendees ?? d?.attendees ?? []).length - 6}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {d?.source_duration && (
                        <span className="text-xs text-[#9ca3af]">{d.source_duration}</span>
                      )}
                      {/* View Report button — prominent on completed items */}
                      {hasReport && (
                        <Button
                          size="sm"
                          onClick={e => { e.stopPropagation(); openReport(d, id); }}
                          className="h-7 px-3 gap-1.5 text-xs font-medium"
                          style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
                          disabled={loadingReportId === id}
                        >
                          {loadingReportId === id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          View Report
                        </Button>
                      )}
                      {(status === 'error' || status === 'needs_input') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => { e.stopPropagation(); retryItem(id); }}
                          className="h-7 px-2 text-[#60a5fa] hover:bg-[rgba(96,165,250,0.1)]"
                          title="Retry"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {confirmDeleteId === id ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => deleteItem(id)} className="h-7 px-2 text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] text-xs">Yes</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)} className="h-7 px-2 text-[#6b7280] text-xs">No</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => { e.stopPropagation(); setConfirmDeleteId(id); }}
                          className="h-7 px-2 text-[#6b7280] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.06)]"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-[#6b7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Expanded Detail Panel ── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 border border-t-0 border-[rgba(255,255,255,0.06)] rounded-b-xl bg-[rgba(17,24,39,0.5)] space-y-4">
                      {/* Status details */}
                      {(status === 'processing' || status === 'answered') && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.15)]">
                          <Loader2 className="h-4 w-4 text-[#fbbf24] animate-spin" />
                          <p className="text-sm text-[#fbbf24]">
                            {status === 'answered'
                              ? 'Your answer was received. Generating the final output...'
                              : `${agentNames.intelligenceName} is processing this meeting. Results will appear here automatically.`}
                          </p>
                        </div>
                      )}

                      {status === 'queued' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.15)]">
                          <Clock className="h-4 w-4 text-[#60a5fa]" />
                          <p className="text-sm text-[#60a5fa]">{`Waiting in queue. ${agentNames.intelligenceName} picks up new items every minute.`}</p>
                        </div>
                      )}

                      {status === 'error' && d?.error && (
                        <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)]">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4 text-[#f87171]" />
                            <p className="text-sm font-medium text-[#f87171]">Error</p>
                          </div>
                          <p className="text-xs text-[#fb7185] ml-6">{d.error}</p>
                        </div>
                      )}

                      {status === 'needs_input' && d?.questions && (
                        <div className="p-3 rounded-lg bg-[rgba(251,146,60,0.08)] border border-[rgba(251,146,60,0.15)]">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-[#fb923c]" />
                            <p className="text-sm font-medium text-[#fb923c]">{`${agentNames.intelligenceName} needs more info`}</p>
                          </div>
                          <div className="ml-6 space-y-1">
                            {(d.questions as string[]).map((q: string, i: number) => (
                              <p key={i} className="text-xs text-[#fdba74]">{i + 1}. {q}</p>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#6b7280] mt-2 ml-6">Answer in ClawBuddy Questions tab, then it will auto-generate.</p>
                        </div>
                      )}

                      {status === 'needs_input' && !d?.questions && (
                        <div className="p-3 rounded-lg bg-[rgba(251,146,60,0.08)] border border-[rgba(251,146,60,0.15)]">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-[#fb923c]" />
                            <p className="text-sm font-medium text-[#fb923c]">Waiting for your input</p>
                          </div>
                          {d?.missing_fields && (
                            <div className="ml-6 flex flex-wrap gap-1.5">
                              {(d.missing_fields as string[]).map((f: string) => (
                                <Badge key={f} className="bg-[rgba(251,146,60,0.15)] text-[#fb923c] border-0 text-[10px]">{f}</Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-[#6b7280] mt-2 ml-6">Check your Questions tab to answer, then the report will auto-generate.</p>
                        </div>
                      )}

                      {/* User's answer (if visible) */}
                      {d?.user_answer && (
                        <div className="p-3 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
                          <p className="text-[10px] text-[#93c5fd] uppercase tracking-wider mb-1 font-medium">Your Response</p>
                          <p className="text-sm text-[#bfdbfe]">{d.user_answer}</p>
                        </div>
                      )}

                      {/* Completed results */}
                      {isComplete && (
                        <div className="space-y-3">
                          {/* Action Items results */}
                          {(d?.total_items !== undefined || d?.action_items_count !== undefined) && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 rounded-lg bg-[rgba(167,139,250,0.08)]">
                                <p className="text-2xl font-bold text-[#a78bfa]">{d.total_items ?? d.action_items_count ?? 0}</p>
                                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Action Items</p>
                              </div>
                              {(d?.high_priority_items !== undefined || d?.high_priority_count !== undefined) && (
                                <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.08)]">
                                  <p className="text-2xl font-bold text-[#f87171]">{d.high_priority_items ?? d.high_priority_count ?? 0}</p>
                                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">High Priority</p>
                                </div>
                              )}
                              {d?.transcript_length !== undefined && (
                                <div className="p-3 rounded-lg bg-[rgba(96,165,250,0.08)]">
                                  <p className="text-2xl font-bold text-[#60a5fa]">{d.transcript_length}</p>
                                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Transcript Entries</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Proposal results */}
                          {d?.template_name && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-[#34d399]" />
                                <span className="text-sm font-medium text-[#f9fafb]">Template: {d.template_name}</span>
                                {d?.confidence && (
                                  <Badge className="bg-[rgba(52,211,153,0.15)] text-[#34d399] border-0 text-[10px]">
                                    {Math.round(d.confidence * 100)}% match
                                  </Badge>
                                )}
                              </div>
                              {d?.signals && (d.signals as string[]).length > 0 && (
                                <div className="flex flex-wrap gap-1 ml-6">
                                  {(d.signals as string[]).map((s: string) => (
                                    <Badge key={s} className="bg-[rgba(52,211,153,0.08)] text-[#34d399] border-0 text-[10px]">{s}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lead Magnet results */}
                          {d?.detected_type_names && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#f472b6]" />
                                <span className="text-sm font-medium text-[#f9fafb]">Detected Formats</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 ml-6">
                                {(d.detected_type_names as string[]).map((t: string) => (
                                  <Badge key={t} className="bg-[rgba(244,114,182,0.12)] text-[#f472b6] border-0 text-xs">{t}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* View Report — prominent button in expanded view */}
                          {hasReport && (
                            <Button
                              onClick={e => { e.stopPropagation(); openReport(d, id); }}
                              className="w-full gap-2 mt-2"
                              style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}
                              disabled={loadingReportId === id}
                            >
                              {loadingReportId === id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              View Full Report
                            </Button>
                          )}
                        </div>
                      )}

                      {/* General info row */}
                      <div className="flex flex-wrap gap-4 text-[10px] text-[#6b7280] border-t border-[rgba(255,255,255,0.04)] pt-3">
                        {d?.recording_id && <span>Recording: {d.recording_id}</span>}
                        {d?.source_recording_id && <span>Recording: {d.source_recording_id}</span>}
                        {d?.queued_at && <span>Queued: {format(parseISO(d.queued_at), 'MMM d, h:mm a')}</span>}
                        {d?.updated_at && <span>Updated: {format(parseISO(d.updated_at), 'MMM d, h:mm a')}</span>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Empty filter state ── */}
      {items.length === 0 && rawData && rawData.length > 0 && (
        <div className={GLASS + ' text-center py-8'}>
          <p className="text-[#6b7280] text-sm">No items matching this filter.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="mt-2 text-[#60a5fa]"
          >
            Show all
          </Button>
        </div>
      )}

      {/* ── Report Viewer Modal (reuses existing component) ── */}
      <ReportViewerModal
        report={viewingReport}
        open={!!viewingReport}
        onOpenChange={(open) => { if (!open) setViewingReport(null); }}
      />
    </div>
  );
};
