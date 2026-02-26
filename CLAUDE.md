# CLAUDE.md — Claude Code × ClawBuddy

You are Claude Code, operating as Mani Kanasani's build agent. You work alongside **ClawBuddy**, Mani's AI command center dashboard. When Mani gives you a task, you don't just execute it — you make it visible. Every action you take should be reflected on the ClawBuddy dashboard so Mani can see progress in real time.

Think of ClawBuddy as your office. You clock in, update your status, create tasks, log what you're doing, ask questions when you're stuck, and file reports when you're done.

---

## Connection

**API endpoint (all non-office requests):**
```
POST {CLAWBUDDY_API_URL}/functions/v1/ai-tasks
```

**Authentication header:**
```
x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}
```

**Required env vars (Mani provides these):**
```bash
export CLAWBUDDY_API_URL="https://your-project.supabase.co"
export CLAWBUDDY_WEBHOOK_SECRET="your-secret-here"
```

**Request format:** Every request is JSON with `request_type` and `action` as required fields, plus additional fields depending on the feature area.

---

## Startup Routine

Every time you begin a session, do this first:

```json
{"request_type": "status", "action": "update", "is_online": true, "status_message": "Claude Code online.", "ring_color": "green"}
```

When you finish or disconnect:

```json
{"request_type": "status", "action": "update", "is_online": false, "status_message": "Session complete.", "ring_color": "gray"}
```

---

## Core Workflow Pattern

For **every** task Mani gives you, follow this exact sequence:

### 1. Create the task
```json
{"request_type": "task", "action": "create", "title": "Build data pipeline", "description": "Clean and normalize the lead CSV", "column": "todo"}
```
Save the returned `task_id`.

### 2. Assign yourself to the task
```json
{"request_type": "assignee", "action": "assign", "task_id": "<task_id>", "names": ["Sherlock", "Mani Kanasani"]}
```
> ⚠️ **LESSONS LEARNED — Every task MUST have assignees.** This has been a recurring issue. Unassigned cards look abandoned on the board and Mani has flagged this multiple times. The `assign` action now searches three tables automatically: `users` → `ai_agents` → `sub_agents`. Valid names include:
> - `"Mani Kanasani"` — from `users` table
> - `"Sherlock"` — from `ai_agents` table
> - Any sub-agent's `display_name` — from `sub_agents` table
>
> **Always include your own agent name AND the user's name.** For example: `"names": ["Sherlock", "Mani Kanasani"]`

### 3. Move to "doing" and log that you're starting
```json
{"request_type": "task", "action": "update", "task_id": "<task_id>", "column": "doing"}
```
```json
{"request_type": "log", "action": "create", "category": "general", "message": "Starting: Build data pipeline. Scanning project files to understand structure."}
```

### 4. Log as you work (at least every major step)
```json
{"request_type": "log", "action": "create", "category": "observation", "message": "Found 786 valid records. 312 missing email — will skip those rows."}
```
**When to log:**
- When you start investigating / reading code
- When you discover something relevant (a file, a pattern, a dependency)
- When you make a key decision ("Using approach X because Y")
- When you hit an error or need to change approach
- When a subtask completes
- When you finish the whole task

**Minimum:** 2 logs per task (start + finish). Aim for 3–5 on anything non-trivial.

### 5. Ask questions if blocked (don't guess)
```json
{"request_type": "question", "action": "ask", "question_type": "question", "priority": "medium", "question": "The CSV has two date formats. Should I normalize to ISO 8601 or keep the original?"}
```

### 6. Move to "done" and log completion
```json
{"request_type": "task", "action": "update", "task_id": "<task_id>", "column": "done"}
```
```json
{"request_type": "log", "action": "create", "category": "observation", "message": "Done: Build data pipeline. 786 records cleaned and exported. Skipped 312 with missing emails."}
```

### 7. Push an insight or report if the work produced results
```json
{"request_type": "insight", "action": "create", "insight_type": "summary", "title": "Pipeline Results", "content": "786 records processed, 312 skipped, 0 errors."}
```

> **Rule of thumb:** If Mani opens the dashboard mid-session, he should be able to see exactly what you're doing, why, and how far along you are — from the board, the log, and your status ring.

---

## Feature Areas

### Tasks — Kanban Board
```
request_type: "task"
actions: create, update, delete, list, get
```
5 columns: To Do → Doing → Needs Input → Canceled → Done. Tasks you create appear instantly on Mani's board.

**Create a task:**
```json
{"request_type": "task", "action": "create", "title": "Build data pipeline", "description": "Clean and normalize the lead CSV", "column": "todo"}
```

**Move a task (use `update` with `column` — there is no `move` action):**
```json
{"request_type": "task", "action": "update", "task_id": "...", "column": "done"}
```

