# Module: Autonomous Agent Orchestration

> **Agent Instruction Doc** — Give this file to any OpenClaw agent or AI coordinator.
> The agent reads these instructions to orchestrate autonomous build sessions via ClawBuddy.

---

## Overview

This module enables **overnight and unattended autonomous builds** by defining:
1. How a coordinator agent (OpenClaw) assigns tasks to executor agents (Claude Code, Cursor, etc.)
2. How the Session Intelligence hooks ensure full context across sessions
3. The autonomy envelope — what's pre-approved vs. requires human approval
4. Cross-QA protocol between agents
5. Morning deliverable format so the human wakes up to a complete report

**This is agent-agnostic.** The orchestrator can be OpenClaw, n8n, Make.com, or any system that can POST to the ClawBuddy API. The executor can be Claude Code, Cursor, Windsurf, or any coding agent with file access.

**Prerequisite:** ClawBuddy must be deployed. Session Intelligence hooks should be installed (see `supercharge-claude-code.md`).

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    HUMAN (Mani)                      │
│         Sets priorities → Reviews morning report     │
└──────────────────────┬──────────────────────────────┘
                       │ Kanban board + approvals
                       ▼
┌─────────────────────────────────────────────────────┐
│              COORDINATOR (OpenClaw)                   │
│                                                       │
│  • Reads Kanban → picks highest-priority task         │
│  • Creates subtasks + assigns executor                │
│  • Monitors progress via ClawBuddy logs               │
│  • Handles cross-QA between agents                    │
│  • Escalates blockers → posts question                │
│  • Generates morning report when all tasks complete   │
└──────────────────────┬──────────────────────────────┘
                       │ Task assignment + context
                       ▼
┌─────────────────────────────────────────────────────┐
│              EXECUTOR (Claude Code / Any Agent)       │
│                                                       │
│  • Session-start hook loads STATUS.md + ClawBuddy     │
│  • /autopilot runs 8-phase build loop                 │
│  • Logs every step to AI Log                          │
│  • Pre-compact hook saves state before context loss   │
│  • /done protocol wraps session                       │
│  • NEVER deploys without approval                     │
└─────────────────────────────────────────────────────┘
```

---

## Step 1: Coordinator Setup (OpenClaw)

The coordinator is the "night shift manager." It doesn't write code — it assigns work, monitors progress, and handles escalation.

### Coordinator Responsibilities

| Duty | How |
|------|-----|
| Pick next task | Read Kanban: `{"request_type": "task", "action": "list"}` → filter by priority |
| Assign executor | `{"request_type": "assignee", "action": "assign", "task_id": "...", "names": ["Sherlock", "Mani Kanasani"]}` |
| Move to doing | `{"request_type": "task", "action": "update", "task_id": "...", "column": "doing"}` |
| Monitor progress | Poll AI Log: `{"request_type": "log", "action": "list"}` — check for new entries |
| Detect stalls | If no log entry for 30 min on a "doing" task → escalate |
| Handle blockers | If executor posts question → check if pre-approved, else hold |
| Cross-QA | When executor finishes → validate output before marking done |
| Morning report | Generate HTML report: `{"request_type": "report", "action": "create", ...}` |

### Coordinator Loop (Pseudocode)

```
WHILE unfinished_tasks exist AND within_operating_hours:
    1. task = pick_highest_priority_todo()
    2. assign(task, executor="Sherlock")
    3. move(task, "doing")
    4. log("Coordinator: Assigned '{task.title}' to Sherlock")
    5. wake_executor(task)  # Start Claude Code session with task context

    6. WHILE task.column == "doing":
        a. WAIT 5 minutes
        b. check_logs(task)
        c. IF no_new_logs_for_30_min:
            post_question("Executor appears stalled on '{task.title}'. Investigate?")
            BREAK
        d. IF executor_posted_question:
            IF question_in_autonomy_envelope:
                respond_automatically()
            ELSE:
                log("Coordinator: Holding — needs human approval")
                BREAK

    7. IF task.column == "done":
        run_cross_qa(task)
        IF qa_passes:
            log("Coordinator: QA passed for '{task.title}'")
        ELSE:
            move(task, "doing")
            log("Coordinator: QA failed — sending back for fixes")

GENERATE morning_report()
SET status offline
```

---

## Step 2: Executor Context Loading

When the coordinator "wakes up" an executor (starts a Claude Code session), the **session-start hook** automatically fires and loads:

### What Gets Loaded (Automatic via Hooks)

| Source | What It Provides |
|--------|-----------------|
| `STATUS.md` | Last session's state — what was done, what's next |
| ClawBuddy unread logs | Messages from coordinator or other agents |
| ClawBuddy pending questions | Answered questions waiting for pickup |
| ClawBuddy active tasks | Current Kanban state (To Do, Doing, Needs Input counts) |
| `MEMORY.md` | API quirks, project map, session rules |
| `CLAUDE.md` | Full project instructions + ClawBuddy integration guide |

### What the Executor Sees at Session Start

```
═══ CLAWBUDDY SESSION LOADED ═══

