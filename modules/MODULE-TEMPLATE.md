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

| Block Type | What It Displays |
|-----------|-----------------|
| `feed` | Scrollable list of items (most common) |
| `kpi` | Key metric cards with numbers |
| `chart` | Data visualizations |
| `table` | Structured data table |
| `config` | Settings/configuration panel |
| `calendar` | Calendar view of events |
| `notes` | Rich text notes |
| `links` | Link collection |
| `timeline` | Chronological events |
| `gallery` | Image/media grid |
| `embed` | Embedded external content |
| `markdown` | Markdown-rendered content |
| `checklist` | Checkable item list |
| `status` | Status indicators |
| `metrics` | Multiple metric displays |
| `comparison` | Side-by-side comparisons |
| `kanban` | Kanban-style board |
| `tree` | Hierarchical data |
| `custom` | Custom HTML rendering |

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
