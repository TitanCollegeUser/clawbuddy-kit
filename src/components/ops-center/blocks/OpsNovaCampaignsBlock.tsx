import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./nova/GlassCard";
import { StatusBadge } from "./nova/StatusBadge";
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useTemplates, useSequences, useEmails } from "@/hooks/useNova";
import { useOpsData } from "@/hooks/useOpsData";
import { timeAgo } from "@/lib/nova-utils";
import {
  Megaphone, Plus, Mail, FileText, Layers, Clock, Zap, Send,
  ChevronRight, ChevronLeft, Check, Pause, Play, Settings2,
  Download, ArrowUpRight, Eye, MousePointer, MessageSquare, AlertTriangle,
  User, Brain, Gift, Lightbulb, Search, Loader2, CheckCircle, Users, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { NovaCampaign } from "@/types/nova";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const statusGlow: Record<string, "violet" | "cyan" | "green" | "orange" | "blue"> = {
  draft: "blue",
  scheduled: "cyan",
  running: "violet",
  paused: "orange",
  completed: "green",
};

const TIMEZONES = ["America/Vancouver", "America/New_York", "America/Chicago", "America/Denver", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Australia/Sydney"];

// ── ClawBuddy integration ──
const CLAWBUDDY_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tasks`;
const WEBHOOK_SECRET = import.meta.env.VITE_CLAWBUDDY_WEBHOOK_SECRET;

const callClawBuddy = async (payload: Record<string, unknown>) => {
  const res = await fetch(CLAWBUDDY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-secret": WEBHOOK_SECRET },
    body: JSON.stringify(payload),
  });
  return res.json();
};

// ── Personalization levels ──
type PersonalizationLevel = "minimal" | "average" | "full_custom";

const LEVELS: {
  id: PersonalizationLevel;
  label: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow: string;
}[] = [
  {
    id: "minimal",
    label: "Minimal",
    tagline: "Quick & Scalable",
    description: "First name + company name swap. One customized sentence per lead. Best for high-volume outreach.",
    icon: Zap,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
  },
  {
    id: "average",
    label: "Average",
    tagline: "Balanced Touch",
    description: "Pain points identified. 2-3 customized sentences per lead. Good balance of scale and personalization.",
    icon: User,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.25)",
  },
  {
    id: "full_custom",
    label: "Full Custom",
    tagline: "Maximum Impact",
    description: "Completely unique message per lead using LinkedIn insights, bio, and pain points. Best for high-value targets.",
    icon: Brain,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
  },
];

// ── Campaign Detail Sheet ──
function CampaignDetail({ campaign, onClose }: { campaign: NovaCampaign; onClose: () => void }) {
  const updateCampaign = useUpdateCampaign();
  const { data } = useEmails({ campaignId: campaign.id, limit: 10 });
  const emails = data?.emails || [];

  const kpis = [
    { label: "Sent", value: campaign.emails_sent, icon: Send, color: "text-violet-400" },
    { label: "Delivered", value: campaign.emails_delivered || 0, icon: Mail, color: "text-blue-400" },
    { label: "Opened", value: campaign.emails_opened, icon: Eye, color: "text-purple-400" },
    { label: "Clicked", value: campaign.emails_clicked || 0, icon: MousePointer, color: "text-cyan-400" },
    { label: "Replied", value: campaign.emails_replied, icon: MessageSquare, color: "text-green-400" },
    { label: "Bounced", value: campaign.emails_bounced, icon: AlertTriangle, color: "text-orange-400" },
  ];

  const canToggle = campaign.status === "running" || campaign.status === "paused";

  function togglePause() {
    updateCampaign.mutate({
      id: campaign.id,
      status: campaign.status === "running" ? "paused" : "running",
    });
  }

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-card border-white/[0.06] overflow-y-auto p-0">
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
          <SheetHeader className="relative">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{campaign.name}</SheetTitle>
                {campaign.description && <p className="text-xs text-muted-foreground mt-1">{campaign.description}</p>}
              </div>
              <StatusBadge status={campaign.status as any} />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
              <span className="font-mono">{campaign.from_address}</span>
              <span>•</span>
              <span>Created {timeAgo(campaign.created_at)}</span>
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-2">
            {kpis.map(k => (
              <GlassCard key={k.label} className="p-3 text-center" glow="violet">
                <k.icon className={cn("h-3.5 w-3.5 mx-auto mb-1", k.color)} />
                <p className="text-lg font-bold font-mono">{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Progress */}
          {campaign.total_leads > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Progress</span>
                <span className="font-mono">{campaign.emails_sent} / {campaign.total_leads}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(campaign.emails_sent / campaign.total_leads) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                />
              </div>
            </div>
          )}

          {/* Rate badges */}
          <div className="flex gap-2">
            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400 font-mono">Open {campaign.open_rate}%</span>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 font-mono">Click {campaign.click_rate}%</span>
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400 font-mono">Reply {campaign.reply_rate}%</span>
          </div>

          {/* Settings */}
          <GlassCard className="p-4 space-y-2" glow="blue">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">Settings</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Daily Limit</span><span className="font-mono">{campaign.send_limit_per_day}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Window</span><span className="font-mono">{campaign.send_window_start}–{campaign.send_window_end}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Timezone</span><span className="font-mono text-[10px]">{campaign.timezone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Personalization</span><span className="capitalize">{campaign.personalization_level}</span></div>
            </div>
          </GlassCard>

          {/* Linked emails */}
          {emails.length > 0 && (
            <GlassCard className="p-0 overflow-hidden" glow="violet">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-2">Recent Emails</h4>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[10px]">Recipient</TableHead>
                    <TableHead className="text-[10px]">Subject</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map(e => (
                    <TableRow key={e.id} className="border-white/[0.06] hover:bg-violet-500/5">
                      <TableCell className="text-xs">{e.to_name || e.to_address}</TableCell>
                      <TableCell className="text-xs truncate max-w-[180px]">{e.subject}</TableCell>
                      <TableCell><StatusBadge status={e.status as any} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {canToggle && (
              <Button size="sm" variant="outline" onClick={togglePause} className="border-violet-500/30">
                {campaign.status === "running" ? <><Pause className="mr-1 h-3 w-3" /> Pause</> : <><Play className="mr-1 h-3 w-3" /> Resume</>}
              </Button>
            )}
            <Button size="sm" variant="outline" className="border-white/[0.06]">
              <Settings2 className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button size="sm" variant="outline" className="border-white/[0.06]">
              <Download className="mr-1 h-3 w-3" /> Export
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Campaign Creator (Jason-style with Nova UI) ──
function NovaCampaignCreator({ open, onClose, appId }: { open: boolean; onClose: () => void; appId: string }) {
  const createCampaign = useCreateCampaign();
  const [selected, setSelected] = useState<PersonalizationLevel>("average");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [leadMagnet, setLeadMagnet] = useState(false);
  const [leadMagnetIdea, setLeadMagnetIdea] = useState("");
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pull leads from OpsCenter data
  const { data: leads } = useOpsData({ appId, itemType: "lead" });
  const availableLeads = (leads || []).filter(l => ["new", "enriched"].includes(l.status));
  const totalLeads = (leads || []).length;

  function reset() {
    setName(""); setSubject(""); setBody(""); setLeadMagnet(false);
    setLeadMagnetIdea(""); setResearchResult(null); setSelected("average");
  }

  async function handleAIResearch() {
    if (!leadMagnetIdea.trim()) { toast.error("Describe your lead magnet idea first"); return; }
    setResearching(true);
    setResearchResult(null);
    try {
      await callClawBuddy({
        request_type: "question",
        action: "ask",
        question_type: "question",
        priority: "high",
        question: `Research the best lead magnet for a cold email campaign. Idea: "${leadMagnetIdea}". Analyze what would resonate most with B2B prospects. Consider formats (PDF guide, video, tool, template) and topics that drive the highest response rates.`,
      });
      await callClawBuddy({
        request_type: "log",
        action: "create",
        category: "observation",
        message: `Lead magnet research requested for Nova campaign "${name || "Untitled"}". Idea: ${leadMagnetIdea}`,
        agent_name: "Sherlock",
        agent_emoji: "\uD83D\uDD0D",
      });
      setResearchResult(
        `Research queued for AI analysis. Your agent will investigate: "${leadMagnetIdea}" and recommend the best format, angle, and content structure. Check the Questions page for the full analysis.`
      );
      toast.success("AI research task created");
    } catch {
      toast.error("Failed to submit research request");
    } finally {
      setResearching(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error("Campaign name is required"); return; }
    if (!subject.trim()) { toast.error("Subject line is required"); return; }
    setSubmitting(true);
    try {
      const leadCount = availableLeads.length;
      const levelLabel = LEVELS.find(l => l.id === selected)?.label || selected;

      // 1. Create campaign in nova_campaigns
      await createCampaign.mutateAsync({
        name: name.trim(),
        description: `${levelLabel} personalization · ${leadCount} leads · ${leadMagnet ? "With lead magnets" : "No lead magnets"}`,
        from_address: "nova@verticalsystems.io",
        template_id: null,
        sequence_id: null,
        send_limit_per_day: 50,
        send_window_start: "09:00",
        send_window_end: "17:00",
        timezone: "America/Vancouver",
        personalization_level: selected,
        status: "draft",
        total_leads: leadCount,
        subject_template: subject.trim(),
        body_template: body.trim(),
        generate_lead_magnet: leadMagnet,
      });

      // 2. Create a task on ClawBuddy Kanban board
      const taskResult = await callClawBuddy({
        request_type: "task",
        action: "create",
        title: `Draft ${leadCount} ${levelLabel} emails — ${name.trim()}`,
        description: [
          `Campaign: ${name.trim()}`,
          `Personalization: ${levelLabel}`,
          `Leads: ${leadCount} available${leadCount > 0 ? ` (${availableLeads.map(l => l.title).slice(0, 5).join(", ")}${leadCount > 5 ? "..." : ""})` : ""}`,
          `Subject: ${subject.trim()}`,
          leadMagnet ? `Lead Magnet: ${leadMagnetIdea.trim() || "Auto-generate"}` : "",
          "",
          `Draft and personalize cold emails for all ${leadCount} leads in this campaign.`,
          selected === "full_custom" ? "Use each lead's LinkedIn profile, bio, and AI summary for maximum personalization." : "",
        ].filter(Boolean).join("\n"),
        column: "todo",
      });

      // 3. Assign the task
      if (taskResult?.task?.id) {
        await callClawBuddy({
          request_type: "assignee",
          action: "assign",
          task_id: taskResult.task.id,
          names: ["Sherlock", "Mani Kanasani"],
        });
      }

      // 4. Log to ClawBuddy
      await callClawBuddy({
        request_type: "log",
        action: "create",
        category: "observation",
        message: `Nova campaign created: "${name.trim()}" — ${levelLabel} personalization, ${leadCount} leads, ${leadMagnet ? "with lead magnets" : "no lead magnets"}. Task added to Kanban.`,
        agent_name: "Sherlock",
        agent_emoji: "\uD83D\uDD0D",
      });

      toast.success(`Campaign created! Task added for ${leadCount} emails.`);
      reset();
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLevel = LEVELS.find(l => l.id === selected)!;

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-white/[0.06] p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Sparkles className="h-5 w-5 text-violet-400" style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }} />
          </div>
          <div>
            <h3 className="text-base font-semibold uppercase tracking-wider text-foreground">
              Create New Campaign
            </h3>
            <p className="text-xs text-muted-foreground">Configure personalization level and messaging</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Campaign Name *</Label>
            <Input
              className="h-10 bg-white/[0.03] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/30"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Skool Community Launch"
            />
          </div>

          {/* Personalization Level Cards */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Personalization Level</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {LEVELS.map((level, i) => {
                const Icon = level.icon;
                const isSelected = selected === level.id;
                return (
                  <motion.button
                    key={level.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setSelected(level.id)}
                    className={cn(
                      "relative text-left rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer",
                      isSelected
                        ? "border-opacity-80 bg-white/[0.06]"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]"
                    )}
                    style={{
                      borderColor: isSelected ? level.color : undefined,
                      boxShadow: isSelected ? `0 0 20px ${level.glow}, inset 0 1px 0 rgba(255,255,255,0.06)` : undefined,
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute inset-0 rounded-xl opacity-10 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 0%, ${level.color} 0%, transparent 70%)` }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${level.color}20`,
                            boxShadow: isSelected ? `0 0 10px ${level.glow}` : undefined,
                          }}
                        >
                          <Icon className="h-4 w-4" style={{ color: level.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground uppercase tracking-wider">{level.label}</p>
                          <p className="text-xs text-muted-foreground">{level.tagline}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">{level.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Lead Magnet Toggle + Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <Gift className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Generate Lead Magnets</p>
                  <p className="text-xs text-muted-foreground">Auto-create personalized resources for each lead</p>
                </div>
              </div>
              <Switch checked={leadMagnet} onCheckedChange={setLeadMagnet} />
            </div>

            <AnimatePresence>
              {leadMagnet && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-emerald-400" />
                      <Label className="text-xs uppercase tracking-wider text-emerald-400">What's the lead magnet?</Label>
                    </div>
                    <Textarea
                      className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:ring-emerald-500/50 focus:border-emerald-500/30 resize-none"
                      value={leadMagnetIdea}
                      onChange={e => setLeadMagnetIdea(e.target.value)}
                      placeholder='e.g. A PDF guide on "5 AI SDR Playbooks That Book 3x More Meetings" or a free ROI calculator'
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      onClick={handleAIResearch}
                      disabled={researching}
                    >
                      {researching ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Researching...</>
                      ) : (
                        <><Search className="h-4 w-4" /> AI Research — Find Best Lead Magnet</>
                      )}
                    </Button>
                    <AnimatePresence>
                      {researchResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/15"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-300/80 leading-relaxed">{researchResult}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subject Line Template */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Subject Line Template</Label>
            <Input
              className="h-10 bg-white/[0.03] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/30"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. {{first_name}}, quick question about {{company}}"
            />
            <p className="text-xs text-muted-foreground">
              Use {"{{first_name}}"}, {"{{company}}"}, {"{{pain_point}}"} as merge tags
            </p>
          </div>

          {/* Body Template */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Body Template</Label>
            <Textarea
              className="min-h-[120px] bg-white/[0.03] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/30 resize-none"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={
                selected === "minimal"
                  ? "Hey {{first_name}},\n\nI noticed {{company}} is growing fast. Quick question — are you using AI to automate outreach yet?\n\nWorth a quick chat?"
                  : selected === "average"
                  ? "Hey {{first_name}},\n\n{{pain_point_opener}}\n\n{{custom_sentences}}\n\nWould love to show you how we solve this."
                  : "This will be fully generated per lead using their LinkedIn profile, bio, and pain points."
              }
            />
            {selected === "full_custom" && (
              <p className="text-xs text-amber-400/80">
                Full custom mode generates a unique message for each lead — template is used as a guide only.
              </p>
            )}
          </div>

          {/* Lead Count + Summary Bar */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Target leads</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-foreground">{availableLeads.length} <span className="text-green-400 font-normal">ready</span></p>
                <p className="text-xs text-muted-foreground">{totalLeads} total in database</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedLevel.color, boxShadow: `0 0 8px ${selectedLevel.glow}` }}
              />
              <p className="text-xs text-muted-foreground flex-1">
                <span className="text-foreground font-medium">{selectedLevel.label}</span> personalization
                {leadMagnet && " + Lead Magnets"}
                {" · "}
                <span className="text-foreground">{availableLeads.length} emails</span> to draft
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
              <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Creates campaign + adds a task to the Kanban board for Claude Code to draft all emails</span>
            </div>
          </div>

          {/* Create Button */}
          <Button
            className="w-full h-12 gap-2 text-sm uppercase tracking-wider bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all"
            onClick={handleCreate}
            disabled={submitting || availableLeads.length === 0}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating Campaign...</>
            ) : (
              <><Send className="h-4 w-4" /> Create Campaign — {availableLeads.length} Leads</>
            )}
          </Button>
          {availableLeads.length === 0 && (
            <p className="text-xs text-center text-amber-400/80">
              No leads with "new" or "enriched" status. Add leads to the app first.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Block ──
export const OpsNovaCampaignsBlock = ({ block, appId }: Props) => {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<NovaCampaign | null>(null);

  const filtered = campaigns.filter(c => statusFilter === "all" || c.status === statusFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Email Campaigns</h1>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-shadow">
          <Plus className="mr-1 h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1 w-fit">
        {["all", "draft", "scheduled", "running", "paused", "completed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize", statusFilter === s ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => <GlassCard key={i} className="h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard glow="violet">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No campaigns yet</p>
            <Button onClick={() => setWizardOpen(true)} variant="outline" className="mt-4 border-violet-500/30"><Plus className="mr-1 h-4 w-4" /> Launch your first campaign</Button>
          </div>
        </GlassCard>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
          {filtered.map(c => (
            <motion.div key={c.id} variants={item}>
              <GlassCard
                glow={statusGlow[c.status] || "violet"}
                className="p-5 space-y-3 cursor-pointer group"
                onClick={() => setSelectedCampaign(c)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm group-hover:text-violet-400 transition-colors">{c.name}</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status as any} />
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                {c.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{c.description}</p>}
                {c.total_leads > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.emails_sent / c.total_leads) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.emails_sent} / {c.total_leads} sent</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="font-mono">{c.emails_opened} opened</span>
                  <span className="text-green-400">{c.emails_replied} replied</span>
                  <span className="text-orange-400">{c.emails_bounced} bounced</span>
                  <span className="text-cyan-400">{c.meetings_booked} meetings</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-violet-400 font-mono">Open {c.open_rate}%</span>
                  <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-green-400 font-mono">Reply {c.reply_rate}%</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <NovaCampaignCreator open={wizardOpen} onClose={() => setWizardOpen(false)} appId={appId} />
      {selectedCampaign && <CampaignDetail campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />}
    </motion.div>
  );
};
