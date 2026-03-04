import type { Hook, AlignmentCheck, BuildEntry, CCSkill, EvolutionEntry, AutopilotPhase, CCAgent, ActivityEntry } from '@/types/command-center';

// Static config — hooks are local config, not DB-driven
export const hooks: Hook[] = [
  {
    id: '1', name: 'Command Guard', icon: '🛡️', eventType: 'PreToolUse: Bash',
    active: true, description: 'Blocks destructive system commands',
    lastFired: '14m ago', activityCount: 1,
    details: ['rm -rf', 'force push', 'db reset', '.env deletion'],
  },
  {
    id: '2', name: 'Pre-Compact Save', icon: '💾', eventType: 'PreCompact',
    active: true, description: 'Saves critical state before context compaction',
    lastFired: '2h ago', activityCount: 3,
    details: ['STATUS.md', 'ClawBuddy state', 'memory files'],
  },
  {
    id: '3', name: 'Session Start', icon: '🚀', eventType: 'SessionStart',
    active: true, description: 'Loads operational context on agent connect',
    lastFired: 'session start', activityCount: 142,
    details: ['STATUS.md', 'tasks', 'unread logs', 'pending questions'],
  },
  {
    id: '4', name: 'Post-Edit Typecheck', icon: '🔍', eventType: 'PostToolUse: Write|Edit',
    active: true, description: 'Runs type checking after code modifications',
    lastFired: '45m ago', activityCount: 0,
    details: ['tsc --noEmit', 'Scope: clawbuddy-kit'],
  },
];

export const deploymentRules: string[] = [
  'Production deploys require explicit approval',
  '/autopilot never deploys without human sign-off',
  'Force push to main/master blocked',
  'Database resets blocked',
  '.env file deletion blocked',
  'Max 5 heal attempts before escalation',
];

export const autopilotPhases: AutopilotPhase[] = [
  { id: 'CTX', name: 'Context', fullName: 'CONTEXT', color: 'ops-purple' },
  { id: 'PLN', name: 'Plan', fullName: 'PLAN', color: 'ops-indigo' },
  { id: 'TSK', name: 'Tasks', fullName: 'TASK BOARD', color: 'ops-blue' },
  { id: 'BLD', name: 'Build', fullName: 'BUILD', color: 'ops-emerald' },
  { id: 'VAL', name: 'Validate', fullName: 'VALIDATE', color: 'ops-teal' },
  { id: 'HEL', name: 'Heal', fullName: 'HEAL', color: 'ops-amber' },
  { id: 'RPT', name: 'Report', fullName: 'REPORT', color: 'ops-violet' },
  { id: 'CLS', name: 'Close', fullName: 'CLOSE', color: 'ops-gray' },
];

// Mock fallbacks — used when Supabase is not configured or query fails
export const mockAlignmentChecks: AlignmentCheck[] = [
  { id: '1', name: 'STATUS.md freshness', status: 'pass', detail: 'Updated 1h ago', description: 'Checks if STATUS.md has been updated in the last 4 hours' },
  { id: '2', name: 'MEMORY.md content', status: 'pass', detail: '288 lines', description: 'Verifies MEMORY.md exists and has substantial content' },
  { id: '3', name: 'Doing tasks assigned', status: 'fail', detail: '2 tasks without assignees', description: 'All tasks in "Doing" column must have at least one assignee' },
  { id: '4', name: 'No stuck tasks', status: 'warn', detail: '1 task in doing for >48h', description: 'Flags tasks that have been in progress for more than 48 hours' },
  { id: '5', name: 'Agent online', status: 'pass', detail: 'Status is online', description: 'Primary agent should be online during business hours' },
  { id: '6', name: 'Questions answered', status: 'pass', detail: 'No stale high-priority', description: 'No high-priority questions unanswered for >2 hours' },
  { id: '7', name: 'AI Log active', status: 'pass', detail: '12 entries in last 24h', description: 'At least 5 log entries in the last 24 hours' },
  { id: '8', name: 'Git clean', status: 'pass', detail: 'Working tree clean', description: 'No uncommitted changes in working directory' },
  { id: '9', name: 'CLAUDE.md present', status: 'pass', detail: '394 lines', description: 'Agent configuration file exists and is well-formed' },
  { id: '10', name: 'Hooks configured', status: 'pass', detail: '4 hook types active', description: 'All required safety hooks are registered and active' },
  { id: '11', name: 'Skills healthy', status: 'pass', detail: 'Skill Factory accessible', description: 'Skills API is responsive and all skills pass health check' },
  { id: '12', name: 'Edge functions', status: 'pass', detail: '28 functions in source', description: 'Edge functions directory is present and contains expected functions' },
];

