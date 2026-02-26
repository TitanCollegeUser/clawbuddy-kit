# AI Employees -- ClawBuddy Module

## What This Module Does

Turn sub-agents into full AI Employees with a dedicated OpsCenter dashboard. Each AI Employee gets a lead database, campaign builder with 3 personalization levels, and analytics dashboard — everything an SDR, marketer, or outreach agent needs to operate autonomously.

## Prerequisites

- ClawBuddy instance running (SETUP.md complete)
- At least one sub-agent created (the AI Employee identity)
- Optional: Email sending service (Resend, SendGrid, etc.) for live campaigns

---

## Concepts

### What's an AI Employee?

An AI Employee is a **sub-agent with a dedicated OpsCenter app**. Under the hood:

1. **Identity** = Sub-agent record (`subagent.create`) — gives the employee a name, role, and persona
2. **Workspace** = OpsCenter app — the dashboard they operate through
3. **Animated presence** = Office character (`manage-office-agent`) — visual representation in the 2D office

Your OpenClaw agent (Ray) or Claude Code (Sherlock) creates AI Employees the same way they create sub-agents, then provisions the workspace using the steps below.

### Creating the Employee Identity

Before building the workspace, create the sub-agent:

```json
{
  "request_type": "subagent",
  "action": "create",
  "name": "Jason",
  "model": "gpt-4o-mini",
  "system_prompt": "You are Jason, an AI SDR. You write personalized cold emails, manage leads, and book meetings.",
  "token_budget": 100000
}
```

Save the returned `sub_agent_id`. Then add them to the animated office:

```json
// POST to manage-office-agent
{
  "action": "create",
  "name": "Jason",
  "role": "AI SDR",
  "status": "idle"
}
```

Now Jason exists as an identity. The steps below build his workspace.

---

## Setup Instructions

### Step 1: Create the App

```json
{
  "request_type": "ops",
  "action": "create_app",
  "name": "Jason",
  "description": "AI SDR — cold email outreach, lead management, campaign tracking",
  "icon": "mail"
}
```

Save the returned `app_id`.

### Step 2: Create Pages

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Dashboard", "title": "Dashboard", "sort_order": 1}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Leads", "title": "Lead List", "sort_order": 2}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Campaigns", "title": "Campaigns", "sort_order": 3}
```

Save each `page_id`.

### Step 3: Create Blocks

**Dashboard page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<dashboard_page_id>", "title": "Performance Metrics", "block_type": "employee_analytics", "config": {}}
```

**Leads page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<leads_page_id>", "title": "Lead Database", "block_type": "employee_lead_table", "config": {}}
```

**Campaigns page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<campaigns_page_id>", "title": "Campaign Builder", "block_type": "employee_campaign_creator", "config": {}}
```

Save each `block_id`.

### Step 4: Seed Analytics Overview

Create one analytics overview record. Your agent updates this as campaigns run.

```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<analytics_block_id>",
  "item_type": "analytics",
  "data": {
    "type": "overview",
    "kpis": {
      "total_leads": 0,
      "emails_sent": 0,
      "open_rate": 0,
      "reply_rate": 0,
      "meetings_booked": 0,
      "conversion_rate": 0
    },
    "daily_metrics": [],
    "funnel": {
      "sent": 0,
      "opened": 0,
      "replied": 0,
      "meetings": 0,
      "converted": 0
    },
    "campaign_performance": [],
    "hourly_heatmap": [],
    "last_updated": "2026-01-01T00:00:00Z"
  }
}
```

### Step 5: Seed Sample Leads (Optional)

Add a few leads to verify the workspace:

```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<lead_table_block_id>",
  "item_type": "lead",
  "title": "Sarah Chen",
  "status": "new",
  "data": {
    "email": "sarah@acme.com",
    "phone": "+1-555-0123",
    "company_website": "https://acme.com",
    "linkedin_profile": "https://linkedin.com/in/sarahchen",
    "linkedin_headline": "VP of Sales at Acme Corp",
    "bio": "15 years B2B SaaS sales experience",
    "ai_summary": "High-value prospect. Pain point: manual outreach at scale.",
    "source": "manual"
  }
}
```

---

## Frontend Components

The kit includes 3 specialized block components for AI Employees:

### Block Components

| Component | Block Type | Lines | Key Features |
|-----------|-----------|-------|-------------|
| `OpsEmployeeCampaignCreatorBlock` | `employee_campaign_creator` | 481 | 3 personalization level cards, lead magnet toggle, subject/body templates, creates Kanban tasks |
| `OpsEmployeeLeadTableBlock` | `employee_lead_table` | 378 | Lead database with enrichment scoring, search, status filtering, slide-out detail panel |
| `OpsEmployeeAnalyticsBlock` | `employee_analytics` | 548 | KPI cards, area charts, engagement funnel, heatmap, campaign bar chart, live lead pipeline |

### OpsEmployeeCampaignCreatorBlock

The hero feature. Displays 3 personalization levels as selectable cards:

