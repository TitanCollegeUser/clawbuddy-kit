# CLAUDE.md -- ClawBuddy Agent Instructions

You are an AI agent connected to **ClawBuddy**, an AI command center dashboard. Every action you take should be reflected on the dashboard so your user can see progress in real time.

Think of ClawBuddy as your office. You clock in, update your status, create tasks, log what you're doing, ask questions when you're stuck, and file reports when you're done.

---

## Connection

**API endpoint:**
```
POST {CLAWBUDDY_API_URL}/functions/v1/ai-tasks
```

**Authentication header:**
```
x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}
```

**Required env vars:**
```bash
export CLAWBUDDY_API_URL="https://YOUR_PROJECT.supabase.co"
export CLAWBUDDY_WEBHOOK_SECRET="your-secret-here"
```

---

## Startup Routine

Every time you begin a session:

```json
{"request_type": "status", "action": "update", "is_online": true, "status_message": "Agent online.", "ring_color": "green", "agent_name": "YOUR_AGENT_NAME", "agent_emoji": "YOUR_EMOJI"}
```

When you finish:

```json
{"request_type": "status", "action": "update", "is_online": false, "status_message": "Session complete.", "ring_color": "gray", "agent_name": "YOUR_AGENT_NAME", "agent_emoji": "YOUR_EMOJI"}
```

---

## Core Workflow

For **every** task, follow this sequence:

### 1. Create the task
```json
{"request_type": "task", "action": "create", "title": "Build data pipeline", "description": "Clean and normalize the lead CSV", "column": "todo"}
```

### 2. Assign it
```json
{"request_type": "assignee", "action": "assign", "task_id": "<task_id>", "names": ["YOUR_USER_NAME"]}
```

### 3. Start working
```json
{"request_type": "task", "action": "update", "task_id": "<task_id>", "column": "doing"}
```
```json
{"request_type": "log", "action": "create", "category": "general", "message": "Starting: Build data pipeline."}
```

### 4. Log progress (at least every major step)
```json
{"request_type": "log", "action": "create", "category": "observation", "message": "Found 786 valid records. 312 missing email."}
```

### 5. Ask questions if blocked
```json
{"request_type": "question", "action": "ask", "question_type": "question", "priority": "medium", "question": "Two date formats found. Normalize to ISO 8601?"}
```

### 6. Complete the task
```json
{"request_type": "task", "action": "update", "task_id": "<task_id>", "column": "done"}
```
```json
{"request_type": "log", "action": "create", "category": "observation", "message": "Done: 786 records cleaned and exported."}
```

### 7. Report results
```json
{"request_type": "insight", "action": "create", "insight_type": "summary", "title": "Pipeline Results", "content": "786 processed, 312 skipped, 0 errors."}
```

---

## Feature Areas

### Tasks -- Kanban Board
```
request_type: "task"
actions: create, update, delete, list, get
columns: todo, doing, needs_input, canceled, done
```

### Subtasks
```
request_type: "subtask"
actions: create, update, delete
```

### AI Log -- Your Journal
```
request_type: "log"
actions: create, list, get_unread
categories: general, observation, reminder, fyi
```
Field is `message`, NOT `content`.

### Questions & Approvals
```
request_type: "question"
actions: ask, check_answers, respond, list
question_types: question, approval
priorities: low, medium, high, urgent
```
Action is `ask`, NOT `create`.

### Insights -- Analytics Cards
```
request_type: "insight"
actions: create, update
insight_types: performance, suggestion, alert, summary
```
Field is `insight_type`, NOT `type`.

### Reports -- HTML Output
```
request_type: "report"
actions: create, list, get, mark_read
report_types: employee, insight
```
Fields: `report_type` and `html_content`.

### Status -- Your Presence
```
request_type: "status"
actions: update
ring_color: green | yellow | red | gray
```
**Always pass `agent_name` and `agent_emoji`** on every status update.

### Sub-Agents
```
request_type: "subagent"
actions: create, update, delete, list, spawn_task, get_sessions, update_session
```

### Memory
```
request_type: "memory"
action: submit
```

### Skills Factory
```
request_type: "skill"
actions: list, get, create, update, review
```

### OpsCenter
```
request_type: "ops"
actions: list_apps, create_app, list_pages, create_page, add_block, list_data, add_data, update_data, delete_data
```

### Automations
```
request_type: "automation"
actions: list, create, update, delete, trigger
```

### Queue
```
request_type: "queue"
actions: list, claim, complete, fail, heartbeat, disconnect
```

### Assignees
```
request_type: "assignee"
actions: assign, unassign, list
```

### Budget
```
request_type: "budget"
actions: update, get
```

### Learning (Sherlock Brain)
```
request_type: "learning"
actions: list, get, review, stats
```

---

## Animated Office

The office uses **separate endpoints** (not ai-tasks):

```
POST {CLAWBUDDY_API_URL}/functions/v1/{function-name}
```

| Endpoint | Purpose |
|----------|---------|
| `list-offices` | List all offices |
| `manage-office-agent` | Create/update/delete office characters |
| `create-office-task` | Create tasks in an office |
| `office-agent-status` | Update agent status and animation |
| `reset-office` | Reset office to clean state |
| `upload-office-deliverable` | Upload files |

---

## Python Helper

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

## Operating Principles

1. **Make work visible.** If the user can't see it on the dashboard, it didn't happen.
2. **Assign yourself to every task.** Unassigned cards look abandoned.
3. **Log at every step.** Minimum 2 logs per task. Aim for 3-5.
4. **Ask through ClawBuddy, not terminal.** Questions on the dashboard create a better async workflow.
5. **Update status.** Green when working. Yellow when waiting. Red when blocked.
6. **Report results.** Meaningful output deserves an HTML report, not just terminal output.
7. **Break work into tasks.** Even big requests should be decomposed into visible subtasks.

---

## API Gotchas

- `agent_name` + `agent_emoji` required on every status update (defaults to "Ray" ghost if omitted)
- Log field is `message`, not `content`
- Question action is `ask`, not `create`
- Insight field is `insight_type`, not `type`
- Report fields: `report_type` and `html_content`
- Memory action is `submit`, not `create`
- Skill action is `create`, not `submit`
- OpsCenter `add_data` requires `app_id` explicitly
- `list_data` caps at 1,000 rows
- `delete_data` requires both `app_id` and `data_id`
- Task columns: `todo`, `doing`, `needs_input`, `canceled`, `done`
