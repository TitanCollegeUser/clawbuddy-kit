# ClawBuddy Deployment & Integration Guide v3.1.0

> Last updated: February 27, 2026
> Source of truth: Audited directly from `ai-tasks/index.ts` (4,852 lines), 25 Edge Functions, and 66 migrations.
> Supabase project: `YOUR_PROJECT_REF`

---

## Table of Contents

**Deployment**
1. [Deployment](#deployment)

**Integration (API Reference)**
1. [Connection & Authentication](#connection--authentication)
2. [Status](#1-status)
3. [Tasks (Kanban)](#2-tasks-kanban)
4. [Subtasks](#3-subtasks)
5. [Assignees](#4-assignees)
6. [Budget](#5-budget)
7. [AI Log](#6-ai-log)
8. [Questions & Approvals](#7-questions--approvals)
9. [Insights](#8-insights)
10. [Reports](#9-reports)
11. [Raw Reports & Webhooks](#10-raw-reports--webhooks)
12. [Sub-Agents](#11-sub-agents)
13. [Queue (Async Tasks)](#12-queue-async-tasks)
14. [Memory](#13-memory)
15. [Skills Factory](#14-skills-factory)
16. [Identity Files](#15-identity-files)
17. [OpsCenter (Apps/Pages/Blocks/Data)](#16-opscenter)
18. [Automations](#17-automations)
19. [Intelligence Sync](#18-intelligence-sync)
20. [Arena Scoreboards](#19-arena-scoreboards)
21. [AI Agents (Multi-Agent)](#20-ai-agents-multi-agent)
22. [Animated Office System](#animated-office-system)
23. [Standalone Edge Functions](#standalone-edge-functions)
24. [Known Quirks & Gotchas](#known-quirks--gotchas)
25. [Database Tables Reference](#database-tables-reference)

---

## Deployment

### Prerequisites

- **Supabase account** — Free tier works. Create at [supabase.com](https://supabase.com).
- **Netlify account** — Free tier works. Create at [netlify.com](https://netlify.com).
- **GitHub account** — To fork the repo.
- **Supabase CLI** — `npm install -g supabase`
- **Node.js 18+** — For building the frontend.

### Step 1: Fork & Clone

```bash
# Fork https://github.com/mkanasani/clawbuddy-kit on GitHub, then:
git clone https://github.com/YOUR_USERNAME/clawbuddy-kit.git
cd clawbuddy-kit
```

### Step 2: Backend Setup (Supabase)

Create a new Supabase project, then deploy the full backend:

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all 65 database migrations (creates the full schema)
supabase db push

# Generate and set secrets
supabase secrets set CLAWBUDDY_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set AI_TASKS_API_KEY=$(openssl rand -hex 32)

# Deploy all 25 edge functions
for fn in \
  ai-tasks automation-runner sherlock-brain \
  morning-digest evening-report midday-prep competitor-intel \
  intelligence-sync browser-research calendar-sync \
  goal-analyzer report-webhook \
  list-offices manage-office-agent create-office-task \
  office-agent-status reset-office upload-office-deliverable \
  activate-license millis-proxy \
  lexa-webhook lexa-precall lexa-campaign-runner \
  make-proxy forge-analyzer; do
  supabase functions deploy "$fn" --no-verify-jwt
done
```

**Optional secrets** (for specific features):

| Secret | Required For |
|--------|-------------|
| `YOUTUBE_API_KEY` | Competitor Intel automation |
| `SUBSCRIBR_API_KEY` | Outlier video detection |
| `RESEND_API_KEY` | Email delivery (automations) |
| `MILLIS_API_KEY` | Lexa AI Phone Employee |
| `FATHOM_WEBHOOK_SECRET` | Fathom meeting webhooks |
| `GEMINI_API_KEY` | Goal Analyzer (Gemini 2.5 Pro) |

### Step 3: Frontend Setup (Netlify)

**Option A: One-click deploy**

Click the **Deploy to Netlify** button in the README. Set these env vars in Netlify (Site Settings > Environment Variables):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key (from Project Settings > API) |
| `VITE_CLAWBUDDY_WEBHOOK_SECRET` | The webhook secret you generated in Step 2 |

**Option B: Manual deploy**

```bash
npm install
npm run build
npx netlify deploy --prod --dir=dist
```

> **Blank page after deploy?** The Supabase env vars must be baked into the JS bundle at build time. If `VITE_SUPABASE_URL` is missing during build, the app mounts but silently fails with no console errors. Re-deploy with the env vars set.

### Step 4: Connect Your First Agent

Test the connection with a curl command:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "request_type": "status",
    "action": "update",
    "is_online": true,
    "status_message": "First connection!",
    "ring_color": "green",
    "agent_name": "MyAgent",
    "agent_emoji": "🤖"
  }'
```

If the response includes `"status"` with your agent name, you're connected.

**For Claude Code:** Copy the `CLAUDE.md` from the repo root into your project. Update the `CLAWBUDDY_API_URL` and `CLAWBUDDY_WEBHOOK_SECRET` env vars.

**For OpenClaw / Custom agents:** Use the REST API documented below.

### Updating

When a new version is released:

```bash
# One-command update (git pull + db push + redeploy all functions)
./update.sh
```

Or manually:
```bash
git fetch upstream && git merge upstream/main --no-edit
supabase db push
# Redeploy functions individually or via the loop above
```

The frontend auto-deploys if connected to Netlify via GitHub. Otherwise, rebuild and redeploy.

---

## Connection & Authentication

### Main API Endpoint (all ai-tasks requests)

```
POST {CLAWBUDDY_API_URL}/functions/v1/ai-tasks
```

### Required Headers

```
x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}
Content-Type: application/json
```

### Environment Variables

```bash
CLAWBUDDY_API_URL="https://YOUR_PROJECT_REF.supabase.co"
CLAWBUDDY_WEBHOOK_SECRET="<your-webhook-secret>"
```

### Request Format

Every request is JSON with `request_type` and `action` as the top-level routing fields:

```json
{
  "request_type": "task",
  "action": "create",
  "title": "Build the thing"
}
```

### Authentication Flow

The `x-webhook-secret` header is resolved in this order:
1. Look up in `ai_agents.webhook_secret` (multi-agent support)
2. Look up in `users.webhook_secret` (primary user auth)
3. Compare against `AI_TASKS_API_KEY` env var (legacy API key)

### Global Body Fields (read on every request)

| Field | Default | Notes |
|-------|---------|-------|
| `request_type` (or `type`) | -- | Routes to the correct handler |
| `action` | -- | Sub-routes within the handler |
| `agent_name` | `"Ray"` | Used for log attribution |
| `agent_emoji` | `"⚡"` (Ray) / `"🤖"` (others) | Displayed on dashboard |

---

## 1. Status

Update your presence on the dashboard header.

**`request_type: "status"`**

### update (default for POST)

```json
{
  "request_type": "status",
  "action": "update",
  "is_online": true,
  "status_message": "Working on data pipeline.",
  "ring_color": "green",
  "agent_name": "Sherlock",
  "agent_emoji": "🔍"
}
```

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `is_online` | no | boolean | Auto-sets `last_seen` when true |
| `status_message` | no | string | Shown in dashboard header |
| `ring_color` | no | string | `green`, `yellow`, `red`, `gray` |
| `agent_name` | **yes*** | string | Defaults to `"Ray"` if omitted — **always pass explicitly** to avoid ghost records |
| `agent_emoji` | **yes*** | string | Always pair with `agent_name` |
| `agent_id` | no | string | For multi-agent setups. Matched by `updateBujjiLastSeen` on every request. |

> ⚠️ **`agent_name` defaults to `"Ray"` if not provided.** This applies to both status updates and queue heartbeats. Always pass `agent_name` and `agent_emoji` on every call or ghost status records will appear in the dashboard header.

**Response:** `{ "status": { id, is_online, status_message, ring_color, agent_name, agent_emoji, ... } }`

### get

```json
{ "request_type": "status", "action": "get" }
```

**Response:** `{ "statuses": [...], "status": <first> }`

**Table:** `ai_status` (upserts by `user_id` + `agent_id` or `agent_name`)

> **Important:** The `ai_status` table is written to by two separate code paths: (1) the status/heartbeat handlers which match by `agent_name`, and (2) the `updateBujjiLastSeen` helper which runs on **every** API request and matches by `agent_id`. Both keys (`agent_name` and `agent_id`) must be set on the same record to prevent duplicate/ghost entries. When creating a new agent via `ai_agents`, manually link its `ai_status` record: `UPDATE ai_status SET agent_id = '<ai_agents.id>' WHERE agent_name = '<name>';`

---

## 2. Tasks (Kanban)

**`request_type: "task"`**

### Board Column IDs

| Column | ID |
|--------|-----|
| To Do | `29739efc-ecac-4037-adff-bd0a8ea9cd2a` |
| Doing | `a886c067-d4d3-4e77-9ac3-5cc231dddc35` |
| Needs Input | `9d39bd42-cd5f-4c46-a440-ce54b671d0ae` |
| Canceled | `95c0cd62-c173-4494-8a00-bf9da98a6bc9` |
| Done | `b22cc561-298f-48e1-8c9a-4123b0f7e0db` |

### Column Name Aliases (case-insensitive)

| Input | Maps To |
|-------|---------|
| `"to do"`, `"todo"` | To Do |
| `"doing"`, `"in progress"` | Doing |
| `"needs input"`, `"blocked"` | Needs Input |
| `"canceled"`, `"cancelled"` | Canceled |
| `"done"`, `"complete"` | Done |

### create

```json
{
  "request_type": "task",
  "action": "create",
  "title": "Build data pipeline",
  "description": "Clean and normalize the lead CSV",
  "column": "todo",
  "priority": "High"
}
```

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `title` | **yes** | -- | |
| `description` | no | null | |
| `column` | no | `"To Do"` | Column name (not ID) |
| `priority` | no | `"Medium"` | `Low`, `Medium`, `High`, `Urgent` |
| `due_date` | no | null | ISO date string |
| `estimated_cost` | no | null | Creates `task_budgets` row |
| `comment` | no | null | |

**Response:** `{ "task": { id, title, board_column, subtasks, ... } }`

> **Auto-assignment:** When a task is created via the API (not from the dashboard UI), the backend automatically assigns the creating agent and the account owner to the task. This means you no longer need a separate `assignee.assign` call after `task.create` — it's handled automatically. The auto-assign is non-fatal: if it fails (e.g., agent not found), the task is still created successfully.

### update (also used to move between columns)

```json
{
  "request_type": "task",
  "action": "update",
  "task_id": "...",
  "column": "done"
}
```

| Param | Required | Notes |
|-------|----------|-------|
| `id` or `task_id` | **yes** | Either works |
| `title` | no | |
| `description` | no | |
| `column` | no | Column name (not ID). This is how you move tasks. |
| `priority` | no | |
| `due_date` | no | |
| `estimated_cost` | no | Upserts budget |
| `actual_cost` | no | Upserts budget |
| `comment` | no | |

> **There is NO `move` action.** Use `update` with `column` to move tasks between columns.

### list

```json
{ "request_type": "task", "action": "list" }
```

Optional: `"column": "doing"` to filter by column name.

**Response:** `{ "tasks": [...], "columns": [...] }`

### get

```json
{ "request_type": "task", "action": "get", "task_id": "..." }
```

### delete

```json
{ "request_type": "task", "action": "delete", "task_id": "..." }
```

**Table:** `tasks`, `board_columns`, `activity_log`

---

## 3. Subtasks

**`request_type: "subtask"`**

### create

```json
{
  "request_type": "subtask",
  "action": "create",
  "task_id": "...",
  "title": "Parse CSV headers"
}
```

Optional: `due_date`, `assigned_to`

### update (toggle completion)

```json
{
  "request_type": "subtask",
  "action": "update",
  "id": "...",
  "completed": true
}
```

> **Uses `id`, not `subtask_id`.**

### delete

```json
{ "request_type": "subtask", "action": "delete", "id": "..." }
```

**Table:** `subtasks`

---

## 4. Assignees

**`request_type: "assignee"`**

The assignee system supports **three entity types** — users, AI agents, and sub-agents. The `assign` action searches all three tables automatically:

1. **`users`** — Human users (e.g., `"Mani Kanasani"`)
2. **`ai_agents`** — Registered AI agents (e.g., `"Sherlock"`, `"OpenClaw"`)
3. **`sub_agents`** — Sub-agents matched by `display_name` (e.g., `"Research Bot"`)

### assign

```json
{
  "request_type": "assignee",
  "action": "assign",
  "task_id": "...",
  "names": ["Sherlock", "Mani Kanasani"]
}
```

`names` can be a string or string array. Searches `users` → `ai_agents` → `sub_agents` (by `display_name`) in that order.

> **Who should be assigned?** Every task on the Kanban board should have an assignee so cards don't appear abandoned. Follow these rules:
> - **AI agents creating tasks for themselves:** Include your own agent name (e.g., `"names": ["Sherlock"]`)
> - **AI agents creating tasks for the user:** Include the user's name (e.g., `"names": ["Mani Kanasani"]`)
> - **AI agents creating tasks for a sub-agent:** Include the sub-agent's display name (e.g., `"names": ["Research Bot"]`)
> - **Multiple assignees:** You can assign both yourself and others in one call (e.g., `"names": ["Sherlock", "Mani Kanasani"]`)

> **How names appear on Kanban cards:** The frontend resolves names via `useAssignableEntities`, which merges all three tables. AI agents display with their emoji (from `ai_status.agent_emoji`). Sub-agents display with a bot icon. Cards show first names only with a max of 2 visible.

### unassign

```json
{
  "request_type": "assignee",
  "action": "unassign",
  "task_id": "...",
  "names": ["Sherlock"]
}
```

### list

```json
{ "request_type": "assignee", "action": "list", "task_id": "..." }
```

**Table:** `task_assignees`

> **Note:** The `task_assignees.user_id` column stores UUIDs from any of the three entity tables (users, ai_agents, sub_agents). There is no FK constraint — any valid UUID is accepted.

---

## 5. Budget

**`request_type: "budget"`**

### update (upsert)

```json
{
  "request_type": "budget",
  "action": "update",
  "task_id": "...",
  "estimated_cost": 50.00,
  "actual_cost": 42.50,
  "notes": "API costs lower than expected",
  "currency": "USD"
}
```

### get

```json
{ "request_type": "budget", "action": "get" }
```

**Response:** `{ "budgets": [{ task: { id, title }, estimated_cost, actual_cost, ... }] }`

**Table:** `task_budgets`

---

## 6. AI Log

Your journal. Write observations as you work.

**`request_type: "log"`**

### create

```json
{
  "request_type": "log",
  "action": "create",
  "category": "observation",
  "message": "Found 786 valid records. 312 missing email."
}
```

> **The field is `message`, NOT `content`.** This is a known discrepancy with older docs.

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `message` | **yes** | -- | Non-empty string |
| `category` | no | `"general"` | `general`, `observation`, `reminder`, `fyi` |
| `agent_name` | no | from auth | |
| `agent_emoji` | no | from auth | |

### list

```json
{ "request_type": "log", "action": "list" }
```

Optional: `"category": "observation"` or `"all"`, `"unread_only": true`

### get_unread

```json
{ "request_type": "log", "action": "get_unread" }
```

**Response:** `{ "unread_count": 5 }`

**Table:** `ai_log`

---

## 7. Questions & Approvals

Ask through the dashboard, not the terminal.

**`request_type: "question"`**

### ask

```json
{
  "request_type": "question",
  "action": "ask",
  "question": "Ready to send 300 emails. Approve?",
  "question_type": "approval",
  "priority": "high"
}
```

> **Action is `ask`, NOT `create`.** Field is `question_type`, NOT `type`.

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `question` | **yes** | -- | Non-empty string |
| `question_type` | no | `"question"` | `question` or `approval` |
| `priority` | no | `"normal"` | |
| `context` | no | null | Additional context string |
| `related_task_id` | no | null | Link to a Kanban task |

### check_answers

```json
{ "request_type": "question", "action": "check_answers" }
```

**Response:** `{ "answered_questions": [...] }` (up to 10, ordered by `answered_at` desc)

### list

```json
{ "request_type": "question", "action": "list" }
```

Optional: `"status": "pending"` or `"all"`

### get (count only)

```json
{ "request_type": "question", "action": "get" }
```

**Response:** `{ "pending_count": 3 }`

**Table:** `ai_questions`

---

## 8. Insights

Push analytics cards, alerts, and discoveries.

**`request_type: "insight"`**

### create

```json
{
  "request_type": "insight",
  "action": "create",
  "title": "Pipeline Results",
  "content": "Processed 1,200 records in 47 seconds",
  "insight_type": "performance",
  "data": {"records": 1200, "duration_seconds": 47}
}
```

> **Field is `insight_type`, NOT `type`.**

| Param | Required | Notes |
|-------|----------|-------|
| `title` | **yes** | |
| `content` | **yes** | |
| `insight_type` | **yes** | `performance`, `suggestion`, `alert`, `summary` |
| `data` | no | JSON object for structured metrics |
| `target_user_id` | no | For multi-user setups |

### update

```json
{ "request_type": "insight", "action": "update", "id": "...", "is_read": true }
```

### delete

```json
{ "request_type": "insight", "action": "delete", "id": "..." }
```

> **There is NO `list` action** for insights via ai-tasks. Use the REST API directly if needed.

**Table:** `ai_insights`

---

## 9. Reports

Generate formatted HTML reports.

**`request_type: "report"`**

### create

```json
{
  "request_type": "report",
  "action": "create",
  "title": "Weekly Summary",
  "report_type": "insight",
  "html_content": "<h1>Results</h1><p>Details here...</p>"
}
```

> **Field is `html_content`, NOT `content`.** Field is `report_type`, NOT `type`.**

| Param | Required | Notes |
|-------|----------|-------|
| `title` | **yes** | |
| `report_type` | **yes** | `employee` or `insight` |
| `html_content` | **yes** | Full HTML string |

### list

```json
{ "request_type": "report", "action": "list" }
```

Optional: `"report_type": "insight"` or `"all"`

### delete

```json
{ "request_type": "report", "action": "delete", "report_id": "..." }
```

### mark_read

```json
{ "request_type": "report", "action": "mark_read", "report_id": "..." }
```

**Table:** `reports`

---

## 10. Raw Reports & Webhooks

Receive and process external webhook payloads.

**`request_type: "raw_report"`**

### list

```json
{ "request_type": "raw_report", "action": "list", "status": "pending" }
```

### get

```json
{ "request_type": "raw_report", "action": "get", "raw_report_id": "..." }
```

### submit (trigger processing)

```json
{
  "request_type": "raw_report",
  "action": "submit",
  "raw_report_id": "...",
  "function_id": "..."
}
```

### process (mark completed)

```json
{
  "request_type": "raw_report",
  "action": "process",
  "raw_report_id": "...",
  "processed_report_id": "..."
}
```

### mark_failed

```json
{
  "request_type": "raw_report",
  "action": "mark_failed",
  "raw_report_id": "...",
  "error_message": "Parse error on line 42"
}
```

**Tables:** `raw_reports`, `webhook_functions`

---

## 11. Sub-Agents

Create and manage specialized AI workers. Sub-agents appear as assignable entities on the Kanban board and in the animated office.

**`request_type: "subagent"`**

> **Onboarding pattern:** When provisioning a new AI Employee, sub-agent, or any specialized worker, you must create their identity so they can be assigned to tasks on the Kanban board. This is similar to provisioning an office — the agent needs to exist in the system before it can own work.
>
> **For AI Agents** (first-class agents like Sherlock, OpenClaw): Register via `request_type: "ai_agent"` — they're automatically assignable by name.
>
> **For Sub-Agents** (specialized workers, AI Employees): Register via `request_type: "subagent", action: "create"` — they're assignable by their `display_name`.
>
> **Provisioning checklist for a new agent/employee:**
> 1. **Create identity** — `subagent.create` (or `ai_agent` for first-class agents)
> 2. **Add to office** — `manage-office-agent` with `action: "create"` (animated character)
> 3. **Assign to tasks** — Use their name in `assignee.assign` calls
> 4. **Update status** — Use `office-agent-status` to show what they're working on

### create

```json
{
  "request_type": "subagent",
  "action": "create",
  "name": "researcher",
  "display_name": "Research Bot",
  "model": "gpt-4o-mini",
  "workspace": "default",
  "system_prompt": "You are a research specialist...",
  "monthly_token_budget": 1000000,
  "monthly_cost_budget": 50
}
```

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `name` | **yes** | -- | Must match `^[a-z][a-z0-9-]{2,49}$` |
| `display_name` | **yes** | -- | |
| `model` | **yes** | -- | |
| `workspace` | **yes** | -- | |
| `description` | no | null | |
| `system_prompt` | no | null | |
| `allowed_tools` | no | null | |
| `max_concurrent_tasks` | no | 3 | |
| `timeout_minutes` | no | 60 | |
| `monthly_token_budget` | no | 1,000,000 | |
| `monthly_cost_budget` | no | 50 | |

### spawn (start a session)

```json
{
  "request_type": "subagent",
  "action": "spawn",
  "agent_id": "...",
  "task": "Research competitor pricing",
  "kanban_task_id": "...",
  "timeout_minutes": 30
}
```

### update_session

```json
{
  "request_type": "subagent",
  "action": "update_session",
  "session_id": "...",
  "status": "completed",
  "result_summary": "Found 5 competitor pricing pages",
  "tokens_used": 15000,
  "cost": 0.03
}
```

When status is `completed` or `failed`, auto-calculates duration and updates agent lifetime stats.

### Other actions

| Action | Params | Notes |
|--------|--------|-------|
| `list` | -- | All sub-agents |
| `get` | `agent_id` | |
| `pause` | `agent_id` | Sets status to `"paused"` |
| `resume` | `agent_id` | Sets status to `"idle"` |
| `list_sessions` | `agent_id`, optional `limit` | |
| `get_session` | `session_id` | |
| `update` | `agent_id` + fields | Spreads all body fields as updates |
| `delete` | `agent_id` | |

**Tables:** `sub_agents`, `sub_agent_sessions`, `sub_agent_tasks`

---

## 12. Queue (Async Tasks)

Poll for work items queued for you.

**`request_type: "queue"`**

| Action | Params | Notes |
|--------|--------|-------|
| `list` | optional `status` (default `"pending"`), `limit` (default 50) | |
| `claim` | `task_id` | Atomically sets to `"processing"` |
| `complete` | `task_id`, optional `result` | |
| `fail` | `task_id`, optional `error_message` | |
| `heartbeat` | optional `status_message`, `ring_color`, **`agent_name`** (always pass!), `agent_emoji` | Upserts `ai_status`. Returns `pending_count`. ⚠️ `agent_name` defaults to `"Ray"` if omitted. |
| `disconnect` | optional `agent_name`, `agent_id` | Sets `is_online: false` |

**Table:** `pending_tasks`, `ai_status`

---

## 13. Memory

Submit persistent knowledge for the user to approve.

**`request_type: "memory"`**

### submit

```json
{
  "request_type": "memory",
  "action": "submit",
  "content": "The API uses message, not content, for log entries."
}
```

> **Action is `submit`, NOT `create`.** Creates a pending entry + log observation + approval question.

### Other actions

| Action | Params | Notes |
|--------|--------|-------|
| `list` | optional `status` | Max 50 items |
| `get` | `memory_id` | |
| `approve` | `memory_id` | |
| `reject` | `memory_id` | |
| `delete` | `memory_id` | |

**Table:** `memory_injections`

---

## 14. Skills Factory

**`request_type: "skill"`**

### create

```json
{
  "request_type": "skill",
  "action": "create",
  "name": "outlier-hunter",
  "title": "Outlier Video Hunter",
  "agent_name": "Sherlock",
  "protocol_type": "api",
  "api_base_url": "https://subscribr.ai/api/v1",
  "status": "ready",
  "skill_operations": [
    { "name": "search_outliers", "title": "Search Outliers", "method": "POST", "path": "/search" }
  ]
}
```

> Set `agent_name: "Sherlock"` explicitly or skills show as "OpenClaw".
> Set `status: "ready"` to auto-accept.

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `name` | **yes** | -- | Must match `^[a-z][a-z0-9-]{2,49}$` |
| `title` | **yes** | -- | Human-readable display name |
| `agent_name` | **yes*** | `"OpenClaw"` | Always set explicitly |
| `protocol_type` | no | `"custom"` | `api`, `webhook`, `custom`, `smtp` |
| `agent_type` | no | `"openclaw"` | `"claude-code"` or `"openclaw"`. Determines which category the skill appears under in the Skill Library. |
| `api_base_url` | no | null | Required for `api` protocol |
| `status` | no | `"draft"` | Set `"ready"` to auto-accept |
| `skill_markdown` | no | null | For `custom` protocol. Must be 100+ chars if no operations. |
| `skill_operations` | no | `[]` | Array of operation definitions |

### Other actions

| Action | Params | Notes |
|--------|--------|-------|
| `list` | -- | Only returns `bujji_status: "accepted"` skills |
| `get` | `skill_id` or `skill_name` | |
| `update` | `skill_id` + fields | If `skill_operations` provided, replaces all |
| `delete` | `skill_id` | |
| `submit` / `review` | `skill_id` | Runs validation pipeline |

**Tables:** `skills`, `skill_operations`

---

## 15. Identity Files

Read/write agent config files and daily memory logs.

**`request_type: "identity"`**

| Action | Params | Notes |
|--------|--------|-------|
| `read` | `file_key`, optional `agent_id` | Returns stub if not found |
| `update` | `file_key`, `content`, optional `agent_id` | Upserts |
| `list` | optional `agent_id` | All identity files for user |
| `read_daily_log` | `date` (YYYY-MM-DD), optional `agent_id` | |
| `write_daily_log` | `date`, `content`, optional `agent_id` | |

**Tables:** `identity_files`, `daily_memory_logs`

---

## 16. OpsCenter

The modular app/page/block/data system for custom dashboards.

**`request_type: "ops"`**

### App Actions

| Action | Required Params | Optional Params |
|--------|----------------|-----------------|
| `list_apps` | -- | -- |
| `create_app` | `name`, `title` | `description`, `icon` (default `"monitor"`), `status` (default `"active"`), `agent_name`, `agent_type`, `theme`, `config` |
| `get_app` | `app_id` OR `name` | -- |
| `update_app` | `app_id` | `title`, `description`, `icon`, `status`, `agent_name`, `agent_type`, `theme`, `config`, `page_order` |
| `delete_app` | `app_id` | -- |

### Page Actions

| Action | Required Params | Optional Params |
|--------|----------------|-----------------|
| `create_page` | `app_id`, `name`, `title` | `icon` (default `"file"`), `sort_order`, `layout` (default `"stack"`), `config` |
| `update_page` | `page_id` | `name`, `title`, `icon`, `sort_order`, `layout`, `config` |
| `delete_page` | `page_id` | -- (cascades: sets `block_id = NULL` on linked ops_data) |
| `reorder_pages` | `page_ids` (string[]) | -- |

### Block Actions

| Action | Required Params | Optional Params |
|--------|----------------|-----------------|
| `add_block` | `page_id`, `block_type` | `title`, `sort_order`, `config` |
| `update_block` | `block_id` | `block_type`, `title`, `sort_order`, `config` |
| `remove_block` | `block_id` | -- |
| `reorder_blocks` | `block_ids` (string[]) | -- |

#### Block Type Config Reference

Each block type requires specific fields in `config` to render correctly. A block with data but no proper config will appear empty.

**Generic Blocks:**

| Block Type | Required Config | Notes |
|------------|----------------|-------|
| `table` | `columns` (array of `{key, label, width?, format?}`) | Supports nested dot-notation keys (e.g., `data.field.nested`). Optional: `sortable`, `filterable`, `default_sort`, `use_app_data`, `item_type_filter` |
| `metric_cards` | `cards` (array of `{label, value_path, icon?, color?, format?}`) | `value_path` options: `data.field` (first matching record), `count:item_type`, `count:item_type:status`. Icon names are Lucide kebab-case. |
| `feed` | `max_items` (number) | Optional: `show_agent_badge` (default true). Items render `title`, `metadata.agent` (for badge), `created_at` (relative timestamp). |
| `alert_banner` | `message` (string), `severity` | **Config-driven — does NOT read ops_data.** Severity: `info`, `success`, `warning`, `urgent`. Optional: `subtitle`, `dismissible`, `action_label`, `action_link`. |
| `kanban` | `columns` (array of `{id, title, color}`) | Items placed via `column_id` on ops_data. Optional: `enable_drag`, `card_fields`. |
| `list` | -- | Optional: `show_timestamp`, `show_status_badge`, `max_items`. |
| `chart` | `chart_type` (`bar`, `line`, `pie`, `area`) | Uses Recharts. Reads data from ops_data records. |
| `form` | `fields` (array of field definitions) | Inserts to ops_data on submit. |
| `calendar` | -- | Reads date-based records. |
| `text` | -- | Renders markdown/HTML content. |
| `countdown` | `target_date` | Countdown to a specific date/time. |
| `embed` | `url` | Embedded iframe content. |
| `gallery` | -- | Image/media grid from ops_data. |
| `comparison` | -- | Side-by-side data comparisons. |
| `progress_bar` | -- | Progress tracking visualization. |
| `agent_card` | -- | Agent identity display card. |
| `approval_queue` | -- | Approval workflow items. |
| `timeline` | -- | Chronological event display. |

**Creator Command Blocks (YouTube):**

| Block Type | Data Source | Notes |
|------------|-----------|-------|
| `yt_dashboard` | `useOpsData({ appId })` | Channel KPIs (subscribers, views, videos). Uses overview record pattern. |
| `yt_analytics` | `useOpsData({ appId })` | Deep analytics with Recharts bar/line/area charts, upload frequency, performance trends. |
| `yt_competitors` | `useOpsData({ appId, blockId })` | Competitor cards with subscriber counts, outlier detection, "Analyze" actions. |
| `yt_banger_lab` | `useOpsData({ appId, blockId })` | Idea cards with banger scores, validation status, feedback loop. |
| `yt_pipeline` | `useOpsData({ appId, blockId })` | Content pipeline with status columns (Idea, Script, Film, Edit, Published). |
| `yt_scripts` | `useOpsData({ appId, blockId })` | Script cards with word count, edit history, copy-to-clipboard. |
| `yt_intel_feed` | `useOpsData({ appId, blockId })` | Intelligence digest feed with categorized insights. |
| `yt_outlier_feed` | `useOpsData({ appId, blockId })` | Viral outlier videos with view multiples, thumbnail previews, detail panels. |

**Meeting Intelligence Blocks:**

| Block Type | Data Source | Notes |
|------------|-----------|-------|
| `meeting_intel` | `useOpsData({ appId })` | Full meeting dashboard: search, type/month charts (Recharts), inline expand/collapse detail panels, "Send To" dropdown for queuing to feature pipelines (Action Items, Proposals, Lead Magnets). Uses DOMPurify for HTML sanitization. 25-per-page pagination. |

> **Feature block routing:** The Meeting Intelligence feature pages (Action Items, Proposals, Lead Magnets) use `block_type: "feed"` in the database but are intercepted by a `MEETING_FEATURE_BLOCK_IDS` Set in OpsBlockRenderer and routed to `OpsMeetingFeatureBlock`. This component shows status-aware cards (queued/processing/complete/error/needs_input), status filtering, "View Report" button, and retry/delete actions.

**Outreach Blocks:**

| Block Type | Data Source | Notes |
|------------|-----------|-------|
| `outreach_scoreboard` | `useOpsData({ appId })` | Outreach KPI scoreboard. |
| `outreach_leads` | `useOpsData({ appId, blockId })` | Lead management with status tracking. |
| `outreach_phone` | `useOpsData({ appId, blockId })` | Phone call tracking and logging. |
| `outreach_email` | `useOpsData({ appId, blockId })` | Email outreach status and templates. |
| `outreach_campaigns` | `useOpsData({ appId, blockId })` | Campaign management with stats. |
| `outreach_results` | `useOpsData({ appId, blockId })` | Campaign results analytics. |

**AI Employee Blocks:**

| Block Type | Data Source | Notes |
|------------|-----------|-------|
| `employee_campaign_creator` | Writes to `ops_data` | Campaign builder with 3 personalization levels (Minimal/Average/Full Custom), lead magnet toggle, subject/body templates. |
| `employee_lead_table` | `useOpsData({ appId })` | Lead management table with inline editing. |
| `employee_analytics` | `useOpsData({ appId })` | Employee performance charts and metrics. |

### Data Actions

| Action | Required Params | Optional Params |
|--------|----------------|-----------------|
| `add_data` | `app_id`, `item_type`, `title` | `block_id`, `description`, `status` (default `"active"`), `column_id`, `sort_order`, `data`, `metadata` |
| `update_data` | `data_id` | `title`, `description`, `status`, `column_id`, `sort_order`, `data`, `metadata`, `block_id`, `item_type` |
| `move_data` | `data_id` | `column_id`, `status`, `sort_order` |
| `delete_data` | `data_id` | -- |
| `list_data` | `app_id` | `block_id`, `item_type`, `status`, `column_id`, `limit` |
| `bulk_add_data` | `app_id`, `items` (array) | Each item: same fields as `add_data` minus `app_id` |

> **`add_data` REQUIRES `app_id` explicitly.** Without it you get a null constraint violation.
> **`update_data` uses `data_id`**, not `item_id`.
> **`list_data`** without `limit` paginates in batches of 1,000. With `limit`, uses a single query.

### Example: Add competitor data

```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "84982e63-a48a-494e-b0ad-fb3bfa47e926",
  "block_id": "ba39811a-9379-404f-b036-143b340d496e",
  "item_type": "competitor",
  "title": "Nick Saraev",
  "data": {
    "name": "Nick Saraev",
    "handle": "@nicksaraev",
    "subscriber_count": 250000,
    "view_count": 15000000
  }
}
```

**Tables:** `ops_apps`, `ops_pages`, `ops_blocks`, `ops_data`

---

## 17. Automations

Schedule and manage recurring automations.

**`request_type: "automation"`**

### create

```json
{
  "request_type": "automation",
  "action": "create",
  "name": "Morning Digest",
  "cron_expression": "0 6 * * *",
  "timezone": "America/Vancouver",
  "function_name": "morning-digest",
  "channels": ["agentmail", "dashboard"],
  "enabled": false
}
```

### Other actions

| Action | Params | Notes |
|--------|--------|-------|
| `list` | optional `enabled`, `tags` | |
| `get` | `automation_id` | Includes last 5 executions |
| `update` | `automation_id` + fields | |
| `enable` | `automation_id` | |
| `disable` | `automation_id` | |
| `trigger` | `automation_id` | Fires async to `automation-runner` |
| `delete` | `automation_id` | |
| `list_runs` | `automation_id`, optional `limit` (default 25) | |

### Delivery Channels

| Channel | Config Fields | Notes |
|---------|--------------|-------|
| `dashboard` | `{}` | Creates `ai_insights` record |
| `email` | `api_key`, `from_email`, `to_emails`, `subject_template` | **Recommended.** Sends via Resend API. Use a verified domain (e.g., `updates.yourdomain.com`). |
| `agentmail` | `api_key`, `inbox_id`, `to_email` | Sends via AgentMail/SES. Lower deliverability than Resend — use `email` channel instead. |
| `telegram` | `bot_token`, `chat_id` | Sends via Telegram Bot API (truncated to 4,000 chars) |
| `discord` | `webhook_url` | Sends via Discord webhook (truncated to 2,000 chars) |

**Channel config example (Resend):**
```json
{
  "channels": [{
    "type": "email",
    "config": {
      "api_key": "re_xxxx",
      "from_email": "Agent Name <agent@updates.yourdomain.com>",
      "to_emails": "user@gmail.com",
      "subject_template": "🌅 Morning Digest — {{date}}"
    }
  }]
}
```

**Tables:** `automations`, `automation_executions`

---

## 18. Intelligence Sync

Sync YouTube intelligence data (competitors, videos, ideas, scripts).

**`request_type: "intelligence"`**

> These are **read-only** actions from ai-tasks. For write operations, use the `intelligence-sync` Edge Function directly.

| Action | Params | Table |
|--------|--------|-------|
| `list_ideas` | optional `status`, `workspace_id`, `is_banger`, `limit` | `intelligence_ideas` |
| `list_competitors` | optional `workspace_id`, `limit` | `intelligence_competitors` |
| `list_videos` | optional `workspace_id`, `is_outlier`, `limit` | `intelligence_videos` |
| `list_scripts` | optional `workspace_id`, `status`, `limit` | `intelligence_scripts` |
| `list_digests` | optional `workspace_id`, `limit` | `intelligence_digests` |
| `list_insights` | optional `workspace_id`, `priority`, `limit` | `intelligence_insights` |

### intelligence-sync Edge Function (write operations)

```
POST {CLAWBUDDY_API_URL}/functions/v1/intelligence-sync
```

Same `x-webhook-secret` auth. Body requires `action` and usually `workspace_id`.

| Action | Purpose |
|--------|---------|
| `sync_competitors` | Upsert competitor data |
| `sync_videos` | Upsert video data |
| `push_digest` | Upsert daily digest |
| `push_insight` | Insert insight |
| `sync_ideas` | Insert ideas (NOT upsert) |
| `sync_scripts` | Insert scripts |
| `update_idea` | Update single idea |
| `update_script` | Update single script |
| `idea_feedback` | Append feedback to idea |
| `check_pending_feedback` | Find ideas awaiting AI response |
| `confirm_banger` | Set `is_banger` flag |
| `evolve_idea` | Update allowed field + log evolution |

---

## 19. Arena Scoreboards

Configure and track competitive scoring between office agents.

**`request_type: "arena"`**

### configure

```json
{
  "request_type": "arena",
  "action": "configure",
  "office_id": "...",
  "primary_metric_name": "Revenue",
  "primary_metric_unit": "$",
  "categories": [
    { "name": "Revenue", "is_primary": true },
    { "name": "Calls Made" }
  ]
}
```

### add_score

```json
{
  "request_type": "arena",
  "action": "add_score",
  "office_id": "...",
  "category": "Revenue",
  "agent_name": "Lex",
  "value": 450,
  "metadata": { "deal": "Acme Corp" }
}
```

### get_scores

```json
{ "request_type": "arena", "action": "get_scores", "office_id": "..." }
```

**Tables:** `arena_scoreboards`, `arena_score_categories`, `arena_scores`

---

## 20. AI Agents (Multi-Agent)

Manage agent identities for multi-agent setups. AI agents registered here are automatically assignable to Kanban tasks by name.

**`request_type: "ai_agent"` (or `"agent"`)**

| Action | Params | Notes |
|--------|--------|-------|
| `get` | -- | Returns the agent resolved from webhook auth |
| `update` | `name`, `description`, `avatar_color` | |
| `list` | -- | All agents for the user |

**Table:** `ai_agents`

> **Assignee integration:** Once an AI agent is registered in `ai_agents`, its `name` can be used directly in `assignee.assign` calls. The agent's emoji (from `ai_status.agent_emoji`) will display on Kanban cards next to the name.
>
> **Onboarding a new AI agent:**
> 1. Create a webhook secret for the agent in Settings
> 2. Register the agent — it gets an entry in `ai_agents`
> 3. Link its `ai_status` record: `UPDATE ai_status SET agent_id = '<ai_agents.id>' WHERE agent_name = '<name>';`
> 4. Set `agent_emoji` in `ai_status` so the Kanban card shows the right icon
> 5. The agent can now assign itself to tasks: `"names": ["AgentName"]`
>
> **AI Employees** (like Jason the SDR) follow the same pattern — register as a sub-agent via `subagent.create` so they appear as assignable entities, then provision their office character.

---

## Animated Office System

The 2D animated office uses **separate Edge Function endpoints** (NOT ai-tasks).

```
POST {CLAWBUDDY_API_URL}/functions/v1/{function-name}
```

Same `x-webhook-secret` header for auth.

### list-offices

```json
// POST to list-offices
// Query param: ?include_agents=true
{}
```

**Response:** `{ "offices": [{ id, name, agent_count, agents? }] }`

### manage-office-agent

```json
// POST to manage-office-agent
{
  "action": "create",
  "office_id": "...",
  "name": "Researcher",
  "role": "Data Analyst",
  "species": "cat",
  "neon_color": "#f97316",
  "fur_color": "#8B6914",
  "fur_highlight": "#C4A44A",
  "suit_color": "#1e293b",
  "persona": "Methodical and thorough"
}
```

Actions: `create`, `update`, `delete`, `get`, `list`

Auto-assigns desk position from 8 predefined slots if not specified.

### office-agent-status

```json
// POST to office-agent-status
{
  "office_id": "...",
  "agent_name": "Researcher",
  "status": "busy",
  "thought": "Analyzing revenue column",
  "event_type": "task_start",
  "task_id": "..."
}
```

> **`thought` maps to `current_thought`** on the agent record.

Valid event types: `status_change`, `thought`, `task_start`, `task_complete`, `delegation`, `movement`, `collection`, `report`, `director_directive`, `error`

On `task_complete` with `task_id`: auto-updates task progress and marks complete when all agents finish.

### create-office-task

```json
// POST to create-office-task
{
  "office_id": "...",
  "title": "Analyze competitor data",
  "client_name": "Growth Creators",
  "description": "Pull and compare stats",
  "assigned_agents": ["Researcher", "Analyst"]
}
```

Auto-sets status to `"in_progress"` and updates the Director agent.

### reset-office

```json
// POST to reset-office
{ "office_id": "..." }
```

Resets ALL agents to idle. Does NOT delete tasks or logs.

### upload-office-deliverable

Supports 3 upload methods:

**Base64:**
```json
{
  "office_id": "...",
  "task_id": "...",
  "agent_name": "Researcher",
  "file_name": "report.pdf",
  "file_base64": "JVBERi0xLj...",
  "content_type": "application/pdf"
}
```

**URL fetch:**
```json
{
  "office_id": "...",
  "task_id": "...",
  "agent_name": "Researcher",
  "file_name": "data.csv",
  "file_url": "https://example.com/data.csv"
}
```

**Text content:**
```json
{
  "office_id": "...",
  "task_id": "...",
  "agent_name": "Researcher",
  "file_name": "notes.md",
  "content": "# Analysis Notes\n\nFindings..."
}
```

Also supports `multipart/form-data` with a `file` field.

Storage path: `{office_id}/{task_id}/{agent_name}/{file_name}`

---

## Standalone Edge Functions

### automation-runner

```
POST {CLAWBUDDY_API_URL}/functions/v1/automation-runner
x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}
```

Body: `{ "automation_id": "..." }`

Orchestrates scheduled automation execution. Called by `pg_cron` or `trigger` action.

**Auth:** Accepts `x-webhook-secret` header (primary), `x-api-key`, or `Authorization: Bearer {SERVICE_ROLE_KEY}`. The `pg_cron` trigger function (`sync_automation_cron`) uses `x-webhook-secret`.

**Child function calls:** `automation-runner` passes both `Authorization: Bearer` and `x-webhook-secret` headers to child edge functions, ensuring compatibility with functions that only accept webhook auth (e.g., `intelligence-sync`).

### morning-digest / midday-prep / evening-report

Internal functions called by `automation-runner`. No direct auth. Return `{ html, subject, text }` for email delivery.

| Function | Purpose | Side Effects |
|----------|---------|-------------|
| `morning-digest` | Musashi principles + daily focus + tasks | Tracks principle usage in `musashi_state` |
| `midday-prep` | 5 reflection questions | Creates a Kanban task |
| `evening-report` | Day summary + momentum metrics | None |

### competitor-intel

Internal function. Reads competitor list from OpsCenter (`ops_data` with `block_id` matching the Competitors block). Falls back to hardcoded handles if no OpsCenter data found. For each competitor, fetches YouTube stats via YouTube Data API and detects outlier videos (3x+ median). Flags viral alerts (3x+ outlier score). Also fetches trending AI/automation videos via Subscribr API.

**Env vars required:** `YOUTUBE_API_KEY`, `SUBSCRIBR_API_KEY`
**OpsCenter integration:** Reads from competitors block — add/remove competitors in Creator Command dashboard and the intel report updates automatically.

### subscribr-proxy

```
POST {CLAWBUDDY_API_URL}/functions/v1/subscribr-proxy
Authorization: Bearer {USER_JWT}
```

Body: `{ "endpoint": "/trends", "method": "GET", "params": {} }`

Frontend proxy to Subscribr API. Injects server-side API key.

### goal-analyzer

```
POST {CLAWBUDDY_API_URL}/functions/v1/goal-analyzer
x-webhook-secret: {SECRET}
```

Body: `{ "goal": "Close $50K this quarter", "goal_type": "quarterly" }`

AI-powered goal decomposition via Gemini 2.5 Pro. Returns assumptions, metrics, and action items.

### report-webhook

```
POST {CLAWBUDDY_API_URL}/functions/v1/report-webhook?endpoint={slug}
```

Receives external webhook payloads, queues as `raw_reports`. If `auto_process: true`, triggers processing via ai-tasks.

**Authentication (two methods supported):**

1. **Simple secret header** (default): `x-webhook-secret: {PER_ENDPOINT_SECRET}` — compared against `webhook_endpoints.secret`.
2. **HMAC signature verification** (Fathom/Svix-style): Detected when request includes `webhook-id`, `webhook-timestamp`, `webhook-signature` headers. Uses `FATHOM_WEBHOOK_SECRET` env var (format: `whsec_<base64key>`). Verifies HMAC-SHA256 of `{id}.{timestamp}.{rawBody}` with 5-minute timestamp tolerance.

**Env var:** `FATHOM_WEBHOOK_SECRET` — Required for Fathom webhook verification. Store via `supabase secrets set`.

### lexa-webhook

```
POST {CLAWBUDDY_API_URL}/functions/v1/lexa-webhook
```

Receives Millis AI call completion events. Parses transcript, determines call type (inbound/outbound/campaign), calculates cost, analyzes sentiment. Writes to `lexa_calls`, dual-writes to `ops_data` (OpsCenter feed + call log), updates `lexa_daily_metrics`. Updates campaign counters and lead status if applicable.

**Env vars:** `MILLIS_API_KEY`

### lexa-precall

```
POST {CLAWBUDDY_API_URL}/functions/v1/lexa-precall
```

Provides pre-call context to Millis AI agent. Returns lead info, previous call history, and campaign context for personalized conversations.

### lexa-campaign-runner

```
POST {CLAWBUDDY_API_URL}/functions/v1/lexa-campaign-runner
```

Processes Lexa outbound call campaigns. Picks up queued calls from `lexa_campaigns`, initiates calls via Millis AI API, tracks progress.

### millis-proxy

```
POST {CLAWBUDDY_API_URL}/functions/v1/millis-proxy
Authorization: Bearer {USER_JWT}
```

Body: `{ "method": "GET", "path": "/agents", "body": {} }`

Frontend proxy to Millis AI API (`api-west.millis.ai`). Injects server-side API key.

### make-proxy

```
POST {CLAWBUDDY_API_URL}/functions/v1/make-proxy
x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}
```

Proxy to Make.com REST API. Lets any authenticated agent run Make.com scenarios, list available scenarios, and check execution results — without needing direct Make.com API access.

**Auth:** Same as `intelligence-sync` — validates `x-webhook-secret` against `users.webhook_secret` → `ai_agents.webhook_secret` → `AI_TASKS_API_KEY` env var.

**Actions:**

| Action | Required Fields | Description |
|--------|----------------|-------------|
| `list` | (none) | List Make.com scenarios. `active_only` (default `true`) filters to active only. |
| `run` | `scenario_id` | Run a scenario. Optional `data` object passed as input. Returns execution result. |
| `get_execution` | `scenario_id`, `execution_id` | Get details of a specific execution. |

**Examples:**

```json
// List active scenarios
{"action": "list"}

// List ALL scenarios (including inactive)
{"action": "list", "active_only": false}

// Run a scenario
{"action": "run", "scenario_id": 3890482}

// Run with input data
{"action": "run", "scenario_id": 3885541, "data": {"event_name": "Team Sync", "start_date": "2026-03-01T10:00:00Z"}}

// Check execution result
{"action": "get_execution", "scenario_id": 3890482, "execution_id": "abc123"}
```

**Env vars required:** `MAKE_API_TOKEN`, `MAKE_TEAM_ID`

### forge-analyzer

```
POST {CLAWBUDDY_API_URL}/functions/v1/forge-analyzer
x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}
```

AI-powered content analyzer for the Forge feature. Takes YouTube transcripts, API docs, MCP specs, URLs, or any text and identifies buildable skills, tools, OpsCenter apps, automations, and Make.com scenarios.

**Auth:** JWT (frontend) or webhook secret (agents) — same dual-auth as make-proxy.

**Actions:**

| Action | Required Fields | Description |
|--------|----------------|-------------|
| `analyze` | `input_type`, `content` or `url` | Analyze content with AI. Returns buildable items with complexity, recommended agent/model, build steps. |
| `list` | (none) | List past analyses. Optional `limit` (default 20). |
| `get` | `analysis_id` | Get a specific analysis by ID. |
| `video_info` | `url` | Get YouTube video metadata (title, author, videoId) via oEmbed. |

**Input types:** `transcript`, `url`, `api_docs`, `mcp_spec`, `text`

**Examples:**

```json
// Analyze a pasted transcript with YouTube URL for metadata enrichment
{"action": "analyze", "input_type": "transcript", "content": "In this video we build...", "url": "https://youtube.com/watch?v=abc123"}

// Analyze a URL (content fetched automatically)
{"action": "analyze", "input_type": "url", "url": "https://docs.stripe.com/api"}

// Analyze pasted API docs
{"action": "analyze", "input_type": "api_docs", "content": "POST /v1/customers..."}

// List past analyses
{"action": "list", "limit": 10}

// Get YouTube video metadata
{"action": "video_info", "url": "https://youtube.com/watch?v=abc123"}
```

**Response (analyze):**
```json
{
  "id": "uuid",
  "status": "complete",
  "analysis": {
    "summary": "Brief overview",
    "source_type": "API documentation",
    "items": [
      {
        "name": "stripe-webhook-handler",
        "type": "edge_function",
        "description": "Handles Stripe webhook events",
        "complexity": "moderate",
        "recommended_agent": "Sherlock",
        "recommended_model": "claude-opus-4-6",
        "build_steps": ["Step 1", "Step 2"],
        "apis_needed": ["Stripe API"],
        "estimated_effort": "2 hours",
        "priority": "high"
      }
    ],
    "total_items": 1,
    "key_technologies": ["Stripe", "Webhooks"]
  }
}
```

**Database:** `forge_analyses` table. **Env vars required:** `OPENAI_API_KEY`

### activate-license

```
POST {CLAWBUDDY_API_URL}/functions/v1/activate-license
```

Body: `{ "code": "ACTIVATION_CODE" }`

Validates activation codes against the `licenses` table, signs a token with HMAC-SHA256, and returns a license token (`cb_*`). Users set this as `CLAWBUDDY_LICENSE_TOKEN` in Supabase secrets.

**Env vars:** `LICENSE_SIGNING_KEY`

### browser-research

```
POST {CLAWBUDDY_API_URL}/functions/v1/browser-research
Authorization: Bearer {SERVICE_ROLE_KEY}
```

Fetches URLs or searches topics via DuckDuckGo, extracts plain text, and summarizes with a configurable LLM (OpenAI or Anthropic). Reads AI config from the OpsCenter Research Hub settings block and stores results in the Research Hub feed.

**Env vars:** `OPENAI_API_KEY` (or Anthropic key, depending on configured provider)

### calendar-sync

```
POST {CLAWBUDDY_API_URL}/functions/v1/calendar-sync
```

Searches upcoming calendar events (48h window) or creates new events by calling Make.com scenarios via REST. Returns cleaned event JSON and formatted agenda text.

**Env vars:** `MAKE_API_TOKEN`

### sherlock-brain

```
POST {CLAWBUDDY_API_URL}/functions/v1/sherlock-brain
Authorization: Bearer {SERVICE_ROLE_KEY}
```

Self-improving automation health analyzer. Computes 24h/7d success rates, duration trends, and health scores. Auto-tunes automation timeouts and enabled flags. Discovers stale tasks and orphaned executions. Generates an HTML brain report.

**Env vars:** `OPENAI_API_KEY` (optional, for LLM-powered report synthesis)

---

## Known Quirks & Gotchas

### Field Name Discrepancies (Code vs Old Docs)

| Feature | Old Docs Said | Actual Code |
|---------|--------------|-------------|
| Log create | `content` | **`message`** |
| Question create | action `create` | action **`ask`** |
| Question create | `type` field | **`question_type`** |
| Question create | `options` array | **Not supported** |
| Report create | `content` | **`html_content`** |
| Report create | `type` | **`report_type`** |
| Insight create | `type` | **`insight_type`** |
| Task move | action `move` | **Use `update` with `column`** |
| Memory create | action `create` | action **`submit`** |

### OpsCenter Data Gotchas

- `add_data` **REQUIRES `app_id`** explicitly. `block_id` alone causes null constraint violation.
- `update_data` uses `data_id` (not `item_id`) as the record identifier.
- `update_data` can change `block_id` but NOT `app_id`.
- `delete_page` cascades: sets `block_id = NULL` on linked ops_data.
- `list_data` **hard-caps at 1,000 rows** regardless of `limit` param. Offset wraps around (offset 1000 returns same records as offset 0). For datasets >1,000: use Supabase REST API directly with service_role key and `Range` headers for proper pagination.
- `delete_data` requires **BOTH `app_id` AND `data_id`**. Without `app_id` it returns `{"success": true}` but silently does nothing.
- **Bulk operations on large datasets:** For clearing or migrating >1,000 records, use the Supabase REST API directly (e.g., `DELETE /rest/v1/ops_data?app_id=eq.{id}`) rather than looping through `list_data` + `delete_data`.
- **`update_data` REPLACES the entire `data` field** — it does NOT merge. When updating, you must include ALL existing fields plus new ones, or previous data will be lost. Read-then-update pattern required for partial updates.
- **Feature card reports:** Always store `report_id` and `report_title` in ops_data when generating reports so the frontend can link directly. Never use "Pipeline" in report titles — the frontend filters those out.

### OpsCenter Block Rendering Gotchas

- **`alert_banner` is config-driven, NOT data-driven.** The component reads `config.message` directly — it never reads ops_data records. If `config.message` is missing, the component returns `null` (invisible). Storing alert data as ops_data records in an `alert_banner` block will not render. Use a `feed` block instead if you need multiple alerts.
- **`metric_cards` `data.field` paths are single-depth only.** The `computeValue()` function does `item.data?.[field]` — meaning `data.average_health` looks up `item.data['average_health']`. It does NOT support nested dot notation like `data.after.health_score`. Use `count:item_type` paths for counting records by type.
- **`metric_cards` fetches ALL app items** (no `blockId` filter). The `useOpsData({ appId })` hook pulls every record in the app, then computes values across them. Keep this in mind for apps with many records.
- **`table` blocks DO support nested dot-notation** via `getNestedValue()`. Column keys like `data.after.health_score` correctly traverse `item.data.after.health_score`.
- **`feed` items need `metadata.agent`** for agent badge rendering. Without `metadata: {"agent": "AgentName"}`, items render but show no agent badge. Always set `metadata.agent` when creating feed records.
- **`list_data` response key differs by filter.** Without `block_id`, response uses `data` key. With `block_id`, response uses `items` key. Always check both keys when parsing responses.
- **Block configs must be set explicitly.** Creating a block with `config: {}` and then adding data will show "No data yet" in the frontend even though records exist in the database. Set the component-specific config (see Block Type Config Reference above) BEFORE or alongside data population.

### Webhook Integration Gotchas

- **Third-party webhooks often use HMAC, not simple secret headers.** Fathom, Stripe, GitHub, and Svix-based services sign payloads with HMAC-SHA256 instead of passing a secret in a header. The `report-webhook` function now supports both methods.
- **Must read raw body BEFORE parsing JSON** when doing HMAC verification. The body stream can only be consumed once — read as text first, verify signature, then `JSON.parse()`.
- **Fathom webhook secret format:** `whsec_<base64key>`. Decode the part after `whsec_` for the HMAC key.
- **Fathom webhook events:** Sends Transcript, Summary, and Action Items per meeting. Configurable per webhook in the API key Manage page.
- **Fathom webhook docs:** `https://developers.fathom.ai/webhooks`

### Automation & Cron Gotchas

- **pg_cron auth uses `x-webhook-secret`**, NOT `Authorization: Bearer`. The `sync_automation_cron()` trigger function hardcodes the webhook secret into `net.http_post()` headers. If you change the webhook secret, you must re-toggle all automations (disable → enable) to regenerate the cron jobs.
- **pg_cron marks jobs as "succeeded" even on HTTP 401.** The `net.http_post()` SQL call succeeds (the SQL ran), even if the HTTP response is an error. Check `automation_executions` table for actual delivery status, not `cron.job_run_details`.
- **`automation-runner` passes `x-webhook-secret` to child functions.** This ensures child functions like `intelligence-sync` (which only accept webhook auth) work correctly. Both `Authorization: Bearer` and `x-webhook-secret` headers are sent.
- **`competitor-intel` reads competitors from OpsCenter.** It queries `ops_data` by `block_id` for records with `data.type = "competitor"`. If no records found, falls back to hardcoded handles. Add competitors via Creator Command dashboard.
- **Resend `email` channel is recommended over `agentmail`.** AgentMail uses Amazon SES with shared domain reputation — emails may be silently delayed or dropped. Resend with a verified custom domain has better deliverability.
- **`channels` field is an array of objects**, not an array of strings. Each entry has `type` and `config`.
- **Debug RPCs available:** `list_cron_jobs()` and `list_cron_job_run_details()` — call via Supabase REST RPC to inspect pg_cron state.

### Task Gotchas

- **No `move` action.** Use `update` with `column` field.
- **No `bulk_create` action.** Create tasks individually.
- **No `search` action.**
- Task ID field accepts either `id` or `task_id`.

### Status & Agent Identity Gotchas

- **`agent_name` defaults to `"Ray"` everywhere.** The edge function's status handler, heartbeat handler, and log attribution all default to `"Ray"` when `agent_name` is not provided. Always pass `agent_name` and `agent_emoji` explicitly.
- **`updateBujjiLastSeen` runs on every API request** (line 687 in `ai-tasks/index.ts`). It matches `ai_status` by `(user_id, agent_id)`. If no matching row exists, it INSERTs a ghost record with DB defaults (`agent_name = 'Ray'`, `ring_color = '#ef4444'`).
- **The `ai_status` table has two independent lookup keys**: `agent_name` (used by status/heartbeat handlers) and `agent_id` (used by `updateBujjiLastSeen`). Both must be set on the same row. If they're on different rows, you get duplicate agent entries in the dashboard header.
- **After creating an agent in `ai_agents`**, you must link its `ai_status` record: `UPDATE ai_status SET agent_id = '<ai_agents.id>' WHERE agent_name = '<name>';`
- **Column defaults on `ai_status`**: `agent_name = 'Ray'`, `ring_color = '#ef4444'` (red). Any INSERT that omits these fields will create a "Ray" ghost.

### Skill Factory Gotchas

- Must set `agent_name: "Sherlock"` explicitly or skills default to "OpenClaw".
- Use `action: "create"` for new skills (not `submit`).
- Operation names must match `^[a-z][a-z0-9_]{1,49}$`.

### Python 3.9 Compatibility

- Use `Optional[dict]` not `dict|None`, `List[dict]` not `list[dict]`
- No backslashes in f-strings. Use `%` formatting for complex templates.
- HTML entity codes for emojis in templates (`&#128293;` not emoji chars)

---

## Database Tables Reference

### Core

| Table | Purpose |
|-------|---------|
| `users` | User accounts (`ai_name`, `webhook_secret`) |
| `ai_agents` | Multi-agent identities |
| `ai_status` | Agent presence/status |
| `ai_log` | Agent journal entries |
| `ai_questions` | Questions & approvals |
| `ai_insights` | Analytics cards |
| `reports` | HTML reports |
| `raw_reports` | Queued webhook payloads |
| `webhook_functions` | Webhook endpoint configs |

### Kanban

| Table | Purpose |
|-------|---------|
| `tasks` | Kanban tasks |
| `board_columns` | Column definitions (To Do, Doing, etc.) |
| `subtasks` | Task subtasks |
| `task_budgets` | Cost tracking per task |
| `task_assignees` | User assignments per task |
| `activity_log` | Task activity history |

### OpsCenter

| Table | Purpose |
|-------|---------|
| `ops_apps` | Custom dashboard apps |
| `ops_pages` | Tabs within apps |
| `ops_blocks` | UI blocks within pages |
| `ops_data` | Data records within blocks |

### Sub-Agents

| Table | Purpose |
|-------|---------|
| `sub_agents` | Agent definitions |
| `sub_agent_sessions` | Execution sessions |
| `sub_agent_tasks` | Kanban task links |

### Intelligence

| Table | Purpose |
|-------|---------|
| `intelligence_ideas` | Video ideas |
| `intelligence_competitors` | YouTube competitors |
| `intelligence_videos` | Tracked videos |
| `intelligence_scripts` | Script drafts |
| `intelligence_digests` | Daily digests |
| `intelligence_insights` | AI insights |

### Automations

| Table | Purpose |
|-------|---------|
| `automations` | Automation configs |
| `automation_executions` | Run history |

### Office

| Table | Purpose |
|-------|---------|
| `offices` | Office definitions |
| `office_agents` | Animated characters |
| `office_tasks` | Office-scoped tasks |
| `office_events` | Agent events |
| `office_activity_log` | Activity feed |
| `office_deliverables` | Uploaded files |

### AI Employees — Lexa (Phone)

| Table | Purpose |
|-------|---------|
| `lexa_calls` | Call records with transcript, sentiment, cost |
| `lexa_leads` | Lead contact database |
| `lexa_campaigns` | Outbound call campaigns |
| `lexa_daily_metrics` | Pre-aggregated daily call stats |

### AI Employees — Nova (Email)

| Table | Purpose |
|-------|---------|
| `nova_templates` | Email template library with `{{variables}}` |
| `nova_sequences` | Multi-step email sequences |
| `nova_campaigns` | Email campaigns with send settings |
| `nova_emails` | Individual emails with lifecycle tracking |
| `nova_daily_metrics` | Pre-aggregated daily email stats |

### Other

| Table | Purpose |
|-------|---------|
| `pending_tasks` | Async queue items |
| `memory_injections` | Persistent knowledge |
| `skills` | Skill definitions |
| `skill_operations` | Skill API operations |
| `identity_files` | Agent config files |
| `daily_memory_logs` | Daily memory entries |
| `arena_scoreboards` | Competition boards |
| `arena_score_categories` | Score categories |
| `arena_scores` | Individual scores |
| `musashi_state` | Dokkodo principle tracking |

---

## Current App & Block IDs

| Item | ID |
|------|-----|
| Creator Command App | `84982e63-a48a-494e-b0ad-fb3bfa47e926` |
| Meeting Intelligence App | `ef7624be-bdec-4348-8b3c-219c675f4407` |
| Agents in a Box App | `82e20a46-be6b-4796-ba5b-185ffea6adea` |
| Dashboard Block | `55362710-7a7f-4416-8c80-ad7a9714030b` |
| Outlier Feed Block | `a5e73712-96e1-425c-99c0-7a670081e55d` |
| Intel Feed Block | `4c451858-7e8c-4ee2-81a9-350199c2dbae` |
| Competitors Block | `ba39811a-9379-404f-b036-143b340d496e` |
| Banger Lab Block | `cb4c720d-f941-4838-819c-1247aff06695` |
| Meeting Intel Block | `b1818fa2-d916-413d-a58b-747aa4ffb848` |
| Action Items Block | `c64fdaaf-67e5-49b2-94a3-9d0688e3fae0` |
| Proposals Block | `0dee583a-84aa-4bd6-88fb-93f998e2bfac` |
| Lead Magnets Block | `8622e572-0e4a-427f-bfc6-4fc689009df3` |

---

## Meeting Intelligence Feature Workflow

### Status Flow

All three feature pipelines (Action Items, Proposals, Lead Magnets) follow the same status lifecycle:

```
queued → processing → needs_input → answered → complete
```

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `queued` | Meeting sent to feature queue via dropdown | Cron picks up, fetches transcript |
| `processing` | Transcript being fetched and analyzed | Auto-transitions to needs_input |
| `needs_input` | Question posted, waiting for user's answer | User answers in Questions tab |
| `answered` | Answer received, generating final output | Cron generates report |
| `complete` | Report generated and stored | User clicks "View Report" |
| `error` | Processing failed | User can retry via refresh button |

### Report → Feature Card Linking (report_id pattern)

When a generator creates a report, it **must** store `report_id` and `report_title` in the ops_data record so the frontend can link directly to it:

```python
# 1. Create the report
report_title = "Action Items — %s" % meeting_title
report_resp = cb.create_report(report_title, html)

# 2. Extract report_id (try both response shapes)
report_id = (report_resp.get("data", {}) or {}).get("id", "")
if not report_id:
    report_id = (report_resp.get("report", {}) or {}).get("id", "")

# 3. Store in ops_data alongside status update
update_item_status(data_id, "complete", {
    "report_generated": True,
    "report_id": report_id,
    "report_title": report_title,
    "completed_at": datetime.utcnow().isoformat() + "Z",
})
```

**Frontend lookup strategy** (in `OpsMeetingFeatureBlock.tsx`):
1. **Strategy 1:** Direct lookup by `report_id` from ops_data (fastest, most reliable)
2. **Strategy 2:** Exact match on `report_title` from ops_data
3. **Strategy 3:** Fuzzy search by meeting title (`ilike`), skipping reports with "Pipeline" in the title

### Report Title Conventions

**Always use these prefixes for generated reports:**

| Feature | Report Title Format | Example |
|---------|-------------------|---------|
| Action Items | `Action Items — {meeting_title}` | Action Items — Team Standup |
| Proposals | `Proposal — {meeting_title}` | Proposal — Discovery Call between Balagee |
| Lead Magnets | `Lead Magnet — {meeting_title}` | Lead Magnet — Content Planning Session |

**Never use "Pipeline" or "Status" in report titles.** These are reserved for internal debugging. Reports with "Pipeline" in the title are filtered out by the frontend.

### OpsCenter Data Fields for Feature Cards

All feature records in ops_data should include these fields for the frontend to render correctly:

```json
{
  "status": "complete",
  "source_meeting_title": "Discovery Call between Balagee",
  "source_meeting_date": "2026-02-24T...",
  "source_recording_id": 120914591,
  "source_attendees": ["User Name", "Colleague"],
  "report_generated": true,
  "report_id": "6329a96a-...",
  "report_title": "Proposal — Discovery Call between Balagee",
  "user_answer": "Option 1: $2500 setup...",
  "completed_at": "2026-02-25T00:28:34Z"
}
```

### Cron Automation (3-Step Cycle)

The automation processor runs every minute via crontab and executes three steps:

1. **Process queued items** — Fetch transcript, analyze, ask questions → `needs_input`
2. **Match answered questions** — Find `needs_input` items with matching answers → `answered`
3. **Generate output** — Create reports for `answered` items → `complete`

Script: `skills/meeting-intel/scripts/automation_processor.py`
Cron: `skills/meeting-intel/cron_runner.sh`

---

## Python Helper

```python
import requests, os

CLAWBUDDY_URL = os.environ.get("CLAWBUDDY_API_URL")
CLAWBUDDY_SECRET = os.environ.get("CLAWBUDDY_WEBHOOK_SECRET")

def clawbuddy(request_type, action, **kwargs):
    payload = {"request_type": request_type, "action": action, **kwargs}
    resp = requests.post(
        "%s/functions/v1/ai-tasks" % CLAWBUDDY_URL,
        json=payload,
        headers={
            "x-webhook-secret": CLAWBUDDY_SECRET,
            "Content-Type": "application/json"
        }
    )
    return resp.json()

def office(function_name, **kwargs):
    resp = requests.post(
        "%s/functions/v1/%s" % (CLAWBUDDY_URL, function_name),
        json=kwargs,
        headers={
            "x-webhook-secret": CLAWBUDDY_SECRET,
            "Content-Type": "application/json"
        }
    )
    return resp.json()
```

### Usage Examples

```python
# Status
clawbuddy("status", "update", is_online=True, status_message="Working.", ring_color="green")

# Task
task = clawbuddy("task", "create", title="Build pipeline", column="todo")
clawbuddy("task", "update", task_id=task["task"]["id"], column="done")

# Log (uses 'message', not 'content')
clawbuddy("log", "create", category="observation", message="Found 786 records.")

# Question (action is 'ask', not 'create')
clawbuddy("question", "ask", question="Approve sending emails?", question_type="approval")

# Insight (uses 'insight_type', not 'type')
clawbuddy("insight", "create", title="Results", content="Done.", insight_type="performance")

# Report (uses 'html_content' and 'report_type')
clawbuddy("report", "create", title="Summary", report_type="insight", html_content="<h1>Done</h1>")

# Memory (action is 'submit', not 'create')
clawbuddy("memory", "submit", content="The API uses message, not content.")

# OpsCenter
clawbuddy("ops", "add_data",
    app_id="84982e63-a48a-494e-b0ad-fb3bfa47e926",
    block_id="ba39811a-9379-404f-b036-143b340d496e",
    item_type="competitor",
    title="Nick Saraev",
    data={"name": "Nick Saraev", "handle": "@nicksaraev"})
```
