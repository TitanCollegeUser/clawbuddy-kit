import { useState, useEffect } from "react";
import { Users, Search, Phone, Mail, Building2, Clock, Loader2, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { StatusDot } from "./lexa/StatusDot";
import { formatDuration } from "@/lib/lexa-utils";
import { useLeads, useCampaigns, useLeadsRealtime } from "@/hooks/useLexa";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { OpsBlock } from "@/hooks/useOpsBlocks";
import type { LexaLead } from "@/types/lexa";

interface Props { block: OpsBlock; appId: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  pending:   { label: "Pending",   color: "#6b7280", bg: "bg-gray-500/10",    text: "text-gray-400"    },
  calling:   { label: "Calling",   color: "hsl(187, 82%, 53%)", bg: "bg-cyan-500/10", text: "text-cyan-400"  },
  completed: { label: "Completed", color: "hsl(160, 60%, 52%)", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  failed:    { label: "Failed",    color: "#ef4444", bg: "bg-red-500/10",     text: "text-red-400"     },
  skipped:   { label: "Skipped",   color: "#f59e0b", bg: "bg-amber-500/10",   text: "text-amber-400"   },
};

const RESULT_LABELS: Record<string, string> = {
  answered: "Answered",
  voicemail: "Voicemail",
  failed: "Failed",
  "no-answer": "No Answer",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  neutral: "text-gray-400",
  negative: "text-red-400",
};

export const OpsLexaLeadsBlock = ({ block, appId }: Props) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [campaignFilter, setCampaignFilter] = useState<string | undefined>();
  const [selectedLead, setSelectedLead] = useState<LexaLead | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 30;

  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData || [];

  const { data, isLoading } = useLeads({
    campaignId: campaignFilter,
    status: statusFilter,
    search: search || undefined,
    limit: perPage,
    offset: page * perPage,
  });

  const leads = data?.leads || [];
  const total = data?.total || 0;

  // Realtime updates
  useEffect(() => {
    const unsub = useLeadsRealtime(() => {
      queryClient.invalidateQueries({ queryKey: ["lexa-leads"] });
    });
    return unsub;
  }, [queryClient]);

  // Count leads per status (from current filtered set totals — approximate)
  const statusCounts: Record<string, number> = {};
  leads.forEach((l) => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-cyan-400" />
          <h2 className="text-xl font-bold text-foreground">Leads</h2>
          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-semibold">
            {total}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Campaign filter */}
          {campaigns.length > 0 && (
            <select
              value={campaignFilter || ""}
              onChange={(e) => { setCampaignFilter(e.target.value || undefined); setPage(0); }}
              className="text-xs bg-white/[0.03] border border-white/[0.08] text-foreground rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search leads..."
              className="pl-9 w-48 bg-white/[0.03] border-white/[0.08] text-sm h-9"
            />
          </div>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter(undefined); setPage(0); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            !statusFilter
              ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
              : "bg-white/[0.03] text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(statusFilter === key ? undefined : key); setPage(0); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              statusFilter === key
                ? `${cfg.bg} ${cfg.text} ring-1 ring-current/30`
                : "bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            <StatusDot color={cfg.color} pulse={key === "calling"} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
        </div>
      ) : leads.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No leads found</p>
          <p className="text-sm mt-2">Upload leads through the Campaign Builder</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["Name", "Phone", "Company", "Status", "Result", "Duration", "Sentiment", "Attempts"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => {
                  const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.pending;
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedLead(lead)}
                      className="border-b border-white/[0.04] last:border-none hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{lead.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{lead.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{lead.company || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                          <StatusDot color={sc.color} pulse={lead.status === "calling"} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {lead.call_result ? RESULT_LABELS[lead.call_result] || lead.call_result : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {lead.call_duration_seconds > 0 ? formatDuration(Number(lead.call_duration_seconds)) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {lead.call_sentiment ? (
                          <span className={`text-xs font-medium capitalize ${SENTIMENT_COLORS[lead.call_sentiment] || "text-gray-400"}`}>
                            {lead.call_sentiment}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground text-center">
                        {lead.attempts}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > perPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <span className="text-xs text-muted-foreground">
                {page * perPage + 1}–{Math.min((page + 1) * perPage, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * perPage >= total}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-lg border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-2xl overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="text-foreground">{selectedLead.name}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const sc = STATUS_CONFIG[selectedLead.status] || STATUS_CONFIG.pending;
                    return (
                      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${sc.bg} ${sc.text}`}>
                        <StatusDot color={sc.color} pulse={selectedLead.status === "calling"} />
                        {sc.label}
                      </span>
                    );
                  })()}
                  {selectedLead.call_result && (
                    <span className="text-xs text-muted-foreground">
                      Result: {RESULT_LABELS[selectedLead.call_result] || selectedLead.call_result}
                    </span>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-cyan-400" />
                    <span className="text-sm font-mono text-foreground">{selectedLead.phone}</span>
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-cyan-400" />
                      <span className="text-sm text-foreground">{selectedLead.email}</span>
                    </div>
                  )}
                  {selectedLead.company && (
                    <div className="flex items-center gap-3">
                      <Building2 size={14} className="text-cyan-400" />
                      <span className="text-sm text-foreground">{selectedLead.company}</span>
                    </div>
                  )}
                </div>

                {/* Call Details */}
                {selectedLead.call_session_id && (
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare size={14} className="text-cyan-400" />
                      Call Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDuration(Number(selectedLead.call_duration_seconds))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sentiment</p>
                        <p className={`text-sm font-medium capitalize ${SENTIMENT_COLORS[selectedLead.call_sentiment || ""] || "text-gray-400"}`}>
                          {selectedLead.call_sentiment || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Attempts</p>
                        <p className="text-sm font-medium text-foreground">{selectedLead.attempts}</p>
                      </div>
                      {selectedLead.last_attempt_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">Last Attempt</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(selectedLead.last_attempt_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedLead.call_summary && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Summary</p>
                        <p className="text-sm text-foreground/80">{selectedLead.call_summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Fields */}
                {Object.keys(selectedLead.custom_fields || {}).length > 0 && (
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <h4 className="text-sm font-semibold text-foreground">Custom Fields</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedLead.custom_fields).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-xs text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm text-foreground">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} />
                  Created {new Date(selectedLead.created_at).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
