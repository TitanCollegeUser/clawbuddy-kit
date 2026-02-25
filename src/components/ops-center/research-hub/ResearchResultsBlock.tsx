import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ExternalLink, Globe, ChevronDown, ChevronUp, Link, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useOpsData } from '@/hooks/useOpsData';
import { format, parseISO } from 'date-fns';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';

const PAGE_SIZE = 20;

interface Props {
  block: OpsBlock;
  appId: string;
}

export const ResearchResultsBlock = ({ block, appId }: Props) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'url' | 'topic'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [page, setPage] = useState(1);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());

  // Debounce search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    let results = items.filter(i => i.item_type === 'research');

    // Type filter
    if (typeFilter === 'url') {
      results = results.filter(i => (i.data as Record<string, unknown>)?.url);
    } else if (typeFilter === 'topic') {
      results = results.filter(i => (i.data as Record<string, unknown>)?.topic && !(i.data as Record<string, unknown>)?.url);
    }

    // Search filter
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(i => {
        const d = i.data as Record<string, unknown>;
        return (
          i.title.toLowerCase().includes(q) ||
          ((d?.topic as string) || '').toLowerCase().includes(q) ||
          ((d?.summary as string) || '').toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortBy === 'alpha') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      results.sort((a, b) => {
        const aDate = (a.data as Record<string, unknown>)?.researched_at as string || a.created_at;
        const bDate = (b.data as Record<string, unknown>)?.researched_at as string || b.created_at;
        return bDate.localeCompare(aDate);
      });
    }

    return results;
  }, [items, typeFilter, debouncedQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSummary = (id: string) => {
    setExpandedSummaries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePoints = (id: string) => {
    setExpandedPoints(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalResults = items?.filter(i => i.item_type === 'research').length || 0;

  // Get model from most recent result
  const latestModel = useMemo(() => {
    if (!items) return null;
    const research = items.filter(i => i.item_type === 'research');
    if (research.length === 0) return null;
    const sorted = [...research].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return (sorted[0].data as Record<string, unknown>)?.model_used as string || null;
  }, [items]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const renderResultCard = (item: OpsDataItem, i: number) => {
    const d = item.data as Record<string, unknown>;
    const topic = d?.topic as string;
    const url = d?.url as string;
    const source = d?.source as string;
    const summary = d?.summary as string || '';
    const keyPoints = (d?.key_points as string[]) || [];
    const modelUsed = d?.model_used as string;
    const rawTextLength = d?.raw_text_length as number;
    const researchedAt = d?.researched_at as string || item.created_at;
    const isUrlResearch = !!url;
    const isSummaryExpanded = expandedSummaries.has(item.id);
    const isPointsExpanded = expandedPoints.has(item.id);
    const showSummaryToggle = summary.length > 300;
    const showPointsToggle = keyPoints.length > 3;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className="glass-strong rounded-xl p-5 border border-transparent hover:border-white/[0.12] transition-all"
      >
        {/* Top row: badges + timestamp */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isUrlResearch ? (
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px]">
                <Link size={10} className="mr-1" /> URL Research
              </Badge>
            ) : (
              <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/20 text-[10px]">
                <Search size={10} className="mr-1" /> Topic Research
              </Badge>
            )}
            {modelUsed && (
              <span className="text-[10px] font-mono text-muted-foreground/60 bg-white/[0.04] px-2 py-0.5 rounded">
                {modelUsed}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {(() => {
              try {
                return format(parseISO(researchedAt), "MMM d, yyyy 'at' h:mm a");
              } catch {
                return '';
              }
            })()}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-start gap-2 mb-3">
          <h4 className="text-sm font-semibold text-foreground flex-1">{item.title}</h4>
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition shrink-0"
              title="Open source"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-3">
            <p className={`text-xs text-white/70 leading-relaxed ${!isSummaryExpanded && showSummaryToggle ? 'line-clamp-4' : ''}`}>
              {summary}
            </p>
            {showSummaryToggle && (
              <button
                onClick={() => toggleSummary(item.id)}
                className="flex items-center gap-1 mt-1 text-[11px] text-blue-400 hover:text-blue-300 transition"
              >
                {isSummaryExpanded ? (
                  <>Show less <ChevronUp size={12} /></>
                ) : (
                  <>Show more <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* Key points */}
        {keyPoints.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">
              Key Points
            </p>
            <ul className="space-y-1">
              {(isPointsExpanded ? keyPoints : keyPoints.slice(0, 3)).map((point, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
            {showPointsToggle && (
              <button
                onClick={() => togglePoints(item.id)}
                className="flex items-center gap-1 mt-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
              >
                {isPointsExpanded ? (
                  <>Show fewer <ChevronUp size={12} /></>
                ) : (
                  <>Show all {keyPoints.length} points <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* Source footer */}
        {(source || rawTextLength) && (
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
            {source && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 min-w-0">
                <Globe size={11} className="shrink-0" />
                <span className="font-mono truncate">{source.length > 60 ? source.slice(0, 60) + '...' : source}</span>
              </div>
            )}
            {rawTextLength && (
              <span className="text-[10px] text-muted-foreground/40 shrink-0">
                {rawTextLength.toLocaleString()} chars
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-blue-400" />
          <div>
            <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">
              Research Results
            </h3>
            <p className="text-xs text-muted-foreground">AI-powered web research</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestModel && (
            <span className="text-[10px] font-mono text-muted-foreground bg-white/[0.06] px-2 py-1 rounded">
              {latestModel}
            </span>
          )}
          <Badge variant="outline" className="text-[10px] bg-white/[0.04]">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Search & filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search research results..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition"
          />
        </div>

        {/* Filter row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            {(['all', 'url', 'topic'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setTypeFilter(f); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  typeFilter === f
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/[0.04] text-muted-foreground border border-transparent hover:bg-white/[0.08] hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : f === 'url' ? 'URL Research' : 'Topic Research'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {(['recent', 'alpha'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  sortBy === s
                    ? 'bg-white/[0.1] text-foreground'
                    : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
                }`}
              >
                {s === 'recent' ? 'Most Recent' : 'Alphabetical'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results feed */}
      {paginated.length > 0 ? (
        <div className="space-y-3">
          {paginated.map((item, i) => renderResultCard(item, i))}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Search size={24} className="text-blue-400" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {debouncedQuery || typeFilter !== 'all' ? 'No matching results' : 'No research results yet'}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            {debouncedQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Research will appear here automatically when the browser-research function runs. Trigger research via Telegram, automations, or the API.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-foreground font-semibold">
              Page {page} of {totalPages}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
            </span>
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
