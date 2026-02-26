import { useState } from 'react';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData } from '@/hooks/useOpsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, User, Brain, Sparkles, Gift, Send, Users,
  Search, Loader2, CheckCircle, FileText, Lightbulb,
} from 'lucide-react';

type PersonalizationLevel = 'minimal' | 'average' | 'full_custom';

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
    id: 'minimal',
    label: 'Minimal',
    tagline: 'Quick & Scalable',
    description: 'First name + company name swap. One customized sentence per lead. Best for high-volume outreach.',
    icon: Zap,
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.25)',
  },
  {
    id: 'average',
    label: 'Average',
    tagline: 'Balanced Touch',
    description: 'Pain points identified. 2-3 customized sentences per lead. Good balance of scale and personalization.',
    icon: User,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.25)',
  },
  {
    id: 'full_custom',
    label: 'Full Custom',
    tagline: 'Maximum Impact',
    description: 'Completely unique message per lead using LinkedIn insights, bio, and pain points. Best for high-value targets.',
    icon: Brain,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
  },
];

const CLAWBUDDY_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tasks`;
const WEBHOOK_SECRET = import.meta.env.VITE_CLAWBUDDY_WEBHOOK_SECRET;

const callClawBuddy = async (payload: Record<string, unknown>) => {
  const res = await fetch(CLAWBUDDY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': WEBHOOK_SECRET },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const OpsEmployeeCampaignCreatorBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const [selected, setSelected] = useState<PersonalizationLevel>('average');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [leadMagnet, setLeadMagnet] = useState(false);
  const [leadMagnetIdea, setLeadMagnetIdea] = useState('');
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Get lead count for the campaign
  const { data: leads } = useOpsData({ appId, itemType: 'lead' });
  const availableLeads = (leads || []).filter(l => ['new', 'enriched'].includes(l.status));
  const totalLeads = (leads || []).length;

  const handleAIResearch = async () => {
    if (!leadMagnetIdea.trim()) { toast.error('Describe your lead magnet idea first'); return; }
    setResearching(true);
    setResearchResult(null);
    try {
      // Create a research question on ClawBuddy for AI to investigate
      await callClawBuddy({
        request_type: 'question',
        action: 'ask',
        question_type: 'question',
        priority: 'high',
        question: `Research the best lead magnet for a cold email campaign. Idea: "${leadMagnetIdea}". Analyze what would resonate most with B2B sales leaders and SDR managers. Consider formats (PDF guide, video, tool, template) and topics that drive the highest response rates.`,
      });

      // Also log the research request
      await callClawBuddy({
        request_type: 'log',
        action: 'create',
        category: 'observation',
        message: `Lead magnet research requested for campaign "${name || 'Untitled'}". Idea: ${leadMagnetIdea}`,
        agent_name: 'Jason',
        agent_emoji: '📧',
      });

      setResearchResult(
        `Research queued for AI analysis. Your agent will investigate: "${leadMagnetIdea}" and recommend the best format, angle, and content structure. Check the Questions page for the full analysis.`
      );
      toast.success('AI research task created');
    } catch {
      toast.error('Failed to submit research request');
    } finally {
      setResearching(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Campaign name is required'); return; }
    if (!subject.trim()) { toast.error('Subject line is required'); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not authenticated'); return; }

      const leadCount = availableLeads.length;

      // 1. Create campaign record in ops_data
      const { error } = await supabase.from('ops_data').insert({
        app_id: appId,
        block_id: block.id,
        item_type: 'campaign',
        title: name.trim(),
        status: 'draft',
        data: {
          personalization_level: selected,
          generate_lead_magnet: leadMagnet,
          lead_magnet_idea: leadMagnet ? leadMagnetIdea.trim() : null,
          subject_template: subject.trim(),
          body_template: body.trim(),
          lead_count: leadCount,
          stats: { total_leads: leadCount, sent: 0, opened: 0, replied: 0, meetings: 0 },
        },
        user_id: user.id,
      });
      if (error) throw error;

      // 2. Create a task on ClawBuddy Kanban board for Claude Code to draft emails
      const levelLabel = LEVELS.find(l => l.id === selected)?.label || selected;
      const taskResult = await callClawBuddy({
        request_type: 'task',
        action: 'create',
        title: `Draft ${leadCount} ${levelLabel} emails — ${name.trim()}`,
        description: [
          `Campaign: ${name.trim()}`,
          `Personalization: ${levelLabel}`,
          `Leads: ${leadCount} available (${availableLeads.map(l => l.title).slice(0, 5).join(', ')}${leadCount > 5 ? '...' : ''})`,
          `Subject: ${subject.trim()}`,
          leadMagnet ? `Lead Magnet: ${leadMagnetIdea.trim() || 'Auto-generate'}` : '',
          '',
          `Draft and personalize cold emails for all ${leadCount} leads in this campaign.`,
          selected === 'full_custom' ? 'Use each lead\'s LinkedIn profile, bio, and AI summary for maximum personalization.' : '',
        ].filter(Boolean).join('\n'),
        column: 'todo',
      });

      // 3. Assign the task
      if (taskResult?.task_id) {
        await callClawBuddy({
          request_type: 'assignee',
          action: 'assign',
          task_id: taskResult.task_id,
          names: ['Mani Kanasani'],
        });
      }

      // 4. Log the campaign creation
      await callClawBuddy({
        request_type: 'log',
        action: 'create',
        category: 'observation',
        message: `Campaign created: "${name.trim()}" — ${levelLabel} personalization, ${leadCount} leads, ${leadMagnet ? 'with lead magnets' : 'no lead magnets'}. Task added to Kanban.`,
        agent_name: 'Jason',
        agent_emoji: '📧',
      });

      toast.success(`Campaign created! Task added for ${leadCount} emails.`);
      setName('');
      setSubject('');
      setBody('');
      setLeadMagnet(false);
      setLeadMagnetIdea('');
      setResearchResult(null);
      queryClient.invalidateQueries({ queryKey: ['ops-data'] });
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLevel = LEVELS.find(l => l.id === selected)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))' }} />
        </div>
        <div>
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">
            {block.title || 'Campaign Creator'}
          </h3>
          <p className="text-xs text-muted-foreground">Configure personalization level and messaging</p>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-5">
        {/* Campaign Name */}
        <div className="space-y-1.5">
          <Label className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">
            Campaign Name *
          </Label>
          <Input
            className="h-10 glass border-white/[0.08] focus:ring-primary/50 focus:border-primary/30"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Skool Community Launch"
          />
        </div>

        {/* Personalization Level Cards */}
        <div className="space-y-2">
          <Label className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">
            Personalization Level
          </Label>
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
                  className={`relative text-left rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-opacity-80 bg-white/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                  }`}
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
                        <p className="font-orbitron text-sm font-semibold text-foreground uppercase tracking-wider">
                          {level.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{level.tagline}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {level.description}
                    </p>
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
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-400" />
                    <Label className="font-orbitron text-xs uppercase tracking-wider text-emerald-400">
                      What's the lead magnet?
                    </Label>
                  </div>
                  <Textarea
                    className="min-h-[80px] glass border-white/[0.08] focus:ring-emerald-500/50 focus:border-emerald-500/30 resize-none"
                    value={leadMagnetIdea}
                    onChange={e => setLeadMagnetIdea(e.target.value)}
                    placeholder="e.g. A PDF guide on '5 AI SDR Playbooks That Book 3x More Meetings' or a free ROI calculator showing how much they save replacing 1 SDR with AI"
                  />

                  {/* AI Research Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    onClick={handleAIResearch}
                    disabled={researching}
                  >
                    {researching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        AI Research — Find Best Lead Magnet
                      </>
                    )}
                  </Button>

                  {/* Research Result */}
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

        {/* Subject Line */}
        <div className="space-y-1.5">
          <Label className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">
            Subject Line Template
          </Label>
          <Input
            className="h-10 glass border-white/[0.08] focus:ring-primary/50 focus:border-primary/30"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. {{first_name}}, quick question about {{company}}"
          />
          <p className="text-xs text-muted-foreground">
            Use {'{{first_name}}'}, {'{{company}}'}, {'{{pain_point}}'} as merge tags
          </p>
        </div>

        {/* Body Template */}
        <div className="space-y-1.5">
          <Label className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">
            Body Template
          </Label>
          <Textarea
            className="min-h-[120px] glass border-white/[0.08] focus:ring-primary/50 focus:border-primary/30 resize-none"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              selected === 'minimal'
                ? 'Hey {{first_name}},\n\nI noticed {{company}} is growing fast. Quick question — are you using AI to automate outreach yet?\n\nWorth a quick chat?'
                : selected === 'average'
                ? 'Hey {{first_name}},\n\n{{pain_point_opener}}\n\n{{custom_sentences}}\n\nWould love to show you how we solve this.'
                : 'This will be fully generated per lead using their LinkedIn profile, bio, and pain points.'
            }
          />
          {selected === 'full_custom' && (
            <p className="text-xs text-amber-400/80">
              Full custom mode generates a unique message for each lead — template is used as a guide only.
            </p>
          )}
        </div>

        {/* Lead Count + Summary Bar */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          {/* Lead targeting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Target leads</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-foreground">{availableLeads.length} ready</p>
              <p className="text-xs text-muted-foreground">{totalLeads} total in database</p>
            </div>
          </div>

          {/* Config summary */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedLevel.color, boxShadow: `0 0 8px ${selectedLevel.glow}` }}
            />
            <p className="text-xs text-muted-foreground flex-1">
              <span className="text-foreground font-medium">{selectedLevel.label}</span> personalization
              {leadMagnet && ' + Lead Magnets'}
              {' · '}
              <span className="text-foreground">{availableLeads.length} emails</span> to draft
            </p>
          </div>

          {/* What happens on create */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
            <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Creates campaign + adds a task to the Kanban board for Claude Code to draft all emails</span>
          </div>
        </div>

        {/* Create Button */}
        <Button
          className="w-full h-11 gap-2 font-orbitron text-sm uppercase tracking-wider hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          onClick={handleCreate}
          disabled={submitting || availableLeads.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Campaign...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Create Campaign — {availableLeads.length} Leads
            </>
          )}
        </Button>
        {availableLeads.length === 0 && (
          <p className="text-xs text-center text-amber-400/80">
            No leads with "new" or "enriched" status. Add leads first.
          </p>
        )}
      </div>
    </motion.div>
  );
};