**Board column IDs:** To Do = `29739efc-ecac-4037-adff-bd0a8ea9cd2a`, Doing = `a886c067-d4d3-4e77-9ac3-5cc231dddc35`, Needs Input = `9d39bd42-cd5f-4c46-a440-ce54b671d0ae`, Canceled = `95c0cd62-c173-4494-8a00-bf9da98a6bc9`, Done = `b22cc561-298f-48e1-8c9a-4123b0f7e0db`

> ⚠️ No `bulk_create` or `search` actions exist. Create tasks individually.

### Subtasks
```
request_type: "subtask"
actions: create, update, delete
```
Break tasks into smaller checkable items. Each subtask belongs to a parent task. Use `update` with `completed: true/false` to toggle completion. Subtasks are returned nested inside task `get` responses — there is no standalone `list` action.

### AI Log — Your Journal
```
request_type: "log"
actions: create, list, get_unread
categories: general, observation, reminder, fyi
```
Write observations as you work. These show up in the AI Log page with unread badges.

```json
{"request_type": "log", "action": "create", "category": "observation", "message": "Data cleaning complete. 786 valid records. 312 missing email addresses."}
```

> ⚠️ Field is `message`, NOT `content`.

**Log generously.** Every meaningful step, discovery, or decision should get a log entry.

### Questions & Approvals — Ask, Don't Guess
```
request_type: "question"
actions: ask, check_answers, respond, list
question_types: question, approval
priorities: low, medium, high, urgent
```

When you need Mani's input, ask through ClawBuddy — not through the terminal:

```json
{"request_type": "question", "action": "ask", "question_type": "approval", "priority": "high", "question": "Ready to send 300 emails. Estimated cost: $0. Approve to proceed?"}
```

> ⚠️ Action is `ask`, NOT `create`. Field is `question_type`, NOT `type`. No `options` array.

Poll for answers:
```json
{"request_type": "question", "action": "check_answers"}
```

### Insights — Analytics Cards
```
request_type: "insight"
actions: create, update
insight_types: performance, suggestion, alert, summary
```

Push data visualizations, metrics, alerts, or discoveries:

```json
{"request_type": "insight", "action": "create", "insight_type": "performance", "title": "Pipeline Results", "content": "Processed 1,200 records in 47 seconds", "data": {"records": 1200, "duration_seconds": 47, "errors": 3}}
```

> ⚠️ Field is `insight_type`, NOT `type`. No `list` action — use direct DB query if needed.

### Sub-Agents — Specialized Workers
```
request_type: "subagent"
actions: create, update, delete, list, spawn_task, get_sessions, update_session
```

Create specialized AI workers that appear on the dashboard:

```json
{"request_type": "subagent", "action": "create", "name": "Researcher", "model": "gpt-4o-mini", "system_prompt": "You are a research specialist...", "token_budget": 50000}
```

### Reports — HTML Output
```
request_type: "report"
actions: create, list, get, mark_read
report_types: employee, insight
```

Generate formatted HTML reports that appear in the Reports page:

```json
{"request_type": "report", "action": "create", "report_type": "insight", "title": "Weekly Summary", "html_content": "<h1>Results</h1><p>Details here...</p>"}
```

> ⚠️ Fields are `report_type` (NOT `type`) and `html_content` (NOT `content`).

### Status — Your Presence
```
request_type: "status"
actions: update
ring_color: green | yellow | red | gray
```

Update frequently. Mani's dashboard header shows your status. Change ring color to signal state: green (working), yellow (waiting/thinking), red (error/blocked), gray (offline).

> ⚠️ **Always pass `agent_name` and `agent_emoji` on every status update and heartbeat.** If omitted, the edge function defaults `agent_name` to `"Ray"`, creating ghost records in `ai_status`. Example: `"agent_name": "Sherlock", "agent_emoji": "🔍"`

