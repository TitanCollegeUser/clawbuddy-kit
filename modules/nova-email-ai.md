# Nova — AI Email Employee · ClawBuddy Module

## What This Module Does

Email AI agent powered by Resend. Nova sends personalized email sequences to lead lists, tracks every open, click, and reply, detects when meetings are booked, and gives you full engagement analytics. Templates support {{variable}} placeholders for per-lead personalization. Multi-step sequences handle the follow-up cadence automatically.

## Prerequisites

- ClawBuddy instance running (SETUP.md complete)
- Resend account (https://resend.com) with API key
- Verified sending domain (DNS records added in Resend dashboard)
- Supabase CLI installed and linked to your project

---

## Setup Instructions

### Step 1: Run Migration

This migration creates Nova's 5 database tables + registers 6 OpsCenter block types.

```bash
# From your cosmic-flow-51 (or clawbuddy-kit) directory:
supabase db push
```

Migration file:
- `supabase/migrations/20260228100000_nova_email_employee.sql` — Creates `nova_templates`, `nova_sequences`, `nova_campaigns`, `nova_emails`, `nova_daily_metrics` tables + registers block types

### Step 2: Deploy Edge Functions

Nova uses the report-webhook for inbound Resend events (already deployed if you set up ClawBuddy). If you have a dedicated Nova sender function:

```bash
supabase functions deploy report-webhook --no-verify-jwt
```

### Step 3: Set Secrets

```bash
supabase secrets set RESEND_API_KEY=re_your-resend-api-key
```

### Step 4: Verify Sending Domain

In the Resend dashboard:

1. Go to Domains → Add Domain
2. Add your sending domain (e.g., `yourdomain.com`)
3. Add the DNS records Resend provides (SPF, DKIM, DMARC)
4. Wait for verification (usually 5-30 minutes)

Your emails will send from an address like `nova@yourdomain.com`.

### Step 5: Create the OpsCenter App

```json
{
  "request_type": "ops",
  "action": "create_app",
  "name": "Nova",
  "description": "AI Email Employee — sequences, templates, and engagement analytics",
  "icon": "mail"
}
```

Save the returned `app_id`.

### Step 6: Create Pages (6)

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Dashboard", "sort_order": 1}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Outbox", "sort_order": 2}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Templates", "sort_order": 3}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Sequences", "sort_order": 4}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Campaigns", "sort_order": 5}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Analytics", "sort_order": 6}
```

Save each `page_id`.

### Step 7: Create Blocks (6)

```json
{"request_type": "ops", "action": "create_block", "page_id": "<dashboard_page_id>", "name": "Command Center", "block_type": "nova_dashboard", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<outbox_page_id>", "name": "Outbox", "block_type": "nova_outbox", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<templates_page_id>", "name": "Templates", "block_type": "nova_templates", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<sequences_page_id>", "name": "Sequences", "block_type": "nova_sequences", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<campaigns_page_id>", "name": "Campaigns", "block_type": "nova_campaigns", "config": {}}
```
```json
{"request_type": "ops", "action": "create_block", "page_id": "<analytics_page_id>", "name": "Analytics", "block_type": "nova_analytics", "config": {}}
```

### Step 8: Configure Resend Webhook (Optional)

To receive real-time email events (opens, clicks, bounces):

1. In Resend dashboard → Webhooks → Add Webhook
2. Set URL to your report-webhook with a Nova endpoint:
   ```
   https://<your-supabase-url>/functions/v1/report-webhook?endpoint=nova-events
   ```
3. Select events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

---

## Block Reference

| Block Type | Page | What It Shows |
|-----------|------|---------------|
| `nova_dashboard` | Dashboard | 6 KPIs, email volume chart, engagement funnel, activity feed, top performers, peak hours |
| `nova_outbox` | Outbox | Paginated email table with 8 status filters, search, email detail sheet |
| `nova_templates` | Templates | Template library with editor, {{variable}} pills, live preview, performance stats |
| `nova_sequences` | Sequences | Sequence builder with multi-step flow, delays, conditions, enrollment stats |
| `nova_campaigns` | Campaigns | Campaign cards with progress, 3-step wizard, pause/resume, linked emails |
| `nova_analytics` | Analytics | Period selector, 8 KPIs, volume trends, engagement charts, template performance |

---

## Data Schema

### Template Record (`nova_templates`)

```json
{
  "name": "Cold Outreach v2",
  "subject": "Quick question about {{company}}",
  "body_html": "<p>Hi {{name}},</p><p>I noticed {{company}} is scaling their AI operations...</p>",
  "body_text": "Hi {{name}}, I noticed {{company}} is scaling their AI operations...",
  "variables": ["name", "company", "role"],
  "category": "outreach",
  "tags": ["cold", "ai", "enterprise"],
  "usage_count": 47,
  "avg_open_rate": 0.42,
  "avg_reply_rate": 0.12,
  "is_active": true
}
```

### Sequence Record (`nova_sequences`)

```json
{
  "name": "3-Touch Enterprise Outreach",
  "description": "Initial contact → follow-up → breakup email",
  "status": "active",
  "steps": [
    {"step": 1, "template_id": "<template_uuid>", "delay_days": 0, "condition": "none"},
    {"step": 2, "template_id": "<followup_template_uuid>", "delay_days": 3, "condition": "no_reply"},
    {"step": 3, "template_id": "<breakup_template_uuid>", "delay_days": 7, "condition": "no_reply"}
  ],
  "total_enrolled": 150,
  "active_count": 89,
  "completed_count": 45,
  "stopped_count": 16
}
```

### Campaign Record (`nova_campaigns`)

```json
{
  "name": "Q1 Enterprise Push",
  "status": "active",
  "sequence_id": "<sequence_uuid>",
  "template_id": "<template_uuid>",
  "from_address": "nova@yourdomain.com",
  "total_leads": 200,
  "emails_sent": 147,
  "emails_delivered": 142,
  "emails_opened": 63,
  "emails_clicked": 28,
  "emails_replied": 17,
  "emails_bounced": 5,
  "meetings_booked": 4,
  "open_rate": 0.44,
  "click_rate": 0.20,
  "reply_rate": 0.12,
  "send_limit_per_day": 50,
  "send_window_start": "09:00",
  "send_window_end": "17:00",
  "timezone": "America/Vancouver"
}
```

### Email Record (`nova_emails`)

```json
{
  "resend_id": "re_abc123xyz",
  "campaign_id": "<campaign_uuid>",
  "template_id": "<template_uuid>",
  "from_address": "nova@yourdomain.com",
  "to_address": "jane@acme.com",
  "to_name": "Jane Smith",
  "subject": "Quick question about Acme Corp",
  "personalization_fields": {"name": "Jane", "company": "Acme Corp", "role": "VP Engineering"},
  "status": "opened",
  "sent_at": "2026-02-25T10:15:00Z",
  "delivered_at": "2026-02-25T10:15:02Z",
  "first_open_at": "2026-02-25T14:32:00Z",
  "open_count": 3,
  "clicked_at": null,
  "click_count": 0,
  "replied_at": null,
  "meeting_booked": false
}
```

---

## Template Variables

Nova templates support `{{variable}}` syntax. Variables are:

1. **Defined in the template** — Listed in the `variables` array when you create a template
2. **Extracted automatically** — The frontend regex-extracts `{{word}}` patterns from subject + body
3. **Filled per-lead at send time** — Each lead's data populates the placeholders

Common variables:
- `{{name}}` — Recipient's first name
- `{{company}}` — Company name
- `{{role}}` — Job title
- `{{custom_field}}` — Any field from the lead's `custom_fields` JSONB

**Example:** Template subject `"Quick question about {{company}}"` + lead with `company: "Acme Corp"` → Sent email subject: `"Quick question about Acme Corp"`

---

## Email Lifecycle Statuses

| Status | Meaning |
|--------|---------|
| `queued` | Scheduled, waiting to send |
| `sending` | Being sent via Resend API |
| `delivered` | Successfully delivered to inbox |
| `opened` | Recipient opened the email |
| `clicked` | Recipient clicked a link |
| `replied` | Recipient replied (snippet captured) |
| `bounced` | Delivery failed (hard or soft bounce) |
| `failed` | Send error (API failure, invalid address) |

Each status transition is timestamped. An email can progress through multiple statuses (delivered → opened → clicked → replied).

---

## Troubleshooting

**Emails not sending:**
- Verify `RESEND_API_KEY` is set in Supabase secrets
- Check that your sending domain is verified in Resend
- Look at edge function logs for API errors

**Emails going to spam:**
- Ensure SPF, DKIM, and DMARC DNS records are all verified
- Keep daily send volume under 50 for new domains (warm up gradually)
- Avoid spam trigger words in subject lines

**Open tracking not working:**
- Resend tracks opens via a tracking pixel — some email clients block images by default
- Open counts will be lower than actual opens due to image blocking
- This is an industry-wide limitation, not a Nova issue

**Bounces increasing:**
- Check the `bounce_type` field: hard bounces = invalid address, soft bounces = temporary issue
- Remove hard-bounced addresses from future campaigns
- High bounce rates (>5%) damage sender reputation

**Real-time updates not working:**
- The migration adds `nova_emails` to `supabase_realtime` publication
- Verify in Supabase dashboard: Database → Publications → supabase_realtime → nova_emails should be listed