--- Last Session State (STATUS.md) ---
[Previous session summary]

Unread ClawBuddy logs: 2
Pending questions: 1
Tasks — To Do: 3 | Doing: 1 | Needs Input: 0

═══ SHERLOCK ONLINE — Ready to work ═══
```

The executor immediately knows:
- What happened last session
- What's assigned to it right now
- Whether there are coordinator messages to process
- Whether previously asked questions have been answered

---

## Step 3: The Autonomy Envelope

The autonomy envelope defines what the executor can do without human approval. This is the **critical safety boundary** for overnight builds.

### Pre-Approved Actions (No Human Needed)

| Action | Condition |
|--------|-----------|
| Read any project file | Always |
| Write/edit source code | Within assigned task scope |
| Run builds (`npm run build`, `tsc`) | Always |
| Run tests (`npm test`, `pytest`) | Always |
| Run linting | Always |
| Create ClawBuddy tasks/subtasks | Always |
| Log to AI Log | Always |
| Post questions to ClawBuddy | Always |
| Update STATUS.md | Always |
| Submit to Cognitive Memory | Always |
| Create insight cards | Always |
| Generate reports | Always |
| Git commit (with descriptive message) | After validation passes |
| Self-heal (fix build errors, up to 5 attempts) | Always |
| Install npm packages (non-global) | If required by task |

### Requires Human Approval (STOP and Ask)

| Action | Why |
|--------|-----|
| Deploy to production (edge functions, Netlify) | Irreversible in production |
| Database migrations | Schema changes need review |
| Modify .env files | Credential changes |
| Delete files | Destructive |
| Force push to any branch | Destructive |
| Modify security permissions | Access control |
| Send emails/messages to external users | Communication on behalf of human |
| Create new API keys or tokens | Security |
| Modify ClawBuddy hooks or settings.local.json | Self-modification of safety boundaries |
| Spend money (API calls to paid services) | Financial |
| Modify another agent's configuration | Cross-agent boundary |

### How Approval Works Overnight

When the executor hits a "requires approval" action:

1. **Post question to ClawBuddy:**
   ```json
   {
     "request_type": "question",
     "action": "ask",
     "question_type": "approval",
     "priority": "high",
     "question": "Ready to deploy ai-tasks edge function. 3 files changed, all tests passing. Approve deploy?"
   }
   ```

2. **Move task to "Needs Input":**
   ```json
   {"request_type": "task", "action": "update", "task_id": "...", "column": "needs_input"}
   ```

3. **Log the hold:**
   ```json
   {"request_type": "log", "action": "create", "category": "general", "message": "HOLDING: Awaiting approval to deploy. Moving to next task."}
   ```

4. **Move to next task** (don't block the entire night on one approval)

5. **Coordinator picks up** — if coordinator can auto-approve (based on its own envelope), it does. Otherwise, it holds for human.

---

## Step 4: Cross-QA Protocol

When an executor marks a task "done," the coordinator (or a second executor) runs quality assurance.

### QA Checklist

```
□ Build passes (npm run build / tsc --noEmit)
□ Tests pass (if tests exist for changed files)
□ No lint errors introduced
□ Git diff looks clean (no debug code, no console.logs left)
□ STATUS.md was updated
□ At least 2 log entries exist for the task
□ Task has assignees
□ Subtasks are all marked complete
□ No "TODO" or "FIXME" introduced without a corresponding task
```

### QA Flow

```json
// Coordinator runs QA
{"request_type": "log", "action": "create", "category": "observation", "message": "Cross-QA: Reviewing '{task.title}' by Sherlock"}

// If QA passes
{"request_type": "task", "action": "update", "task_id": "...", "column": "done"}
{"request_type": "log", "action": "create", "category": "observation", "message": "Cross-QA PASSED: '{task.title}'. Build ✓, Tests ✓, Lint ✓, Docs ✓"}

