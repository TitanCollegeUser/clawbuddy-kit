import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Repeat, Presentation, FileSearch, Radar, Brain, Megaphone, Wrench,
  ArrowRight, GitBranch, Clock, Zap, Lock, Copy, Check, Cpu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TeamTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  agents: string[];
  pattern: string;
  patternIcon: React.ElementType;
  estimatedTokens: string;
  bestFor: string;
  capabilities: string[];
}

const teamTemplates: TeamTemplate[] = [
  {
    id: 'content-repurpose',
    name: 'Content Repurposer',
    tagline: 'One source, four platforms, zero overlap',
    description: 'Feed a YouTube transcript. Get a blog post, LinkedIn article, newsletter, and Twitter thread — each leading with a unique angle. Agents cross-reference insights to prevent duplication.',
    icon: Repeat,
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.25)',
    agents: ['Blog Writer', 'LinkedIn Writer', 'Newsletter Writer', 'Twitter Writer'],
    pattern: 'Parallel + Cross-Reference',
    patternIcon: GitBranch,
    estimatedTokens: '~120K',
    bestFor: 'Content creators repurposing video content',
    capabilities: [
      'Parallel execution across 4 platforms',
      'Insight deduplication via agent communication',
      'Unique lead angles per platform',
      'Postmortem synthesis report',
    ],
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck Builder',
    tagline: 'Research to slides in one session',
    description: 'Three agents work in strict sequence: Researcher gathers data, Slide Writer structures the narrative, Designer builds the PPTX. Plan approval gate before design starts.',
    icon: Presentation,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.25)',
    agents: ['Researcher', 'Slide Writer', 'Designer'],
    pattern: 'Sequential + Human Gate',
    patternIcon: ArrowRight,
    estimatedTokens: '~150K',
    bestFor: 'Startup pitches, sales presentations',
    capabilities: [
      'Stage-blocked sequential handoff',
      'Human-in-the-loop plan approval',
      'Max 8 words per title, 3-4 bullets per slide',
      'HTML-to-PPTX automated export',
    ],
  },
  {
    id: 'rfp-response',
    name: 'Proposal Response',
    tagline: 'Two-stage pipeline for RFPs',
    description: 'Stage 1: RFP Analyst and Capability Researcher run in parallel. Stage 2: Two Section Writers divide the proposal. A Team Lead reviews for consistency and completeness.',
    icon: FileSearch,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.25)',
    agents: ['RFP Analyst', 'Capability Researcher', 'Section Writer A', 'Section Writer B', 'Team Lead'],
    pattern: 'Parallel Pairs in Sequence',
    patternIcon: GitBranch,
    estimatedTokens: '~180K',
    bestFor: 'Government RFPs, enterprise proposals',
    capabilities: [
      'Parallel analysis stage unlocks parallel writing stage',
      'Automatic consistency and terminology review',
      'Unaddressed requirement flagging',
      'Executive summary + technical + qualifications + pricing',
    ],
  },
  {
    id: 'competitive-intel',
    name: 'Competitive Intelligence',
    tagline: 'Let Claude decide the team',
    description: 'Give it your competitors — Claude Code designs the optimal team composition. Each analyst shares top 3 findings with the group before a Synthesis Lead produces the final report.',
    icon: Radar,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    agents: ['Auto-assigned analysts', 'Synthesis Lead'],
    pattern: 'Dynamic + Synthesis',
    patternIcon: Cpu,
    estimatedTokens: '~150K',
    bestFor: 'Market research, competitor analysis',
    capabilities: [
      'Claude determines optimal agent roles',
      'Forced finding-sharing before synthesis',
      'Cross-competitor pattern identification',
      'Strengths / weaknesses / opportunities matrix',
    ],
  },
  {
    id: 'advisory-board',
    name: 'AI Advisory Board',
    tagline: 'Five perspectives, one decision',
    description: 'Market Researcher, Audience Gap Analyst, Financial Modeler, Competitive Strategist, and Devil\'s Advocate — all analyze independently. Consensus or informed disagreement.',
    icon: Brain,
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.25)',
    agents: ['Market Researcher', 'Audience Gap Analyst', 'Financial Modeler', 'Competitive Strategist', "Devil's Advocate"],
    pattern: 'Parallel + Informed Disagreement',
    patternIcon: Users,
    estimatedTokens: '~160K',
    bestFor: 'Go/no-go decisions, pricing strategy, new ventures',
    capabilities: [
      'Mutually exclusive analysis tracks',
      'Allows split recommendations (not forced consensus)',
      'Executive brief with go / no-go / conditional',
      'Top 3 risks regardless of recommendation',
    ],
  },
  {
    id: 'campaign-launch',
    name: 'Campaign Launch',
    tagline: 'Full marketing stack in parallel',
    description: 'Email Marketer (3-email sequence), Social Media Manager, Ad Copywriter (problem-agitation, social proof, us-vs-them variations), and Landing Page Creator. Synthesis agent ensures cohesion.',
    icon: Megaphone,
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.25)',
    agents: ['Email Marketer', 'Social Media Manager', 'Ad Copywriter', 'Landing Page Creator', 'Cohesion Reviewer'],
    pattern: 'Parallel + Cohesion Check',
    patternIcon: Zap,
    estimatedTokens: '~170K',
    bestFor: 'Product launches, course promotions, SaaS rollouts',
    capabilities: [
      '3-email drip sequence',
      '3 ad copy variations (different frameworks)',
      'Landing page with conversion focus',
      'Cross-channel messaging consistency review',
    ],
  },
  {
    id: 'hybrid-builder',
    name: 'Hybrid Builder',
    tagline: 'Recon first, then coordinated build',
    description: 'Sub-agents clone and analyze a repo for architecture patterns. Then an agent team of 5 builds the project with dependency chains. Architect completes foundations before specialists proceed.',
    icon: Wrench,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.25)',
    agents: ['Scout (sub-agent)', 'Architect', 'Interface Builder', 'Router & Tools', 'Memory & Context', 'CLI'],
    pattern: 'Sub-agents + Agent Team',
    patternIcon: GitBranch,
    estimatedTokens: '~200K+',
    bestFor: 'Building apps, cloning + improving repos, technical projects',
    capabilities: [
      'Sub-agents for cheap reconnaissance',
      'Architect-first dependency chain',
      'Parallel specialist execution after foundations',
      'Direct refinement after team handoff',
    ],
  },
];