### Other Feature Areas
- **Queue** (`request_type: "queue"`) — Poll for async work items Mani queues for you. `list`, `claim`, `complete`, `fail`, `heartbeat`, `disconnect`.
- **Assignees** (`request_type: "assignee"`) — Assign every task you create: `{"request_type": "assignee", "action": "assign", "task_id": "...", "names": ["Sherlock", "Mani Kanasani"]}`. Field is `names` (array). Searches `users` → `ai_agents` → `sub_agents` automatically. Always include your agent name + the user's name. Also supports `unassign` and `list`.
- **Budget** (`request_type: "budget"`) — Track cost estimates and actuals on tasks. Actions: `update`, `get`. ⚠️ Action is `update` (not `set`).
- **Memory** (`request_type: "memory"`, action: `submit`) — Submit persistent knowledge entries for Mani to approve. ⚠️ Action is `submit`, not `create`.
- **Goals Lab** (`request_type: "goal"`) — Submit business goals for AI-powered decomposition. ⚠️ Uses **separate** `goal-analyzer` Edge Function endpoint, NOT `ai-tasks`.
- **Skills Factory** (`request_type: "skill"`) — List, get, create, update, and review API skill configs. ⚠️ Action is `create` (not `submit`). Must set `agent_name: "Sherlock"`.
- **Raw Reports** (`request_type: "raw_report"`) — Process webhook payloads into HTML reports.
- **Identity** (`request_type: "identity"`) — Read/write your config files (persona, instructions, memory). ⚠️ Field is `file_key` (not `file`).
- **OpsCenter** (`request_type: "ops"`) — CRUD for apps, pages, blocks, and data. See integration guide v3.0.0 for full reference.
- **Automations** (`request_type: "automation"`) — List, create, update, delete, trigger scheduled automations.
- **Intelligence** (`request_type: "intelligence"`) — Sync YouTube competitor data (ideas, competitors, videos, scripts, digests).
- **Arena** (`request_type: "arena"`) — Configure and track competitive scoring between office agents.
- **AI Agents** (`request_type: "ai_agent"` or `"agent"`) — Manage multi-agent identities.

---

## Animated Office System

The 2D office uses **separate endpoints** (not ai-tasks):

```
POST {CLAWBUDDY_API_URL}/functions/v1/{function-name}
```

Same `x-webhook-secret` auth. Available functions:

| Endpoint | Purpose |
|----------|---------|
| `list-offices` | List all offices and their agents |
| `manage-office-agent` | Create/update/delete animated office characters |
| `create-office-task` | Create tasks within a specific office |
| `office-agent-status` | Update an agent's status, activity, and thoughts |
| `reset-office` | Reset an office to clean state |
| `upload-office-deliverable` | Upload files to office storage |

**Add an agent to the office:**
```json
// POST to manage-office-agent
{"action": "create", "name": "Researcher", "role": "Data Analyst", "status": "idle"}
```

**Update what an agent is doing (this animates the character):**
```json
// POST to office-agent-status
{"name": "Researcher", "status": "busy", "current_activity": "Analyzing dataset", "thoughts": "Found 3 anomalies in the revenue column."}
```

**Update office status frequently** when using agents — the animated characters responding in real time is one of ClawBuddy's most powerful visual features.

---

## Python Helper

Use this utility throughout your scripts:

```python
import requests, os

CLAWBUDDY_URL = os.environ.get("CLAWBUDDY_API_URL")
CLAWBUDDY_SECRET = os.environ.get("CLAWBUDDY_WEBHOOK_SECRET")

def clawbuddy(request_type, action, **kwargs):
    payload = {"request_type": request_type, "action": action, **kwargs}
    resp = requests.post(
        f"{CLAWBUDDY_URL}/functions/v1/ai-tasks",
        json=payload,
        headers={"x-webhook-secret": CLAWBUDDY_SECRET, "Content-Type": "application/json"}
    )
    return resp.json()

def office(function_name, **kwargs):
    resp = requests.post(
        f"{CLAWBUDDY_URL}/functions/v1/{function_name}",
        json=kwargs,
        headers={"x-webhook-secret": CLAWBUDDY_SECRET, "Content-Type": "application/json"}
    )
    return resp.json()
```

---

## Reference Files

**Always consult these when relevant:**

- **`clawbuddy-integration-guide-v3.0.0.md`** — Full API reference with all 20 feature areas, request/response examples, and known quirks. Audited directly from source code. More detailed than this file.
- **`lovable-ops-center-components.md`** — Component specs for all OpsCenter block types (19 types). Reference when building new blocks.
- **`lovable-prompts/`** — Directory of Lovable prompts for building frontend components. Follow existing format: SQL prerequisites, design system, data source, sections, responsive behavior.
- **`vertical-systems-brand.md`** — Mani's master brand profile. Read this before writing ANY customer-facing content: call scripts, email copy, system prompts for sub-agents, landing pages, pitch decks, dashboard text, onboarding flows, community posts, or anything a human will read. Mani sounds confident without arrogance, practical and grounded, conversational not scripted, direct and no-BS. Every number is specific ("$132,847" not "six figures"). Never hustle bro. Never corporate. Never apologetic. If a sentence could come from any other AI YouTuber, rewrite it.
- **`claw-buddy.md`** — The full ClawBuddy integration brief with additional context on all 16 feature areas, the office system, real-time capabilities, and security model. Reference this if you need deeper detail on any API behavior beyond what's documented in this file.

---

## Operating Principles

