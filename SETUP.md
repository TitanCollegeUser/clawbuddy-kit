# ClawBuddy Setup Guide

Complete guide to setting up your own ClawBuddy instance. Takes about 20 minutes.

---

## Prerequisites

- [Supabase account](https://supabase.com) (free tier works)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`npm install -g supabase`)
- [Deno](https://deno.land) installed (for local edge function testing)
- An AI agent (Claude Code, OpenClaw, or any custom agent)

**Optional services:**
- [AgentMail](https://agentmail.to) -- Email delivery for automations
- [OpenAI API key](https://platform.openai.com) -- For Sherlock Brain reports and AI research
- [Make.com](https://make.com) -- For Google Calendar integration
- [Resend](https://resend.com) -- Alternative email delivery

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name (e.g., "clawbuddy") and set a database password
4. Select a region close to you
5. Wait for the project to be created

**Save these values** (Settings > API):
- **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
- **anon/public key** (starts with `eyJhbGci...`)
- **service_role key** (starts with `eyJhbGci...` -- keep this secret)
- **Project ref** (the `abcdefghijkl` part of your URL)

---

## Step 2: Set Up Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/clawbuddy-kit.git
cd clawbuddy-kit

# Create your environment file
cp .env.example .env

# Edit .env with your values
# At minimum, fill in:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   SUPABASE_ACCESS_TOKEN
#   CLAWBUDDY_API_URL (same as SUPABASE_URL)
#   CLAWBUDDY_WEBHOOK_SECRET (generate with: openssl rand -hex 32)
#   AI_TASKS_API_KEY (generate with: openssl rand -hex 32)
```

---

## Step 3: Deploy Database Schema

```bash
# Link Supabase CLI to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations (creates all tables, indexes, RLS policies)
supabase db push
```

This creates:
- `tasks`, `subtasks`, `assignees` -- Kanban board
- `ai_logs` -- Agent journal
- `ai_questions` -- Question/approval workflow
- `ai_insights` -- Analytics cards
- `ai_reports` -- HTML reports
- `ai_status` -- Agent presence
- `ai_agents` -- Multi-agent identities
- `automations`, `automation_executions` -- Scheduled workflows
- `ops_apps`, `ops_pages`, `ops_blocks`, `ops_data` -- OpsCenter
- `agent_learning_log` -- Self-improving brain
- `office_agents`, `office_tasks`, `offices` -- Animated office
- And more (51 migrations total)

---

## Step 4: Set Supabase Secrets

Edge functions need secrets to operate. Set them via the CLI or Dashboard:

```bash
# Required secrets
supabase secrets set CLAWBUDDY_WEBHOOK_SECRET=your-webhook-secret
supabase secrets set AI_TASKS_API_KEY=your-api-key

# Optional secrets (enable specific features)
supabase secrets set AGENTMAIL_API_KEY=your-agentmail-key     # Email delivery
supabase secrets set OPENAI_API_KEY=sk-your-openai-key        # Brain reports + research
supabase secrets set MAKE_API_TOKEN=your-make-token            # Calendar sync
```

---

## Step 5: Deploy Edge Functions

Deploy all edge functions to your Supabase project:

```bash
# Core API (required)
supabase functions deploy ai-tasks --no-verify-jwt

# Automation system (required for scheduled workflows)
supabase functions deploy automation-runner --no-verify-jwt

# Sherlock Brain (self-improving agent -- recommended)
supabase functions deploy sherlock-brain --no-verify-jwt

# Automation functions
supabase functions deploy morning-digest --no-verify-jwt
supabase functions deploy evening-report --no-verify-jwt
supabase functions deploy midday-prep --no-verify-jwt
supabase functions deploy competitor-intel --no-verify-jwt
supabase functions deploy intelligence-sync --no-verify-jwt

# Research & Calendar
supabase functions deploy browser-research --no-verify-jwt
supabase functions deploy calendar-sync --no-verify-jwt

# Goal analyzer (separate endpoint)
supabase functions deploy goal-analyzer --no-verify-jwt

# Report processor
supabase functions deploy report-webhook --no-verify-jwt

# Animated Office (optional)
supabase functions deploy list-offices --no-verify-jwt
supabase functions deploy manage-office-agent --no-verify-jwt
supabase functions deploy create-office-task --no-verify-jwt
supabase functions deploy office-agent-status --no-verify-jwt
supabase functions deploy reset-office --no-verify-jwt
supabase functions deploy upload-office-deliverable --no-verify-jwt
```

**Quick deploy all at once:**

```bash
for fn in ai-tasks automation-runner sherlock-brain morning-digest evening-report midday-prep competitor-intel intelligence-sync browser-research calendar-sync goal-analyzer report-webhook list-offices manage-office-agent create-office-task office-agent-status reset-office upload-office-deliverable; do
  supabase functions deploy $fn --no-verify-jwt
done
```

---

## Step 6: Create Your First User

Your agent needs a user record to assign tasks to. Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Create a user (replace with your name)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'your-email@example.com',
  '{"full_name": "Your Name"}'::jsonb
);

-- Verify
SELECT id, email, raw_user_meta_data->>'full_name' as name FROM auth.users;
```

Save the returned `user_id` -- your agent will reference it.

---

## Step 7: Register Your Webhook Secret

The webhook secret authenticates your agent's API requests. Store it in your Supabase project:

```sql
-- Run in SQL Editor
INSERT INTO vault.secrets (name, secret)
VALUES ('clawbuddy_webhook_secret', 'your-webhook-secret-here');
```

Or set it as a Supabase secret (already done in Step 4).

---

## Step 8: Connect Your Agent

### Claude Code

Copy the `CLAUDE.md` file to your project root:

```bash
cp CLAUDE.md /path/to/your/project/CLAUDE.md
```

Edit the connection section with your values:

```markdown
export CLAWBUDDY_API_URL="https://YOUR_PROJECT_REF.supabase.co"
export CLAWBUDDY_WEBHOOK_SECRET="your-webhook-secret-here"
```

Claude Code reads `CLAUDE.md` automatically and will:
1. Go online (update status to green)
2. Create tasks on the Kanban board
3. Log every step of its work
4. Push insights and reports when done

### OpenClaw / Custom Agents

Use the REST API directly:

```bash
# Test your connection
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"request_type": "status", "action": "update", "is_online": true, "status_message": "Agent online!", "agent_name": "MyAgent", "agent_emoji": "🤖"}'
```

Expected response:

```json
{"success": true, "data": {"agent_name": "MyAgent", "is_online": true}}
```

### Python Agents

```python
import requests, os

CLAWBUDDY_URL = os.environ.get("CLAWBUDDY_API_URL")
CLAWBUDDY_SECRET = os.environ.get("CLAWBUDDY_WEBHOOK_SECRET")

def clawbuddy(request_type, action, **kwargs):
    payload = {"request_type": request_type, "action": action, **kwargs}
    resp = requests.post(
        f"{CLAWBUDDY_URL}/functions/v1/ai-tasks",
        json=payload,
        headers={
            "x-webhook-secret": CLAWBUDDY_SECRET,
            "Content-Type": "application/json"
        }
    )
    return resp.json()

# Go online
clawbuddy("status", "update", is_online=True, status_message="Agent online!")

# Create a task
result = clawbuddy("task", "create", title="My first task", column="todo")
task_id = result["data"]["task_id"]

# Log progress
clawbuddy("log", "create", category="general", message="Starting work on first task.")

# Complete the task
clawbuddy("task", "update", task_id=task_id, column="done")
```

---

## Step 9: Set Up Automations (Optional)

Register automations to run on a schedule via pg_cron:

```sql
-- Example: Morning Digest at 4:30 AM PST daily
INSERT INTO public.automations (
  name, description, cron_expression, function_name,
  is_active, channels, user_id
) VALUES (
  'Morning Digest',
  'Daily morning briefing with priorities and calendar',
  '30 12 * * *',  -- 4:30 AM PST = 12:30 UTC
  'morning-digest',
  true,
  '[{"type": "dashboard"}]'::jsonb,
  'YOUR_USER_ID'
);
```

The `sync_automation_cron` trigger automatically creates the pg_cron job when you insert or update an automation record.

---

## Step 10: Verify Everything Works

Run through this checklist:

```bash
# 1. Status update
curl -X POST $CLAWBUDDY_API_URL/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_WEBHOOK_SECRET" \
  -d '{"request_type": "status", "action": "update", "is_online": true, "agent_name": "TestAgent", "agent_emoji": "🧪"}'

# 2. Create a task
curl -X POST $CLAWBUDDY_API_URL/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_WEBHOOK_SECRET" \
  -d '{"request_type": "task", "action": "create", "title": "Test task", "column": "todo"}'

# 3. Create a log entry
curl -X POST $CLAWBUDDY_API_URL/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_WEBHOOK_SECRET" \
  -d '{"request_type": "log", "action": "create", "category": "general", "message": "ClawBuddy is alive!"}'

# 4. Push an insight
curl -X POST $CLAWBUDDY_API_URL/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_WEBHOOK_SECRET" \
  -d '{"request_type": "insight", "action": "create", "insight_type": "summary", "title": "Setup Complete", "content": "ClawBuddy is fully operational."}'
```

If all 4 return `{"success": true, ...}` -- you're live.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Unauthorized` on API calls | Check your `x-webhook-secret` header matches the secret in Supabase |
| `Function not found` | Make sure you ran `supabase functions deploy` for that function |
| Migrations fail | Check you're linked to the right project: `supabase link --project-ref YOUR_REF` |
| Agent status shows "Ray" | Always pass `agent_name` and `agent_emoji` in status updates |
| Tasks don't appear on board | Make sure the user exists in `auth.users` and task has a valid `column` value |
| Automations not running | Check `is_active: true` and verify the cron job exists: `SELECT * FROM cron.job;` |

---

## Next Steps

- Read the [Integration Guide](docs/integration-guide.md) for the full API reference
- Explore [Capabilities](docs/capabilities.html) to see what ClawBuddy can do
- Set up the [Animated Office](docs/integration-guide.md#animated-office) for visual agent tracking
- Join the Agents in a Box community on Skool for tutorials and support
