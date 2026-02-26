# Creator Command Centre -- ClawBuddy Module

## What This Module Does

YouTube analytics and intelligence dashboard. Tracks your channel performance, monitors competitors, scores video ideas, manages your content pipeline, and surfaces viral outlier videos in your niche.

## Prerequisites

- ClawBuddy instance running (SETUP.md complete)
- YouTube Data API key (for competitor tracking)
- Optional: Subscribr API key (for niche trend detection and outlier scoring)

---

## Setup Instructions

### Step 1: Create the App

```json
{
  "request_type": "ops",
  "action": "create_app",
  "name": "Creator Command",
  "description": "YouTube analytics, competitor tracking, and content intelligence",
  "icon": "tv"
}
```

Save the returned `app_id`.

### Step 2: Create Pages

```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Dashboard", "title": "Dashboard", "sort_order": 1}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Analytics", "title": "Analytics", "sort_order": 2}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Competitors", "title": "Competitors", "sort_order": 3}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Banger Lab", "title": "Banger Lab", "sort_order": 4}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Pipeline", "title": "Pipeline", "sort_order": 5}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Scripts", "title": "Scripts", "sort_order": 6}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Intel Feed", "title": "Intel Feed", "sort_order": 7}
```
```json
{"request_type": "ops", "action": "create_page", "app_id": "<app_id>", "name": "Outlier Feed", "title": "Outlier Feed", "sort_order": 8}
```

Save each `page_id`.

### Step 3: Create Blocks

**Dashboard page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<dashboard_page_id>", "title": "Channel Overview", "block_type": "yt_dashboard", "config": {}}
```

**Analytics page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<analytics_page_id>", "title": "Deep Analytics", "block_type": "yt_analytics", "config": {}}
```

**Competitors page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<competitors_page_id>", "title": "Competitor Tracker", "block_type": "yt_competitors", "config": {}}
```

**Banger Lab page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<banger_lab_page_id>", "title": "Idea Validator", "block_type": "yt_banger_lab", "config": {}}
```

**Pipeline page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<pipeline_page_id>", "title": "Content Pipeline", "block_type": "yt_pipeline", "config": {}}
```

**Scripts page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<scripts_page_id>", "title": "Script Manager", "block_type": "yt_scripts", "config": {}}
```

