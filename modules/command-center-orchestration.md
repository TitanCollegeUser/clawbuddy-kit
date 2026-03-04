# Command Center & Cross-Agent Orchestration

## Module Overview

The Command Center is the real-time operations dashboard for ClawBuddy. It provides live visibility into autonomous agent work — what's running, how far along it is, whether it's healthy, and the full history of past builds. Cross-Agent Orchestration enables multi-agent workflows where a coordinator agent (Ray) can dispatch work to an executor agent (Sherlock) without requiring the user to relay messages.

**What this module covers:**
- Session Intelligence hooks (5 hooks that fire automatically)
- Autonomous build loop (`/autopilot` — 8 phases)
- Session close protocol (`/done` — 8 steps)
- Live Autopilot Tracker (real-time dashboard widget)
- Mandatory Progress Broadcasting (heartbeat system + watchdog)
- Cross-Agent Auto-Dispatch (queue-based agent-to-agent handoff)
- Self-Evolution rules (agent learns from mistakes)
- Alignment scoring (12-check health system)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMMAND CENTER                           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  SessionIntel│  │ Build History │  │  Self-Evolution Log    │ │
│  │  (Live)      │  │ (Expandable) │  │  (Learning Feed)       │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │
│         │                 │                                     │
│         ▼                 ▼                                     │
│  useActiveAutopilot   useBuildHistory   useEvolutionLog         │
│         │                 │                 │                   │
│         └─────────┬───────┘─────────────────┘                   │
│                   ▼                                             │
│            Supabase (ai_log + ai_insights)                      │
│                   ▲                                             │
│                   │  Real-time subscriptions                    │
│                   │  + 30s polling fallback                     │
└───────────────────┼─────────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────────────┐
    │               │                       │
    ▼               ▼                       ▼
┌────────┐   ┌────────────┐         ┌────────────────┐
│ Hooks  │   │ /autopilot │         │ pg_cron        │
│ (5)    │   │ /done      │         │ Watchdog       │
│        │   │ Skills     │         │ (every 1 min)  │
└────────┘   └────────────┘         └────────────────┘
```

---

## Part 1: Session Intelligence Hooks

Hooks are bash scripts in `.claude/hooks/` that fire automatically on Claude Code lifecycle events. They're registered in `.claude/settings.local.json`.

### Hook Registry

| Hook | File | Event | What It Does |
|------|------|-------|-------------|
| Session Start | `session-start.sh` | `SessionStart` | Sets agent online, loads STATUS.md, pulls unread logs/questions/tasks, checks queue for dispatched work, detects orphaned runs |
| Pre-Compact Save | `pre-compact-save.sh` | `PreCompact` | Outputs directive telling agent to save state before context is lost |
| Command Guard | `command-guard.sh` | `PreToolUse: Bash` | Blocks destructive commands (`rm -rf /`, force push to main, `supabase db reset`, `.env` deletion) using Python `shlex` parsing |
| Post-Edit Typecheck | `typecheck.sh` | `PostToolUse: Write\|Edit` | Auto-runs `tsc --noEmit` after editing `.ts/.tsx` files in clawbuddy-kit |
| Alignment Check | `alignment-check.sh` | Manual (`/alignment`) | Runs 12-check scoring system, pushes score as ClawBuddy insight card |

### Hook Telemetry

Every hook logs its execution to ClawBuddy for dashboard visibility:
```json
{
  "request_type": "log",
  "action": "create",
  "category": "general",
  "message": "Hook fired: <hook-name>",
  "agent_name": "Sherlock",
  "agent_emoji": "🔍",
  "data": {
    "event_type": "hook_execution",
    "hook_name": "<hook-name>",
    "result": "pass|fail|block"
  }
}
```

The Command Center dashboard reads these entries to populate the Hook Execution panel, showing which hooks fired, when, and whether they passed or blocked.

### settings.local.json Structure

```json
{
  "permissions": {
    "allow": ["Bash(*)"],
    "deny": []
  },
  "hooks": {
    "PreCompact": [
      { "type": "command", "command": "bash .claude/hooks/pre-compact-save.sh" }
    ],
    "SessionStart": [
      { "type": "command", "command": "bash .claude/hooks/session-start.sh" }
    ],
    "PreToolUse": [
      {
        "type": "command",
        "command": "bash .claude/hooks/command-guard.sh",
        "matcher": "Bash"
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "bash .claude/hooks/typecheck.sh",
        "matcher": "Write|Edit"
      }
    ]
  }
}
```

### Session Start Hook — Full Breakdown

The most complex hook. Runs at every conversation start and does 6 things:

1. **Sets agent online** — `POST ai-tasks` with `status.update`, green ring
2. **Loads STATUS.md** — `head -40` of the status file to show last session state
3. **Pulls ClawBuddy state** — Unread logs, answered questions, task counts (To Do / Doing / Needs Input)
4. **Checks queue** — Looks for pending dispatch items from Ray or Mani. If found, displays them with priority and ID, instructs agent to claim
5. **Detects orphaned runs** — Queries `ai_log` via PostgREST for `run_start` events without matching `run_end`. If found, instructs agent to resume heartbeating
6. **Logs hook execution** — Fires telemetry event for dashboard visibility

### Command Guard — Smart Parsing

Uses Python `shlex.split()` to tokenize commands before checking for destructive patterns. This prevents false positives when blocked keywords appear inside quoted strings (e.g., a curl payload containing "rm" in a JSON message body).

**Blocked patterns:**
- `rm -rf /` (filesystem wipe)
- `git push --force` to `main`/`master`
- `supabase db reset`
- `rm *.env`
- `mkfs`, `shutdown`, `reboot`, `dd if=`

---

## Part 2: Autonomous Build Loop (`/autopilot`)

An 8-phase autonomous loop for building, validating, and reporting on deliverables. Every step is logged to ClawBuddy so the user can see progress in real time.

```
CONTEXT → PLAN → TASK BOARD → BUILD → VALIDATE → HEAL → REPORT → CLOSE
  (1)      (2)      (3)        (4)      (5)       (6)     (7)     (8)