- **Minimal** — First name + company swap. 1 customized sentence. Fast, high volume.
- **Average** — Pain points + 2-3 customized sentences. Balanced approach.
- **Full Custom** — Completely unique message per lead. Highest reply rate.

Also includes:
- Lead magnet generation toggle (Switch) — when enabled, AI researches a relevant lead magnet idea
- Subject line template input with variable support (`{{first_name}}`, `{{company}}`)
- Body template textarea
- "Launch Campaign" button — creates a campaign record in `ops_data` AND a Kanban task for tracking
- Lead count badge showing available leads from the app

**Data flow:**
1. Reads leads via `useOpsData({ appId, itemType: 'lead' })`
2. Writes campaign to `ops_data` with `item_type: 'campaign'`
3. Creates a ClawBuddy task via the `ai-tasks` API for Kanban visibility
4. If lead magnet enabled, posts a question via the questions API for AI research

### OpsEmployeeLeadTableBlock

Full lead database with:
- **Search** — Filter by name across all leads
- **Status filter bar** — 9 color-coded status badges (new, enriched, drafted, sent, opened, replied, meeting_booked, converted, bounced)
- **Sortable columns** — Name, Email, Company, Status, Enrichment Score
- **Enrichment score** — Computed from 7 fields (email, phone, company_website, linkedin_profile, linkedin_headline, bio, ai_summary). Visual progress bar.
- **Detail panel** — Slide-out Sheet with full lead info, clickable LinkedIn/website links, AI summary

### OpsEmployeeAnalyticsBlock

Analytics dashboard with 6 sections:
1. **KPI cards** — Total Leads, Emails Sent, Open Rate, Reply Rate, Meetings Booked, Conversion Rate
2. **Daily metrics area chart** — Sent, opened, replied, meetings over time (Recharts)
3. **Engagement funnel** — Visual funnel from Sent → Opened → Replied → Meetings → Converted
4. **Hourly activity heatmap** — 24h × 5 weekday grid showing send patterns
5. **Campaign performance bar chart** — Per-campaign comparison (sent, opened, replied, meetings)
6. **Live lead pipeline** — Real-time status distribution computed from actual lead records

---

## Data Schema

### Lead Record (`item_type: "lead"`)

```json
{
  "item_type": "lead",
  "title": "Sarah Chen",
  "status": "new",
  "data": {
    "email": "sarah@acme.com",
    "phone": "+1-555-0123",
    "company_website": "https://acme.com",
    "linkedin_profile": "https://linkedin.com/in/sarahchen",
    "linkedin_headline": "VP of Sales at Acme Corp",
    "bio": "15 years B2B SaaS sales experience. Previously at Salesforce.",
    "ai_summary": "High-value prospect. Pain point: manual outreach at scale. Decision maker.",
    "source": "manual"
  }
}
```

**Status flow:** `new` → `enriched` → `drafted` → `sent` → `opened` → `replied` → `meeting_booked` → `converted`
**Dead end:** `bounced` (can happen from any status after `sent`)

**Enrichment score fields (7 total):**
| Field | Points |
|-------|--------|
| `email` | ✓ |
| `phone` | ✓ |
| `company_website` | ✓ |
| `linkedin_profile` | ✓ |
| `linkedin_headline` | ✓ |
| `bio` | ✓ |
| `ai_summary` | ✓ |

Score = (fields filled / 7) × 100%. Displayed as a colored progress bar (red < 40%, yellow 40-70%, green > 70%).

### Campaign Record (`item_type: "campaign"`)

```json
{
  "item_type": "campaign",
  "title": "Skool Community Launch",
  "status": "active",
  "data": {
    "personalization_level": "full_custom",
    "generate_lead_magnet": true,
    "lead_magnet_idea": "Free AI automation audit for agencies",
    "subject_template": "{{first_name}}, quick question about {{company}}",
    "body_template": "Hi {{first_name}},\n\nI noticed {{company}} is scaling fast...",
    "lead_count": 50,
    "stats": {
      "total_leads": 50,
      "sent": 30,
      "opened": 18,
      "replied": 5,
      "meetings": 2
    }
  }
}
```

**Personalization levels:**
| Level | Description | Volume | Reply Rate |
|-------|------------|--------|-----------|
| `minimal` | First name + company swap. 1 customized sentence. | High | Lower |
| `average` | Pain points + 2-3 customized sentences. | Medium | Medium |
| `full_custom` | Completely unique message per lead. | Low | Highest |

**Campaign statuses:** `draft` → `active` → `paused` → `completed`

### Analytics Overview Record (`item_type: "analytics"`)

