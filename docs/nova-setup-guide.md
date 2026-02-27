# Nova Setup Guide — AI Email Employee

Your AI email agent that sends personalized sequences and tracks engagement. This guide walks you through setting up Nova from scratch.

**Time:** ~15 minutes
**Difficulty:** Intermediate (requires Resend account + domain verification)

---

## What You'll Get

After setup, Nova gives you:

- **Dashboard** — 6 KPIs (sent, open rate, reply rate, meetings, bounces, queue)
- **Outbox** — Every email with status tracking and engagement timeline
- **Template Library** — Email templates with {{variable}} personalization
- **Sequence Builder** — Multi-step follow-up flows with delays and conditions
- **Campaign Manager** — Send limits, time windows, progress tracking
- **Analytics** — Engagement funnels, volume trends, template performance

---

## Prerequisites Checklist

- [ ] ClawBuddy Kit running (completed SETUP.md)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project linked (`supabase link`)
- [ ] Resend account — [Sign up at resend.com](https://resend.com)
- [ ] Resend API key (from your Resend dashboard)
- [ ] A domain you own (for verified sending)

---

## Step 1: Set Up Resend

1. Log into [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key**
3. Name it (e.g., "Nova - ClawBuddy") and copy the key
4. Go to **Domains** → **Add Domain**
5. Enter your domain (e.g., `yourdomain.com`)
6. Resend will show you 3 DNS records to add:

| Type | Name | Value |
|------|------|-------|
| TXT | (SPF record) | `v=spf1 include:...` |
| CNAME | (DKIM record) | `resend._domainkey...` |
| TXT | (DMARC record) | `v=DMARC1; p=none...` |

7. Add these records in your domain's DNS settings (Cloudflare, Namecheap, GoDaddy, etc.)
8. Back in Resend → Click **Verify** → Wait 5-30 minutes for propagation

**Why this matters:** Without domain verification, your emails will bounce or land in spam. This is the most important step.

---

## Step 2: Run Database Migration

From your project directory:

```bash
supabase db push
```

This creates 5 tables:
- `nova_templates` — Email template library with performance stats
- `nova_sequences` — Multi-step email flows with delays and conditions
- `nova_campaigns` — Campaign configs with send limits and scheduling
- `nova_emails` — Every individual email with full lifecycle tracking
- `nova_daily_metrics` — Pre-aggregated daily stats for charts

---

## Step 3: Deploy Edge Functions

```bash
supabase functions deploy report-webhook --no-verify-jwt
```

The `report-webhook` function handles incoming Resend events (opens, clicks, bounces). It's shared across ClawBuddy — if you've already deployed it, you're set.

---

## Step 4: Set Secrets

```bash
supabase secrets set RESEND_API_KEY=re_your-api-key-here
```

---

## Step 5: Create the OpsCenter App

### Option A: Let Claude Do It (Recommended)

Tell Claude Code:
> "Read the Nova module doc at `modules/nova-email-ai.md` and set up the Nova OpsCenter app."

Claude will create the app, 6 pages, and 6 blocks automatically.

### Option B: Manual API Calls

Use the ClawBuddy API to create the app structure. See `modules/nova-email-ai.md` for the exact JSON payloads.

---

## Step 6: Configure Resend Webhook (Optional but Recommended)

This lets Nova track opens, clicks, and bounces in real-time:

1. In Resend dashboard → **Webhooks** → **Add Webhook**
2. Set the URL:
   ```
   https://YOUR-SUPABASE-URL.supabase.co/functions/v1/report-webhook?endpoint=nova-events
   ```
3. Select these events:
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
4. Save

**What to expect:** Now when someone opens your email or clicks a link, Nova's dashboard updates automatically.

---

## Step 7: Create Your First Template

1. Open ClawBuddy → OpsCenter → **Nova** → **Templates**
2. Click **Create Template**
3. Fill in:
   - **Name:** "Cold Outreach v1"
   - **Subject:** `Quick question about {{company}}`
   - **Body:** Write your email using `{{name}}`, `{{company}}`, `{{role}}` placeholders
4. The editor shows variable pills and a live preview
5. Save

**Pro tip:** Start with a simple 3-line email. Short emails get higher reply rates than long ones.

---

## Step 8: Build a Sequence (Optional)

Sequences automate follow-ups:

1. Go to **Sequences** → **Create Sequence**
2. Add steps:
   - **Step 1:** Your intro template (Day 0)
   - **Step 2:** Follow-up template (Day 3, condition: no reply)
   - **Step 3:** Breakup template (Day 7, condition: no reply)
3. Save

Nova will automatically send follow-ups to leads who don't reply, waiting the specified number of days between each step.

---

## Step 9: Send a Test Email

Before launching a campaign, send a test:

1. Go to **Outbox** → The template preview should work
2. Or create a small campaign with 1 lead (your own email)
3. Check that the email arrives, opens tracking works, and the dashboard updates

---

## FAQ

**How many emails can I send per day?**
Default is 50/day per campaign (configurable). New sending domains should start low and warm up over 2-4 weeks. Resend's free tier allows 100 emails/day total.

**Why are my emails going to spam?**
Three main causes: (1) DNS records not fully verified, (2) sending too many emails too fast from a new domain, (3) spam trigger words in subject/body. Start with 10-20 emails/day and gradually increase.

**What's the difference between templates and sequences?**
A **template** is a single email. A **sequence** chains multiple templates together with delays and conditions (like "send step 2 after 3 days if no reply").

**How does meeting detection work?**
When a recipient replies and the reply contains calendar-related keywords or links, Nova flags `meeting_booked: true` on that email record.

**Can I personalize beyond name and company?**
Yes — any `{{variable}}` in your template gets matched against the lead's data. Add custom fields to your leads (role, industry, pain point, etc.) and reference them as `{{role}}`, `{{industry}}`, etc.

**What happens when someone bounces?**
Hard bounces (invalid address) are flagged immediately. Soft bounces (temporary issue) may retry. Both show in the Outbox with bounce details. High bounce rates (>5%) will damage your sender reputation — clean your lists.

**Can I pause a running campaign?**
Yes — update the campaign status to "paused" from the Campaign Manager. Resume anytime. Emails already queued will still send, but no new emails get queued.