```

### Phase 1 — CONTEXT
- Generate `run_id` (UUID)
- Emit `run_start` event
- Read project files (CLAUDE.md, STATUS.md)
- Pull ClawBuddy state (tasks, questions, unread logs)
- **Check queue for dispatched work** — list pending items, claim the top one
- Set status to working (green ring)

### Phase 2 — PLAN
- Create implementation plan with discrete subtasks
- Identify dependencies and validation gates
- Log the plan

### Phase 3 — TASK BOARD
- Create main task on Kanban board
- Assign Sherlock + Mani
- Create subtasks for each planned step

### Phase 4 — BUILD
- Execute the plan step by step
- Log at every major step (minimum 3 logs)
- Mark subtasks complete as you go
- **Mandatory heartbeat** every 5 minutes (see Progress Broadcasting)
- If blocked, ask via ClawBuddy Questions and stop

### Phase 5 — VALIDATE
- Run all applicable validation gates:
  - TypeScript: `npx tsc --noEmit`
  - Edge functions: `supabase functions deploy --dry-run`
  - Frontend: `npm run build`
  - API: curl test
  - Database: query verification
- Pass → Phase 7. Fail → Phase 6.

### Phase 6 — HEAL
- Maximum 5 attempts
- Read error, check known patterns (MEMORY.md, CLAUDE.md), fix, re-validate
- If 5th attempt fails: emit `run_end` with `outcome: "failed"`, set ring red, post urgent question, STOP

### Phase 7 — REPORT
- Generate HTML execution report → ClawBuddy Reports
- Create insight card with build metrics → `build_summary` event type
- Extract learnings → Cognitive Memory
- Move task to "done"

### Phase 8 — CLOSE
- Emit `run_end` with `outcome: "completed"`
- Update STATUS.md
- Run alignment check
- Set ring green
- Output terminal summary

---

## Part 3: Session Close Protocol (`/done`)

An 8-step structured shutdown ensuring nothing is lost between sessions.

```
VALIDATE → SYNC → AUDIT → REPORT → HEAL → COMMIT → LEARN → OFFLINE
   (1)      (2)    (3)     (4)      (5)    (6)      (7)     (8)
