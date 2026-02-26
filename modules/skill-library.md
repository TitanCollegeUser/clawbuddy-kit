# Module: Skill Library

> **Agent Instruction Doc** — Give this file to Claude Code or any OpenClaw agent.
> The agent reads these instructions and populates the Skill Library.

---

## Overview

This module sets up the Skill Library — a collection of pre-configured API skills stored in the Skill Factory. Each skill is a JSON config your agent reads at runtime to call external services without custom integration code.

**What the agent does:**
1. Registers pre-built skills (email, Telegram, search, calendar)
2. Creates operations for each skill (the actual API endpoints)
3. Validates skills through the review pipeline
4. Verifies discovery works (list + get)

**Prerequisite:** ClawBuddy must be deployed and working. The `ai-tasks` edge function handles all skill operations.

---

## API Reference

**Endpoint:** `POST {CLAWBUDDY_API_URL}/functions/v1/ai-tasks`

**Auth header:** `x-webhook-secret: {CLAWBUDDY_WEBHOOK_SECRET}`

**Request format:** `{"request_type": "skill", "action": "...", ...}`

**Available actions:** `create`, `list`, `get`, `update`, `delete`, `submit` (review)

---

## Step 1: Register Core Skills

Create each skill with its operations. Set `agent_name: "Sherlock"` and `status: "ready"` on every skill.

### Telegram Notifications

```json
{
  "request_type": "skill",
  "action": "create",
  "name": "telegram-notify",
  "title": "Telegram Notifications",
  "description": "Send messages, alerts, and formatted reports to a Telegram chat. Supports Markdown and HTML formatting.",
  "protocol_type": "rest",
  "api_base_url": "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}",
  "auth_type": "api_key",
  "agent_name": "Sherlock",
  "status": "ready",
  "use_cases": [
    "Send task completion notifications",
    "Deliver daily digest and evening report summaries",
    "Alert on errors, blocked tasks, or urgent questions"
  ],
  "skill_operations": [
    {
      "name": "send_message",
      "title": "Send Text Message",
      "http_method": "POST",
      "endpoint_path": "/sendMessage",
      "request_body_schema": {
        "chat_id": "string — target chat ID",
        "text": "string — message content (up to 4096 chars)",
        "parse_mode": "Markdown or HTML"
      }
    },
    {
      "name": "send_photo",
      "title": "Send Photo with Caption",
      "http_method": "POST",
      "endpoint_path": "/sendPhoto",
      "request_body_schema": {
        "chat_id": "string",
        "photo": "URL of the image",
        "caption": "optional text caption"
      }
    }
  ]
}
```

### Send Email (AgentMail)

⚠️ User must provide their AgentMail API key and inbox ID.

```json
{
  "request_type": "skill",
  "action": "create",
  "name": "send-email",
  "title": "Send Email via AgentMail",
  "description": "Send emails with HTML formatting, multiple recipients, and plain text fallback.",
  "protocol_type": "rest",
  "api_base_url": "https://api.agentmail.to",
  "auth_type": "bearer",
  "auth_header": "Authorization",
  "auth_format": "Bearer {AGENTMAIL_API_KEY}",
  "agent_name": "Sherlock",
  "status": "ready",
  "use_cases": [
    "Send follow-up emails after meetings",
    "Deliver research reports to stakeholders",
    "Automated outreach and notifications"
  ],
  "skill_operations": [
    {
      "name": "send_message",
      "title": "Send Email",
      "http_method": "POST",
      "endpoint_path": "/inboxes/{inbox_id}/messages/send",
      "request_body_schema": {
        "to": "array of email address strings",
        "subject": "string",
        "html": "HTML body content",
        "text": "plain text fallback"
      },
      "example_request": {
        "to": ["recipient@example.com"],
        "subject": "Research Summary",
        "html": "<h1>Findings</h1><p>Details here...</p>",
        "text": "Findings: Details here..."
      }
    },
    {
      "name": "list_messages",
      "title": "List Inbox Messages",
      "http_method": "GET",
      "endpoint_path": "/inboxes/{inbox_id}/messages",
      "response_schema": {
        "messages": "array of message objects with id, from, subject, date"
      }
    }
  ]
}
```

