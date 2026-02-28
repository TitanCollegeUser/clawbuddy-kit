import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X, Play, Pause, Phone, User, Building2, Mail, Clock, Hash,
  CheckCircle2, AlertTriangle, Loader2, PhoneCall, PhoneOff,
  BarChart3, ChevronDown, ChevronUp,
} from "lucide-react";
import { StatusDot } from "./StatusDot";
import { formatDuration, formatCost, formatPhone, timeAgo } from "@/lib/lexa-utils";
import { useLeads, useLaunchCampaign, useLeadsRealtime } from "@/hooks/useLexa";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Campaign, LexaLead } from "@/types/lexa";

interface Props {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  idle: "#6b7280",
  running: "hsl(187, 82%, 53%)",
  paused: "hsl(43, 96%, 56%)",
  completed: "hsl(160, 60%, 52%)",
};

const leadStatusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pending: { color: "text-zinc-400", icon: Clock, label: "Pending" },
  calling: { color: "text-cyan-400", icon: PhoneCall, label: "Calling" },
  completed: { color: "text-emerald-400", icon: CheckCircle2, label: "Completed" },
  failed: { color: "text-red-400", icon: AlertTriangle, label: "Failed" },
  skipped: { color: "text-amber-400", icon: PhoneOff, label: "Skipped" },
};

export function CampaignDetailSheet({ campaign, open, onClose }: Props) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const queryClient = useQueryClient();

  const { data: leadsData, isLoading: leadsLoading } = useLeads({
    campaignId: campaign?.id,
    status: statusFilter,
    search: search || undefined,
    limit: 200,
  });

  const leads = leadsData?.leads || [];
  const totalLeads = leadsData?.total || 0;

  const launchCampaign = useLaunchCampaign();

  // Realtime lead updates
  useEffect(() => {
    if (!campaign?.id) return;
    const unsub = useLeadsRealtime(() => {
      queryClient.invalidateQueries({ queryKey: ["lexa-leads"] });
      queryClient.invalidateQueries({ queryKey: ["lexa-campaigns"] });
    });
    return unsub;
  }, [campaign?.id, queryClient]);

  if (!open || !campaign) return null;

  const progress = campaign.total_records > 0
    ? (campaign.calls_made / campaign.total_records) * 100
    : 0;

  const handleLaunch = () => {
    if (campaign.status === "running") return;
    launchCampaign.mutate(campaign.id);
  };

  const handlePause = async () => {
    // Update status to paused in Supabase
    await supabase
      .from("lexa_campaigns")
      .update({ status: "paused" })
      .eq("id", campaign.id);
    queryClient.invalidateQueries({ queryKey: ["lexa-campaigns"] });
  };

  const statusCounts = {
    pending: leads.filter((l) => l.status === "pending").length,
    calling: leads.filter((l) => l.status === "calling").length,
    completed: leads.filter((l) => l.status === "completed").length,
    failed: leads.filter((l) => l.status === "failed").length,
    skipped: leads.filter((l) => l.status === "skipped").length,
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-[hsl(222,47%,6%)] border-l border-white/[0.08] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[hsl(222,47%,6%)]/95 backdrop-blur-xl border-b border-white/[0.08] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{campaign.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <StatusDot color={statusColors[campaign.status] || "#6b7280"} pulse={campaign.status === "running"} />
                  <span className="text-xs font-semibold capitalize" style={{ color: statusColors[campaign.status] }}>
                    {campaign.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {campaign.total_records} leads
                </span>
                <span className="text-xs text-muted-foreground">
                  Created {timeAgo(campaign.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {campaign.status === "running" ? (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-all flex items-center gap-2"
                >
                  <Pause size={14} /> Pause
                </button>
              ) : campaign.status !== "completed" ? (
                <button
                  onClick={handleLaunch}
                  disabled={launchCampaign.isPending}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-500/90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                >
                  {launchCampaign.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  {launchCampaign.isPending ? "Launching..." : "Launch"}
                </button>
              ) : null}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/[0.06] text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{campaign.calls_made} / {campaign.total_records} calls made</span>
              <span className="font-semibold">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: statusColors[campaign.status],
                  boxShadow: `0 0 12px ${statusColors[campaign.status]}40`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Answered", value: campaign.calls_answered, color: "text-emerald-400" },
              { label: "Voicemail", value: campaign.calls_voicemail, color: "text-amber-400" },
              { label: "Failed", value: campaign.calls_failed, color: "text-red-400" },
              { label: "Total Cost", value: formatCost(campaign.total_cost), color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="text-[11px] text-muted-foreground mb-1">{stat.label}</div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {campaign.avg_duration_seconds > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> Avg Duration: <strong className="text-foreground">{formatDuration(campaign.avg_duration_seconds)}</strong>
              </span>
              {campaign.from_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={12} /> From: <strong className="text-foreground">{formatPhone(campaign.from_phone)}</strong>
                </span>
              )}
            </div>
          )}

          {/* AI Prompt (collapsible) */}
          {campaign.ai_prompt && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 size={14} className="text-cyan-400" /> AI Prompt
                </span>
                {showPrompt ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </button>
              {showPrompt && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{campaign.ai_prompt}</p>
                </div>
              )}
            </div>
          )}

          {/* Leads Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User size={14} className="text-cyan-400" /> Leads ({totalLeads})
              </h3>
            </div>

            {/* Status filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setStatusFilter(undefined)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !statusFilter ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                }`}
              >
                All ({campaign.total_records})
              </button>
              {Object.entries(statusCounts).map(([status, count]) => {
                if (count === 0 && status !== "pending") return null;
                const cfg = leadStatusConfig[status];
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? undefined : status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      statusFilter === status ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
                    }`}
                  >
                    {cfg?.label || status} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search leads by name, phone, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-4 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />

            {/* Lead list */}
            {leadsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="animate-spin text-cyan-400" size={20} />
              </div>
            ) : leads.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No leads {statusFilter ? `with status "${statusFilter}"` : "found"}
              </div>
            ) : (
              <div className="space-y-1.5">
                {leads.map((lead, idx) => (
                  <LeadRow key={lead.id} lead={lead} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LeadRow({ lead, index }: { lead: LexaLead; index: number }) {
  const cfg = leadStatusConfig[lead.status] || leadStatusConfig.pending;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.04] transition-all group"
    >
      <Icon size={14} className={cfg.color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
          {lead.company && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Building2 size={10} /> {lead.company}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone size={10} /> {formatPhone(lead.phone)}
          </span>
          {lead.email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={10} /> {lead.email}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        {lead.call_duration_seconds > 0 && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {formatDuration(lead.call_duration_seconds)}
          </div>
        )}
        {lead.attempts > 0 && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
            <Hash size={8} /> {lead.attempts} attempt{lead.attempts > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
}