```

Key behaviors:
- **Step 2 (SYNC):** Updates STATUS.md — the bridge between sessions
- **Step 3 (AUDIT):** Runs 12-check alignment scoring
- **Step 4 (REPORT):** Generates HTML session report filed to ClawBuddy Reports
- **Step 5 (HEAL):** If alignment < 80%, auto-fixes common issues (stale STATUS.md, unassigned tasks, etc.)
- **Step 6 (COMMIT):** Git commit with alignment score in message. Never pushes without explicit ask.
- **Step 7 (LEARN):** Extracts session learnings → Cognitive Memory
- **Step 8 (OFFLINE):** Emits `run_end` to close any active run, sets Sherlock offline (gray ring)

---

## Part 4: Live Autopilot Tracker

### Frontend Components

**`useActiveAutopilot.ts`** — React hook that detects active runs in real-time.

**Data source:** `ai_log` table, filtered by:
```sql
data->>'phase' IS NOT NULL
OR data->>'event_type' IN ('run_start', 'work_progress', 'run_end', 'stale_progress')
```

**Detection strategy:**
1. **Definitive:** Find `run_start` events without matching `run_end` (by `run_id`)
2. **Fallback:** Legacy phase-based detection (timestamp within 10 minutes)

**Real-time updates:**
- Supabase real-time subscription on `ai_log` INSERT → invalidates React Query cache
- 30-second polling fallback

**State interface:**
```typescript
interface ActiveAutopilotState {
  isActive: boolean;
  runId: string | null;
  currentPhase: string | null;       // e.g., "BUILD"
  currentPhaseIndex: number;         // 0-7
  completedPhases: string[];
  currentMessage: string | null;
  startedAt: string | null;
  elapsedMs: number;
  status: 'idle' | 'running' | 'completed';
  // Progress broadcasting
  percentComplete: number | null;    // 0-100
  currentAction: string | null;      // "Building edge function handlers"
  etaMinutes: number | null;
  blockers: string[];
  isStale: boolean;                  // No heartbeat >10 min
  lastHeartbeatAt: string | null;
}
```

**`SessionIntel.tsx`** — The Command Center UI component. Three sections:

1. **Autonomous Assignment** (live tracker)
   - 8 phase dots with animated progression (glow on current, solid on completed)
   - Elapsed time counter
   - Progress bar with gradient (when `percentComplete` available)
   - ETA display
   - Stale warning badge (pulsing red, shows last heartbeat time)
   - Blockers panel (red-bordered box listing current blockers)
   - Run ID display

2. **Build History** (expandable table)
   - Date, title, phase dots, duration, heal attempts, alignment score
   - Clickable rows with `runId` expand to show full run lifecycle
   - Rows without `runId` show "Legacy" badge and aren't expandable

3. **Self-Evolution Log** (learning feed)
   - Type badges (rule_extraction, user_correction, stale_fix, pattern_learned)
   - File changed, change description, trigger

### Mock Fallback Badge Rule

When the dashboard renders data from fallback/mock sources (e.g., `command-center-data.ts` defaults when no real `ai_log` data exists), the UI **must** display a visible "Sample Data" badge. This prevents users from mistaking placeholder content for real agent activity.

> **Rule:** Any component that falls back to hardcoded mock data must render a clearly visible badge (e.g., gray pill with "Sample Data" or "Demo") at the top of the section. Never render mock data without labeling it. This applies to SessionIntel (phase dots, build history), insight cards, and evolution logs.

---

## Part 5: Mandatory Progress Broadcasting

The heartbeat system ensures the Command Center never goes silent during active work.

### Timezone & Timestamp Standard

All timestamps throughout the system use **UTC (ISO 8601)**. This applies to:
- `ai_log.created_at` — Supabase default `now()` in UTC
- `work_progress` heartbeat comparisons
- pg_cron watchdog gap calculations (`EXTRACT(EPOCH FROM (now() - last_heartbeat))`)
- Frontend `useActiveAutopilot` — `Date.now()` (UTC millis) vs `new Date(created_at).getTime()`
- Stale threshold comparisons (10-minute gap)
- `session-start.sh` orphaned run detection

> **Rule:** Never use local time in log payloads or timestamp comparisons. Supabase `now()` and JavaScript `Date.now()` are both UTC — keep it that way. If rendering for the user, convert to local time in the UI layer only.

### Run Lifecycle Events

All events are logged to `ai_log` with structured `data` JSONB:

| Event | When | Key Fields |
|-------|------|-----------|
| `run_start` | Phase 1 of /autopilot | `run_id`, `task_id`, `agent_name` |
| `work_progress` | Every 5 min during active work | `run_id`, `task_id`, `phase`, `percent_complete`, `current_action`, `blockers[]`, `eta_minutes` |
| `run_end` | Phase 8, /done Step 8, heal failure | `run_id`, `task_id`, `outcome` (completed/failed/canceled/session_close) |
| `stale_progress` | pg_cron watchdog (auto) | `run_id`, `task_id`, `last_heartbeat`, `gap_minutes` |

### Payload Contracts

**Progress heartbeat:**
```json
{
  "request_type": "log",
  "action": "create",
  "category": "observation",
  "message": "Progress: 40% complete. Building edge function handlers.",
  "agent_name": "Sherlock",
  "agent_emoji": "🔍",
  "data": {
    "event_type": "work_progress",
    "run_id": "<uuid>",
    "task_id": "<uuid>",
    "phase": "BUILD",
    "percent_complete": 40,
    "current_action": "Building edge function handlers",
    "blockers": [],
    "eta_minutes": 25
  }
}
```

**Run start:**
```json
{
  "data": {
    "event_type": "run_start",
    "run_id": "<uuid>",
    "task_id": "pending",
    "agent_name": "Sherlock"
  }
}
```

**Run end:**
```json
{
  "data": {
    "event_type": "run_end",
    "run_id": "<uuid>",
    "task_id": "<uuid>",
    "outcome": "completed",
    "phases_completed": 8,
    "total_phases": 8
  }
}
```

### pg_cron Watchdog

A PostgreSQL function (`check_stale_progress()`) scheduled via `cron.schedule` to run every minute.

**What it does:**
1. Finds all active runs (`run_start` without `run_end`)
2. For each, finds the most recent heartbeat (work_progress, run_start, or phase entry)
3. If gap > 10 minutes, INSERTs a `stale_progress` alert into `ai_log`
4. Anti-spam: won't re-alert the same `run_id` within 10 minutes

**Migration:** `20260302200000_progress_watchdog.sql`

```sql
CREATE OR REPLACE FUNCTION public.check_stale_progress()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$
-- Finds open runs, checks heartbeat gap, inserts stale_progress alert
$$;