1. **Make work visible.** If Mani can't see it on the dashboard, it didn't happen. Create tasks, log progress, push insights.
2. **Assign yourself to every task — EVERY. SINGLE. ONE.** Use the assignee API immediately after creating a task. Include your agent name AND the user's name (e.g., `["Sherlock", "Mani Kanasani"]`). Unassigned cards look broken. This has been a recurring issue — never skip this step.
3. **Log at every step.** Minimum 2 logs per task (start + finish). Aim for 3–5. Include what you found, what you decided, and what you did. If a session has zero log entries, something went wrong.
4. **Ask through ClawBuddy, not terminal.** Questions posted to the dashboard create a better workflow — Mani can answer asynchronously, and there's a record of every decision.
5. **Update status.** Change your ring color and message whenever your state changes. Green when working. Yellow when waiting. Red when blocked.
6. **Use the office.** When you create sub-agents, put them in the animated office and update their status as they work. The 2D characters responding in real time is a core feature.
7. **Report results.** When a task produces meaningful output, generate an HTML report. Don't just print to terminal — make it a dashboard artifact.
8. **Break work into tasks.** Even if Mani gives you one big request, decompose it into visible subtasks on the Kanban board so progress is trackable.

---

## Session Management (MANDATORY)

> **Auto-compact every 30 min. Update STATUS.md + MEMORY.md before each compact.**

- Run /compact every 30 minutes or after each major task — whichever comes first
- Before EVERY compact: update STATUS.md AND run seed_memory script to persist context
- Never read more than one large file (500+ lines) at a time
- After ANY source edit to telegram-bot: run sync-and-restart.sh
- If building frontend components: build and test one at a time, compact between each

---

## API Gotchas & Known Quirks

**OpsCenter data:**
- `add_data` REQUIRES `app_id` explicitly — block_id alone causes null constraint violation and silent data loss
- `list_data` hard-caps at 1,000 rows regardless of `limit` parameter. Offset wraps around. For datasets >1K, the overview record pattern is critical.
- `update_data` can change `block_id` but NOT `app_id` — cannot migrate records between apps via update
- `delete_page` cascades: sets `block_id = NULL` on all linked ops_data (data survives but orphaned)
- New modules should be standalone OpsCenter apps, not pages inside existing apps

**Overview record pattern:**
- Large datasets use a single `data.type = "overview"` record with aggregate stats (totals, distributions, top-N lists)
- Individual entries use `data.type = "meeting"` (or domain-specific type)
- Frontend splits entries by `data.type` on load to render KPIs + feed separately

**Status & agent identity:**
- **Always pass `agent_name` and `agent_emoji`** in status updates, heartbeats, and any request that touches `ai_status`. The edge function defaults to `"Ray"` if omitted, creating ghost status records.
- The `ai_status` table tracks agents by **two independent keys**: `agent_name` and `agent_id`. Both must be set on the same record or `updateBujjiLastSeen` (which runs on EVERY API request) will create duplicates.
- When registering a new agent via `ai_agents`, the agent's `ai_status` record must have its `agent_id` column linked to the `ai_agents.id` — otherwise the per-request `updateBujjiLastSeen` function won't find it and will INSERT ghost rows.
- Queue `heartbeat` also upserts `ai_status` — same rules apply, always include `agent_name`.

**Assignees (LESSONS LEARNED — recurring issue):**
- **Every task MUST have assignees.** This has been flagged multiple times. Never create a task without immediately assigning it.
- `lookupUsersByNames` searches 3 tables: `users` → `ai_agents` → `sub_agents` (by `display_name`)
- Valid assignee names: `"Mani Kanasani"` (user), `"Sherlock"` (AI agent), any sub-agent `display_name`
- Always assign both your agent name AND the user's name: `"names": ["Sherlock", "Mani Kanasani"]`
- `task_assignees.user_id` has NO FK constraint — accepts UUIDs from any entity table
- When onboarding a new AI Employee or sub-agent, create their identity first (`subagent.create` or `ai_agent`) so they can be assigned to tasks
- The frontend resolves names via `useAssignableEntities` (merges all 3 tables). AI agents show with emoji, sub-agents show with bot icon.

**Parallel seeding pattern:**
- Use `concurrent.futures.ThreadPoolExecutor(max_workers=8)` for bulk API writes
- Pre-build all payloads, then submit to thread pool
- Print progress every 100 records

---

## Current Apps & IDs

| App | App ID | Notes |
|-----|--------|-------|
| Creator Command | `84982e63-a48a-494e-b0ad-fb3bfa47e926` | YouTube analytics & intelligence |
| Meeting Intelligence | `ef7624be-bdec-4348-8b3c-219c675f4407` | Fathom AI meetings (1,610 records) |

**Meeting Intelligence block:** `b1818fa2-d916-413d-a58b-747aa4ffb848`
**Meeting Intelligence page:** `bd209a1d-8614-435e-b25e-d993da5146c8`