// If QA fails
{"request_type": "task", "action": "update", "task_id": "...", "column": "doing"}
{"request_type": "log", "action": "create", "category": "observation", "message": "Cross-QA FAILED: '{task.title}'. Issues: [list]. Returning for fixes."}
```

---

## Step 5: Context Persistence Across Sessions

The Session Intelligence hooks create a **memory bridge** between sessions. Here's how context survives:

### Pre-Compact (Before Context Loss)

When compaction is triggered, the pre-compact hook outputs a DIRECTIVE that forces the executor to:

1. Push session summary to AI Log
2. Update STATUS.md with current progress
3. Update in-progress task descriptions with current state
4. Submit new learnings to Cognitive Memory
5. Set status ring to yellow

### Session Start (After Wake-Up)

When a new session begins, the session-start hook:

1. Sets Sherlock online (green ring)
2. Loads last 30 lines of STATUS.md
3. Pulls unread logs from ClawBuddy (coordinator messages)
4. Checks for answered questions
5. Shows active task counts

### State Flow Diagram

```
Session 1                    Gap                    Session 2
─────────                    ───                    ─────────
  Working...                                        Hook fires
  Pre-compact fires ──→ STATUS.md updated    ──→   Reads STATUS.md
  AI Log entry      ──→ Stored in Supabase   ──→   Pulls unread logs
  Cognitive Memory  ──→ Persisted            ──→   Available via API
  Task descriptions ──→ Updated on Kanban    ──→   Task list loaded
  Ring → yellow     ──→ Visible on dashboard ──→   Ring → green
```

### What If Context Is Lost Anyway?

If an executor starts fresh with no prior context:

1. `CLAUDE.md` provides full project instructions (always loaded by Claude Code)
2. `MEMORY.md` has all API quirks and project map (auto-loaded)
3. `STATUS.md` has last session state (loaded by session-start hook)
4. ClawBuddy API has full task history, logs, and cognitive memory
5. Git log has commit history with descriptive messages

The executor can reconstruct context from these 5 sources in under 30 seconds.

---

## Step 6: Morning Deliverable

When all overnight tasks complete (or operating hours end), the coordinator generates a morning report.

### Morning Report Format

```json
{
  "request_type": "report",
  "action": "create",
  "report_type": "insight",
  "title": "Overnight Build Report — [Date]",
  "html_content": "<html>...</html>"
}
```

### Report Contents

```html
<h1>🌅 Overnight Build Report</h1>
<p>Session: [start time] → [end time] ([duration])</p>

<h2>✅ Completed</h2>
<table>
  <tr><th>Task</th><th>Agent</th><th>Duration</th><th>Files Changed</th><th>QA</th></tr>
  <tr><td>Build data pipeline</td><td>Sherlock</td><td>47min</td><td>3</td><td>✅ Passed</td></tr>
</table>

<h2>⏸️ Awaiting Approval</h2>
<ul>
  <li><strong>Deploy ai-tasks edge function</strong> — 3 files changed, all tests pass. Approve?</li>
</ul>

<h2>🔴 Blocked</h2>
<ul>
  <li><strong>Migrate user schema</strong> — Needs clarification on field naming convention.</li>
</ul>

<h2>📊 Metrics</h2>
<ul>
  <li>Tasks completed: 4/6</li>
  <li>Total build time: 3h 12m</li>
  <li>Self-heal attempts: 2 (both successful)</li>
  <li>Files modified: 14</li>
  <li>Alignment score: 88% (B+)</li>
</ul>

<h2>🧠 Learnings Extracted</h2>
<ul>
  <li>Supabase RLS policies need explicit service_role bypass for edge functions</li>
  <li>React Query cache invalidation must happen after task board mutations</li>