SELECT cron.schedule('progress_watchdog', '* * * * *',
  'SELECT public.check_stale_progress()');
```

### Stale Detection (Frontend)

`useActiveAutopilot` computes `isStale` as:
```typescript
const isStale = !isCompleted && (
  now - lastHeartbeatMs > STALE_THRESHOLD_MS || hasStaleAlert
);
```

Where `STALE_THRESHOLD_MS = 10 * 60 * 1000` (10 minutes).

When stale, the dashboard shows a pulsing red "⚠️ STALE — No heartbeat" badge with last heartbeat time.

### Run Timeout Policy

Stale ≠ failed. The system distinguishes between these states:

| State | Condition | Action |
|-------|-----------|--------|
| **Healthy** | Last heartbeat < 10 min ago | Normal display |
| **Stale** | No heartbeat for > 10 min, no `run_end` | Yellow/red warning badge. pg_cron inserts `stale_progress` alert. Agent is prompted to resume heartbeating on next session start. |
| **Failed** | 5th heal attempt fails in /autopilot Phase 6 | Agent emits `run_end` with `outcome: "failed"`, sets ring red, posts urgent question. |
| **Abandoned** | No heartbeat for > 10 min AND no `run_start` lifecycle event | Frontend returns `idle` (auto-cleans). Legacy detection only. |

> **Key distinction:** A stale run is never auto-failed. Only the agent itself can emit `run_end` with `outcome: "failed"` (after heal exhaustion) or `outcome: "canceled"` (user request). The watchdog alerts but never terminates — it's an observer, not an executor. If a session crashes mid-run, the next `session-start.sh` detects the orphan and instructs the agent to either resume or close it.

### Orphaned Run Detection (Session Start)

`session-start.sh` queries `ai_log` via PostgREST at every session start:
```
GET /rest/v1/ai_log?select=data,created_at&order=created_at.desc&limit=100
```

Finds `run_start` events without matching `run_end`, outputs:
```
⚠️ ACTIVE RUN DETECTED: a1b2c3d4...
   Started: 2026-03-02T18:30:00Z
   ACTION: Resume heartbeating with work_progress events for this run_id.
