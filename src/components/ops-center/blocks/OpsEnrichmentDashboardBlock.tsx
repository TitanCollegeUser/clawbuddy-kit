import { useOpsData } from "@/hooks/useOpsData";
import { motion } from "framer-motion";
import {
  Search, Mail, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Users, Zap, BarChart3, Clock,
} from "lucide-react";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

export const OpsEnrichmentDashboardBlock = ({ block, appId }: Props) => {
  const { data: allData = [], isLoading } = useOpsData({ appId });

  // Split data by type
  const overview = allData.find((d: any) => d.data?.type === "overview");
  const leads = allData.filter((d: any) => d.data?.type === "enriched_lead");
  const stats = overview?.data || {
    total_leads: 0, processed: 0, enriched: 0, verified_emails: 0,
    no_match: 0, failed: 0, progress_pct: 0, status: "idle",
  };

  const isRunning = stats.status === "running";
  const isComplete = stats.status === "complete";

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search size={22} className="text-cyan-400" />
          <h2 className="text-xl font-bold text-foreground">Lead Enrichment Pipeline</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            isRunning ? "bg-cyan-500/10 text-cyan-400 animate-pulse" :
            isComplete ? "bg-emerald-500/10 text-emerald-400" :
            "bg-white/[0.06] text-muted-foreground"
          }`}>
            {isRunning ? "Running" : isComplete ? "Complete" : stats.status || "Idle"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Zap size={12} className="text-cyan-400" />
          Contact Compass API
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span className="font-medium">{stats.processed} / {stats.total_leads} processed</span>
          <span className="font-semibold text-foreground">{(stats.progress_pct || 0).toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress_pct || 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            style={{ boxShadow: "0 0 20px rgba(6,182,212,0.3)" }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Leads", value: stats.total_leads, icon: Users, color: "text-foreground" },
          { label: "Enriched", value: stats.enriched, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Verified Emails", value: stats.verified_emails, icon: Mail, color: "text-cyan-400" },
          { label: "No Match", value: stats.no_match, icon: AlertTriangle, color: "text-amber-400" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-400" },
          { label: "Rate", value: stats.enriched > 0 ? `${((stats.verified_emails / stats.enriched) * 100).toFixed(0)}%` : "—", icon: BarChart3, color: "text-purple-400" },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={14} className={kpi.color} />
              <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Enriched Leads Feed */}
      {leads.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Mail size={14} className="text-cyan-400" /> Recent Enrichments ({leads.length})
          </h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {leads.slice(0, 50).map((lead: any, idx: number) => {
              const d = lead.data || {};
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.01 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.04] transition-all"
                >
                  <div className={`shrink-0 ${d.email_status === "verified" ? "text-emerald-400" : "text-amber-400"}`}>
                    {d.email_status === "verified" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                      {d.company && (
                        <span className="text-[11px] text-muted-foreground">@ {d.company}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-cyan-400 truncate">{d.email}</span>
                      {d.title && (
                        <span className="text-[11px] text-muted-foreground truncate">{d.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      d.email_status === "verified"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {d.email_status || "unknown"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isRunning && leads.length === 0 && stats.processed === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Pipeline ready</p>
          <p className="text-sm mt-2">Enrichment will begin when the script starts processing leads</p>
        </div>
      )}
    </div>
  );
};