</ul>
```

### Notification

The coordinator also pushes an insight card so it's visible on the dashboard:

```json
{
  "request_type": "insight",
  "action": "create",
  "insight_type": "summary",
  "title": "Overnight Build Complete",
  "content": "4/6 tasks completed. 2 awaiting approval. Alignment: 88%. Full report filed.",
  "data": {"completed": 4, "total": 6, "blocked": 1, "awaiting_approval": 1, "alignment_score": 88}
}
```

---

## Step 7: Operating Hours & Safety

### Operating Window

The coordinator respects operating hours:

| Mode | Hours | Behavior |
|------|-------|----------|
| Active | Set by human | Full autonomous build |
| Idle | Outside active hours | No new tasks picked up, existing tasks can finish |
| Emergency only | Explicit flag | Only process tasks marked "urgent" |

### Safety Rails

1. **Command Guard Hook** — Blocks destructive commands even in autonomous mode (rm -rf /, force push, db reset, .env deletion)
2. **Max Heal Attempts** — Self-healing loop caps at 5 attempts per failure, then escalates
3. **No Silent Failures** — Every error gets logged. If a task fails 5 times, it moves to "needs input"
4. **No Production Deploys** — /autopilot builds, validates, and reports — never deploys without approval
5. **Budget Tracking** — API call costs are tracked per task via ClawBuddy Budget feature
6. **Audit Trail** — Every action is logged to AI Log with timestamps, creating a complete audit trail

### Kill Switch

The human can stop all autonomous work at any time:

```json
{"request_type": "status", "action": "update", "is_online": false, "status_message": "EMERGENCY STOP — all autonomous work halted.", "ring_color": "red"}
```

The coordinator checks Sherlock's status before assigning new tasks. Red ring = stop everything.

---

## Step 8: Multi-Agent Night Shift

For larger projects, multiple executors can work in parallel:

### Agent Roster

| Agent | Role | Specialty |
|-------|------|-----------|
| Sherlock | Lead executor | Full-stack builds, API integrations |
| Watson | Email/comms executor | Draft emails, process inbound, update CRM |
| PepperPots | Meeting intel | Process recordings, prep next-day meetings |
| Researcher | Research agent | Web research, competitor analysis, data gathering |

### Parallel Execution Rules

1. **No two agents work on the same file** — Coordinator assigns non-overlapping tasks
2. **Shared Kanban board** — All agents see each other's tasks and can read each other's logs
3. **Cross-QA** — Agent A's work is QA'd by Agent B (never self-QA)
4. **Merge conflicts** — If detected, task moves to "needs input" with details logged
5. **Resource contention** — Coordinator sequences tasks that touch the same service (e.g., Supabase deploys are serialized)

---

## Data Schema

### Task Records (Kanban)

Tasks assigned by the coordinator follow standard ClawBuddy task schema:

```json
{
  "title": "Build user onboarding flow",
  "description": "Create 3-step onboarding wizard with form validation. See design in Figma link.",
  "column": "todo",
  "metadata": {
    "assigned_by": "coordinator",
    "priority": "high",
    "autonomy_level": "full",
    "estimated_hours": 2,
    "dependencies": [],
    "qa_required": true
  }
}
```

### Log Entry Format

Executor logs follow this convention:

```json
{
  "request_type": "log",
  "action": "create",
  "category": "observation",
  "message": "[EXECUTOR:Sherlock] Phase 4 BUILD: Created UserOnboarding.tsx with 3 steps. Form validation using zod schema. Moving to Phase 5 VALIDATE."
}
```

Coordinator logs use:

```json
{
  "request_type": "log",
  "action": "create",
  "category": "general",
  "message": "[COORDINATOR] Assigned 'Build user onboarding flow' to Sherlock. Priority: high. Estimated: 2h."
}
```

---

## Usage (Day-to-Day)

### Setting Up a Night Shift

1. **Human queues tasks** on Kanban board during the day, setting priorities
2. **Human activates coordinator** at end of day: "Run overnight builds"
3. **Coordinator picks up tasks** in priority order, assigns executors
4. **Executors build autonomously** using /autopilot loop
5. **Morning report appears** on ClawBuddy dashboard when human wakes up
6. **Human reviews** — approves deploys, answers blocked questions, reviews QA results

### Checking Progress Mid-Night

Open ClawBuddy dashboard:
- **Status ring** — Green = working, Yellow = waiting, Red = blocked, Gray = done for the night
- **AI Log** — Real-time feed of what every agent is doing
- **Kanban board** — Tasks moving through columns
- **Insight cards** — Metrics and completion summaries

### Starting an Overnight Session

Tell your executor:
```
/autopilot — Build all tasks in the To Do column, highest priority first.
Log everything. QA each task before marking done. Generate morning report when complete.
```

Or have the coordinator do it automatically by scheduling it as a ClawBuddy automation.

---

## Integration with Existing Modules

| Module | How It Connects |
|--------|----------------|
| **Supercharge Claude Code** | Session Intelligence hooks (pre-compact, session-start, command-guard) provide the memory backbone |
| **Skill Library** | /autopilot and /done skills are the executor's primary workflows |
| **Cognitive Memory** | Learnings from overnight builds auto-submit to persistent memory |
| **Meeting Intelligence** | PepperPots agent can prep for next-day meetings during night shift |
| **Creator Command** | Research agent can gather competitor intel overnight |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Executor loses context mid-build | Pre-compact hook should fire → check STATUS.md was updated. If not, verify hook is in settings.local.json |
| Task stuck in "doing" for hours | Coordinator should detect via log staleness check (30 min threshold) |
| Build fails repeatedly | Self-heal loop caps at 5 attempts → moves to "needs input" with full error log |
| Coordinator assigns overlapping tasks | Check task dependencies and file paths — coordinator should serialize conflicting work |
| Morning report missing | Verify coordinator reached end of loop → check for crashes in coordinator logs |
| Agent creates ghost status records | Always pass `agent_name` and `agent_emoji` in every API call |
