import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./nova/GlassCard";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useNova";
import { extractVariables } from "@/lib/nova-utils";
import { FileText, Plus, Search, Edit, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { NovaTemplate } from "@/types/nova";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const categories: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Outreach", value: "outreach" },
  { label: "Follow-Up", value: "follow-up" },
  { label: "Nurture", value: "nurture" },
  { label: "Re-engagement", value: "re-engagement" },
  { label: "Meeting Request", value: "meeting-request" },
];

const catBadgeClass: Record<string, string> = {
  outreach: "bg-violet-500/20 text-violet-400",
  "follow-up": "bg-blue-500/20 text-blue-400",
  nurture: "bg-green-500/20 text-green-400",
  "re-engagement": "bg-orange-500/20 text-orange-400",
  "meeting-request": "bg-cyan-500/20 text-cyan-400",
};

const catGlow: Record<string, "violet" | "blue" | "green" | "orange" | "cyan"> = {
  outreach: "violet",
  "follow-up": "blue",
  nurture: "green",
  "re-engagement": "orange",
  "meeting-request": "cyan",
};

const defaultVariables = ["first_name", "company", "pain_point", "custom_1"];

function rateColor(rate: number) {
  if (rate >= 40) return "text-green-400";
  if (rate >= 20) return "text-amber-400";
  return "text-red-400";
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1 } };

