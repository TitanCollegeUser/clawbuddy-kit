# Module: Supercharge Claude Code

> **Agent Instruction Doc** — Give this file to Claude Code or any OpenClaw agent.
> The agent reads these instructions and sets up the systems.

---

## Overview

This module extends ClawBuddy with:
1. A Telegram bot for mobile agent commands
2. AI-powered web research stored in OpsCenter
3. 5 scheduled automations running server-side
4. Google Calendar sync via Make.com
5. Session management patterns for persistent context

**Prerequisite:** ClawBuddy must be deployed and working.

---

## Step 1: Telegram Bot Setup

### Create the Bot
1. User must create a Telegram bot via @BotFather and provide:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

### Deploy the Bot
```bash
cd telegram-bot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Required Environment Variables
```
TELEGRAM_BOT_TOKEN=<from BotFather>
TELEGRAM_CHAT_ID=<user's chat ID>
CLAWBUDDY_API_URL=<supabase URL>
CLAWBUDDY_WEBHOOK_SECRET=<webhook secret>
OPENAI_API_KEY=<optional, for AI features>
DEEPGRAM_API_KEY=<optional, for voice transcription>
```

### Auto-Start (macOS)
Copy the launchd plist to `~/Library/LaunchAgents/` and load it. The bot restarts automatically on login.

---

## Step 2: Research Hub Setup

### Create Research Hub App in OpsCenter

```json
{"request_type": "ops", "action": "create_app", "name": "Research Hub", "description": "AI-powered web research results"}
```
Save the returned `app_id`.

### Create Pages

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Dashboard", "sort_order": 0}
```

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Results", "sort_order": 1}
```

### Create Blocks

**AI Config Block** (stores AI model configuration):
```json
{"request_type": "ops", "action": "create_block", "page_id": "<dashboard_page_id>", "block_type": "config", "title": "AI Configuration", "config": {"editable": true}}
```

**Research Results Feed** (stores research findings):
```json
{"request_type": "ops", "action": "create_block", "page_id": "<results_page_id>", "block_type": "feed", "title": "Research Results", "config": {"filterable": true, "searchable": true}}
```

### Seed AI Config

⚠️ **CRITICAL:** Include `app_id` explicitly — `add_data` requires it.

```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<ai_config_block_id>",
  "item_type": "config",
  "data": {
    "type": "ai_config",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "api_key": "sk-user-provides-this"
  }
}
```

---

## Step 3: Register Automations

Create 5 automation records. The `sync_automation_cron` trigger auto-creates pg_cron jobs.

### Morning Digest
```sql
INSERT INTO public.automations (name, description, cron_expression, function_name, is_active, channels, user_id)
VALUES ('Morning Digest', 'Daily morning briefing', '30 12 * * *', 'morning-digest', true, '[{"type":"dashboard"},{"type":"telegram"}]'::jsonb, '<user_id>');
```

### Midday Prep
```sql
INSERT INTO public.automations (name, description, cron_expression, function_name, is_active, channels, user_id)
VALUES ('Midday Prep', 'Calendar scan and meeting prep', '0 19 * * *', 'midday-prep', true, '[{"type":"dashboard"},{"type":"telegram"}]'::jsonb, '<user_id>');
```

### Competitor Intel
```sql
INSERT INTO public.automations (name, description, cron_expression, function_name, is_active, channels, user_id)
VALUES ('Competitor Intel', 'Competitor activity sweep', '0 22 * * *', 'competitor-intel', true, '[{"type":"dashboard"}]'::jsonb, '<user_id>');
```

### Meeting Intelligence
```sql
INSERT INTO public.automations (name, description, cron_expression, function_name, is_active, channels, user_id)
VALUES ('Meeting Intelligence', 'Process meeting transcripts', '0 23 * * *', 'intelligence-sync', true, '[{"type":"dashboard"}]'::jsonb, '<user_id>');
```

### Evening Report
```sql
INSERT INTO public.automations (name, description, cron_expression, function_name, is_active, channels, user_id)
VALUES ('Evening Report', 'End-of-day summary', '0 4 * * *', 'evening-report', true, '[{"type":"dashboard"},{"type":"telegram"}]'::jsonb, '<user_id>');
```

**Verify:** `SELECT jobname, schedule FROM cron.job;` should show 5 jobs.

**Note:** Cron expressions are UTC. User must convert their preferred local times.

---

## Step 4: Google Calendar Sync

This requires Make.com (external service). The agent should guide the user through:

1. Create a Make.com account (free tier)
2. Create a scenario with:
   - **Trigger:** Google Calendar → Watch Events (every 15 min)
   - **Action:** HTTP → POST to `{CLAWBUDDY_API_URL}/functions/v1/calendar-sync`
   - **Headers:** `x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}`
   - **Body:** Map event fields (title, start, end, attendees, description)
3. Activate the scenario

The `calendar-sync` edge function stores events in OpsCenter. The Midday Prep automation reads them for meeting prep briefs.

---

## Step 5: Session Management

### Create STATUS.md
In the user's project root:
```markdown
# STATUS.md
## Last Updated: <date>

## What Was Done
- <completed items>

## What's Next
- <pending items>

## Active Issues
- None
```

### Session Rules
- Run `/compact` every 30 minutes or after each major task
- Before every compact: update STATUS.md
- At session start: read MEMORY.md (auto-loaded) + STATUS.md
- Never read more than one large file (500+ lines) at a time
- Keep bash commands simple (avoid complex piping in zsh)

---

## Verification Checklist

After setup, verify:
- [ ] Telegram bot responds to messages
- [ ] Dashboard status ring updates when bot is active
- [ ] 5 cron jobs exist in `cron.job` table
- [ ] Research Hub app exists in OpsCenter with AI config
- [ ] Calendar events sync from Google Calendar (within 15 min)
- [ ] STATUS.md and MEMORY.md exist in project root

---

## API Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| Research | `/functions/v1/browser-research` | POST |
| Calendar sync | `/functions/v1/calendar-sync` | POST |
| All automations | Triggered by pg_cron → edge functions | Auto |
| Agent status | `/functions/v1/ai-tasks` | POST |

All endpoints use the same `x-webhook-secret` header for auth.
