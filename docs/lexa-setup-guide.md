# Lexa Setup Guide — AI Phone Employee

Your AI phone agent that handles inbound and outbound calls. This guide walks you through setting up Lexa from scratch.

**Time:** ~15 minutes
**Difficulty:** Intermediate (requires Millis AI account)

---

## What You'll Get

After setup, Lexa gives you:

- **Dashboard** — 6 real-time KPIs (calls, minutes, answer rate, cost)
- **Call Log** — Every call with transcript, sentiment, and cost breakdown
- **Campaign Manager** — Build and launch outbound calling campaigns
- **Lead Tracker** — Upload contacts and track call outcomes per lead
- **Transcripts** — Full conversation history with speaker labels
- **Analytics** — Trends, duration patterns, cost analysis over time

---

## Prerequisites Checklist

- [ ] ClawBuddy Kit running (completed SETUP.md)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project linked (`supabase link`)
- [ ] Millis AI account — [Sign up at millis.ai](https://millis.ai)
- [ ] Millis AI API key (from your Millis dashboard)
- [ ] Phone number provisioned in Millis

---

## Step 1: Create Your Millis AI Agent

Before setting up Lexa in ClawBuddy, you need a voice agent in Millis:

1. Log into [millis.ai](https://millis.ai)
2. Go to **Agents** → **Create Agent**
3. Give it a name (e.g., "Lexa - Sales Rep")
4. Write a system prompt describing how your agent should handle calls
5. Choose a voice (Millis offers several)
6. Save and note the **Agent ID** (looks like `-OmNNf485Na8Bw82RSfz`)
7. Go to **Settings** → **API Keys** and copy your API key

---

## Step 2: Run Database Migrations

From your project directory:

```bash
supabase db push
```

This creates 4 tables:
- `lexa_calls` — Every call record with full metadata
- `lexa_campaigns` — Outbound campaign configurations
- `lexa_leads` — Contact lists for campaigns
- `lexa_daily_metrics` — Pre-aggregated stats for dashboard charts

**What to expect:** You should see the migrations applied without errors. If you get a conflict, the tables may already exist from a previous setup.

---

## Step 3: Deploy Edge Functions

```bash
supabase functions deploy lexa-webhook --no-verify-jwt
supabase functions deploy lexa-campaign-runner --no-verify-jwt
supabase functions deploy lexa-precall --no-verify-jwt
supabase functions deploy millis-proxy --no-verify-jwt
```

**What each function does:**
- `lexa-webhook` — Receives call data after every call ends
- `lexa-campaign-runner` — Dials through your lead lists in batches
- `lexa-precall` — Validates lead data before campaigns launch
- `millis-proxy` — Bridges your dashboard to the Millis AI API

---

## Step 4: Set Secrets

```bash
supabase secrets set MILLIS_API_KEY=your-api-key-here
supabase secrets set MILLIS_AGENT_ID=your-agent-id-here
```

Replace with the values from Step 1.

---

## Step 5: Configure the Millis Webhook

This is how Millis tells Lexa about completed calls:

1. In your Millis AI dashboard → Agent Settings → **Webhooks**
2. Add a new webhook URL:
   ```
   https://YOUR-SUPABASE-URL.supabase.co/functions/v1/lexa-webhook
   ```
3. Replace `YOUR-SUPABASE-URL` with your actual Supabase project URL

**What to expect:** After this, every call (inbound or outbound) will automatically appear in your ClawBuddy dashboard.

---

## Step 6: Create the OpsCenter App

You can do this two ways:

### Option A: Let Claude Do It (Recommended)

Tell Claude Code:
> "Read the Lexa module doc at `modules/lexa-voice-ai.md` and set up the Lexa OpsCenter app."

Claude will create the app, 6 pages, and 6 blocks automatically.

### Option B: Manual API Calls

Use the ClawBuddy API to create the app structure. See `modules/lexa-voice-ai.md` for the exact JSON payloads.

---

## Step 7: Test Your First Call

1. Open ClawBuddy → OpsCenter → **Lexa**
2. You should see the Dashboard with all KPIs at zero
3. Call your Millis phone number from any phone
4. Talk for 30 seconds, then hang up
5. Within 10 seconds, the call should appear in:
   - Dashboard → Recent Activity feed
   - Call Log → Full table entry
   - Dashboard → KPIs update (1 call, duration, cost)

If the call doesn't appear, check edge function logs:
```bash
supabase functions logs lexa-webhook
```

---

## Step 8: Launch Your First Campaign (Optional)

1. Go to **Campaigns** tab → **New Campaign**
2. Name it and write an AI prompt for the call
3. Go to **Leads** tab → Upload your contact list (CSV or manual entry)
4. Back in Campaigns → Select your campaign → **Launch**
5. Lexa will dial through the list in batches of 50

---

## FAQ

**How much does each call cost?**
Costs depend on your Millis AI plan. Each call's cost is broken down: STT (speech-to-text), TTS (text-to-speech), LLM (AI processing), and Millis platform credits. Typical calls run $0.05-0.15.

**Can Lexa handle multiple calls at once?**
Yes — Millis AI handles concurrent calls. Each call gets its own session and webhook callback.

**How does sentiment analysis work?**
The webhook function analyzes the transcript for positive/negative keywords and assigns a sentiment score. It's not perfect but catches the general tone.

**Can I change the AI prompt per campaign?**
Yes — each campaign has its own `ai_prompt` field. You can customize what Lexa says for different audiences.

**What happens if Millis credits run out?**
The dashboard status bar turns red when credits drop below 100. Outbound calls will fail until you top up.