**Intel Feed page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<intel_feed_page_id>", "title": "Intelligence Feed", "block_type": "yt_intel_feed", "config": {}}
```

**Outlier Feed page:**
```json
{"request_type": "ops", "action": "add_block", "page_id": "<outlier_feed_page_id>", "title": "Outlier Videos", "block_type": "yt_outlier_feed", "config": {}}
```

Save each `block_id`.

### Step 4: Seed Overview Record

```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<dashboard_block_id>",
  "item_type": "record",
  "data": {
    "type": "overview",
    "subscriber_count": 0,
    "total_views": 0,
    "total_videos": 0,
    "avg_views_per_video": 0,
    "upload_frequency": "weekly",
    "last_updated": "2026-01-01T00:00:00Z"
  }
}
```

### Step 5: Connect Services

1. **YouTube Data API:** Set `YOUTUBE_API_KEY` in Supabase secrets. The `competitor-intel` edge function uses this for fetching channel/video stats.

2. **Subscribr API (optional):** Set `SUBSCRIBR_API_KEY` in Supabase secrets. Used for niche analysis, trend detection, and outlier video scoring. The frontend uses a `subscribr-proxy` edge function to call the API.

3. **Competitor Intel Automation:** Create or enable the Competitor Intel automation to run daily. It reads competitors from the Competitors block and fetches fresh stats.

---

## Frontend Components

The kit includes 8 specialized Lovable-built components plus a support panel and custom hook:

### Block Components

| Component | Block Type | Lines | Key Features |
|-----------|-----------|-------|-------------|
| `OpsYtDashboardBlock` | `yt_dashboard` | 462 | Channel KPIs, subscriber/view/video counts, overview record pattern |
| `OpsYtAnalyticsBlock` | `yt_analytics` | 864 | Recharts bar/line/area charts, upload frequency, performance trends, deep metrics |
| `OpsYtCompetitorsBlock` | `yt_competitors` | 232 | Competitor cards with subscriber counts, outlier detection, "Analyze" CTA |
| `OpsYtBangerLabBlock` | `yt_banger_lab` | 575 | Idea validation with banger scores, status badges, feedback loop, AI scoring |
| `OpsYtPipelineBlock` | `yt_pipeline` | 247 | Content pipeline with Kanban-like status columns (Idea > Script > Film > Edit > Published) |
| `OpsYtScriptsBlock` | `yt_scripts` | 178 | Script cards with word count, status, editing actions |
| `OpsYtIntelFeedBlock` | `yt_intel_feed` | 163 | Intelligence digest feed with categorized insight cards |
| `OpsYtOutlierFeedBlock` | `yt_outlier_feed` | 329 | Viral outlier video cards with view multiples, thumbnail previews, expandable detail panels |

### Support Components

| Component | Purpose |
|-----------|---------|
| `OutlierVideoDetailPanel` (243 lines) | Slide-out panel for detailed outlier video analysis |
| `useSubscribrProxy` hook (21 lines) | Frontend hook for proxied Subscribr API calls |

---

## Data Schema

### Overview Record (`data.type: "overview"`)

```json
{
  "type": "overview",
  "subscriber_count": 15000,
  "total_views": 2500000,
  "total_videos": 120,
  "avg_views_per_video": 20833,
  "upload_frequency": "2x/week",
  "top_videos": [
    {"title": "How I Built an AI Agent", "views": 150000, "published": "2026-02-01"}
  ],
  "monthly_growth": {"subscribers": 1200, "views": 300000},
  "last_updated": "2026-02-26T00:00:00Z"
}
```

### Competitor Record (`data.type: "competitor"`)

```json
{
  "type": "competitor",
  "name": "Nick Saraev",
  "handle": "@nicksaraev",
  "channel_id": "UCxxxxxx",
  "subscriber_count": 250000,
  "view_count": 15000000,
  "video_count": 200,
  "avg_views": 75000,
  "outlier_threshold": 225000,
  "recent_outliers": [],
  "last_synced": "2026-02-26T00:00:00Z"
}
```

### Idea Record (`data.type: "idea"`)

```json
{
  "type": "idea",
  "title": "Building AI Agents That Actually Work",
  "description": "Step-by-step guide to building production agents",
  "banger_score": 85,
  "status": "validated",
  "niche_fit": "high",
  "competition_level": "medium",
  "estimated_views": 50000,
  "feedback": ["Strong hook potential", "Trending topic"],
  "source": "outlier_analysis"
}
```

### Pipeline Record (`data.type: "pipeline"`)

```json
{
  "type": "pipeline",
  "title": "AI Agent Tutorial",
  "status": "scripting",
  "idea_id": "<idea_record_id>",
  "target_publish": "2026-03-01",
  "script_word_count": 2400,
  "thumbnail_status": "draft"
}
```

### Script Record (`data.type: "script"`)

```json
{
  "type": "script",
  "title": "AI Agent Tutorial Script",
  "pipeline_id": "<pipeline_record_id>",
  "word_count": 2400,
  "status": "draft",
  "content": "Hook: What if I told you...",
  "version": 2,
  "last_edited": "2026-02-25T00:00:00Z"
}
```

### Intel Digest Record (`data.type: "digest"`)

```json
{
  "type": "digest",
  "title": "Weekly AI YouTube Trends",
  "date": "2026-02-26",
  "insights": [
    {"category": "trending", "text": "Agent frameworks seeing 3x search volume"},
    {"category": "opportunity", "text": "Low competition on 'AI phone agents' keyword"}
  ],
  "source": "subscribr"
}
```

### Outlier Video Record (`data.type: "outlier"`)

```json
{
  "type": "outlier",
  "title": "I Replaced My Entire Team with AI",
  "channel": "Tech Creator",
  "views": 500000,
  "median_views": 50000,
  "outlier_multiple": 10.0,
  "published": "2026-02-20",
  "thumbnail_url": "https://img.youtube.com/...",
  "video_id": "dQw4w9WgXcQ",
  "why_it_worked": "Provocative title + trending topic + strong thumbnail"
}
```

---

## Usage

**Adding a competitor:**
```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<competitors_block_id>",
  "item_type": "competitor",
  "title": "Nick Saraev",
  "data": {
    "type": "competitor",
    "name": "Nick Saraev",
    "handle": "@nicksaraev",
    "subscriber_count": 250000,
    "view_count": 15000000
  }
}
```

**Submitting a video idea:**
```json
{
  "request_type": "ops",
  "action": "add_data",
  "app_id": "<app_id>",
  "block_id": "<banger_lab_block_id>",
  "item_type": "idea",
  "title": "Building AI Agents That Actually Work",
  "data": {
    "type": "idea",
    "title": "Building AI Agents That Actually Work",
    "banger_score": 0,
    "status": "new"
  }
}
```

**Syncing outlier videos (via intelligence-sync edge function):**
```json
{
  "action": "sync_videos",
  "workspace_id": "<user_id>",
  "videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "I Replaced My Entire Team with AI",
      "channel_name": "Tech Creator",
      "view_count": 500000,
      "is_outlier": true
    }
  ]
}
```

---

## Automation Integration

The **Competitor Intel** automation (already in the kit) reads competitors from this app's Competitors block and fetches fresh YouTube stats daily. It also fetches trending videos via the Subscribr API and pushes outliers + digests.

**Environment variables required:**
- `YOUTUBE_API_KEY` — YouTube Data API v3 key
- `SUBSCRIBR_API_KEY` — Subscribr API key (optional, for advanced analytics)
