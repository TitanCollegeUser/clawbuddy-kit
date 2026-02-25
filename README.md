# ClawBuddy -- Mission Control for AI Agents

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/mkanasani/clawbuddy-kit)

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

### 2. Set up Supabase (backend)

Create a free Supabase project at [supabase.com](https://supabase.com), then deploy the backend:

```bash
# Install Supabase CLI
npm install -g supabase

# Clone your fork
git clone https://github.com/YOUR_USERNAME/clawbuddy-kit.git
cd clawbuddy-kit

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations (creates the full schema)
supabase db push

# Activate your license (get your code from https://www.skool.com/aibox/about)
curl -X POST https://api.clawbuddy.com/functions/v1/activate-license \
  -H "Content-Type: application/json" \
  -d '{"activation_code":"YOUR-CODE","project_ref":"YOUR_PROJECT_REF"}'

# Set secrets (use the license_token from the activation response)
supabase secrets set CLAWBUDDY_LICENSE_TOKEN="cb_your-token-here"
supabase secrets set LICENSE_VERIFY_KEY="your-verify-key"
supabase secrets set CLAWBUDDY_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set AI_TASKS_API_KEY=$(openssl rand -hex 32)

# Deploy all edge functions
for fn in ai-tasks automation-runner sherlock-brain morning-digest evening-report midday-prep competitor-intel intelligence-sync browser-research calendar-sync goal-analyzer report-webhook list-offices manage-office-agent create-office-task office-agent-status reset-office upload-office-deliverable; do
  supabase functions deploy $fn --no-verify-jwt
done
```

### 3. Deploy frontend (dashboard)

Click the **Deploy to Netlify** button above, or manually:

```bash
# Set your environment variables
cp .env.example .env
# Edit .env with your Supabase URL and keys

# Install and build
npm install
npm run build
```

In Netlify, set these environment variables (Site Settings > Environment Variables):
- `VITE_SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = your anon key
- `VITE_CLAWBUDDY_WEBHOOK_SECRET` = your webhook secret

### 4. Connect your agent

**Claude Code** -- Copy `CLAUDE.md` to your project root. Update the connection variables. Done.

**OpenClaw / Custom** -- Use the REST API:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-tasks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"request_type": "status", "action": "update", "is_online": true}'
```

See **[SETUP.md](SETUP.md)** for the full 10-step walkthrough.

---

## Updating

When a new version is released, run the update script:

```bash
# Set upstream (one-time)
git remote add upstream https://github.com/mkanasani/clawbuddy-kit.git

# Update everything
./update.sh
```

This pulls the latest code, applies new database migrations, and redeploys edge functions. Your frontend auto-deploys if connected to Netlify.

---

## What's Inside

```
clawbuddy-kit/
├── src/                     # React frontend (dashboard)
├── public/                  # Static assets
├── supabase/
│   ├── functions/           # 18 edge functions
│   │   ├── ai-tasks/        # Core API (tasks, logs, insights, questions, etc.)
│   │   ├── automation-runner/   # Scheduled automation orchestrator
│   │   ├── sherlock-brain/  # Self-improving AI brain
│   │   ├── morning-digest/  # Daily morning briefing
│   │   ├── evening-report/  # Daily evening summary
│   │   ├── midday-prep/     # Midday preparation
│   │   ├── competitor-intel/ # Competitive intelligence
│   │   ├── browser-research/ # AI web research
│   │   ├── calendar-sync/   # Google Calendar bridge
│   │   └── ... (+ 9 more)
│   └── migrations/          # 51 SQL migrations (full schema)
├── docs/
│   ├── capabilities.html    # Feature showcase
│   ├── community-features.html  # Community features showcase
│   └── integration-guide.md # Full API reference (20 feature areas)
├── CLAUDE.md                # Agent instructions template
├── SETUP.md                 # Detailed setup guide
├── update.sh                # One-command updater
├── netlify.toml             # Netlify deploy config
└── .env.example             # Environment variables template
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