### Web Search

⚠️ User must provide their search API key (SerpAPI, Brave Search, or similar).

```json
{
  "request_type": "skill",
  "action": "create",
  "name": "web-search",
  "title": "Web Search",
  "description": "Search the web and return structured results. Supports multiple search providers.",
  "protocol_type": "rest",
  "api_base_url": "https://serpapi.com",
  "auth_type": "api_key",
  "agent_name": "Sherlock",
  "status": "ready",
  "use_cases": [
    "Research competitors and market trends",
    "Find documentation and API references",
    "Verify facts and claims"
  ],
  "skill_operations": [
    {
      "name": "search",
      "title": "Google Search",
      "http_method": "GET",
      "endpoint_path": "/search",
      "request_body_schema": {
        "q": "search query string",
        "num": "number of results (default 10)",
        "api_key": "your API key"
      },
      "response_schema": {
        "organic_results": "array of {title, link, snippet}"
      }
    }
  ]
}
```

### Calendar Events (via Make.com Webhook)

⚠️ Requires Make.com scenario set up (see Supercharge Claude Code course).

```json
{
  "request_type": "skill",
  "action": "create",
  "name": "calendar-events",
  "title": "Calendar Events",
  "description": "Create, read, and manage calendar events via Make.com webhooks.",
  "protocol_type": "webhook",
  "api_base_url": "https://hook.us1.make.com",
  "agent_name": "Sherlock",
  "status": "ready",
  "use_cases": [
    "Schedule meetings and reminders",
    "Check tomorrow's calendar for prep",
    "Create follow-up events after meetings"
  ],
  "connection_config": {
    "event_types": ["create", "update", "delete"],
    "signature_algorithm": "hmac-sha256"
  },
  "skill_operations": [
    {
      "name": "create_event",
      "title": "Create Calendar Event",
      "http_method": "POST",
      "endpoint_path": "/{MAKE_WEBHOOK_ID}",
      "request_body_schema": {
        "title": "event title",
        "start": "ISO 8601 datetime",
        "end": "ISO 8601 datetime",
        "description": "optional details",
        "attendees": "array of email addresses"
      }
    }
  ]
}
```

### Document Analysis (Custom Protocol)

This skill uses the custom protocol with a methodology document instead of API operations.

```json
{
  "request_type": "skill",
  "action": "create",
  "name": "document-analysis",
  "title": "Document Analysis & Extraction",
  "description": "Extract text, tables, and structured data from PDFs, spreadsheets, and documents using AI summarization.",
  "protocol_type": "custom",
  "agent_name": "Sherlock",
  "agent_type": "claude-code",
  "status": "ready",
  "use_cases": [
    "Extract key findings from PDF reports",
    "Parse spreadsheet data into structured format",
    "Summarize meeting notes and transcripts"
  ],
  "skill_markdown": "# Document Analysis Methodology\n\n## Supported Formats\n- PDF (text extraction + AI summary)\n- CSV/Excel (pandas analysis)\n- DOCX (text + structure extraction)\n- TXT/MD (direct processing)\n\n## Workflow\n1. Identify file type from extension or content\n2. Extract raw text using appropriate library\n3. Structure extraction: headers, tables, lists\n4. AI summarization: key findings, action items, metrics\n5. Output as structured JSON or formatted report\n\n## Output Format\nReturn JSON with: summary, key_findings[], action_items[], metrics{}, raw_text_length",
  "output_format": "json",
  "input_schema": {
    "file_path": "absolute path to the document",
    "analysis_type": "summary | extraction | full"
  },
  "allowed_tools": ["web-search"]
}
```

---

## Step 2: Verify Skills

After creating all skills, verify they are registered correctly.

### List all skills
```json
{
  "request_type": "skill",
  "action": "list"
}
```
Should return all skills with `bujji_status: "accepted"`.

### Get a specific skill
```json
{
  "request_type": "skill",
  "action": "get",
  "skill_name": "telegram-notify"
}
```
Response should include the full skill record, operations array, `has_methodology`, and `input_fields_count`.

### Run validation on each skill
```json
{
  "request_type": "skill",
  "action": "submit",
  "skill_id": "<skill_id>"
}
```
Check for ❌ issues. Fix any blocking problems and resubmit.