```json
{
  "item_type": "analytics",
  "title": "Analytics Overview",
  "data": {
    "type": "overview",
    "kpis": {
      "total_leads": 150,
      "emails_sent": 487,
      "open_rate": 42.5,
      "reply_rate": 8.2,
      "meetings_booked": 12,
      "conversion_rate": 2.5
    },
    "daily_metrics": [
      {"date": "2026-02-20", "sent": 25, "opened": 12, "replied": 3, "meetings": 1},
      {"date": "2026-02-21", "sent": 30, "opened": 15, "replied": 4, "meetings": 0}
    ],
    "funnel": {
      "sent": 487,
      "opened": 207,
      "replied": 40,
      "meetings": 12,
      "converted": 5
    },
    "campaign_performance": [
      {"name": "Skool Launch", "sent": 200, "opened": 95, "replied": 18, "meetings": 5},
      {"name": "Agency Outreach", "sent": 287, "opened": 112, "replied": 22, "meetings": 7}
    ],
    "hourly_heatmap": [
      {"hour": 9, "mon": 5, "tue": 8, "wed": 6, "thu": 7, "fri": 4},
      {"hour": 10, "mon": 8, "tue": 12, "wed": 9, "thu": 10, "fri": 6}
    ],
    "last_updated": "2026-02-26T00:00:00Z"
  }
}
```

**KPI fields:**
| Field | Type | Description |
|-------|------|------------|
| `total_leads` | number | Total leads in the database |
| `emails_sent` | number | Total emails sent across all campaigns |
| `open_rate` | number | Percentage of opened emails |
| `reply_rate` | number | Percentage of replied emails |
| `meetings_booked` | number | Total meetings booked |
| `conversion_rate` | number | Percentage of leads converted |

### Activity Record (`item_type: "activity"`)

```json
{
  "item_type": "activity",
  "title": "Email sent to Sarah Chen",
  "status": "completed",
  "data": {
    "type": "email_sent",
    "lead_name": "Sarah Chen",
    "campaign": "Skool Community Launch",
    "timestamp": "2026-02-25T14:30:00Z"
  }
}
```

---

## Usage

**Adding leads (agent does this after research/scraping):**
```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<lead_table_block_id>",
  "item_type": "lead",
  "title": "Alex Rivera",
  "status": "new",
  "data": {
    "email": "alex@startup.io",
    "company_website": "https://startup.io",
    "linkedin_profile": "https://linkedin.com/in/alexrivera",
    "linkedin_headline": "Founder at Startup.io",
    "source": "linkedin_scrape"
  }
}
```

**Enriching a lead (agent updates after research):**
```json
{
  "request_type": "ops",
  "action": "update_data",
  "app_id": "<app_id>",
  "data_id": "<lead_record_id>",
  "status": "enriched",
  "data": {
    "email": "alex@startup.io",
    "phone": "+1-555-0456",
    "company_website": "https://startup.io",
    "linkedin_profile": "https://linkedin.com/in/alexrivera",
    "linkedin_headline": "Founder at Startup.io",
    "bio": "Serial entrepreneur. 3 exits. Building AI-first GTM tools.",
    "ai_summary": "Founder-led sales team, likely feeling outreach pain. High potential.",
    "source": "linkedin_scrape"
  }
}
```

**Updating lead status (agent does this as emails are sent/opened):**
```json
{
  "request_type": "ops",
  "action": "update_data",
  "app_id": "<app_id>",
  "data_id": "<lead_record_id>",
  "status": "sent"
}
```

**Updating analytics (agent does this periodically):**
```json
{
  "request_type": "ops",
  "action": "update_data",
  "app_id": "<app_id>",
  "data_id": "<analytics_record_id>",
  "data": {
    "type": "overview",
    "kpis": { "total_leads": 150, "emails_sent": 500, "open_rate": 43.0, "reply_rate": 8.5, "meetings_booked": 13, "conversion_rate": 2.6 },
    "daily_metrics": [...],
    "funnel": { "sent": 500, "opened": 215, "replied": 42, "meetings": 13, "converted": 5 },
    "last_updated": "2026-02-26T12:00:00Z"
  }
}
```

**Listing all leads:**
```json
{"request_type": "ops", "action": "list_data", "app_id": "<app_id>", "item_type": "lead"}
```

---

## Multiple AI Employees

Each AI Employee gets its own OpsCenter app. To create a second employee (e.g., Watson the email marketer):

1. Create the sub-agent identity: `{"request_type": "subagent", "action": "create", "name": "Watson", ...}`
2. Add to office: `POST manage-office-agent {"action": "create", "name": "Watson", "role": "Email Marketer"}`
3. Follow Steps 1-4 above with a new app name ("Watson") and different description

The same 3 block types (`employee_campaign_creator`, `employee_lead_table`, `employee_analytics`) work for any AI Employee — the data is scoped by `app_id`.

---

## Automation Integration

AI Employees can be wired into ClawBuddy's automation system:

- **Morning Digest** — Include employee KPIs in the daily briefing
- **Evening Report** — Summarize emails sent, opens, replies for each employee
- **Custom automation** — Create a scheduled automation that triggers the employee to process queued leads

The employee's agent (Ray, Sherlock, or the sub-agent itself) updates analytics and lead statuses via the same OpsCenter API.
