# Cognitive Memory Module

> **What this does:** Gives your AI employees persistent memory across sessions. They remember past decisions, user preferences, project context, and learned patterns — so you never repeat yourself.

---

## Prerequisites

- ClawBuddy deployed and working (ai-tasks edge function live)
- Sherlock Brain edge function deployed (`supabase functions deploy sherlock-brain --no-verify-jwt`)

---

## Architecture

Cognitive Memory uses two systems that already exist in ClawBuddy:

1. **Memory Submissions** — Your agent submits knowledge entries for approval via the `memory` request type
2. **Agent Learning Log** — The `agent_learning_log` table stores successful patterns, mistakes, and decisions automatically via Sherlock Brain

No new tables. No new edge functions. Everything is already in the kit.

---

## Step 1: Understand the Memory API

Your agent submits memory entries through the standard ai-tasks endpoint:

```json
{
  "request_type": "memory",
  "action": "submit",
  "content": "User prefers ISO 8601 date format for all exports. Confirmed on 2026-02-15.",
  "category": "preference"
}
```

**Important:** Action is `submit`, NOT `create`.

Memory entries go to Mani (the dashboard owner) for approval before becoming permanent. This prevents agents from polluting memory with noise.

### Memory Categories

Use these categories to organize what your agent remembers:

| Category | When to Use | Example |
|----------|-------------|---------|
| `preference` | User preferences and choices | "Always use dark mode for reports" |
| `decision` | Key decisions made during work | "Chose PostgreSQL over MongoDB for this project" |
| `context` | Project context and background | "Main repo is at /Users/name/project/" |
| `pattern` | Successful patterns worth repeating | "Batch API calls in groups of 50 for best performance" |
| `mistake` | Things that went wrong (so they don't repeat) | "Don't use git add -A — it includes .env files" |

---

## Step 2: Set Up the Learning Log

The `agent_learning_log` table is created by the kit migrations. It tracks:

- **Successful patterns** — What worked well
- **Failed approaches** — What didn't work and why
- **Decision rationale** — Why the agent chose approach A over B
- **Performance data** — How long tasks took, error rates

Sherlock Brain automatically writes to this table during its self-improvement cycles. Your agent can also write directly:

```json
{
  "request_type": "log",
  "action": "create",
  "category": "observation",
  "message": "Learned: CSV exports with >10K rows should use streaming. Batch approach caused memory timeout at 15K rows."
}
```

---

## Step 3: Reading Memory at Session Start

At the beginning of every session, your agent should load its memory. For Claude Code, this happens automatically through CLAUDE.md + MEMORY.md files.

For other agents, query the memory API:

```json
{
  "request_type": "memory",
  "action": "list"
}
```

This returns all approved memory entries. Your agent reads these before starting work.

### MEMORY.md Pattern (Claude Code)

Claude Code agents use a file-based memory system:

1. **MEMORY.md** — Auto-loaded at session start. Contains session rules, project map, API quirks, key decisions
2. **STATUS.md** — Current state of ongoing work. Read at start, update before compacting

The workflow:
- Session start → Read MEMORY.md + STATUS.md
- During work → Agent discovers important patterns, preferences, quirks
- Session end → Update STATUS.md, submit new memories to Supabase
- Before /compact → Always update STATUS.md so next session has context

---

## Step 4: Memory Submission Workflow

When your agent discovers something worth remembering:

1. **Log it immediately** (so it's visible on the dashboard):
```json
{
  "request_type": "log",
  "action": "create",
  "category": "observation",
  "message": "Discovered: The Airtable API rate limits at 5 requests/second. Need to add delays."
}
```

2. **Submit it as a memory** (for permanent storage):
```json
{
  "request_type": "memory",
  "action": "submit",
  "content": "Airtable API rate limits at 5 requests/second. Always add 200ms delays between calls.",
  "category": "pattern"
}
```

3. **The dashboard owner approves or rejects** the memory entry
4. **Approved entries** become permanent and load on every future session

---

## Step 5: Self-Improving Brain Integration

Sherlock Brain runs periodic self-improvement cycles:

1. Reviews recent `agent_learning_log` entries
2. Identifies patterns (what keeps working, what keeps failing)
3. Generates improvement suggestions
4. Writes refined patterns back to the learning log

To trigger a brain cycle manually:

```bash
curl -X POST $CLAWBUDDY_API_URL/functions/v1/sherlock-brain \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CLAWBUDDY_WEBHOOK_SECRET" \
  -d '{"action": "reflect"}'
```

Over time, your agent builds a knowledge base specific to YOUR workflows — not generic AI, but an employee that genuinely learns how you work.

---

## What Gets Remembered (Best Practices)

**DO remember:**
- User preferences (date formats, naming conventions, communication style)
- Project structure (file paths, key IDs, API endpoints)
- API quirks (rate limits, required fields, gotchas)
- Successful patterns (batch sizes, retry strategies, data formats)
- Key decisions and their rationale
- Mistakes and their fixes

**DON'T remember:**
- Temporary state (current task progress — that's STATUS.md)
- Secrets or credentials (those go in .env)
- Obvious things (language syntax, common commands)
- Anything the user hasn't confirmed as important

---

## Example: Full Memory Lifecycle

```
Session 1:
  Agent discovers CSV exports fail above 10K rows
  → Logs observation
  → Submits memory: "CSV exports >10K rows need streaming approach"
  → Owner approves

Session 2:
  Agent loads memory at start
  → Sees the CSV pattern
  → When asked to export 15K rows, automatically uses streaming
  → No repeated failure, no wasted time

Session 5:
  Sherlock Brain reviews learning log
  → Notices 3 separate CSV-related learnings
  → Consolidates into one refined pattern: "All file exports: stream if >5K rows, batch if >50K, always validate row count first"
  → Agent gets smarter over time
```

---

## Quick Reference

| Action | Request |
|--------|---------|
| Submit memory | `{"request_type": "memory", "action": "submit", "content": "...", "category": "preference"}` |
| List memories | `{"request_type": "memory", "action": "list"}` |
| Log observation | `{"request_type": "log", "action": "create", "category": "observation", "message": "..."}` |
| Trigger brain cycle | POST to `/functions/v1/sherlock-brain` with `{"action": "reflect"}` |

**Key gotcha:** Memory action is `submit`, NOT `create`.