---

## Step 3: Test Skill Execution

The agent should test at least one skill end-to-end:

1. **List skills** — `action: "list"` to discover available skills
2. **Get skill config** — `action: "get"` with the skill name
3. **Read the config** — Extract endpoint, auth, method, and parameters
4. **Execute the API call** — Use the skill config to make the actual HTTP request
5. **Log the result** — Create an AI log entry with the outcome

### Example: Test Telegram Notification

```python
import requests, os

# 1. Get skill config
skill = clawbuddy("skill", "get", skill_name="telegram-notify")
config = skill["skill"]

# 2. Build the request from the config
base_url = config["api_base_url"].replace("{TELEGRAM_BOT_TOKEN}", os.environ["TELEGRAM_BOT_TOKEN"])
operation = skill["skill"]["skill_operations"][0]  # send_message

# 3. Execute
resp = requests.post(
    f"{base_url}{operation['endpoint_path']}",
    json={
        "chat_id": os.environ["TELEGRAM_CHAT_ID"],
        "text": "Skill Library setup complete. All skills registered.",
        "parse_mode": "Markdown"
    }
)

# 4. Log the result
clawbuddy("log", "create", category="observation",
    message=f"Telegram skill test: {resp.status_code} — {'success' if resp.ok else 'failed'}")
```

---

## Step 4: Create Custom Skills (Optional)

Guide the user through creating a skill for any API they use. The process:

1. **Ask the user** what external services they want their agent to call
2. **Read the API docs** for each service
3. **Map to skill config:**
   - `name`: lowercase-with-hyphens, 3–50 chars
   - `protocol_type`: usually `rest` for standard APIs
   - `api_base_url`: the base URL from the API docs
   - `auth_type`: how the API authenticates (bearer, api_key, basic)
   - `skill_operations`: one operation per endpoint the agent needs
4. **Create via API** — `action: "create"` with the full config
5. **Validate** — `action: "submit"` to run the quality checks
6. **Test** — Execute the skill end-to-end

### Operation naming rules
- Must match: `^[a-z][a-z0-9_]{1,49}$`
- Examples: `send_message`, `search_web`, `create_event`, `get_status`

### Skill naming rules
- Must match: `^[a-z][a-z0-9-]{2,49}$`
- Examples: `telegram-notify`, `send-email`, `web-search`

---

## API Quirks & Known Issues

- **`agent_name` defaults to "OpenClaw"** — Always set `agent_name: "Sherlock"` (or your agent's name) explicitly
- **`status: "ready"` auto-accepts** — Sets `bujji_status: "accepted"` without running validation. Use for trusted configs.
- **`skill_operations` in update REPLACES ALL** — If you include operations in an `update`, it deletes existing ones and inserts the new set. Only include operations if you want a full replacement.
- **Custom protocol exemption** — Skills with `protocol_type: "custom"` don't need operations if they have `skill_markdown` (min 100 chars)
- **`list` only shows accepted skills** — Draft, rejected, or `needs_info` skills are hidden from the list action
- **Delete cascades** — Deleting a skill removes all its operations
- **Naming validation** — Both skill names and operation names are validated via Postgres triggers. Invalid names cause insert failures.

---

## Verification Checklist

After setup, verify:
- [ ] `list` returns all registered skills
- [ ] `get` returns full config with operations for each skill
- [ ] At least one skill executes successfully end-to-end
- [ ] `submit` returns ✅ validations with no ❌ issues
- [ ] Agent can discover and use skills without manual prompting
- [ ] Custom skills (if created) pass validation

---

## Quick Reference

| Action | Request | Notes |
|--------|---------|-------|
| Create skill | `action: "create"`, `name`, `title`, `agent_name: "Sherlock"` | Include `skill_operations` array |
| List skills | `action: "list"` | Only returns accepted skills |
| Get skill | `action: "get"`, `skill_id` or `skill_name` | Returns full config + operations |
| Update skill | `action: "update"`, `skill_id` | Operations array replaces all |
| Delete skill | `action: "delete"`, `skill_id` | Cascades to operations |
| Validate | `action: "submit"`, `skill_id` | Returns validations + issues + suggestions |
