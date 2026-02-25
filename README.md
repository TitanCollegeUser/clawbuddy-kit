# ClawBuddy -- Mission Control for AI Agents

ClawBuddy is an AI command center that makes your AI agents visible, trackable, and autonomous. Built on Supabase, it gives any AI agent -- whether OpenClaw, Claude Code, or custom -- a full operational dashboard with real-time task tracking, automated workflows, and self-improving intelligence.

**What your agent gets:**

- **Kanban Board** -- Tasks flow through To Do > Doing > Needs Input > Done
- **AI Log** -- Every decision, observation, and step logged and searchable
- **Questions & Approvals** -- Agents ask, you answer. Full async workflow.
- **Insights & Reports** -- Agents push analytics, alerts, and formatted HTML reports
- **Automated Workflows** -- Scheduled automations (morning digest, competitor intel, meeting prep, evening report)
- **OpsCenter** -- Modular apps with pages and blocks for any domain (YouTube analytics, meeting intelligence, research hub)
- **Self-Improving Brain** -- Sherlock Brain analyzes past runs, computes health scores, auto-tunes settings
- **Animated Office** -- 2D animated agents with real-time status updates
- **Multi-Agent Support** -- Multiple AI agents with distinct identities, skills, and memory

---

## Quick Start

### 1. Fork this repo

Click **Fork** in the top-right corner of this page.

### 2. Set up Supabase

Create a free Supabase project at [supabase.com](https://supabase.com), then deploy the backend:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
cd clawbuddy-kit
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations (sets up the full schema)
supabase db push

# Deploy all edge functions
supabase functions deploy ai-tasks --no-verify-jwt
supabase functions deploy automation-runner --no-verify-jwt
supabase functions deploy sherlock-brain --no-verify-jwt
# ... deploy each function (see SETUP.md for full list)
```

### 3. Set environment variables

```bash
cp .env.example .env
# Fill in your Supabase URL, keys, and API tokens
```

### 4. Connect your agent

**For Claude Code agents** -- Copy `CLAUDE.md` to your project root and update the connection variables.

**For OpenClaw agents** -- Use the API endpoint directly:

```bash
POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-tasks
Header: x-webhook-secret: YOUR_SECRET
Body: {"request_type": "status", "action": "update", "is_online": true}
```

---

## What's Inside

```
clawbuddy-kit/
├── SETUP.md                 # Detailed setup guide
├── CLAUDE.md                # Agent instructions template (Claude Code)
├── .env.example             # Environment variables template
├── docs/
│   ├── capabilities.html    # Feature showcase
│   ├── community-features.html  # Community features showcase
│   └── integration-guide.md # Full API reference (20 feature areas)
└── supabase/
    ├── config.toml          # Supabase project config
    ├── functions/           # 18 edge functions
    │   ├── ai-tasks/        # Core API (tasks, logs, insights, questions, etc.)
    │   ├── automation-runner/   # Scheduled automation orchestrator
    │   ├── sherlock-brain/  # Self-improving AI brain
    │   ├── morning-digest/  # Daily morning briefing
    │   ├── evening-report/  # Daily evening summary
    │   ├── midday-prep/     # Midday preparation
    │   ├── competitor-intel/ # Competitive intelligence
    │   ├── intelligence-sync/ # Data synchronization
    │   ├── calendar-sync/   # Google Calendar bridge
    │   ├── browser-research/ # AI web research
    │   ├── goal-analyzer/   # Business goal decomposition
    │   ├── report-webhook/  # Webhook payload processor
    │   └── ... (office system functions)
    └── migrations/          # 51 SQL migrations (full schema)
```

---

## Compatible Agents

| Agent Type | How to Connect |
|-----------|----------------|
| **Claude Code** | Add `CLAUDE.md` to your project. Claude Code reads it automatically. |
| **OpenClaw** | Use the REST API directly. See `docs/integration-guide.md`. |
| **Custom Agent** | Any agent that can make HTTP POST requests. Same REST API. |
| **Python Agent** | Use the Python helper in `CLAUDE.md` or build your own client. |
| **Node.js Agent** | Standard `fetch()` calls to the API endpoint. |

---

## Feature Areas (20 total)

| Feature | What It Does |
|---------|-------------|
| **Tasks** | Kanban board with 5 columns |
| **Subtasks** | Break tasks into checkable items |
| **AI Log** | Agent journal with categories and unread badges |
| **Questions** | Async Q&A between agent and user |
| **Insights** | Analytics cards (performance, alerts, summaries) |
| **Reports** | Formatted HTML reports |
| **Status** | Real-time agent presence with color ring |
| **Automations** | Scheduled workflows via pg_cron |
| **OpsCenter** | Modular apps with pages and data blocks |
| **Sub-Agents** | Specialized AI workers |
| **Memory** | Persistent knowledge base |
| **Skills** | Configurable agent capabilities |
| **Queue** | Async work item processing |
| **Budget** | Cost tracking per task |
| **Assignees** | Task assignment management |
| **Intelligence** | YouTube competitor analytics |
| **Arena** | Agent scoring and competition |
| **Identity** | Agent persona and config files |
| **Learning** | Self-improving brain analysis |
| **Office** | Animated 2D agent office |

---

## Documentation

- **[Setup Guide](SETUP.md)** -- Step-by-step from zero to running
- **[Integration Guide](docs/integration-guide.md)** -- Full API reference with examples
- **[Capabilities](docs/capabilities.html)** -- Visual feature showcase
- **[Community Features](docs/community-features.html)** -- What the community gets
- **[CLAUDE.md](CLAUDE.md)** -- Claude Code agent template

---

## Built by Vertical Systems

ClawBuddy is part of the [OpenClaw](https://openclaw.ai) ecosystem -- open-source AI agent infrastructure for creators and entrepreneurs.

**Community:** Join the Agents in a Box community on Skool for tutorials, templates, and support.

**License:** MIT
