import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./nova/GlassCard";
import { StatusBadge } from "./nova/StatusBadge";
import { useSequences, useCreateSequence, useDeleteSequence, useTemplates } from "@/hooks/useNova";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { NovaSequenceStep } from "@/types/nova";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const OpsNovaSequencesBlock = ({ block, appId }: Props) => {
  const { data: sequences = [], isLoading } = useSequences();
  const { data: templates = [] } = useTemplates();
  const createSequence = useCreateSequence();
  const deleteSequence = useDeleteSequence();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [seqName, setSeqName] = useState("");
  const [seqDesc, setSeqDesc] = useState("");
  const [steps, setSteps] = useState<NovaSequenceStep[]>([{ step: 1, template_id: "", delay_days: 0, condition: "always" }]);

  const filtered = sequences.filter(s => statusFilter === "all" || s.status === statusFilter);

  function addStep() {
    setSteps([...steps, { step: steps.length + 1, template_id: "", delay_days: 3, condition: "no_reply" }]);
  }

  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
  }

  function updateStep(idx: number, updates: Partial<NovaSequenceStep>) {
    setSteps(steps.map((s, i) => i === idx ? { ...s, ...updates } : s));
  }

  async function handleCreate() {
    await createSequence.mutateAsync({ name: seqName, description: seqDesc || null, steps, status: "draft" });
    setBuilderOpen(false);
    setSeqName(""); setSeqDesc("");
    setSteps([{ step: 1, template_id: "", delay_days: 0, condition: "always" }]);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Email Sequences</h1>
        </div>
        <Button onClick={() => setBuilderOpen(true)} className="bg-violet-600 hover:bg-violet-600/90 shadow-sm shadow-violet-500/20">
          <Plus className="mr-1 h-4 w-4" /> Create Sequence
        </Button>
      </div>

      <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1 w-fit">
        {["all", "draft", "active", "paused", "completed"].map((s) => (
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
            <GitBranch className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No sequences yet</p>
            <Button onClick={() => setBuilderOpen(true)} variant="outline" className="mt-4 border-violet-500/30">
              <Plus className="mr-1 h-4 w-4" /> Build your first sequence
            </Button>
          </div>
        </GlassCard>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
          {filtered.map(seq => (
            <motion.div key={seq.id} variants={item}>
              <GlassCard glow="violet" className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{seq.name}</h3>
                  <StatusBadge status={seq.status as any} />
                </div>
                {seq.description && <p className="text-xs text-muted-foreground">{seq.description}</p>}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">{(seq.steps as any[])?.length || 0} steps</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{seq.total_enrolled} enrolled</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-green-400">{seq.completed_count} completed</span>
                </div>
                {seq.total_enrolled > 0 && (
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(seq.completed_count / seq.total_enrolled) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    />
                  </div>
                )}
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => deleteSequence.mutate(seq.id)} className="h-7 text-xs text-destructive"><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>Create Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Sequence Name</Label>
              <Input value={seqName} onChange={(e) => setSeqName(e.target.value)} placeholder="3-Step Cold Outreach" className="bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={seqDesc} onChange={(e) => setSeqDesc(e.target.value)} placeholder="Initial outreach with follow-ups..." rows={2} className="bg-white/[0.03] border-white/[0.06] text-xs" />
            </div>

            <div className="space-y-3">
              <Label className="text-xs">Steps</Label>
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {idx > 0 && (
                    <div className="flex items-center gap-2 py-2 pl-6">
                      <div className="w-px h-6 border-l-2 border-dashed border-violet-500/30" />
                      <span className="text-[10px] text-muted-foreground">↓ Wait {step.delay_days} days, if {step.condition.replace("_", " ")}</span>
                    </div>
                  )}
                  <GlassCard glow="violet" className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] font-bold text-white shadow-sm shadow-violet-500/30">{step.step}</div>
                      <span className="text-xs font-medium">Step {step.step}</span>
                      {steps.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removeStep(idx)} className="ml-auto h-6 w-6 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label className="text-[10px]">Template</Label>
                        <Select value={step.template_id} onValueChange={(v) => updateStep(idx, { template_id: v })}>
                          <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-xs h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {templates.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Delay (days)</Label>
                        <Input type="number" value={step.delay_days} onChange={(e) => updateStep(idx, { delay_days: Number(e.target.value) })} className="bg-white/[0.03] border-white/[0.06] text-xs h-8" min={0} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Condition</Label>
                        <Select value={step.condition} onValueChange={(v: any) => updateStep(idx, { condition: v })}>
                          <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-xs h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="no_reply">No Reply</SelectItem>
                            <SelectItem value="no_open">No Open</SelectItem>
                            <SelectItem value="no_click">No Click</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
              <Button variant="outline" onClick={addStep} className="w-full border-dashed border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/5">
                <Plus className="mr-1 h-4 w-4" /> Add Step
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setBuilderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!seqName || steps.some(s => !s.template_id)} className="bg-violet-600 hover:bg-violet-600/90 shadow-sm shadow-violet-500/20">Create Sequence</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
