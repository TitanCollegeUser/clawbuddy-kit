import { useState, useMemo } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import {
  Users, Search, ArrowUp, ArrowDown, Linkedin, Globe, Phone, Mail,
  Sparkles, ChevronRight, ExternalLink, CircleDot,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

/* ──────────────── status config ──────────────── */
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  new:             { label: 'New',        dot: 'bg-sky-400',              bg: 'bg-sky-500/15',     text: 'text-sky-400' },
  enriched:        { label: 'Enriched',   dot: 'bg-violet-400',           bg: 'bg-violet-500/15',  text: 'text-violet-400' },
  drafted:         { label: 'Drafted',    dot: 'bg-amber-400',            bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  sent:            { label: 'Sent',       dot: 'bg-indigo-400',           bg: 'bg-indigo-500/15',  text: 'text-indigo-400' },
  opened:          { label: 'Opened',     dot: 'bg-cyan-400 animate-pulse', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  replied:         { label: 'Replied',    dot: 'bg-emerald-400',          bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  meeting_booked:  { label: 'Meeting',    dot: 'bg-emerald-500',          bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  converted:       { label: 'Converted',  dot: 'bg-yellow-400',           bg: 'bg-yellow-500/15',  text: 'text-yellow-400' },
  bounced:         { label: 'Bounced',    dot: 'bg-red-400',              bg: 'bg-red-500/15',     text: 'text-red-400' },
};

const StatusPill = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, dot: 'bg-white/30', bg: 'bg-white/[0.06]', text: 'text-muted-foreground' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ──────────────── enrichment score ──────────────── */
const ENRICH_FIELDS = ['email', 'phone', 'company_website', 'linkedin_profile', 'linkedin_headline', 'bio', 'ai_summary'];

const enrichmentScore = (data: Record<string, unknown>): number => {
  const filled = ENRICH_FIELDS.filter(f => data[f] && String(data[f]).trim()).length;
  return Math.round((filled / ENRICH_FIELDS.length) * 100);
};

const EnrichmentBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'from-emerald-500 to-emerald-400' : score >= 50 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-8 text-right">{score}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-background border-white/[0.1]">
          <p className="text-xs">Data completeness: {score}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ──────────────── main component ──────────────── */
export const OpsEmployeeLeadTableBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, itemType: 'lead' });
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = items || [];
    if (statusFilter) result = result.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => {
        const d = i.data as Record<string, unknown>;
        return (
          i.title.toLowerCase().includes(q) ||
          String(d.email || '').toLowerCase().includes(q) ||
          String(d.company_website || '').toLowerCase().includes(q) ||
          String(d.linkedin_headline || '').toLowerCase().includes(q)
        );
      });
    }
    return [...result].sort((a, b) => {
      const av = sortKey === 'title' ? a.title : sortKey === 'status' ? a.status : a.created_at;
      const bv = sortKey === 'title' ? b.title : sortKey === 'status' ? b.status : b.created_at;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, search, sortKey, sortDir, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (items || []).forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return counts;
  }, [items]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const selItem = (items || []).find(i => i.id === selectedLead);
  const selData = selItem ? (selItem.data as Record<string, unknown>) : null;

  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))' }} />
          </div>
          <div>
            <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">
              {block.title || 'Lead Database'}
            </h3>
            <p className="text-xs text-muted-foreground">{(items || []).length} leads total</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-9 pl-9 glass border-white/[0.08] focus:ring-primary/50 text-sm"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setStatusFilter(null)}
          className={`text-xs px-2.5 py-1 rounded-full transition-all ${
            !statusFilter ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]'
          }`}
        >
          All ({(items || []).length})
        </button>
        {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([st, count]) => {
          const cfg = STATUS_CONFIG[st];
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(statusFilter === st ? null : st)}
              className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                statusFilter === st
                  ? `${cfg?.bg || 'bg-white/[0.08]'} ${cfg?.text || 'text-foreground'} ring-1 ring-white/[0.15]`
                  : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]'
              }`}
            >
              {cfg?.label || st} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_160px_120px_90px_80px] gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
          {[
            { key: 'title', label: 'Lead' },
            { key: 'headline', label: 'Headline' },
            { key: 'status', label: 'Status' },
            { key: 'enrichment', label: 'Data' },
            { key: 'links', label: 'Links' },
          ].map(col => (
            <button
              key={col.key}
              className="text-left font-orbitron text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => col.key !== 'enrichment' && col.key !== 'links' && toggleSort(col.key)}
            >
              {col.label}
              {sortKey === col.key && (
                sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="border border-dashed border-white/[0.08] rounded-lg py-6">
              <CircleDot className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No leads matching your search' : 'No leads yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((item, i) => {
              const d = item.data as Record<string, unknown>;
              const eScore = enrichmentScore(d);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedLead(item.id)}
                  className="grid grid-cols-[1fr_160px_120px_90px_80px] gap-2 px-4 py-3 hover:bg-white/[0.04] cursor-pointer group transition-all duration-200"
                >
                  {/* Lead info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {item.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.email as string || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="flex items-center min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {(d.linkedin_headline as string) || '—'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <StatusPill status={item.status} />
                  </div>

                  {/* Enrichment */}
                  <div className="flex items-center">
                    <EnrichmentBar score={eScore} />
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-1.5">
                    {d.linkedin_profile && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={d.linkedin_profile as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-blue-500/20 flex items-center justify-center text-muted-foreground hover:text-blue-400 transition-all"
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border-white/[0.1]"><p className="text-xs">LinkedIn</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {d.company_website && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={d.company_website as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-emerald-500/20 flex items-center justify-center text-muted-foreground hover:text-emerald-400 transition-all"
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent className="bg-background border-white/[0.1]"><p className="text-xs">Website</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ml-auto" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-background border-white/[0.08]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center text-lg font-bold text-foreground">
                {selItem?.title.charAt(0)}
              </div>
              {selItem?.title}
            </SheetTitle>
            <SheetDescription>{selData?.linkedin_headline as string || 'Lead details'}</SheetDescription>
          </SheetHeader>

          {selData && (
            <div className="mt-4 space-y-4">
              <StatusPill status={selItem?.status || ''} />

              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">Contact</h4>
                <div className="space-y-1.5">
                  {selData.email && (
                    <a href={`mailto:${selData.email}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {selData.email as string}
                    </a>
                  )}
                  {selData.phone && (
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {selData.phone as string}
                    </p>
                  )}
                  {selData.company_website && (
                    <a href={selData.company_website as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {selData.company_website as string}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
                  {selData.linkedin_profile && (
                    <a href={selData.linkedin_profile as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Enrichment */}
              <div>
                <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Data Completeness</h4>
                <EnrichmentBar score={enrichmentScore(selData)} />
              </div>

              {/* Bio */}
              {selData.bio && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Bio</h4>
                  <p className="text-sm text-foreground leading-relaxed">{selData.bio as string}</p>
                </div>
              )}

              {/* AI Summary */}
              {selData.ai_summary && (
                <div className="bg-gradient-to-br from-violet-500/5 to-blue-500/5 border border-violet-500/10 rounded-lg p-3">
                  <h4 className="font-orbitron text-xs uppercase tracking-wider text-violet-400 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> AI Analysis
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">{selData.ai_summary as string}</p>
                </div>
              )}

              {/* Source */}
              {selData.source && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Source:</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06]">{selData.source as string}</span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};