```

---

## Part 6: Cross-Agent Auto-Dispatch

Enables agents to dispatch work to each other through the existing queue system. The user never needs to relay messages between agents.

### Problem Solved
Ray (coordinator) logs "dispatched Sherlock to build X" but Sherlock has no way to see it. The user becomes a telephone between agents.

### Solution: Queue as Dispatch Channel

ClawBuddy's queue system (`request_type: "queue"`) already supports `list`, `claim`, `complete`, `fail` actions against a `pending_tasks` table. We use it as the communication channel.

### Dispatch Flow

```
Ray dispatches ──→ Creates queue item ──→ Logs agent_dispatch event
                         │
                         ▼
Sherlock starts  ──→ session-start.sh checks queue
                         │
                    Shows: "📋 PENDING QUEUE ITEMS: 1"
                         │
Sherlock runs    ──→ /autopilot Phase 1 claims item
/autopilot               │
                    Logs dispatch_claimed event
                         │
                    Builds the task normally
```

### Ray's Side (Dispatcher)

1. Create queue item:
```json
{
  "request_type": "queue",
  "action": "create",
  "title": "Build Text Expander MVP",
  "description": "Full build with QA + docs",
  "priority": "high"
}
```

2. Log dispatch event:
```json
{
  "request_type": "log",
  "action": "create",
  "category": "general",
  "message": "Dispatched Sherlock to build Text Expander MVP",
  "data": {
    "event_type": "agent_dispatch",
    "dispatcher": "Ray",
    "executor": "Sherlock",
    "queue_item_id": "<uuid>",
    "task_title": "Build Text Expander MVP",
    "priority": "high",
    "requirements": "QA + docs"
  }
}
```

### Sherlock's Side (Executor)

**Automatic (session-start.sh):**
```bash
# Check for pending queue items (dispatched by Ray or Mani)
QUEUE=$(curl -s -X POST "$CLAWBUDDY_URL/functions/v1/ai-tasks" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_SECRET" \
  -d '{"request_type":"queue","action":"list","status":"pending","limit":5}')
```

Output when items exist:
```
📋 PENDING QUEUE ITEMS: 1
  [HIGH] Build Text Expander MVP (id: abc123)
   ACTION: Claim and execute the top item. Use queue.claim to start.
```

**In /autopilot Phase 1 (step 5):**
```json
{"request_type": "queue", "action": "list", "status": "pending", "limit": 5}
```
If items exist, claim:
```json
{"request_type": "queue", "action": "claim", "task_id": "<queue_item_id>"}
```

> **Idempotency note:** `queue.claim` is single-use. Once an item is claimed, its status moves from `pending` → `processing` and subsequent `claim` calls for the same `task_id` will fail. If two agents race to claim the same item, only one succeeds — the other gets an error response. This is by design: the queue provides atomic handoff with no double-pickup risk.
Log pickup:
```json
{
  "data": {
    "event_type": "dispatch_claimed",
    "dispatcher": "Ray",
    "executor": "Sherlock",
    "queue_item_id": "<uuid>",
    "run_id": "<uuid>"
  }
}
```

**In Core Workflow (Step 0):**
Before creating a new task, always check queue first:
```json
{"request_type": "queue", "action": "list", "status": "pending", "limit": 5}
```

### Known Issue: Log-Only Dispatch (No Queue Item)

A coordinator may log a dispatch (`agent_dispatch` event) and create a Kanban task, but **forget to create a queue item**. When this happens:
- The executor's `session-start.sh` queue check returns empty
- `/autopilot` Phase 1 finds nothing to claim
- The dispatch is invisible to the executor — it only exists as a log entry

**The fix:** The coordinator **must** do both:
1. Create queue item: `{"request_type": "queue", "action": "create", "title": "...", "priority": "high"}`
2. Log the dispatch: `{"request_type": "log", "action": "create", ..., "data": {"event_type": "agent_dispatch", ...}}`

A log entry alone is not a dispatch. The queue item is the actual handoff mechanism. Without it, the user becomes the telephone again — which is exactly what this system was built to prevent.

---

## Part 7: Alignment Scoring

12-check system that produces a score (0-100%) with letter grades.

### Checks

| # | Check | Pass Condition | Severity |
|---|-------|---------------|----------|
| 1 | STATUS.md freshness | Updated < 24h ago | fail |
| 2 | MEMORY.md content | > 20 lines | warn |
| 3 | Doing tasks assigned | All doing tasks have assignees | fail |
| 4 | No stuck tasks | No tasks in doing > 48h | warn |
| 5 | Sherlock online | Agent status is online | fail |
| 6 | Questions answered | No stale high-priority questions > 24h | fail |
| 7 | AI Log active | > 0 entries in last 24h | warn |
| 8 | Git clean | Working tree clean | warn |
| 9 | CLAUDE.md present | File exists with > 50 lines | fail/warn |
| 10 | Hooks configured | >= 3 hook types in settings.local.json | warn |
| 11 | Skills healthy | Skill Factory API accessible | pass |
| 12 | Edge functions | Edge functions directory exists | warn |

### Grading

| Score | Grade | Ring Color |
|-------|-------|-----------|
| >= 90% | A | green |
| >= 75% | B | yellow |
| >= 60% | C | yellow |
| < 60% | F | red |

### Output

Alignment check pushes results to ClawBuddy as an insight card:
```json
{
  "request_type": "insight",
  "action": "create",
  "insight_type": "summary",
  "title": "Alignment Score — 92% (A)",
  "content": "12 checks: 10 passed, 1 warning, 1 failed",
  "data": {
    "event_type": "alignment_score",
    "score": 92,
    "grade": "A",
    "run_id": "<uuid>",
    "details": [
      { "check": "STATUS.md freshness", "status": "pass", "detail": "Updated 2h ago" }
    ]
  }
}
```

---

## Part 8: Self-Evolution Rules

Rules governing how the agent improves its own configuration over time.

### Triggers

| Trigger | Action | Approval Required |
|---------|--------|------------------|
| Same error 3+ times | Extract rule → MEMORY.md | After every 5 changes |
| User corrects behavior | Immediate update to CLAUDE.md/MEMORY.md | After every 5 changes |
| Every 5 self-modifications | Pause and ask for review | Yes |
| Stale documentation detected | Flag in alignment check | No (informational) |

### What Can Be Self-Modified

| File | Allowed Changes |
|------|----------------|
| MEMORY.md | Add gotchas, API quirks, session rules |
| CLAUDE.md | Update IDs, fix documented quirks |
| STATUS.md | Full rewrite each session |
| .claude/rules/*.md | Add new rules |
| .claude/hooks/*.sh | Bug fixes only (always requires approval) |
| .claude/skills/*/SKILL.md | Workflow improvements (always requires approval) |

### Evolution Log Contract

```json
{
  "request_type": "log",
  "action": "create",
  "category": "self_evolution",
  "message": "[SELF-EVOLUTION] Type: rule_extraction | File: MEMORY.md | Change: Added shlex parsing quirk | Reason: False positive blocked curl",
  "data": {
    "event_type": "self_evolution",
    "type": "rule_extraction",
    "file": "MEMORY.md",
    "change": "Added shlex parsing quirk for command guard",
    "reason": "False positive blocked curl with log message",
    "run_id": "<uuid>"
  }
}
```

---

## Part 9: Data Model

### Tables Used

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `ai_log` | All lifecycle events, heartbeats, hook telemetry | `message`, `category`, `data` (JSONB), `agent_name`, `agent_emoji` |
| `ai_insights` | Build summaries, alignment scores | `title`, `content`, `data` (JSONB), `insight_type` |
| `ai_status` | Agent presence (online/offline, ring color) | `is_online`, `ring_color`, `status_message`, `agent_name`, `last_seen` |
| `tasks` | Kanban board | `title`, `description`, `board_column_id` |
| `task_assignees` | Task assignments | `task_id`, `user_id` |
| `pending_tasks` | Queue/dispatch system | `title`, `description`, `priority`, `status` |
| `agent_comms` | Inter-agent messaging | `from_agent`, `to_agent`, `message`, `message_type`, `status`, `parent_id` |

### Event Types (data->>'event_type')

| Event Type | Source | Purpose |
|-----------|--------|---------|
| `run_start` | /autopilot Phase 1 | Marks beginning of trackable run |
| `work_progress` | /autopilot Phase 4 (every 5 min) | Heartbeat with progress data |
| `run_end` | /autopilot Phase 8, /done Step 8, heal failure | Closes the run |
| `stale_progress` | pg_cron watchdog | Auto-alert when run goes silent >10 min |
| `hook_execution` | All hooks | Telemetry for hook firing |
| `build_summary` | /autopilot Phase 7 | Build metrics insight card |
| `alignment_score` | alignment-check.sh | Scoring results |
| `self_evolution` | Self-evolution triggers | Learning log entry |
| `agent_dispatch` | Ray (coordinator) | Records dispatch from one agent to another |
| `dispatch_claimed` | Sherlock (executor) | Records pickup of dispatched work |

---

## Part 11: Agent Comms — Inter-Agent Messaging

Agents need to talk to each other. Ray can't ask Sherlock "what's your status?" and get an answer. Mani can't ask Ray "check on Sherlock" and get a real response. Agent Comms solves this with a dedicated messaging channel.

### Table: `agent_comms`

```sql
CREATE TABLE public.agent_comms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_agent text NOT NULL,          -- "Ray", "Sherlock", "Mani Kanasani"
  from_emoji text DEFAULT '🤖',
  to_agent text NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'comment',
    -- comment | question | status_request | status_response | directive
  priority text NOT NULL DEFAULT 'normal',
    -- low | normal | high | urgent
  status text NOT NULL DEFAULT 'pending',
    -- pending | read | replied | archived
  parent_id uuid REFERENCES agent_comms(id),  -- threading
  related_task_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  replied_at timestamptz
);
```

### API Reference

```
request_type: "agent_comms"
actions: send, list, check, reply, mark_read, thread
```

| Action | Purpose | Required Fields |
|--------|---------|----------------|
| `send` | Post message to another agent | `to_agent`, `message` |
| `list` | Get messages for an agent | `agent_name` (optional, defaults to auth agent), `status` |
| `check` | Get unread count | `agent_name` |
| `reply` | Threaded response (auto-updates parent status) | `parent_id`, `message` |
| `mark_read` | Mark one or all as read | `message_id` (single) or `agent_name` (bulk) |
| `thread` | Get full conversation thread | `message_id` (root message) |

### Message Types

| Type | When To Use |
|------|------------|
| `comment` | General notes between agents |
| `question` | Agent needs another agent's input |
| `status_request` | "What are you working on?" |
| `status_response` | Reply with current status/progress |
| `directive` | Priority override or instruction from coordinator/user |

### Example Flow: Mani Asks Ray to Check on Sherlock

```
1. Mani → Ray: "Check on Sherlock's progress"
   (Ray reads this from his own context)