export const AgentTeamsPage = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleComingSoon = (teamName: string) => {
    toast('Coming Soon', {
      description: `${teamName} will be available after launch. Stay tuned!`,
      icon: <Lock className="h-4 w-4" />,
    });
  };

  const handleCopyPrompt = (team: TeamTemplate) => {
    const prompt = `Create an agent team for "${team.name}".

Pattern: ${team.pattern}
Agents: ${team.agents.join(', ')}

Instructions:
${team.capabilities.map(c => `- ${c}`).join('\n')}

Before writing, each teammate should share their top 3 findings with the group to prevent overlap. Require plan approval before the final stage begins. Deliver a synthesis report comparing approaches and flagging inconsistencies.`;

    navigator.clipboard.writeText(prompt);
    setCopiedId(team.id);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-orbitron">Agent Teams</h1>
            <p className="text-muted-foreground text-sm">
              Pre-built multi-agent workflows. Pick a team, copy the prompt, run it in Claude Code.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { label: 'Team Templates', value: '7', color: 'text-primary' },
          { label: 'Orchestration Patterns', value: '5', color: 'text-amber-400' },
          { label: 'Avg Agents per Team', value: '4-5', color: 'text-emerald-400' },
          { label: 'Token Range', value: '120K-200K', color: 'text-violet-400' },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]"
          >
            <span className={`text-sm font-bold font-orbitron ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Team Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {teamTemplates.map((team, index) => {
          const Icon = team.icon;
          const PatternIcon = team.patternIcon;
          const isExpanded = expandedId === team.id;

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index, duration: 0.4 }}
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.04]"
              style={{
                boxShadow: isExpanded ? `0 0 30px ${team.glow}` : 'none',
              }}
              onClick={() => setExpandedId(isExpanded ? null : team.id)}
            >
              {/* Accent top border */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${team.color}, transparent)` }}
              />

              {/* Card content */}
              <div className="p-5">
                {/* Top row: icon + name + pattern badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl border"
                      style={{
                        background: `${team.color}15`,
                        borderColor: `${team.color}30`,
                        boxShadow: `0 0 12px ${team.glow}`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: team.color }} />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-base font-semibold text-foreground">{team.name}</h3>
                      <p className="text-xs text-muted-foreground italic">{team.tagline}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 shrink-0"
                    style={{ borderColor: `${team.color}40`, color: team.color }}
                  >
                    <PatternIcon className="h-3 w-3 mr-1" />
                    {team.pattern}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {team.description}
                </p>

                {/* Agent pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {team.agents.map((agent, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-full border font-medium"
                      style={{
                        background: `${team.color}08`,
                        borderColor: `${team.color}20`,
                        color: team.color,
                      }}
                    >
                      {agent}
                    </span>
                  ))}
                </div>

                {/* Bottom row: tokens + best for */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {team.estimatedTokens} tokens
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {team.bestFor}
                  </span>
                </div>
              </div>

              {/* Expanded capabilities + actions */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-white/[0.06]">
                      <p className="text-xs font-orbitron uppercase tracking-wider text-muted-foreground mb-3">
                        Capabilities
                      </p>
                      <ul className="space-y-2 mb-5">
                        {team.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                              style={{ background: team.color, boxShadow: `0 0 6px ${team.glow}` }}
                            />
                            {cap}
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(team);
                          }}
                        >
                          {copiedId === team.id ? (
                            <><Check className="h-3.5 w-3.5 mr-1.5" /> Copied</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Prompt</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          style={{ background: team.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComingSoon(team.name);
                          }}
                        >
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>Tip: Say <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs">"create an agent team"</code> in Claude Code to trigger team orchestration mode</span>
        </div>
      </motion.div>
    </div>
  );
};
