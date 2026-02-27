import { useState } from "react";
import { Megaphone, Play, Pause, Download, Loader2 } from "lucide-react";
import { StatusDot } from "./lexa/StatusDot";
import { formatCost, formatDuration } from "@/lib/lexa-utils";
import { motion } from "framer-motion";
import { useCampaigns } from "@/hooks/useLexa";
import { CampaignBuilderSheet } from "./lexa/CampaignBuilderSheet";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const campaignStatusColor: Record<string, string> = {
  idle: '#6b7280',
  running: 'hsl(187, 82%, 53%)',
  paused: 'hsl(43, 96%, 56%)',
  completed: 'hsl(160, 60%, 52%)',
};

export const OpsLexaCampaignsBlock = ({ block, appId }: Props) => {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone size={22} className="text-cyan-400" />
          <h2 className="text-xl font-bold text-foreground">Campaigns</h2>
          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-semibold">
            {campaigns.filter(c => c.status === 'running').length} active
          </span>
        </div>
        <button
          onClick={() => setBuilderOpen(true)}
          className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-500/90 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
        >
          New Campaign
        </button>
      </div>

      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />

      {isLoading ? (
        <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={24} /></div>
      ) : campaigns.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No campaigns yet</p>
          <p className="text-sm mt-2">Create your first campaign to start bulk outreach</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {campaigns.map((campaign, idx) => {
            const progress = campaign.total_records > 0 ? (campaign.calls_made / campaign.total_records) * 100 : 0;
            return (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.08)] p-6 group hover:scale-[1.01] transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">{campaign.name}</h3>
                    <div className="flex items-center gap-2">
                      <StatusDot color={campaignStatusColor[campaign.status]} pulse={campaign.status === 'running'} />
                      <span className="text-xs font-semibold capitalize" style={{ color: campaignStatusColor[campaign.status] }}>{campaign.status}</span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span className="font-medium">{campaign.calls_made} / {campaign.total_records} calls</span>
                      <span className="font-semibold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${progress}%`, backgroundColor: campaignStatusColor[campaign.status], boxShadow: `0 0 12px ${campaignStatusColor[campaign.status]}40` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      ['Answered', campaign.calls_answered, 'text-emerald-400'],
                      ['Voicemail', campaign.calls_voicemail, 'text-amber-400'],
                      ['Failed', campaign.calls_failed, 'text-red-400'],
                      ['Avg Duration', formatDuration(campaign.avg_duration_seconds), 'text-muted-foreground'],
                    ].map(([label, value, color]) => (
                      <div key={label as string} className="text-sm">
                        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                        <div className={`font-bold ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-base font-bold text-foreground">{formatCost(campaign.total_cost)}</span>
                    <div className="flex gap-2">
                      {campaign.status === 'running' ? (
                        <button className="p-2 rounded-xl hover:bg-white/[0.06] text-amber-400 transition-colors"><Pause size={15} /></button>
                      ) : campaign.status !== 'completed' ? (
                        <button className="p-2 rounded-xl hover:bg-white/[0.06] text-cyan-400 transition-colors"><Play size={15} /></button>
                      ) : null}
                      <button className="p-2 rounded-xl hover:bg-white/[0.06] text-muted-foreground transition-colors"><Download size={15} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