2. Ray sends status_request:
   {"request_type": "agent_comms", "action": "send",
    "to_agent": "Sherlock",
    "message": "Status update needed — what's your progress on the To-Do app?",
    "message_type": "status_request", "priority": "high"}

3. Sherlock's next session-start.sh shows:
   💬 UNREAD AGENT MESSAGES: 1
     [HIGH] From Ray: "Status update needed..." (status_request) id:abc123

4. Sherlock replies:
   {"request_type": "agent_comms", "action": "reply",
    "parent_id": "<msg_id>",
    "message": "60% done. BUILD phase — deploying edge functions. ETA 15 min.",
    "message_type": "status_response"}

5. Ray checks his messages next heartbeat:
   {"request_type": "agent_comms", "action": "list",
    "agent_name": "Ray", "status": "pending"}
   → Sees Sherlock's response → relays to Mani
```

### Session Start Integration

`session-start.sh` checks for unread agent messages after the queue check:

```bash
# Check for unread agent messages
COMMS=$(curl -s -X POST "$CLAWBUDDY_URL/functions/v1/ai-tasks" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_SECRET" \
  -d '{"request_type":"agent_comms","action":"list","agent_name":"Sherlock","status":"pending","limit":5}')
```

Output:
```
💬 UNREAD AGENT MESSAGES: 2
  [HIGH] From Ray: "Status update needed..." (status_request) id:abc123
  [NORMAL] From Mani Kanasani: "Priority shift — do email template first" (directive) id:def456
   ACTION: Read and respond via agent_comms.reply
```

### Threading Model

Messages support parent-child threading via `parent_id`:
- When you `reply`, the system auto-sets `to_agent` to the parent's `from_agent`
- Parent message status auto-updates to `"replied"`
- Use `thread` action to get the full conversation (root + all replies)

### Event Type for Dashboard

Agent comms don't use `ai_log` event types — they have their own table. The dashboard can read `agent_comms` directly via Supabase realtime subscriptions for instant notification rendering.

---

## Part 12: File Map

```
.claude/
├── hooks/
│   ├── session-start.sh        # SessionStart — loads context, checks queue, checks comms, detects orphans
│   ├── pre-compact-save.sh     # PreCompact — directive to save state
│   ├── command-guard.sh        # PreToolUse:Bash — blocks destructive commands
│   ├── typecheck.sh            # PostToolUse:Write|Edit — auto tsc on .ts/.tsx
│   └── alignment-check.sh      # Manual — 12-check scoring system
├── skills/
│   ├── autopilot/
│   │   └── SKILL.md            # 8-phase autonomous build loop
│   └── done/
│       └── SKILL.md            # 8-step session close protocol
├── commands/
│   ├── alignment.md            # /alignment slash command
│   ├── autopilot.md            # /autopilot slash command
│   └── done.md                 # /done slash command
├── rules/
│   └── self-evolution.md       # Self-improvement governance
├── settings.local.json         # Hook registration + permissions
└── plans/                      # Plan mode artifacts

clawbuddy-kit/src/
├── hooks/
│   └── useActiveAutopilot.ts   # Real-time run detection hook
├── components/command-center/
│   └── SessionIntel.tsx        # Live tracker + build history + evolution log
└── data/
    └── command-center-data.ts  # Phase definitions, color maps, mock fallbacks

cosmic-flow-51/supabase/migrations/
├── 20260302200000_progress_watchdog.sql  # pg_cron stale run detector
└── 20260303020000_agent_comms.sql        # Inter-agent messaging table
```

---

## Quick Start Checklist

1. **Copy hooks** from `.claude/hooks/` into your project's `.claude/hooks/`
2. **Copy skills** from `.claude/skills/` into your project's `.claude/skills/`
3. **Copy commands** from `.claude/commands/` into your project's `.claude/commands/`
4. **Copy rules** from `.claude/rules/` into your project's `.claude/rules/`
5. **Update `settings.local.json`** with hook registrations (see structure above)
6. **Set credentials via environment variables** — export `CLAWBUDDY_API_URL` and `CLAWBUDDY_WEBHOOK_SECRET` in your shell profile (`.zshrc`, `.bashrc`, or `.env`). **Never hardcode secrets directly in hook scripts.** The hooks read from `$CLAWBUDDY_URL` and `$CLAWBUDDY_SECRET` env vars at runtime
7. **Deploy watchdog migration** — `supabase db push` from your Supabase project directory
8. **Deploy frontend** — SessionIntel component reads from `ai_log` and `ai_insights` tables
9. **Set up queue** — ensure your `pending_tasks` table is accessible via the `queue` request type
10. **Test the flow** — run `/autopilot` on a small task and watch the Command Center light up
