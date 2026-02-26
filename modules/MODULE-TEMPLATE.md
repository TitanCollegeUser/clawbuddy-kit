# Module Template

Use this template to create new ClawBuddy modules. Each module is a set of instructions that an AI agent follows to build an OpsCenter app on the user's ClawBuddy instance.

---

## How Modules Work

A module is NOT a separate codebase. It's a recipe that tells your AI agent:

1. **Create an OpsCenter app** (the container)
2. **Add pages** (tabs within the app)
3. **Add blocks to pages** (the UI components)
4. **Seed initial data** (config records, default settings)
5. **Connect edge functions** (if the module uses scheduled automations or external APIs)

Everything runs on the user's existing ClawBuddy infrastructure. No extra deployments needed.

---

## Module Instruction Doc Structure

Every module doc should follow this format:

```markdown
# [Module Name] -- ClawBuddy Module

## What This Module Does
[1-2 sentence description]

## Prerequisites
- ClawBuddy instance running (SETUP.md complete)
- [Any external service needed, e.g., "Make.com account for calendar sync"]

## Setup Instructions

### Step 1: Create the App
[API call to create the OpsCenter app]

### Step 2: Create Pages
[API calls to create each page/tab]

### Step 3: Create Blocks
[API calls to create blocks on each page, with block_type and config]

### Step 4: Seed Data
[API calls to seed config records, default settings, or sample data]

### Step 5: Connect Services (if needed)
[Instructions for setting up external integrations]

## Block Reference
[Table of all blocks used, their types, and what data they display]

## Data Schema
[What fields each data record uses, so agents know how to write to it]

## Usage
[How the agent interacts with this module day-to-day]
```

---

## Available Block Types

Use these `block_type` values when creating blocks:

### Generic Blocks (work with any app)

| Block Type | What It Displays |
|-----------|-----------------|
| `feed` | Scrollable list of items (most common) |
| `metric_cards` | Key metric cards with numbers |
| `chart` | Data visualizations (Recharts) |
| `table` | Structured data table with configurable columns |
| `calendar` | Calendar view of events |
| `text` | Rich text content |
| `timeline` | Chronological events |
| `gallery` | Image/media grid |
| `embed` | Embedded external content |
| `list` | Simple scrollable list |
| `comparison` | Side-by-side comparisons |
| `kanban` | Kanban-style board with drag-and-drop |
| `form` | Data entry form |
| `alert_banner` | Config-driven alert banner (NOT data-driven) |
| `countdown` | Countdown timer |
| `agent_card` | Agent identity card |
| `approval_queue` | Approval workflow queue |
| `progress_bar` | Progress indicator |

### Creator Command Blocks (YouTube analytics)

| Block Type | What It Displays |
|-----------|-----------------|
| `yt_dashboard` | Channel overview with subscriber/view KPIs |
| `yt_analytics` | Deep analytics with charts and trends |
| `yt_competitors` | Competitor tracking cards |
| `yt_banger_lab` | Idea validation and scoring |
| `yt_pipeline` | Content production pipeline |
| `yt_scripts` | Script management and editing |
| `yt_intel_feed` | Intelligence digest feed |
| `yt_outlier_feed` | Viral outlier video detection |

### Meeting Intelligence Blocks

| Block Type | What It Displays |
|-----------|-----------------|
| `meeting_intel` | Full meeting dashboard with search, charts, inline detail panels, and "Send To" feature queue actions |

> **Note:** Meeting Intelligence feature pages (Action Items, Proposals, Lead Magnets) use `block_type: "feed"` in the database but are routed to a specialized `OpsMeetingFeatureBlock` component via block ID matching. See the Meeting Intelligence module doc for details.

### Outreach Blocks

| Block Type | What It Displays |
|-----------|-----------------|
| `outreach_scoreboard` | Outreach metrics scoreboard |
| `outreach_leads` | Lead management table |
| `outreach_phone` | Phone outreach tracking |
| `outreach_email` | Email outreach tracking |
| `outreach_campaigns` | Campaign management |
| `outreach_results` | Campaign results and analytics |

### AI Employee Blocks

| Block Type | What It Displays |
|-----------|-----------------|
| `employee_campaign_creator` | Campaign builder with personalization levels |
| `employee_lead_table` | Employee lead management |
| `employee_analytics` | Employee performance analytics |

### Special Routing

Some blocks use special routing that bypasses the `block_type` switch:

| Routing Method | When It Triggers | Component |
|---------------|-----------------|-----------|
| App ID match | `appId === RESEARCH_HUB_APP_ID` | `ResearchHubBlock` |
| Block ID match | Block ID in `MEETING_FEATURE_BLOCK_IDS` set | `OpsMeetingFeatureBlock` |
| `block_type` switch | Default routing | Corresponding block component |

---

## API Quick Reference

All calls go to: `POST {CLAWBUDDY_API_URL}/functions/v1/ai-tasks`
With header: `x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}`

**Create app:**
```json
{"request_type": "ops", "action": "create_app", "name": "App Name", "description": "What it does", "icon": "brain"}
```

**Create page:**
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Page Name", "sort_order": 1}
```

**Create block:**
```json
{"request_type": "ops", "action": "create_block", "page_id": "<page_id>", "name": "Block Name", "block_type": "feed", "config": {}}
```

**Add data:**
```json
{"request_type": "ops", "action": "add_data", "app_id": "<app_id>", "block_id": "<block_id>", "item_type": "record", "data": {"type": "entry", "title": "...", "content": "..."}}
```

> **Critical:** `add_data` REQUIRES `app_id` explicitly. Without it, data silently fails.

---

## Tips for Module Authors

1. **Keep it agent-executable.** Every step should be a concrete API call, not a vague instruction.
2. **Include the data schema.** Agents need to know what fields to write when they use the module.
3. **Use `data.type` to separate record kinds.** E.g., `"type": "config"` for settings, `"type": "entry"` for feed items, `"type": "overview"` for aggregate stats.
4. **Seed a config block** if the module needs settings (API keys, preferences, etc.).
5. **Reference existing edge functions** instead of creating new ones. The kit ships with 18 functions that cover most use cases.
