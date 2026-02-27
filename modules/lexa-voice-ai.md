# Lexa — AI Phone Employee · ClawBuddy Module

## What This Module Does

Voice AI phone agent powered by Millis AI. Lexa answers inbound calls, runs outbound campaigns to lead lists, captures full transcripts with sentiment analysis, and tracks costs per call. Everything surfaces on a 6-view OpsCenter dashboard with real-time updates.

## Prerequisites

- ClawBuddy instance running (SETUP.md complete)
- Millis AI account (https://millis.ai) with API key
- Phone number provisioned through Millis AI
- Supabase CLI installed and linked to your project

---

## Setup Instructions

### Step 1: Run Migrations

These migrations create Lexa's 4 database tables + register 6 OpsCenter block types.

```bash
# From your cosmic-flow-51 (or clawbuddy-kit) directory:
supabase db push
```

Migration files (run in order):
- `supabase/migrations/20260227000000_lexa_voice_platform.sql` — Creates `lexa_calls`, `lexa_campaigns`, `lexa_leads`, `lexa_daily_metrics` tables
- `supabase/migrations/20260227100000_lexa_opscenter_blocks.sql` — Registers block types: `lexa_dashboard`, `lexa_call_log`, `lexa_analytics`, `lexa_transcripts`, `lexa_campaigns`, `lexa_leads`
- `supabase/migrations/20260228000000_lexa_campaign_builder.sql` — Adds campaign builder columns and indexes

### Step 2: Deploy Edge Functions

```bash
supabase functions deploy lexa-webhook --no-verify-jwt
supabase functions deploy lexa-campaign-runner --no-verify-jwt
supabase functions deploy lexa-precall --no-verify-jwt
supabase functions deploy millis-proxy --no-verify-jwt
```

### Step 3: Set Secrets

```bash
supabase secrets set MILLIS_API_KEY=your-millis-api-key
supabase secrets set MILLIS_AGENT_ID=your-millis-agent-id
```

The `MILLIS_AGENT_ID` is the ID of your Millis AI voice agent — you create this in the Millis dashboard.

### Step 4: Create the OpsCenter App

```json
{
  "request_type": "ops",
  "action": "create_app",
  "name": "Lexa",
  "description": "AI Phone Employee — voice calls, campaigns, and analytics",
  "icon": "phone"
}
```

Save the returned `app_id`.

### Step 5: Create Pages (6)

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Dashboard", "sort_order": 1}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Call Log", "sort_order": 2}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Leads", "sort_order": 3}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Campaigns", "sort_order": 4}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Transcripts", "sort_order": 5}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Analytics", "sort_order": 6}
```

Save each `page_id`.

### Step 6: Create Blocks (6)

```json
{"request_type": "ops", "action": "create_block", "page_id": "<dashboard_page_id>", "name": "Command Center", "block_type": "lexa_dashboard", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<call_log_page_id>", "name": "Call Log", "block_type": "lexa_call_log", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<leads_page_id>", "name": "Lead Manager", "block_type": "lexa_leads", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<campaigns_page_id>", "name": "Campaigns", "block_type": "lexa_campaigns", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<transcripts_page_id>", "name": "Transcripts", "block_type": "lexa_transcripts", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<analytics_page_id>", "name": "Analytics", "block_type": "lexa_analytics", "config": {}}
```

### Step 7: Configure Millis AI Webhook

In your Millis AI dashboard:

1. Go to your agent settings → Webhooks
2. Set the webhook URL to:
   ```
   https://<your-supabase-url>/functions/v1/lexa-webhook
   ```
3. Millis will POST call data to this endpoint after every call ends

---

## Block Reference

| Block Type | Page | What It Shows |
|-----------|------|---------------|
| `lexa_dashboard` | Dashboard | 6 KPIs, call volume chart, outcomes pie, activity feed, cost analysis, status bar |
| `lexa_call_log` | Call Log | Filterable table of all calls with status, duration, sentiment, cost |
| `lexa_leads` | Leads | Lead list manager with status tracking per contact |
| `lexa_campaigns` | Campaigns | Campaign builder, progress tracking, batch calling controls |
| `lexa_transcripts` | Transcripts | Full call transcripts with speaker labels and sentiment |
| `lexa_analytics` | Analytics | Trend charts: duration, answer rate, cost over time |

---

## Data Schema

### Call Record (`lexa_calls`)

```json
{
  "session_id": "sess_abc123",
  "agent_id": "-OmNNf485Na8Bw82RSfz",
  "call_status": "user-ended",
  "duration_seconds": 142,
  "transcript": [
    {"role": "assistant", "content": "Hi, this is Lexa from Vertical Systems..."},
    {"role": "user", "content": "Yes, I'm interested in learning more..."}
  ],
  "cost_breakdown": {"stt": 0.02, "tts": 0.03, "llm": 0.05, "millis": 0.01},
  "total_cost": 0.11,
  "call_metrics": {"utterance_latency": {"avg": 450}},
  "caller_number": "+14155551234",
  "callee_number": "+17787439520",
  "sentiment": "positive",
  "call_type": "inbound",
  "summary": "Prospect interested in enterprise plan. Wants demo next week.",
  "action_items": ["Schedule demo for Thursday", "Send pricing PDF"]
}
```

### Campaign Record (`lexa_campaigns`)

```json
{
  "name": "Q1 Outreach",
  "status": "running",
  "total_records": 150,
  "calls_made": 47,
  "calls_answered": 31,
  "calls_voicemail": 12,
  "calls_failed": 4,
  "avg_duration_seconds": 95,
  "total_cost": 4.82,
  "from_phone": "+17787439520",
  "agent_id": "-OmNNf485Na8Bw82RSfz",
  "ai_prompt": "You are Lexa calling on behalf of Vertical Systems...",
  "call_delay_seconds": 30,
  "max_retries": 2
}
```

### Lead Record (`lexa_leads`)

```json
{
  "campaign_id": "<campaign_uuid>",
  "name": "Jane Smith",
  "phone": "+14155559876",
  "email": "jane@acme.com",
  "company": "Acme Corp",
  "custom_fields": {"role": "VP Engineering", "source": "LinkedIn"},
  "status": "completed",
  "call_session_id": "sess_abc123",
  "call_result": "answered",
  "call_duration_seconds": 142,
  "call_sentiment": "positive",
  "call_summary": "Interested in demo. Will follow up Thursday.",
  "attempts": 1
}
```

---

## Edge Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `lexa-webhook` | POST | Receives call completion data from Millis AI. Parses transcript, calculates cost, upserts `lexa_calls`, updates `lexa_daily_metrics`. |
| `lexa-campaign-runner` | POST | Batch-dials lead lists. Fetches 50 pending leads, calls Millis `/start_outbound_call` for each, updates lead statuses. |
| `lexa-precall` | POST | Pre-call validation. Checks phone formats, deduplicates, flags invalid entries before campaign launch. |
| `millis-proxy` | POST | API bridge to Millis AI. Creates/manages agents, checks credit balance, provisions phone numbers. |

---

## Troubleshooting

**Calls aren't showing up on the dashboard:**
- Check that the Millis webhook URL points to your Supabase project (not someone else's)
- Verify `lexa-webhook` is deployed: `supabase functions list`
- Check edge function logs: `supabase functions logs lexa-webhook`

**Campaign not dialing:**
- Ensure `MILLIS_API_KEY` and `MILLIS_AGENT_ID` are set in secrets
- Check Millis credit balance (needs > 0)
- Verify leads have valid phone numbers (E.164 format: +1XXXXXXXXXX)

**Cost showing as $0:**
- Millis may not return cost_breakdown for very short calls
- Check if `call_metrics` is populated in the `lexa_calls` record

**Real-time updates not working:**
- The migration adds `lexa_calls` to `supabase_realtime` publication
- Verify in Supabase dashboard: Database → Publications → supabase_realtime → lexa_calls should be listed