export const mockBuildHistory: BuildEntry[] = [
  { id: '1', date: 'Mar 2, 2026', title: 'Build Payment Integration', phasesCompleted: 8, totalPhases: 8, duration: '1h 23m', healAttempts: 0, alignmentScore: 91 },
  { id: '2', date: 'Mar 1, 2026', title: 'Implement Skills Factory', phasesCompleted: 8, totalPhases: 8, duration: '2h 10m', healAttempts: 1, alignmentScore: 87 },
  { id: '3', date: 'Feb 28, 2026', title: 'Agent Status Dashboard', phasesCompleted: 8, totalPhases: 8, duration: '58m', healAttempts: 0, alignmentScore: 83 },
  { id: '4', date: 'Feb 27, 2026', title: 'Kanban Board Rebuild', phasesCompleted: 6, totalPhases: 8, duration: '3h 45m', healAttempts: 3, alignmentScore: 72 },
  { id: '5', date: 'Feb 25, 2026', title: 'Real-time Log Viewer', phasesCompleted: 8, totalPhases: 8, duration: '45m', healAttempts: 0, alignmentScore: 95 },
];

export const mockEvolutionLog: EvolutionEntry[] = [
  { id: '1', date: 'Mar 2', type: 'rule_extraction', file: 'MEMORY.md', change: 'Added shlex parsing quirk for command guard', trigger: 'False positive blocked curl with log message' },
  { id: '2', date: 'Mar 2', type: 'user_correction', file: 'MEMORY.md', change: 'Agent IS valid assignee via ai_agents table', trigger: 'User corrected incorrect documentation' },
  { id: '3', date: 'Feb 28', type: 'stale_fix', file: 'STATUS.md', change: 'Full rewrite with current campaign state', trigger: 'Alignment check flagged 43h stale' },
  { id: '4', date: 'Feb 27', type: 'pattern_learned', file: 'MEMORY.md', change: 'Edge function cold starts require 3s buffer in tests', trigger: 'Repeated test failures with timing' },
  { id: '5', date: 'Feb 25', type: 'rule_extraction', file: 'CLAUDE.md', change: 'Always run tsc --noEmit after multi-file edits', trigger: 'Type errors caught late in build cycle' },
];

// Phase color map for inline styles
export const phaseColorMap: Record<string, string> = {
  'ops-purple': 'hsl(263, 70%, 50%)',
  'ops-indigo': 'hsl(239, 84%, 67%)',
  'ops-blue': 'hsl(217, 91%, 60%)',
  'ops-emerald': 'hsl(160, 84%, 39%)',
  'ops-teal': 'hsl(174, 84%, 40%)',
  'ops-amber': 'hsl(45, 93%, 47%)',
  'ops-violet': 'hsl(258, 90%, 66%)',
  'ops-gray': 'hsl(220, 9%, 46%)',
};

// Evolution type badge colors
export const evolutionTypeColors: Record<string, string> = {
  rule_extraction: 'bg-ops-emerald/20 text-ops-emerald',
  user_correction: 'bg-ops-blue/20 text-ops-blue',
  stale_fix: 'bg-ops-amber/20 text-ops-amber',
  pattern_learned: 'bg-ops-purple/20 text-ops-purple',
  observation: 'bg-ops-teal/20 text-ops-teal',
};

// Category badge colors for activity feed
export const categoryColors: Record<string, string> = {
  general: 'bg-muted text-muted-foreground',
  observation: 'bg-ops-emerald/20 text-ops-emerald',
  reminder: 'bg-ops-amber/20 text-ops-amber',
  fyi: 'bg-ops-blue/20 text-ops-blue',
  task: 'bg-ops-teal/20 text-ops-teal',
  question: 'bg-ops-purple/20 text-ops-purple',
  stale_progress: 'bg-ops-red/20 text-ops-red',
  self_evolution: 'bg-ops-violet/20 text-ops-violet',
};
