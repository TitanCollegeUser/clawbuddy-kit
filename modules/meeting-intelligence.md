# Meeting Intelligence (PepperPots) -- ClawBuddy Module

## What This Module Does

Tracks all your meetings from Fathom AI or any meeting tool. Gives you a searchable feed of meeting summaries, action items, and a calendar view. Your agent can query past meetings, prep for upcoming ones, and extract insights across conversations.

## Prerequisites

- ClawBuddy instance running (SETUP.md complete)
- Meeting data source (Fathom AI, Otter.ai, manual entry, or any tool that exports meeting notes)
- Optional: Make.com account for Google Calendar sync

---

## Setup Instructions

### Step 1: Create the App

```json
{
  "request_type": "ops",
  "action": "create_app",
  "name": "Meeting Intelligence",
  "description": "Track meetings, extract insights, and prep for upcoming calls",
  "icon": "calendar"
}
```

Save the returned `app_id`.

### Step 2: Create Pages

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Dashboard", "sort_order": 1}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Meetings", "sort_order": 2}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Calendar", "sort_order": 3}
```

Save each `page_id`.

### Step 3: Create Blocks

**Dashboard page:**
```json
{"request_type": "ops", "action": "create_block", "page_id": "<dashboard_page_id>", "name": "Overview", "block_type": "kpi", "config": {"metrics": ["total_meetings", "this_week", "action_items_open"]}}
```

**Meetings page:**
```json
{"request_type": "ops", "action": "create_block", "page_id": "<meetings_page_id>", "name": "Meeting Feed", "block_type": "feed", "config": {"sortBy": "date", "sortOrder": "desc"}}
```

**Calendar page:**
```json
{"request_type": "ops", "action": "create_block", "page_id": "<calendar_page_id>", "name": "Calendar Events", "block_type": "calendar", "config": {}}
```

Save each `block_id`.

### Step 4: Seed Overview Record

Create one overview record that holds aggregate stats. Your agent updates this as meetings are added.

```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<overview_block_id>",
  "item_type": "record",
  "data": {
    "type": "overview",
    "total_meetings": 0,
    "this_week": 0,
    "action_items_open": 0,
    "top_contacts": [],
    "top_topics": [],
    "last_updated": "2026-01-01T00:00:00Z"
  }
}
```

### Step 5: Connect Calendar Sync (Optional)

If you want upcoming calendar events to appear:

1. Set up a Make.com scenario that fetches Google Calendar events
2. Set the `MAKE_API_TOKEN` in your Supabase secrets
3. The `calendar-sync` edge function (already deployed) will pull events into this block

---

## Data Schema

### Meeting Record (`data.type: "meeting"`)

```json
{
  "type": "meeting",
  "title": "Weekly Standup with Engineering",
  "date": "2026-02-25T10:00:00Z",
  "duration_minutes": 30,
  "attendees": ["Alice", "Bob", "Charlie"],
  "summary": "Discussed sprint progress. Backend API 80% complete...",
  "action_items": [
    {"task": "Review PR #42", "assignee": "Alice", "done": false},
    {"task": "Update docs", "assignee": "Bob", "done": true}
  ],
  "key_decisions": ["Ship MVP by Friday", "Delay auth feature to next sprint"],
  "sentiment": "positive",
  "source": "fathom",
  "source_url": "https://fathom.video/..."
}
```

### Overview Record (`data.type: "overview"`)

```json
{
  "type": "overview",
  "total_meetings": 247,
  "this_week": 8,
  "action_items_open": 12,
  "top_contacts": [
    {"name": "Alice", "count": 34},
    {"name": "Bob", "count": 22}
  ],
  "top_topics": ["product", "hiring", "revenue"],
  "last_updated": "2026-02-25T22:00:00Z"
}
```

### Calendar Event (`data.type: "calendar_event"`)

```json
{
  "type": "calendar_event",
  "title": "1:1 with CEO",
  "start": "2026-02-26T14:00:00Z",
  "end": "2026-02-26T14:30:00Z",
  "attendees": ["CEO Name"],
  "location": "Zoom",
  "notes": "Prep: Review Q1 numbers"
}
```

---

## Usage

**Adding a meeting (agent does this after each call):**
```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<meeting_feed_block_id>",
  "item_type": "record",
  "data": {
    "type": "meeting",
    "title": "Sales Call with Acme Corp",
    "date": "2026-02-25T15:00:00Z",
    "duration_minutes": 45,
    "attendees": ["John from Acme"],
    "summary": "Discussed enterprise plan. They want custom onboarding...",
    "action_items": [{"task": "Send proposal by Friday", "assignee": "You", "done": false}],
    "key_decisions": ["They'll pilot with 10 seats"],
    "sentiment": "positive",
    "source": "manual"
  }
}
```

**Querying meetings (agent lists recent data):**
```json
{"request_type": "ops", "action": "list_data", "app_id": "<app_id>", "block_id": "<meeting_feed_block_id>"}
```

**Prepping for a meeting (agent reads calendar + past meetings with that contact):**
The agent can list calendar events, find past meetings with the same attendees, and generate a prep brief using the data already stored.

---

## Automation Integration

The **Midday Prep** automation (already in the kit) can read from this module to generate meeting preparation briefs. Make sure the automation's config references this app's `app_id`.
