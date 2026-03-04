// Command Center types — ported from agent-command-center

export type AgentStatus = 'online' | 'thinking' | 'error' | 'offline';
export type FreshnessLevel = 'fresh' | 'stale' | 'dead';

export interface CCAgent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  status: AgentStatus;
  statusMessage: string;
  ringColor: string;
  lastActive: string;
  joinedDate: string;
  alignmentScore: number;
  freshness: FreshnessLevel;
  lastSeenRaw: string; // ISO timestamp for freshness calc
}

export interface ActivityEntry {
  id: string;
  time: string;
  agentEmoji: string;
  agentName: string;
  category: 'general' | 'observation' | 'reminder' | 'fyi' | 'task' | 'question' | 'self_evolution';
  message: string;
  runId?: string;
}

export interface AlignmentCheck {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  description: string;
}

export interface Hook {
  id: string;
  name: string;
  icon: string;
  eventType: string;
  active: boolean;
  description: string;
  lastFired: string;
  activityCount: number;
  details: string[];
}

export interface BuildEntry {
  id: string;
  date: string;
  title: string;
  phasesCompleted: number;
  totalPhases: number;
  duration: string;
  healAttempts: number;
  alignmentScore: number;
  runId?: string;
}

export interface RunLifecycleEntry {
  id: string;
  type: 'log' | 'insight';
  timestamp: string;
  message: string;
  category?: string;
  phase?: string;
  agentName?: string;
  agentEmoji?: string;
}

export interface CCSkill {
  id: string;
  name: string;
  category: string;
  operations: number;
  status: 'ready' | 'error' | 'building';
  icon: string;
}

export interface EvolutionEntry {
  id: string;
  date: string;
  type: string;
  file: string;
  change: string;
  trigger: string;
}

export interface AutopilotPhase {
  id: string;
  name: string;
  fullName: string;
  color: string;
}

export interface TaskCounts {
  todo: number;
  doing: number;
  needs_input: number;
  done: number;
  doneThisWeek: number;
  inFlight: number;
}

// Agent Comms types
export interface AgentComm {
  id: string;
  user_id: string;
  from_agent: string;
  from_emoji: string | null;
  to_agent: string;
  message: string;
  message_type: string;
  priority: string;
  status: string;
  parent_id: string | null;
  related_task_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  replies?: AgentComm[];
}

// Orchestration types
export interface PendingTask {
  id: string;
  user_id: string;
  task_type: string;
  action: string;
  payload: Record<string, unknown> | null;
  priority: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AiLogEntry {
  id: string;
  user_id: string;
  message: string;
  category: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface RunGroup {
  runId: string;
  events: AiLogEntry[];
  outcome: string;
  taskTitle: string;
  startedAt: string;
  duration: string | null;
  phases: number | null;
  heals: number | null;
  alignment: number | null;
}
