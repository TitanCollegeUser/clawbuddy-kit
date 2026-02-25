# ClawBuddy Integration Guide v3.0.0

> Last updated: February 24, 2026
> Source of truth: Audited directly from `ai-tasks/index.ts` (4,852 lines) and 15 Edge Functions.
> Supabase project: `YOUR_PROJECT_REF`

---

## Table of Contents

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

### assign

```json
{
  "request_type": "assignee",
  "action": "assign",
  "task_id": "...",
  "names": ["Your Name"]
}
```

`names` can be a string or string array. Looks up users by name in `user_profiles`.

> **Agent Assignment:** The `assign` action only matches names in the `user_profiles` view (auth users). To assign tasks to AI agents or sub-agents, insert directly into `task_assignees` via REST API using the agent's `ai_agents.id` or `sub_agents.id` as `user_id`. The frontend `useAssignableEntities` hook already resolves all entity types (users, ai_agents, sub_agents) in its entityMap — no frontend changes needed.
>
> **Required DB setup (one-time):** Drop the FK constraint on `task_assignees`:
> ```sql
> ALTER TABLE task_assignees DROP CONSTRAINT task_assignees_user_id_fkey;
> ```
> This allows any UUID (not just auth user IDs) to be stored as an assignee. Note: `user_profiles` is a VIEW, not a table — no FK changes needed there.

### unassign

```json
{
  "request_type": "assignee",
  "action": "unassign",
  "task_id": "...",
  "names": ["Your Name"]
}
```

### list

```json
{ "request_type": "assignee", "action": "list", "task_id": "..." }
```

**Table:** `task_assignees`

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

Create and manage specialized AI workers.

**`request_type: "subagent"`**

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

| Channel | Notes |
|---------|-------|
| `dashboard` | Creates `ai_insights` record |
| `agentmail` | Sends via AgentMail API (default inbox: `sherlockbot@agentmail.to`) |
| `email` | Sends via Resend API |
| `telegram` | Sends via Telegram Bot API (truncated to 4,000 chars) |
| `discord` | Sends via Discord webhook (truncated to 2,000 chars) |

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

Manage agent identities for multi-agent setups.

**`request_type: "ai_agent"` (or `"agent"`)**

| Action | Params | Notes |
|--------|--------|-------|
| `get` | -- | Returns the agent resolved from webhook auth |
| `update` | `name`, `description`, `avatar_color` | |
| `list` | -- | All agents for the user |

**Table:** `ai_agents`

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
Authorization: Bearer {SERVICE_ROLE_KEY}
```

Body: `{ "automation_id": "..." }`

Orchestrates scheduled automation execution. Called by `pg_cron` or `trigger` action.

### morning-digest / midday-prep / evening-report

Internal functions called by `automation-runner`. No direct auth. Return `{ html, subject, text }` for email delivery.

| Function | Purpose | Side Effects |
|----------|---------|-------------|
| `morning-digest` | Musashi principles + daily focus + tasks | Tracks principle usage in `musashi_state` |
| `midday-prep` | 5 reflection questions | Creates a Kanban task |
| `evening-report` | Day summary + momentum metrics | None |

### competitor-intel

Internal function. Analyzes YouTube channels, detects outlier videos (3x+ median), flags viral alerts (5x+). Returns HTML report.

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
x-webhook-secret: {PER_ENDPOINT_SECRET}
```

Receives external webhook payloads, queues as `raw_reports`. If `auto_process: true`, triggers processing via ai-tasks.

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