export const OpsNovaTemplatesBlock = ({ block, appId }: Props) => {
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NovaTemplate | null>(null);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [cat, setCat] = useState<string>("outreach");
  const [variables, setVariables] = useState<string[]>([]);
  const [customVar, setCustomVar] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const filtered = templates.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openEditor(template?: NovaTemplate) {
    if (template) {
      setEditing(template);
      setName(template.name);
      setSubject(template.subject);
      setBodyHtml(template.body_html);
      setBodyText(template.body_text || "");
      setCat(template.category);
      setVariables(template.variables || []);
    } else {
      setEditing(null);
      setName(""); setSubject(""); setBodyHtml(""); setBodyText("");
      setCat("outreach"); setVariables([]);
    }
    setEditorOpen(true);
  }

  function insertVariable(v: string, target: "subject" | "body") {
    const tag = `{{${v}}}`;
    if (target === "subject") setSubject((s) => s + tag);
    else setBodyHtml((s) => s + tag);
  }

  function addCustomVariable() {
    if (customVar && !variables.includes(customVar)) {
      setVariables([...variables, customVar]);
      setCustomVar("");
    }
  }

  async function handleSave() {
    const allVars = [...new Set([...variables, ...extractVariables(subject + bodyHtml)])];
    const payload = { name, subject, body_html: bodyHtml, body_text: bodyText || null, category: cat, variables: allVars };
    if (editing) {
      await updateTemplate.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createTemplate.mutateAsync(payload);
    }
    setEditorOpen(false);
  }

  function handleDuplicate(t: NovaTemplate) {
    createTemplate.mutate({ ...t, id: undefined, name: `${t.name} (Copy)`, created_at: undefined, updated_at: undefined } as any);
  }

  function renderPreview(html: string) {
    const sampleData: Record<string, string> = { first_name: "John", company: "Acme Corp", pain_point: "manual reporting", custom_1: "Q4 results" };
    let rendered = html;
    for (const [k, v] of Object.entries(sampleData)) {
      rendered = rendered.split(`{{${k}}}`).join(v);
    }
    return rendered;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-violet-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Email Templates</h1>
        </div>
        <Button onClick={() => openEditor()} className="bg-violet-600 hover:bg-violet-600/90 shadow-sm shadow-violet-500/20">
          <Plus className="mr-1 h-4 w-4" /> Create Template
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                category === c.value ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9 bg-white/[0.03] border-white/[0.06]" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <GlassCard key={i} className="h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard glow="violet">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No templates yet</p>
            <Button onClick={() => openEditor()} variant="outline" className="mt-4 border-violet-500/30">
              <Plus className="mr-1 h-4 w-4" /> Create your first template
            </Button>
          </div>
        </GlassCard>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <motion.div key={t.id} variants={item}>
              <GlassCard glow={catGlow[t.category] || "violet"} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium", catBadgeClass[t.category] || "bg-white/5")}>
                    {t.category}
                  </span>
                </div>
                {t.variables?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.variables.slice(0, 4).map((v) => (
                      <span key={v} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400 transition-all hover:bg-violet-500/20">{`{{${v}}}`}</span>
                    ))}
                    {t.variables.length > 4 && <span className="text-[10px] text-muted-foreground">+{t.variables.length - 4}</span>}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-mono">Used {t.usage_count}×</span>
                  <span className={rateColor(t.avg_open_rate)}>Open {t.avg_open_rate}%</span>
                  <span className={rateColor(t.avg_reply_rate * 5)}>Reply {t.avg_reply_rate}%</span>
                </div>
                <div className="flex items-center gap-1 mt-auto pt-2 border-t border-white/[0.06]">
                  <Button size="sm" variant="ghost" onClick={() => openEditor(t)} className="h-7 text-xs hover:text-violet-400"><Edit className="h-3 w-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(t)} className="h-7 text-xs hover:text-cyan-400"><Copy className="h-3 w-3 mr-1" />Copy</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteTemplate.mutate(t.id)} className="h-7 text-xs text-destructive hover:text-destructive"><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-4">
              <div>
                <Label className="text-xs">Template Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cold Outreach v1" className="bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <Label className="text-xs">Subject Line</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick question about {{company}}" className="bg-white/[0.03] border-white/[0.06]" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...defaultVariables, ...variables.filter(v => !defaultVariables.includes(v))].map((v) => (
                    <button key={v} onClick={() => insertVariable(v, "subject")} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400 hover:bg-violet-500/20 transition-all">
                      {`{{${v}}}`}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input value={customVar} onChange={(e) => setCustomVar(e.target.value)} placeholder="custom" className="h-5 w-20 text-[10px] bg-white/[0.03] border-white/[0.06]" onKeyDown={(e) => e.key === "Enter" && addCustomVariable()} />
                    <Button size="sm" variant="ghost" onClick={addCustomVariable} className="h-5 w-5 p-0"><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Email Body (HTML)</Label>
                <Textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} placeholder="<p>Hi {{first_name}},</p>" rows={12} className="bg-white/[0.03] border-white/[0.06] font-mono text-xs" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...defaultVariables, ...variables.filter(v => !defaultVariables.includes(v))].map((v) => (
                    <button key={v} onClick={() => insertVariable(v, "body")} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400 hover:bg-violet-500/20 transition-all">
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Plain Text Fallback (optional)</Label>
                <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Hi {{first_name}}," rows={4} className="bg-white/[0.03] border-white/[0.06] text-xs" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-xs">Category</Label>
                  <Select value={cat} onValueChange={setCat}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.value !== "all").map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Live Preview</Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Sample data</span>
                  <Switch checked={showPreview} onCheckedChange={setShowPreview} />
                </div>
              </div>
              <GlassCard glow="violet" className="min-h-[300px]">
                <div className="mb-3 border-b border-white/[0.06] pb-2">
                  <p className="text-[10px] text-muted-foreground">Subject:</p>
                  <p className="text-xs font-medium">{showPreview ? renderPreview(subject) : subject}</p>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-xs" dangerouslySetInnerHTML={{ __html: showPreview ? renderPreview(bodyHtml) : bodyHtml }} />
              </GlassCard>
              <div>
                <Label className="text-xs">Detected Variables</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {extractVariables(subject + bodyHtml).map((v) => (
                    <span key={v} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">{v}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name || !subject || !bodyHtml} className="bg-violet-600 hover:bg-violet-600/90 shadow-sm shadow-violet-500/20">
              {editing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
