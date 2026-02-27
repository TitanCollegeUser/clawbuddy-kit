import { useState, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateCampaign, useCreateLeadsBatch, useLaunchCampaign } from "@/hooks/useLexa";
import type { LexaLead } from "@/types/lexa";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Upload, FileSpreadsheet, X, ChevronRight, ChevronLeft,
  Sparkles, Phone, Clock, RotateCcw, AlertTriangle, Rocket, Check,
  Variable,
} from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedLead {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  custom_fields: Record<string, string>;
}

const STEPS = ["Setup", "Upload Leads", "Preview & Launch"];

const DEFAULT_VARIABLES = ["name", "company", "email", "phone"];

export const CampaignBuilderSheet = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createCampaign = useCreateCampaign();
  const createLeadsBatch = useCreateLeadsBatch();
  const launchCampaign = useLaunchCampaign();

  // Step management
  const [step, setStep] = useState(0);

  // Step 1: Campaign Setup
  const [campaignName, setCampaignName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [callDelay, setCallDelay] = useState(5);
  const [maxRetries, setMaxRetries] = useState(0);

  // Step 2: Upload
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Step 3: Launch state
  const [isLaunching, setIsLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const allVariables = [...DEFAULT_VARIABLES, ...customHeaders];

  const resetForm = () => {
    setStep(0);
    setCampaignName("");
    setAiPrompt("");
    setCallDelay(5);
    setMaxRetries(0);
    setParsedLeads([]);
    setCustomHeaders([]);
    setFileName("");
    setParseErrors([]);
    setIsLaunching(false);
    setLaunched(false);
  };

  // ── Variable pill insertion ──────────────────────────────────────
  const insertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const tag = `{{${varName}}}`;
    const newText = aiPrompt.slice(0, start) + tag + aiPrompt.slice(end);
    setAiPrompt(newText);
    // Restore cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // ── File parsing ─────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          setParseErrors(["File has no data rows (need at least a header + 1 data row)"]);
          return;
        }

        const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());

        // Auto-detect standard columns
        const nameCol = headers.findIndex((h) =>
          ["name", "full name", "fullname", "contact", "lead name", "lead"].includes(h)
        );
        const phoneCol = headers.findIndex((h) =>
          ["phone", "phone number", "mobile", "cell", "tel", "telephone", "number"].includes(h)
        );
        const emailCol = headers.findIndex((h) =>
          ["email", "e-mail", "email address", "mail"].includes(h)
        );
        const companyCol = headers.findIndex((h) =>
          ["company", "organization", "org", "business", "company name"].includes(h)
        );

        if (nameCol === -1 || phoneCol === -1) {
          setParseErrors([
            `Could not find required columns. Found: [${headers.join(", ")}].`,
            'Need at least "Name" and "Phone" columns.',
          ]);
          return;
        }

        // Remaining headers become custom fields
        const mappedCols = new Set([nameCol, phoneCol, emailCol, companyCol]);
        const customCols: { index: number; header: string }[] = [];
        headers.forEach((h, i) => {
          if (!mappedCols.has(i) && h) {
            // Sanitize header for variable usage
            const clean = h.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
            customCols.push({ index: i, header: clean });
          }
        });
        setCustomHeaders(customCols.map((c) => c.header));

        const errors: string[] = [];
        const leads: ParsedLead[] = [];

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.every((cell) => !cell)) continue; // skip empty rows

          const name = String(row[nameCol] || "").trim();
          const phone = String(row[phoneCol] || "").trim();

          if (!phone) {
            errors.push(`Row ${r + 1}: missing phone number`);
            continue;
          }
          if (!name) {
            errors.push(`Row ${r + 1}: missing name`);
            continue;
          }

          const custom: Record<string, string> = {};
          customCols.forEach((c) => {
            const val = String(row[c.index] || "").trim();
            if (val) custom[c.header] = val;
          });

          leads.push({
            name,
            phone,
            email: emailCol >= 0 ? String(row[emailCol] || "").trim() || undefined : undefined,
            company: companyCol >= 0 ? String(row[companyCol] || "").trim() || undefined : undefined,
            custom_fields: custom,
          });
        }

        setParsedLeads(leads);
        setParseErrors(errors);

        if (leads.length === 0) {
          setParseErrors([...errors, "No valid leads found in file."]);
        }
      } catch (err: any) {
        setParseErrors([`Failed to parse file: ${err.message}`]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── Prompt preview with sample data ──────────────────────────────
  const getPromptPreview = () => {
    let preview = aiPrompt;
    const sampleLead = parsedLeads[0] || {
      name: "John Smith",
      phone: "+1234567890",
      email: "john@example.com",
      company: "Acme Corp",
      custom_fields: customHeaders.reduce((acc, h) => ({ ...acc, [h]: `[${h}]` }), {}),
    };

    preview = preview.replace(/\{\{name\}\}/g, sampleLead.name);
    preview = preview.replace(/\{\{phone\}\}/g, sampleLead.phone);
    preview = preview.replace(/\{\{email\}\}/g, sampleLead.email || "");
    preview = preview.replace(/\{\{company\}\}/g, sampleLead.company || "");

    const cf = sampleLead.custom_fields || {};
    for (const [key, val] of Object.entries(cf)) {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val));
    }

    return preview;
  };

  // ── Launch ───────────────────────────────────────────────────────
  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      // 1. Create campaign record
      const promptVars = allVariables.filter((v) => aiPrompt.includes(`{{${v}}}`));
      const campaign = await createCampaign.mutateAsync({
        name: campaignName,
        status: "idle",
        total_records: parsedLeads.length,
        ai_prompt: aiPrompt,
        prompt_variables: promptVars,
        from_phone: "+17787439520",
        agent_id: "-OmNNf485Na8Bw82RSfz",
        call_delay_seconds: callDelay,
        max_retries: maxRetries,
      });

      // 2. Batch insert leads
      const leadsToInsert = parsedLeads.map((l) => ({
        campaign_id: campaign.id,
        name: l.name,
        phone: l.phone,
        email: l.email,
        company: l.company,
        custom_fields: l.custom_fields,
        status: "pending" as const,
      }));
      await createLeadsBatch.mutateAsync(leadsToInsert);

      // 3. Launch campaign
      await launchCampaign.mutateAsync(campaign.id);

      setLaunched(true);
      toast({
        title: "Campaign Launched!",
        description: `${campaignName} — calling ${parsedLeads.length} leads`,
      });

      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Launch failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const canProceedStep0 = campaignName.trim().length > 0 && aiPrompt.trim().length > 0;
  const canProceedStep1 = parsedLeads.length > 0;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-foreground">
            <Megaphone size={20} className="text-cyan-400" />
            New Campaign
          </SheetTitle>
        </SheetHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-6 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? "bg-cyan-500 text-white"
                    : i === step
                    ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50"
                    : "bg-white/[0.05] text-muted-foreground"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  i === step ? "text-cyan-400" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? "bg-cyan-500" : "bg-white/[0.08]"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 0: Campaign Setup ─────────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Campaign Name */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Campaign Name
                </label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Q1 Lead Qualification"
                  className="bg-white/[0.03] border-white/[0.08] text-foreground"
                />
              </div>

              {/* AI Prompt Editor */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-400" />
                  AI Prompt
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Write instructions for Lexa. Use variables like{" "}
                  <code className="text-cyan-400">{"{{name}}"}</code> to personalize each call.
                </p>
                <Textarea
                  ref={textareaRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`You are calling {{name}} from {{company}}. Your goal is to introduce our AI automation services and qualify their interest.\n\nKey points:\n- Ask about their current workflow challenges\n- Mention how AI can save them 10+ hours/week\n- If interested, offer to schedule a demo call`}
                  className="min-h-[180px] bg-white/[0.03] border-white/[0.08] text-foreground font-mono text-sm"
                />

                {/* Variable pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground mr-1 pt-1">
                    <Variable size={12} className="inline mr-1" />
                    Insert:
                  </span>
                  {allVariables.map((v) => (
                    <button
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="px-2.5 py-1 text-xs font-mono rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>

                {/* Prompt preview */}
                {aiPrompt && (
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Preview (sample data):</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {getPromptPreview()}
                    </p>
                  </div>
                )}
              </div>

              {/* Call Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    Delay Between Calls (s)
                  </label>
                  <Input
                    type="number"
                    value={callDelay}
                    onChange={(e) => setCallDelay(parseInt(e.target.value) || 5)}
                    min={1}
                    max={60}
                    className="bg-white/[0.03] border-white/[0.08] text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <RotateCcw size={14} className="text-muted-foreground" />
                    Max Retries
                  </label>
                  <Input
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(parseInt(e.target.value) || 0)}
                    min={0}
                    max={3}
                    className="bg-white/[0.03] border-white/[0.08] text-foreground"
                  />
                </div>
              </div>

              {/* Next button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                  className="bg-cyan-500 hover:bg-cyan-500/90 text-white gap-2 shadow-lg shadow-cyan-500/20"
                >
                  Next: Upload Leads <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Upload Leads ───────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Drag and drop area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-cyan-400 bg-cyan-500/10"
                    : fileName
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {fileName ? (
                  <div className="space-y-2">
                    <FileSpreadsheet size={40} className="mx-auto text-emerald-400" />
                    <p className="text-sm font-semibold text-foreground">{fileName}</p>
                    <p className="text-xs text-emerald-400 font-medium">
                      {parsedLeads.length} leads parsed
                      {parseErrors.length > 0 && (
                        <span className="text-amber-400 ml-2">
                          ({parseErrors.length} warning{parseErrors.length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName("");
                        setParsedLeads([]);
                        setCustomHeaders([]);
                        setParseErrors([]);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Replace file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={40} className="mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Drop Excel or CSV file here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requires <strong>Name</strong> and <strong>Phone</strong> columns.
                      Email, Company, and custom columns are optional.
                    </p>
                  </div>
                )}
              </div>

              {/* Parse errors */}
              {parseErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Warnings</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {parseErrors.slice(0, 10).map((err, i) => (
                      <p key={i} className="text-xs text-amber-400/80">{err}</p>
                    ))}
                    {parseErrors.length > 10 && (
                      <p className="text-xs text-amber-400/60">
                        ...and {parseErrors.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Column mapping preview */}
              {parsedLeads.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">
                    Detected Columns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["name", "phone"].map((col) => (
                      <span
                        key={col}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      >
                        {col} *
                      </span>
                    ))}
                    {parsedLeads[0]?.email !== undefined && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/[0.05] text-foreground/70">
                        email
                      </span>
                    )}
                    {parsedLeads[0]?.company !== undefined && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/[0.05] text-foreground/70">
                        company
                      </span>
                    )}
                    {customHeaders.map((h) => (
                      <span
                        key={h}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  {customHeaders.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Custom columns available as{" "}
                      {customHeaders.map((h) => (
                        <code key={h} className="text-violet-400 mr-1">{`{{${h}}}`}</code>
                      ))}{" "}
                      in your prompt.
                    </p>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(0)}
                  className="text-muted-foreground gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="bg-cyan-500 hover:bg-cyan-500/90 text-white gap-2 shadow-lg shadow-cyan-500/20"
                >
                  Next: Preview <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Preview & Launch ────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Campaign summary */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4">
                <h3 className="text-lg font-bold text-foreground">{campaignName}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{parsedLeads.length}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{callDelay}s</p>
                    <p className="text-xs text-muted-foreground">Delay</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{maxRetries}</p>
                    <p className="text-xs text-muted-foreground">Retries</p>
                  </div>
                </div>
              </div>

              {/* Prompt preview */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-foreground">AI Prompt Preview</span>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap font-mono bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                  {getPromptPreview()}
                </p>
              </div>

              {/* Lead preview table */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-semibold text-foreground">
                    Lead Preview (first {Math.min(10, parsedLeads.length)})
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2">Name</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2">Phone</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2">Company</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedLeads.slice(0, 10).map((lead, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/[0.04] last:border-none"
                        >
                          <td className="px-4 py-2.5 text-sm text-foreground">{lead.name}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground font-mono text-xs">{lead.phone}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{lead.company || "—"}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{lead.email || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedLeads.length > 10 && (
                  <div className="px-5 py-2 text-xs text-muted-foreground text-center border-t border-white/[0.04]">
                    +{parsedLeads.length - 10} more leads
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                <Phone size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    This will start calling {parsedLeads.length} leads
                  </p>
                  <p className="text-xs text-amber-400/70 mt-1">
                    Calls will be made from +1 (778) 743-9520 with a {callDelay}s delay between each call.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  disabled={isLaunching || launched}
                  className="text-muted-foreground gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </Button>

                {launched ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Check size={18} /> Campaign Launched!
                  </div>
                ) : (
                  <Button
                    onClick={handleLaunch}
                    disabled={isLaunching}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-500/90 hover:to-cyan-600/90 text-white gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {isLaunching ? (
                      <>
                        <span className="animate-spin">
                          <RotateCcw size={16} />
                        </span>
                        Launching...
                      </>
                    ) : (
                      <>
                        <Rocket size={16} /> Launch Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};
