import { useState } from "react";
import { Search, Phone, PhoneIncoming, PhoneOutgoing, Megaphone, Loader2, X } from "lucide-react";
import { GlassCard } from "./lexa/GlassCard";
import { StatusDot } from "./lexa/StatusDot";
import { formatDuration, formatCost, formatPhone, timeAgo, statusColors, statusLabels, sentimentColors } from "@/lib/lexa-utils";
import { useCalls, useCallDetail } from "@/hooks/useLexa";
import { motion, AnimatePresence } from "framer-motion";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

export const OpsLexaCallLogBlock = ({ block, appId }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const perPage = 20;

  const { data, isLoading } = useCalls({
    limit: perPage,
    offset: page * perPage,
    status: statusFilter !== "all" ? statusFilter : undefined,
    callType: typeFilter !== "all" ? typeFilter : undefined,
    search: search || undefined,
    sortBy: "created_at",
    sortDir: "desc",
  });

  const { data: callDetail, isLoading: detailLoading } = useCallDetail(selectedSessionId || undefined);

  const calls = data?.calls || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / perPage);

  const directionIcon = (type: string) => {
    if (type === 'inbound') return <PhoneIncoming size={15} className="text-blue-400" />;
    if (type === 'outbound') return <PhoneOutgoing size={15} className="text-cyan-400" />;
    return <Megaphone size={15} className="text-purple-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header + count */}
      <div className="flex items-center gap-3">
        <Phone size={22} className="text-cyan-400" />
        <h2 className="text-xl font-bold text-foreground">Call Log</h2>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 font-semibold px-2.5 py-1 rounded-full">{totalCount} calls</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by phone, summary, or session ID..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all">
          <option value="all">All Status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all">
          <option value="all">All Types</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
          <option value="campaign">Campaign</option>
        </select>
      </div>

      {/* Call Detail Panel */}
      <AnimatePresence>
        {selectedSessionId && callDetail && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard glow className="relative">
              <button onClick={() => setSelectedSessionId(null)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition">
                <X size={16} />
              </button>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <StatusDot color={statusColors[callDetail.call_status] || '#666'} pulse />
                <span className="text-lg font-mono font-bold text-foreground">{formatPhone(callDetail.caller_number || 'Unknown')}</span>
                <span className="text-sm text-muted-foreground">{formatDuration(callDetail.duration_seconds)}</span>
                <span className="text-sm text-muted-foreground">{formatCost(callDetail.total_cost)}</span>
                <span className="text-xs capitalize font-semibold px-2 py-0.5 rounded-full" style={{ color: sentimentColors[callDetail.sentiment], backgroundColor: `${sentimentColors[callDetail.sentiment]}15` }}>{callDetail.sentiment}</span>
              </div>
              {callDetail.summary && <p className="text-sm text-muted-foreground mb-4 italic">{callDetail.summary}</p>}
              {Array.isArray(callDetail.transcript) && callDetail.transcript.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                  {callDetail.transcript.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20 text-foreground' : 'bg-white/[0.05] border border-white/[0.08] text-foreground'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">{msg.role === 'user' ? 'Caller:' : 'Lexa:'}</span>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={24} /></div>
        ) : calls.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            {search || statusFilter !== "all" || typeFilter !== "all" ? "No calls match your filters" : "No calls yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12"></th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sentiment</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Latency</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(call => (
                  <tr key={call.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors ${selectedSessionId === call.session_id ? 'bg-cyan-500/[0.06]' : ''}`}
                    onClick={() => setSelectedSessionId(selectedSessionId === call.session_id ? null : call.session_id)}>
                    <td className="px-4 py-3"><StatusDot color={statusColors[call.call_status] || '#666'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {directionIcon(call.call_type)}
                        <span className="text-xs capitalize text-muted-foreground font-medium">{call.call_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{formatPhone(call.caller_number || 'Unknown')}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDuration(call.duration_seconds)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize font-medium px-2 py-0.5 rounded-full"
                        style={{ color: sentimentColors[call.sentiment], backgroundColor: `${sentimentColors[call.sentiment]}15` }}>{call.sentiment}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{(call.call_metrics as any)?.utterance_latency?.avg || '-'}ms</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-medium">{formatCost(call.total_cost)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[220px] truncate">{call.summary || '-'}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{timeAgo(call.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
            <span className="text-xs text-muted-foreground font-medium">
              Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white/[0.05] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all hover:bg-white/[0.08]">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-white/[0.05] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all hover:bg-white/[0.08]">Next</button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
