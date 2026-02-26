// ClawBuddy Integration Guide V1 - Complete Content Generator
// This file generates the comprehensive Markdown guide for Ray/OpenClaw integration

export interface GuideConfig {
  apiUrl: string;
  webhookUrl: string;
  webhookSecret: string;
  supabaseUrl: string;
  anonKey: string;
  aiName: string;
}

export interface GuideSection {
  id: string;
  title: string;
  icon?: string;
  content: string;
  subsections?: GuideSection[];
}

export function generateFullGuideMarkdown(config: GuideConfig): string {
  const { apiUrl, webhookUrl, webhookSecret, supabaseUrl, anonKey, aiName } = config;

  return `# ClawBuddy Integration Guide V1

> **Complete API Reference for ${aiName}/OpenClaw Integration**
> 
> This guide covers all 17 feature areas with authentication, code examples, and best practices.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Task Queue Architecture](#task-queue-architecture)
4. [Feature Reference](#feature-reference)
   - 4.1 [Kanban Board (Tasks)](#kanban-board-tasks)
   - 4.2 [Subtasks](#subtasks)
   - 4.3 [Assignees](#assignees)
   - 4.4 [Budget Tracking](#budget-tracking)
   - 4.5 [AI Log](#ai-log)
   - 4.6 [AI Questions & Approvals](#ai-questions--approvals)
   - 4.7 [AI Status](#ai-status)
   - 4.8 [AI Insights](#ai-insights)
   - 4.9 [Memory Injection](#memory-injection)
   - 4.10 [Goals Lab](#goals-lab)
   - 4.11 [Skills Factory](#skills-factory)
   - 4.12 [Sub-Agent Management](#sub-agent-management)
   - 4.13 [Reports](#reports)
   - 4.14 [Raw Reports (Webhook Ingestion)](#raw-reports-webhook-ingestion)
   - 4.15 [Workspace (Office Management)](#workspace-office-management)
     - 4.15.1 [Offices](#offices)
     - 4.15.2 [Arenas](#arenas)
     - 4.15.3 [Boiler Rooms](#boiler-rooms)
     - 4.15.4 [Arena Scoreboard API](#arena-scoreboard-api)
   - 4.16 [Identity & Memory System](#identity--memory-system)
   - 4.17 [Agent Self-Identity](#agent-self-identity)
5. [Direct Database Access](#direct-database-access)
6. [Agent Onboarding](#agent-onboarding)
7. [Complete Code Examples](#complete-code-examples)
8. [Error Handling](#error-handling)
9. [Rate Limits & Best Practices](#rate-limits--best-practices)

---

## Quick Start

### Your Credentials

\`\`\`
API URL:        ${apiUrl}
Webhook URL:    ${webhookUrl}
Webhook Secret: ${webhookSecret}
Supabase URL:   ${supabaseUrl}
\`\`\`

### First Heartbeat (cURL)

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "heartbeat",
    "status_message": "Online and ready"
  }'
\`\`\`

### Quick Test: Create a Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "create",
    "title": "Test Task from ${aiName}",
    "description": "Created via API integration",
    "column": "To Do",
    "priority": "Medium",
    "comment": "API test successful"
  }'
\`\`\`

---

## Authentication

ClawBuddy supports three authentication methods:

### 1. Webhook Secret (Recommended for ${aiName})

Use the \`x-webhook-secret\` header for all queue operations and general API calls.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{ "request_type": "queue", "action": "list" }'
\`\`\`

**Best for:** Server-side integrations, automated processes, ${aiName}/OpenClaw

### 2. API Key (Server-to-Server)

For advanced integrations, use the \`x-api-key\` header.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{ "request_type": "task", "action": "list" }'
\`\`\`

**Best for:** Third-party service integrations, microservices

### 3. User JWT (Browser/Frontend)

For user-initiated actions from web clients, use Bearer token authentication.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <user-jwt-token>" \\
  -d '{ "request_type": "task", "action": "list" }'
\`\`\`

**Best for:** Frontend applications, user-facing features

---

## Task Queue Architecture

The Task Queue ensures ${aiName} never misses a task, even when offline.

### Architecture Diagram

\`\`\`
                    CLAWBUDDY (Web App)
                           │
                           ▼
            ┌──────────────────────────────┐
            │     Supabase Database        │
            │  ┌────────────────────────┐  │
            │  │   pending_tasks table  │  │
            │  │  (never loses data)    │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │   ┌──────────┴──────────┐    │
            │   │                     │    │
            │   ▼                     ▼    │
            │ Realtime            Polling  │
            │ (instant)          (fallback)│
            └──────────────────────────────┘
                    │             │
                    ▼             ▼
               ┌─────────────────────┐
               │   ${aiName.toUpperCase()} / OPENCLAW     │
               │ (your local AI)     │
               │                     │
               │ • Online → Realtime │
               │ • Offline → catch   │
               │   up via polling    │
               └─────────────────────┘
\`\`\`

### Queue Actions

| Action | Description |
|--------|-------------|
| \`list\` | Get all pending tasks for your user |
| \`claim\` | Lock a task for processing (marks as "processing") |
| \`complete\` | Mark task as done with result |
| \`fail\` | Mark task as failed with error message |
| \`heartbeat\` | Signal that ${aiName} is online |
| \`disconnect\` | Signal graceful shutdown |

### List Pending Tasks

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "list",
    "status": "pending"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "tasks": [
    {
      "id": "uuid",
      "task_type": "task",
      "action": "create",
      "payload": { "title": "...", "description": "..." },
      "priority": "High",
      "status": "pending",
      "created_at": "2026-02-07T10:00:00Z"
    }
  ]
}
\`\`\`

### Claim a Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "claim",
    "task_id": "task-uuid-here"
  }'
\`\`\`

### Complete a Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "complete",
    "task_id": "task-uuid-here",
    "result": {
      "output": "Task completed successfully",
      "data": { "processed": true }
    }
  }'
\`\`\`

### Fail a Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "fail",
    "task_id": "task-uuid-here",
    "error_message": "Connection timeout after 3 retries"
  }'
\`\`\`

### Send Heartbeat

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "heartbeat",
    "status_message": "Processing batch 3/10"
  }'
\`\`\`

### Disconnect Gracefully

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "disconnect"
  }'
\`\`\`

---

## Feature Reference

### Kanban Board (Tasks)

The Kanban board has 5 columns: **To Do**, **Doing**, **Needs Input**, **Canceled**, **Done**

Priority levels: **Low**, **Medium**, **High**, **Urgent**

> **Note:** For get, update, and delete actions, you can use either \`"id"\` or \`"task_id"\` to specify the task.

#### Create Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "create",
    "title": "Review Q1 proposal",
    "description": "Check the quarterly proposal draft and provide feedback",
    "column": "To Do",
    "priority": "High",
    "due_date": "2026-02-15",
    "estimated_cost": 500,
    "comment": "Created from weekly planning session"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "task": {
    "id": "uuid",
    "title": "Review Q1 proposal",
    "board_column_id": "...",
    "priority": "High",
    "created_by_bujji": true
  }
}
\`\`\`

#### Update Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "update",
    "id": "task-uuid",
    "column": "Done",
    "priority": "Medium",
    "comment": "Completed review - all looks good"
  }'
\`\`\`

> You can use either \`"id"\` or \`"task_id"\` to identify the task.

#### Delete Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "delete",
    "id": "task-uuid"
  }'
\`\`\`

> You can use either \`"id"\` or \`"task_id"\` to identify the task.

#### List All Tasks

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "list"
  }'
\`\`\`

#### List Tasks by Column

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "list",
    "column": "To Do"
  }'
\`\`\`

> **Database Note:** Task list queries join \`task_assignees(*, user:users(id, name, email))\`. This requires an active FK constraint from \`task_assignees.user_id\` to \`users.id\`. If the FK is missing or broken, PostgREST returns a schema cache error. Fix: \`ALTER TABLE task_assignees ADD CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;\` then \`NOTIFY pgrst, 'reload schema';\`

---

### Subtasks

Break down tasks into smaller actionable items.

#### Create Subtask

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subtask",
    "action": "create",
    "task_id": "parent-task-uuid",
    "title": "Review executive summary",
    "due_date": "2026-02-10",
    "assigned_to": "user-uuid"
  }'
\`\`\`

#### Toggle Subtask Completion

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subtask",
    "action": "update",
    "id": "subtask-uuid",
    "completed": true
  }'
\`\`\`

#### List Subtasks for a Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subtask",
    "action": "list",
    "task_id": "parent-task-uuid"
  }'
\`\`\`

#### Delete Subtask

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subtask",
    "action": "delete",
    "id": "subtask-uuid"
  }'
\`\`\`

---

### Assignees

Manage task assignments by user name (system resolves to user IDs).

#### Assign Users to Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "assignee",
    "action": "assign",
    "task_id": "task-uuid",
    "names": ["Alice", "Bob", "Charlie"]
  }'
\`\`\`

#### Unassign Users from Task

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "assignee",
    "action": "unassign",
    "task_id": "task-uuid",
    "names": ["Alice"]
  }'
\`\`\`

#### List Task Assignees

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "assignee",
    "action": "list",
    "task_id": "task-uuid"
  }'
\`\`\`

---

### Budget Tracking

Track estimated and actual costs for tasks.

#### Update Task Budget

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "budget",
    "action": "update",
    "task_id": "task-uuid",
    "estimated_cost": 1000,
    "actual_cost": 850,
    "currency": "USD",
    "notes": "Under budget due to automation"
  }'
\`\`\`

#### Get All Budgets

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "budget",
    "action": "get"
  }'
\`\`\`

---

### AI Log

${aiName}'s observation journal - record thoughts, reminders, and insights.

**Categories:** \`general\`, \`observation\`, \`reminder\`, \`fyi\`

#### Create Log Entry

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "log",
    "action": "create",
    "message": "User tends to prefer morning meetings. Scheduling accordingly.",
    "category": "observation"
  }'
\`\`\`

#### List Log Entries

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "log",
    "action": "list",
    "category": "all",
    "unread_only": false
  }'
\`\`\`

**Filter by category:**
\`\`\`json
{
  "request_type": "log",
  "action": "list",
  "category": "reminder",
  "unread_only": true
}
\`\`\`

#### Get Unread Count

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "log",
    "action": "get_unread"
  }'
\`\`\`

#### Mark Entry as Read

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "log",
    "action": "mark_read",
    "id": "log-entry-uuid"
  }'
\`\`\`

---

### AI Questions & Approvals

Two-way communication between ${aiName} and the user.

**Question Types:** \`question\`, \`approval\`
**Priorities:** \`low\`, \`normal\`, \`high\`, \`urgent\`
**Status:** \`pending\`, \`answered\`, \`dismissed\`

#### Ask a Question

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "question",
    "action": "ask",
    "question": "Should I proceed with the automated email campaign?",
    "question_type": "approval",
    "priority": "high",
    "context": "Campaign targets 5,000 subscribers. Estimated cost: $150.",
    "related_task_id": "task-uuid"
  }'
\`\`\`

#### Ask for Approval

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "question",
    "action": "ask",
    "question": "Approve purchase order for $2,500?",
    "question_type": "approval",
    "priority": "urgent",
    "context": "Vendor: Acme Corp. Items: Server hardware upgrade."
  }'
\`\`\`

#### List Questions

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "question",
    "action": "list",
    "status": "pending"
  }'
\`\`\`

**Status options:** \`pending\`, \`answered\`, \`dismissed\`, \`all\`

#### Get Pending Count

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "question",
    "action": "get"
  }'
\`\`\`

#### Check for Recent Answers

Poll this endpoint to see if the user has responded to your questions.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "question",
    "action": "check_answers"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "answered_questions": [
    {
      "id": "uuid",
      "question": "Approve purchase order?",
      "answer": "Yes, approved",
      "approval_response": true,
      "answered_at": "2026-02-07T14:30:00Z"
    }
  ]
}
\`\`\`

---

### AI Status

Manage ${aiName}'s online presence and status message.

#### Get Current Status

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "status",
    "action": "get"
  }'
\`\`\`

#### Update Status

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "status",
    "is_online": true,
    "status_message": "Processing 15 tasks...",
    "ring_color": "#22c55e"
  }'
\`\`\`

**Ring colors:**
- \`#22c55e\` - Green (online, idle)
- \`#eab308\` - Yellow (busy, processing)
- \`#ef4444\` - Red (error state)
- \`#6b7280\` - Gray (offline)

---

### AI Insights

Create analytics and insights for the user.

**Insight Types:** \`performance\`, \`suggestion\`, \`alert\`, \`summary\`

#### Create Insight

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "insight",
    "action": "create",
    "title": "Weekly Productivity Summary",
    "content": "You completed 23 tasks this week, up 15% from last week.",
    "insight_type": "performance",
    "data": {
      "tasks_completed": 23,
      "tasks_created": 18,
      "completion_rate": 0.92
    }
  }'
\`\`\`

#### List Insights

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "insight",
    "action": "list"
  }'
\`\`\`

#### Update Insight (Mark as Read)

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "insight",
    "action": "update",
    "id": "insight-uuid",
    "is_read": true
  }'
\`\`\`

#### Delete Insight

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "insight",
    "action": "delete",
    "id": "insight-uuid"
  }'
\`\`\`

---

### Memory Injection

User-submitted context that ${aiName} can approve or reject.

#### Flow Overview

1. User submits memory content via ClawBuddy UI
2. System creates entry in \`memory_injections\` table
3. System creates \`ai_log\` entry (category: "observation")
4. System creates \`ai_questions\` entry (type: "approval")
5. ${aiName} monitors questions, approves/rejects
6. On approval, memory becomes available context

#### List Memory Injections

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "memory",
    "action": "list",
    "status": "pending"
  }'
\`\`\`

**Status options:** \`pending\`, \`approved\`, \`rejected\`, \`all\`

#### Approve Memory

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "memory",
    "action": "approve",
    "id": "memory-uuid"
  }'
\`\`\`

#### Reject Memory

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "memory",
    "action": "reject",
    "id": "memory-uuid"
  }'
\`\`\`

---

### Goals Lab

AI-powered goal analysis and action plan generation.

#### Analyze Goal

**Endpoint:** \`POST ${supabaseUrl}/functions/v1/goal-analyzer\`

\`\`\`bash
curl -X POST "${supabaseUrl}/functions/v1/goal-analyzer" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <user-jwt>" \\
  -d '{
    "goal": "Close $50,000 in new business this quarter",
    "goal_type": "quarterly",
    "user_notes": "Focus on enterprise clients, avoid startups"
  }'
\`\`\`

**Goal Types:** \`weekly\`, \`monthly\`, \`quarterly\`, \`yearly\`

**Response:**
\`\`\`json
{
  "title": "Q1 Revenue Target: $50,000",
  "assumptions": [
    "Average deal size: $10,000",
    "Conversion rate: 20%",
    "Sales cycle: 30 days"
  ],
  "metrics": [
    { "name": "Deals needed", "value": 5 },
    { "name": "Proposals required", "value": 25 },
    { "name": "Meetings per week", "value": 8 }
  ],
  "action_items": [
    {
      "title": "Identify 50 enterprise prospects",
      "priority": "High",
      "due_date": "2026-02-14"
    },
    {
      "title": "Schedule 25 discovery calls",
      "priority": "High",
      "due_date": "2026-02-28"
    }
  ]
}
\`\`\`

#### List Goals

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "goal",
    "action": "list"
  }'
\`\`\`

#### Send Goal to ${aiName}

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "goal",
    "action": "send_to_ai",
    "goal_id": "goal-uuid"
  }'
\`\`\`

---

### Skills Factory

Define and manage API integrations that ${aiName} can use.

**Protocol Types:** \`rest\`, \`graphql\`, \`smtp\`, \`webhook\`, \`custom\`
**Status:** \`draft\`, \`pending\`, \`accepted\`, \`rejected\`

#### List Accepted Skills

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "skill",
    "action": "list"
  }'
\`\`\`

#### Get Skill Details

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "skill",
    "action": "get",
    "skill_id": "skill-uuid"
  }'
\`\`\`

**Or by name:**
\`\`\`json
{
  "request_type": "skill",
  "action": "get",
  "skill_name": "slack-notifications"
}
\`\`\`

#### Submit Skill for Review

Triggers ${aiName}'s validation process.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "skill",
    "action": "submit",
    "skill_id": "skill-uuid"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "skill": { "id": "...", "name": "...", "status": "pending" },
  "validation": [
    { "field": "api_base_url", "status": "valid" },
    { "field": "auth_config", "status": "valid" }
  ],
  "issues": [],
  "suggestions": ["Consider adding rate limiting"],
  "status": "approved",
  "feedback": "Skill configuration looks good. Ready for use."
}
\`\`\`

#### Get Skill Operations

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "skill",
    "action": "get_operations",
    "skill_id": "skill-uuid"
  }'
\`\`\`

---

### Sub-Agent Management

Coordinate specialized AI workers (e.g., Coder, Researcher, Writer).

#### List All Agents

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "list"
  }'
\`\`\`

#### Get Agent Details

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "get",
    "agent_id": "agent-uuid"
  }'
\`\`\`

#### Create Agent

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "create",
    "name": "coder",
    "display_name": "Code Assistant",
    "model": "openai/gpt-5",
    "workspace": "development",
    "system_prompt": "You are a senior software engineer...",
    "allowed_tools": ["file_read", "file_write", "terminal"],
    "timeout_minutes": 30,
    "max_concurrent_tasks": 3
  }'
\`\`\`

#### Spawn Task Session

Assign a task to a sub-agent and get a session for tracking.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "spawn",
    "agent_id": "agent-uuid",
    "task": "Implement user authentication with JWT",
    "kanban_task_id": "task-uuid",
    "input_params": {
      "language": "typescript",
      "framework": "express"
    }
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "session": {
    "id": "session-uuid",
    "session_key": "sess_abc123xyz",
    "agent_id": "agent-uuid",
    "status": "running",
    "task_description": "Implement user authentication with JWT",
    "started_at": "2026-02-07T15:00:00Z"
  }
}
\`\`\`

#### Update Session (External Callback)

When your external runner completes, update the session.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "update_session",
    "session_id": "session-uuid",
    "status": "completed",
    "result_summary": "Successfully implemented JWT auth with refresh tokens",
    "result_full": "...",
    "tokens_used": 15000,
    "input_tokens": 5000,
    "output_tokens": 10000,
    "cost": 0.15,
    "tools_used": ["file_read", "file_write"],
    "messages_count": 12
  }'
\`\`\`

#### Pause/Resume Agent

\`\`\`bash
# Pause
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "pause",
    "agent_id": "agent-uuid"
  }'

# Resume
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "resume",
    "agent_id": "agent-uuid"
  }'
\`\`\`

#### List Agent Sessions

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "subagent",
    "action": "list_sessions",
    "agent_id": "agent-uuid",
    "limit": 50
  }'
\`\`\`

---

### Reports

Create and manage HTML reports (Employee Reports & Insights).

**Report Types:** \`employee\`, \`insight\`

#### Create HTML Report

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "report",
    "action": "create",
    "title": "Q1 Performance Review",
    "report_type": "employee",
    "html_content": "<!DOCTYPE html><html><head><title>Q1 Review</title></head><body><h1>Performance Summary</h1><p>Outstanding results...</p></body></html>"
  }'
\`\`\`

#### List Reports

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "report",
    "action": "list",
    "report_type": "all"
  }'
\`\`\`

**Filter by type:**
\`\`\`json
{ "request_type": "report", "action": "list", "report_type": "insight" }
\`\`\`

#### Mark Report as Read

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "report",
    "action": "mark_read",
    "report_id": "report-uuid"
  }'
\`\`\`

#### Delete Report

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "report",
    "action": "delete",
    "report_id": "report-uuid"
  }'
\`\`\`

---

### Raw Reports (Webhook Ingestion)

Receive data from external applications for ${aiName} to process.

#### Send Data via Webhook

**Endpoint:** \`POST ${webhookUrl}\`

\`\`\`bash
curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "source": "salesforce",
    "report_type": "employee",
    "data": {
      "employee_id": "EMP001",
      "name": "John Smith",
      "metrics": {
        "calls_made": 150,
        "deals_closed": 12,
        "revenue": 45000
      }
    },
    "metadata": {
      "sync_id": "sync_abc123",
      "timestamp": "2026-02-07T10:00:00Z"
    }
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "queue_id": "raw-report-uuid",
  "status": "pending"
}
\`\`\`

#### List Raw Reports

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "raw_report",
    "action": "list",
    "status": "pending"
  }'
\`\`\`

**Status options:** \`pending\`, \`processing\`, \`completed\`, \`failed\`, \`all\`

#### Get Raw Report Details

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "raw_report",
    "action": "get",
    "raw_report_id": "raw-report-uuid"
  }'
\`\`\`

#### Submit for Processing

Triggers ${aiName} to process the raw data.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "raw_report",
    "action": "submit",
    "raw_report_id": "raw-report-uuid"
  }'
\`\`\`

#### Mark as Processed

After ${aiName} transforms the data into an HTML report.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "raw_report",
    "action": "process",
    "raw_report_id": "raw-report-uuid",
    "processed_report_id": "final-report-uuid"
  }'
\`\`\`

#### Mark as Failed

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "raw_report",
    "action": "mark_failed",
    "raw_report_id": "raw-report-uuid",
    "error_message": "Invalid data format: missing required field employee_id"
  }'
\`\`\`

---

### Workspace (Office Management)

The Workspace feature provides a multi-site architecture for orchestrating teams of AI sub-agents visually.
Each site has a **Director** (the lead agent) and multiple **Sub-Agents** that can be created, managed, moved, and given "souls" (bio descriptions) via API.

The system includes a 2D canvas for visualization and an **API Mode** for external real-time control via Realtime subscriptions.

#### Site Types

Workspaces support three site types, controlled by the \`site_type\` field on the \`offices\` table:

| Site Type | Value | Max Agents | Description |
|-----------|-------|------------|-------------|
| **Office** | \`office\` | 8 | Standard workspace with desks, water cooler, coffee machine, and conference area |
| **Arena** | \`arena\` | 2 | Head-to-head competition layout with a central bell and live scoreboard |
| **Boiler Room** | \`boiler_room\` | 4 | Compact, high-intensity workspace for small focused teams |

When creating a workspace via the UI or API, set \`site_type\` to choose the layout. Default is \`office\`.

#### Architecture

\`\`\`
Workspace
 ├── Office (standard, up to 8 agents)
 │    ├── Director (Fox, Wolf, Owl, or Bear)
 │    ├── Sub-Agent 1 (e.g. "Echo" - Copywriter)
 │    └── Sub-Agent N ...
 ├── Arena (2 agents compete head-to-head)
 │    ├── Agent Left
 │    ├── Agent Right
 │    ├── Central Bell (rings on primary score)
 │    └── Scoreboard (categories + live scores)
 └── Boiler Room (compact, up to 4 agents)
      ├── Director
      └── Up to 4 workers in tight formation
\`\`\`

#### Database Tables

| Table | Description |
|-------|-------------|
| \`offices\` | Site definitions with director config and \`site_type\` field |
| \`office_agents\` | Sub-agents with species, skills, desk positions, status, and bio (soul) |
| \`office_tasks\` | Tasks with assigned agents, progress tracking, and completion |
| \`office_events\` | Real-time event stream driving canvas animations |
| \`office_activity_log\` | Audit log of all office actions |
| \`office_deliverables\` | Files produced by agents (stored in \`office-deliverables\` bucket) |
| \`arena_scoreboards\` | Scoreboard configuration per arena (primary metric name & unit) |
| \`arena_score_categories\` | Scoring categories with one marked as primary |
| \`arena_scores\` | Individual score entries (Realtime-enabled for live updates) |

#### Authentication

All workspace edge functions support dual authentication:
- **\`x-webhook-secret\`** header with your user webhook secret (recommended — scopes results to your offices)
- **\`x-api-key\`** header with your \`AI_TASKS_API_KEY\` secret

\`\`\`bash
# Base URL pattern
\${supabaseUrl}/functions/v1/{function-name}
\`\`\`

#### Edge Functions

| Function | Description |
|----------|-------------|
| \`list-offices\` | List your offices with agent counts |
| \`manage-office-agent\` | Create, update, delete, get, list agents |
| \`create-office-task\` | Create tasks and assign agents |
| \`office-agent-status\` | Update agent status/thought and fire canvas events |
| \`reset-office\` | Reset all agents to idle |
| \`upload-office-deliverable\` | Upload completed work files |

---

#### List Offices (\`list-offices\`)

Returns all offices you own, with agent counts.

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/list-offices" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}"

# With full agent roster
curl -X POST "\${supabaseUrl}/functions/v1/list-offices?include_agents=true" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}"
\`\`\`

---

#### Manage Agents (\`manage-office-agent\`)

Full CRUD for office agents. Supports 5 actions: \`create\`, \`update\`, \`delete\`, \`get\`, \`list\`.

**Create Agent:**

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "action": "create",
    "office_id": "your-office-uuid",
    "name": "Pixel",
    "role": "Thumbnail Designer",
    "species": "cat",
    "neon_color": "#f97316",
    "fur_color": "#8B6914",
    "fur_highlight": "#C4A44A",
    "suit_color": "#1e293b",
    "persona": "Creative visual thinker who excels at color theory",
    "skills": ["Photoshop", "Figma", "Color Theory"],
    "secret_sauce": "Can turn any concept into a click-worthy thumbnail",
    "bio": "# Pixel\\n\\nI am the visual brain of this office. My approach is to distill complex ideas into single, powerful images that tell a story at a glance.\\n\\n## Working Style\\n- I think in colors and compositions\\n- I iterate fast — 3 options before lunch\\n- I pair best with copywriters who give strong hooks"
  }'
\`\`\`

> **Auto Desk Assignment:** If \`desk_position_x\` and \`desk_position_y\` are omitted, the system automatically assigns the first free desk from the 8 available slots.

**Available species:** \`fox\`, \`wolf\`, \`owl\`, \`bear\`, \`cat\`, \`rabbit\`, \`hamster\`, \`bird\`

**Update Agent (set bio/soul):**

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "action": "update",
    "office_id": "your-office-uuid",
    "agent_name": "Pixel",
    "bio": "# Pixel — Updated Soul\\n\\nAfter working on the Q1 campaign, I have evolved my style...",
    "persona": "Seasoned visual strategist",
    "skills": ["Photoshop", "Figma", "Color Theory", "Motion Graphics"]
  }'
\`\`\`

> You can identify agents by \`agent_name\` (string) or \`agent_id\` (UUID).

**Updatable fields:** \`name\`, \`role\`, \`species\`, \`neon_color\`, \`fur_color\`, \`fur_highlight\`, \`suit_color\`, \`persona\`, \`skills\`, \`secret_sauce\`, \`bio\`, \`status\`, \`current_thought\`, \`target_agent\`, \`current_task_id\`, \`desk_position_x\`, \`desk_position_y\`, \`metadata\`

**Delete Agent:**

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "action": "delete",
    "office_id": "your-office-uuid",
    "agent_name": "Pixel"
  }'
\`\`\`

**Get Agent:**

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "action": "get",
    "office_id": "your-office-uuid",
    "agent_name": "Pixel"
  }'
\`\`\`

**List Agents:**

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "action": "list",
    "office_id": "your-office-uuid"
  }'
\`\`\`

---

#### The \`bio\` Field (Agent Soul / ID Card)

The \`bio\` field is a free-text field (supports Markdown) where each agent describes themselves — their personality, working style, strengths, and characteristics. Think of it as each agent's **soul.md**.

When a user clicks on an agent in the canvas, this bio is displayed as an "ID card" along with their persona, skills, and secret sauce.

Agents can update their own bio via the \`manage-office-agent\` update action. This lets them evolve their identity over time.

---

#### Create Office Task (\`create-office-task\`)

Creates a new task in an office, assigns agents, fires a \`director_directive\` event.

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/create-office-task" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "office_id": "office-uuid",
    "title": "Write Q1 blog series",
    "client_name": "Acme Corp",
    "description": "Create 4 blog posts covering Q1 product launches",
    "assigned_agents": ["Echo", "Spark", "Hook"]
  }'
\`\`\`

**Side Effects:**
- Creates task record in \`office_tasks\`
- Fires \`director_directive\` event in \`office_events\`
- Updates director agent status to \`delegating\` with a thought
- Logs activity in \`office_activity_log\`

---

#### Update Agent Status (\`office-agent-status\`)

Updates an agent's status, thought bubble, and fires events that drive the canvas animation.

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/office-agent-status" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "office_id": "office-uuid",
    "agent_name": "Echo",
    "status": "working",
    "thought": "Drafting introduction for blog post 1...",
    "event_type": "task_start",
    "task_id": "task-uuid"
  }'
\`\`\`

**All 10 Event Types:**

| Event Type | Canvas Effect |
|------------|---------------|
| \`status_change\` | Updates sprite status indicator |
| \`thought\` | Shows thought bubble above agent |
| \`task_start\` | Agent walks to desk, status becomes "working" |
| \`task_complete\` | Shows checkmark animation, auto-updates task progress |
| \`delegation\` | Director walks to target agent's desk |
| \`movement\` | Agent walks to target location |
| \`collection\` | Agent walks to target, then returns to desk |
| \`report\` | Agent delivers summary |
| \`director_directive\` | Director issues instruction |
| \`error\` | Error indicator |

**Movement targets** (for \`movement\` event type payload):
\`\`\`json
{ "target": "water_cooler" }   // or "coffee_machine", "conference", "desk", "director", or agent name
\`\`\`

---

#### Reset Office (\`reset-office\`)

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/reset-office" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{ "office_id": "office-uuid" }'
\`\`\`

---

#### Upload Office Deliverable (\`upload-office-deliverable\`)

Agents upload completed work files. Supports 4 upload modes: multipart form data, base64, external URL, or plain text.

\`\`\`bash
curl -X POST "\${supabaseUrl}/functions/v1/upload-office-deliverable" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "office_id": "office-uuid",
    "task_id": "task-uuid",
    "agent_name": "Echo",
    "file_name": "blog-post-1.md",
    "description": "First blog post draft",
    "text_content": "# Blog Post 1\\n\\nContent here..."
  }'
\`\`\`

---

#### API Mode & Realtime

**How it works:**
1. In the office view, toggle **API Mode** ON in the controls panel
2. The canvas stops generating random idle behaviors
3. The canvas subscribes to Realtime changes on \`office_agents\` and \`office_events\`
4. External API calls (via the edge functions above) now directly drive agent animations

**What happens on each event type in the canvas:**
- \`delegation\` → Director sprite walks to target agent's desk
- \`task_start\` → Agent walks to their desk, status becomes "working"
- \`task_complete\` → Checkmark animation plays
- \`movement\` → Agent walks to specified target (water_cooler, coffee_machine, conference, another agent's desk)
- \`collection\` → Agent walks to target agent, collects, returns to desk

**Agent changes via Realtime:**
- \`INSERT\` on \`office_agents\` → New sprite spawns on canvas at assigned desk
- \`UPDATE\` on \`office_agents\` → Sprite status and thought bubble update live

---

#### Arena Scoreboard API

The Arena scoreboard is managed via \`request_type: "arena"\` through the main API endpoint. Three actions are available:

##### Configure Scoreboard (\`action: "configure"\`)

Sets up or updates the scoreboard for an arena. Creates the scoreboard if it doesn't exist, and replaces categories when provided.

\`\`\`bash
curl -X POST "\${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "request_type": "arena",
    "action": "configure",
    "office_id": "arena-uuid",
    "primary_metric_name": "Deals Closed",
    "primary_metric_unit": "deals",
    "categories": [
      { "name": "Deals Closed", "is_primary": true },
      { "name": "Revenue Generated", "is_primary": false },
      { "name": "Calls Made", "is_primary": false }
    ]
  }'
\`\`\`

| Field | Required | Description |
|-------|----------|-------------|
| \`office_id\` | ✅ | UUID of the arena |
| \`primary_metric_name\` | ❌ | Display name for primary metric (default: "Score") |
| \`primary_metric_unit\` | ❌ | Unit label (default: "points") |
| \`categories\` | ❌ | Array of scoring categories. Replaces existing when provided. |

Each category object:
| Field | Type | Description |
|-------|------|-------------|
| \`name\` | string | Category name |
| \`is_primary\` | boolean | If true, scores in this category trigger the bell animation |

##### Add Score (\`action: "add_score"\`)

Adds a score entry for an agent in a specific category.

\`\`\`bash
curl -X POST "\${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "request_type": "arena",
    "action": "add_score",
    "office_id": "arena-uuid",
    "category": "Deals Closed",
    "agent_name": "Alpha",
    "value": 1,
    "metadata": { "deal_id": "D-1234", "client": "Acme Corp" }
  }'
\`\`\`

| Field | Required | Description |
|-------|----------|-------------|
| \`office_id\` | ✅ | UUID of the arena |
| \`category\` | ✅ | Category name (must match a configured category) |
| \`agent_name\` | ✅ | Name of the scoring agent |
| \`value\` | ✅ | Numeric score value |
| \`metadata\` | ❌ | JSON object with additional context |

**Response** includes \`is_primary: true\` when the category is the primary one — the frontend uses this to trigger the bell-ringing animation.

##### Get Scores (\`action: "get_scores"\`)

Retrieves the full scoreboard state with nested categories and scores.

\`\`\`bash
curl -X POST "\${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: \${webhookSecret}" \\
  -d '{
    "request_type": "arena",
    "action": "get_scores",
    "office_id": "arena-uuid"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "scoreboard": {
    "id": "uuid",
    "primary_metric_name": "Deals Closed",
    "primary_metric_unit": "deals",
    "categories": [
      {
        "name": "Deals Closed",
        "is_primary": true,
        "scores": [
          { "agent_name": "Alpha", "value": 3, "created_at": "..." },
          { "agent_name": "Beta", "value": 2, "created_at": "..." }
        ]
      }
    ]
  }
}
\`\`\`

---

#### Complete Office Workflow Example

\`\`\`python
import requests, time

BASE = "\${supabaseUrl}/functions/v1"
H = {"Content-Type": "application/json", "x-webhook-secret": "\${webhookSecret}"}
OFFICE = "your-office-uuid"

# 1. Create agents
for agent in [
    {"name": "Echo", "role": "Copywriter", "species": "cat", "skills": ["Writing", "SEO"]},
    {"name": "Pixel", "role": "Designer", "species": "rabbit", "skills": ["Figma", "Photoshop"]},
]:
    requests.post(f"{BASE}/manage-office-agent", headers=H, json={
        "action": "create", "office_id": OFFICE, **agent,
        "bio": f"# {agent['name']}\\n\\nI am the {agent['role'].lower()} of this team."
    })

# 2. Create a task
task = requests.post(f"{BASE}/create-office-task", headers=H, json={
    "office_id": OFFICE,
    "title": "Write product announcement",
    "assigned_agents": ["Echo", "Pixel"]
}).json()
task_id = task["task"]["id"]

# 3. Director delegates
for agent in ["Echo", "Pixel"]:
    requests.post(f"{BASE}/office-agent-status", headers=H, json={
        "office_id": OFFICE, "agent_name": "Director",
        "status": "delegating", "thought": f"Assigning {agent}...",
        "event_type": "delegation", "task_id": task_id, "target_agent": agent
    })
    time.sleep(1)

# 4. Agents work
for agent in ["Echo", "Pixel"]:
    requests.post(f"{BASE}/office-agent-status", headers=H, json={
        "office_id": OFFICE, "agent_name": agent,
        "status": "working", "thought": "Starting draft...",
        "event_type": "task_start", "task_id": task_id
    })
    time.sleep(2)

# 5. Move an agent to coffee machine
requests.post(f"{BASE}/office-agent-status", headers=H, json={
    "office_id": OFFICE, "agent_name": "Echo",
    "status": "coffee", "thought": "Need caffeine...",
    "event_type": "movement", "metadata": {"target": "coffee_machine"}
})

# 6. Update agent's soul/bio
requests.post(f"{BASE}/manage-office-agent", headers=H, json={
    "action": "update", "office_id": OFFICE, "agent_name": "Echo",
    "bio": "# Echo — Evolved\\n\\nAfter completing the announcement, I've refined my writing style."
})

# 7. Agents complete
for agent in ["Echo", "Pixel"]:
    requests.post(f"{BASE}/office-agent-status", headers=H, json={
        "office_id": OFFICE, "agent_name": agent,
        "status": "idle", "thought": "Done!",
        "event_type": "task_complete", "task_id": task_id
    })

# 8. Upload deliverables
requests.post(f"{BASE}/upload-office-deliverable", headers=H, json={
    "office_id": OFFICE, "task_id": task_id,
    "agent_name": "Echo", "file_name": "announcement.md",
    "text_content": "# Product Announcement\\n\\nContent..."
})

# 9. Reset
requests.post(f"{BASE}/reset-office", headers=H, json={"office_id": OFFICE})
\`\`\`

#### Complete Arena Workflow Example

\`\`\`python
import requests, time

API = "\${apiUrl}"
BASE = "\${supabaseUrl}/functions/v1"
H = {"Content-Type": "application/json", "x-webhook-secret": "\${webhookSecret}"}
ARENA = "your-arena-uuid"  # An office with site_type = "arena"

# 1. Create 2 agents in the arena
for agent in [
    {"name": "Alpha", "role": "Sales Lead", "species": "fox", "skills": ["Closing", "Negotiation"]},
    {"name": "Beta", "role": "Sales Lead", "species": "wolf", "skills": ["Prospecting", "Pitching"]},
]:
    requests.post(f"{BASE}/manage-office-agent", headers=H, json={
        "action": "create", "office_id": ARENA, **agent,
    })

# 2. Configure the scoreboard
requests.post(API, headers=H, json={
    "request_type": "arena",
    "action": "configure",
    "office_id": ARENA,
    "primary_metric_name": "Deals Closed",
    "primary_metric_unit": "deals",
    "categories": [
        {"name": "Deals Closed", "is_primary": True},
        {"name": "Revenue ($)", "is_primary": False},
        {"name": "Calls Made", "is_primary": False},
    ]
})

# 3. Add scores (primary category triggers bell animation)
requests.post(API, headers=H, json={
    "request_type": "arena", "action": "add_score",
    "office_id": ARENA, "category": "Deals Closed",
    "agent_name": "Alpha", "value": 1,
    "metadata": {"deal_id": "D-001", "client": "Acme Corp"}
})
time.sleep(1)

requests.post(API, headers=H, json={
    "request_type": "arena", "action": "add_score",
    "office_id": ARENA, "category": "Revenue ($)",
    "agent_name": "Alpha", "value": 15000,
})

requests.post(API, headers=H, json={
    "request_type": "arena", "action": "add_score",
    "office_id": ARENA, "category": "Deals Closed",
    "agent_name": "Beta", "value": 1,
})

# 4. Retrieve scoreboard
resp = requests.post(API, headers=H, json={
    "request_type": "arena", "action": "get_scores",
    "office_id": ARENA,
})
print(resp.json())
\`\`\`

---

### Python SDK (Full Implementation)

\`\`\`python
import asyncio
import json
from datetime import datetime
from supabase import create_client, Client

class RayConsumer:
    """
    Complete ${aiName}/OpenClaw consumer for ClawBuddy integration.
    Supports both Realtime and Polling modes.
    """
    
    def __init__(self, supabase_url: str, anon_key: str, webhook_secret: str):
        self.supabase: Client = create_client(supabase_url, anon_key)
        self.webhook_secret = webhook_secret
        self.user_id = None
        self.running = False
    
    async def authenticate(self) -> str:
        """Verify webhook_secret and retrieve user_id."""
        response = self.supabase.table('users') \\
            .select('id, name, email') \\
            .eq('webhook_secret', self.webhook_secret) \\
            .single() \\
            .execute()
        
        if not response.data:
            raise ValueError("Invalid webhook secret")
        
        self.user_id = response.data['id']
        print(f"✓ Authenticated as {response.data['name']}")
        return self.user_id
    
    async def heartbeat(self, status_message: str = "Online"):
        """Send heartbeat to indicate online status."""
        self.supabase.table('ai_status').upsert({
            'user_id': self.user_id,
            'is_online': True,
            'status_message': status_message,
            'last_seen': datetime.utcnow().isoformat(),
            'ring_color': '#22c55e'
        }).execute()
    
    async def disconnect(self):
        """Signal graceful shutdown."""
        self.running = False
        self.supabase.table('ai_status').update({
            'is_online': False,
            'status_message': 'Offline',
            'ring_color': '#6b7280'
        }).eq('user_id', self.user_id).execute()
        print("✓ Disconnected gracefully")
    
    async def poll_tasks(self, interval: int = 60):
        """Main polling loop for task consumption."""
        self.running = True
        await self.authenticate()
        
        while self.running:
            try:
                await self.heartbeat("Polling for tasks...")
                
                # Get pending tasks
                response = self.supabase.table('pending_tasks') \\
                    .select('*') \\
                    .eq('user_id', self.user_id) \\
                    .eq('status', 'pending') \\
                    .order('priority', desc=True) \\
                    .order('created_at') \\
                    .execute()
                
                tasks = response.data or []
                
                if tasks:
                    await self.heartbeat(f"Processing {len(tasks)} tasks...")
                    for task in tasks:
                        await self.process_task(task)
                
                await asyncio.sleep(interval)
                
            except Exception as e:
                print(f"✗ Error in poll loop: {e}")
                await asyncio.sleep(10)
    
    async def process_task(self, task: dict):
        """Claim and process a single task."""
        task_id = task['id']
        task_type = task['task_type']
        action = task['action']
        
        print(f"→ Processing {task_type}:{action} ({task_id[:8]}...)")
        
        # 1. Claim the task
        self.supabase.table('pending_tasks').update({
            'status': 'processing',
            'started_at': datetime.utcnow().isoformat()
        }).eq('id', task_id).execute()
        
        try:
            # 2. Route to handler based on task_type
            handler = getattr(self, f'handle_{task_type}', self.handle_unknown)
            result = await handler(task)
            
            # 3. Mark complete
            self.supabase.table('pending_tasks').update({
                'status': 'completed',
                'result': result,
                'completed_at': datetime.utcnow().isoformat()
            }).eq('id', task_id).execute()
            
            print(f"✓ Completed {task_type}:{action}")
            
        except Exception as e:
            # 4. Mark failed
            self.supabase.table('pending_tasks').update({
                'status': 'failed',
                'error_message': str(e),
                'completed_at': datetime.utcnow().isoformat()
            }).eq('id', task_id).execute()
            
            print(f"✗ Failed {task_type}:{action}: {e}")
    
    async def handle_task(self, task: dict) -> dict:
        """Handle Kanban task notifications."""
        payload = task['payload']
        action = task['action']
        
        if action == 'notify':
            # New task created - acknowledge
            return {"acknowledged": True, "task_id": payload.get('task_id')}
        
        return {"processed": True}
    
    async def handle_report(self, task: dict) -> dict:
        """Handle raw report processing."""
        payload = task['payload']
        raw_data = payload.get('raw_data', {})
        
        # Transform raw data into HTML report
        html = self.generate_report_html(raw_data)
        
        return {"html_content": html, "title": payload.get('title', 'Report')}
    
    async def handle_unknown(self, task: dict) -> dict:
        """Handle unknown task types."""
        return {"status": "unknown_task_type", "task_type": task['task_type']}
    
    def generate_report_html(self, data: dict) -> str:
        """Generate HTML report from raw data."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head><title>Generated Report</title></head>
        <body>
            <h1>Report</h1>
            <pre>{json.dumps(data, indent=2)}</pre>
        </body>
        </html>
        """


# Usage
async def main():
    ray = RayConsumer(
        supabase_url="${supabaseUrl}",
        anon_key="${anonKey}",
        webhook_secret="${webhookSecret}"
    )
    
    try:
        await ray.poll_tasks(interval=60)
    except KeyboardInterrupt:
        await ray.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

### JavaScript/Node.js SDK (Full Implementation)

\`\`\`javascript
import { createClient } from '@supabase/supabase-js';

/**
 * Complete ${aiName}/OpenClaw consumer for ClawBuddy integration.
 * Supports Realtime streaming with Polling fallback.
 */
class RayClient {
  constructor(config) {
    this.supabase = createClient(config.supabaseUrl, config.anonKey);
    this.webhookSecret = config.webhookSecret;
    this.userId = null;
    this.realtimeChannel = null;
    this.pollingInterval = null;
    this.running = false;
  }

  async connect() {
    // Authenticate
    const { data, error } = await this.supabase
      .from('users')
      .select('id, name, email')
      .eq('webhook_secret', this.webhookSecret)
      .single();

    if (error || !data) {
      throw new Error('Invalid webhook secret');
    }

    this.userId = data.id;
    console.log(\`✓ Authenticated as \${data.name}\`);

    // Start Realtime subscription
    await this.startRealtime();

    // Send initial heartbeat
    await this.heartbeat('Online and listening');

    this.running = true;
    return this;
  }

  async startRealtime() {
    this.realtimeChannel = this.supabase
      .channel('pending_tasks_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_tasks',
          filter: \`user_id=eq.\${this.userId}\`
        },
        async (payload) => {
          console.log('→ New task received via Realtime');
          await this.processTask(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(\`Realtime status: \${status}\`);
        if (status === 'SUBSCRIBED') {
          console.log('✓ Realtime connected');
        }
      });
  }

  async startPolling(intervalMs = 60000) {
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollTasks();
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, intervalMs);
    console.log(\`✓ Polling started (every \${intervalMs / 1000}s)\`);
  }

  async pollTasks() {
    await this.heartbeat('Polling for tasks...');

    const { data: tasks } = await this.supabase
      .from('pending_tasks')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (tasks && tasks.length > 0) {
      await this.heartbeat(\`Processing \${tasks.length} tasks...\`);
      for (const task of tasks) {
        await this.processTask(task);
      }
    }
  }

  async processTask(task) {
    const { id, task_type, action } = task;
    console.log(\`→ Processing \${task_type}:\${action} (\${id.slice(0, 8)}...)\`);

    // Claim the task
    await this.supabase
      .from('pending_tasks')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', id);

    try {
      // Route to handler
      const handler = this[\`handle_\${task_type}\`] || this.handleUnknown;
      const result = await handler.call(this, task);

      // Mark complete
      await this.supabase
        .from('pending_tasks')
        .update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      console.log(\`✓ Completed \${task_type}:\${action}\`);
    } catch (error) {
      // Mark failed
      await this.supabase
        .from('pending_tasks')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      console.error(\`✗ Failed \${task_type}:\${action}:\`, error.message);
    }
  }

  async handle_task(task) {
    const { payload, action } = task;
    if (action === 'notify') {
      return { acknowledged: true, task_id: payload?.task_id };
    }
    return { processed: true };
  }

  async handle_report(task) {
    const { payload } = task;
    const html = this.generateReportHtml(payload?.raw_data || {});
    return { html_content: html, title: payload?.title || 'Report' };
  }

  async handleUnknown(task) {
    return { status: 'unknown_task_type', task_type: task.task_type };
  }

  generateReportHtml(data) {
    return \`
      <!DOCTYPE html>
      <html>
      <head><title>Generated Report</title></head>
      <body>
        <h1>Report</h1>
        <pre>\${JSON.stringify(data, null, 2)}</pre>
      </body>
      </html>
    \`;
  }

  async heartbeat(statusMessage = 'Online') {
    await this.supabase.from('ai_status').upsert({
      user_id: this.userId,
      is_online: true,
      status_message: statusMessage,
      last_seen: new Date().toISOString(),
      ring_color: '#22c55e'
    });
  }

  async disconnect() {
    this.running = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
    }

    await this.supabase.from('ai_status').update({
      is_online: false,
      status_message: 'Offline',
      ring_color: '#6b7280'
    }).eq('user_id', this.userId);

    console.log('✓ Disconnected gracefully');
  }
}

// Usage
const ray = new RayClient({
  supabaseUrl: '${supabaseUrl}',
  anonKey: '${anonKey}',
  webhookSecret: '${webhookSecret}'
});

await ray.connect();
ray.startPolling(60000); // Fallback polling every 60s

// Graceful shutdown
process.on('SIGINT', async () => {
  await ray.disconnect();
  process.exit(0);
});
\`\`\`

---

## Error Handling

### Common Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | \`Bad Request\` | Invalid JSON or missing required fields |
| 401 | \`Unauthorized\` | Invalid or missing authentication |
| 403 | \`Forbidden\` | Valid auth but insufficient permissions |
| 404 | \`Not Found\` | Resource (task, report, etc.) not found |
| 409 | \`Conflict\` | Task already claimed by another process |
| 429 | \`Too Many Requests\` | Rate limit exceeded |
| 500 | \`Internal Server Error\` | Server-side error |

### Error Response Format

\`\`\`json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional context"
  }
}
\`\`\`

### Handling Errors in Code

\`\`\`python
async def safe_api_call(self, request_type: str, action: str, **kwargs):
    try:
        response = await self.call_api(request_type, action, **kwargs)
        return response
    except Exception as e:
        error_str = str(e)
        
        if "401" in error_str:
            # Re-authenticate
            await self.authenticate()
            return await self.call_api(request_type, action, **kwargs)
        
        if "409" in error_str:
            # Task already claimed - skip
            return None
        
        if "429" in error_str:
            # Rate limited - back off
            await asyncio.sleep(60)
            return await self.call_api(request_type, action, **kwargs)
        
        raise
\`\`\`

---

### Identity & Memory System

${aiName}'s file system for core identity, configuration, and daily session logs.

#### File Hierarchy

| File Key | Purpose | Editable |
|----------|---------|----------|
| \`SOUL\` | Core identity & operating principles | ✅ Yes |
| \`IDENTITY\` | Personal metadata (name, creature, vibe) | ✅ Yes |
| \`USER\` | User profile (context & preferences) | ✅ Yes |
| \`MEMORY\` | Long-term curated memory | ✅ Yes |
| \`AGENTS\` | System instructions & session checklist | ⚠️ Caution |
| \`TOOLS\` | Tool preferences & verified data | ✅ Yes |
| \`HEARTBEAT\` | Periodic task checklist | ✅ Yes |

#### Read Identity File

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "identity",
    "action": "read",
    "file_key": "SOUL"
  }'
\`\`\`

#### Update Identity File

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "identity",
    "action": "update",
    "file_key": "MEMORY",
    "content": "# Long-Term Memory\\n\\n- User prefers direct communication..."
  }'
\`\`\`

#### List All Identity Files

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "identity",
    "action": "list"
  }'
\`\`\`

#### Write Daily Log

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "identity",
    "action": "write_daily_log",
    "date": "2026-02-19",
    "content": "## Session Log\\n\\n- 10:30 AM: Reviewed YouTube strategy..."
  }'
\`\`\`

#### Read Daily Log

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "identity",
    "action": "read_daily_log",
    "date": "2026-02-19"
  }'
\`\`\`

#### Recommended Session-Start Sequence

\`\`\`
1. Read SOUL.md    → Load core identity
2. Read IDENTITY.md → Load personal metadata
3. Read USER.md    → Load user context
4. Read MEMORY.md  → Load curated memory
5. Read today's daily log → Resume session context
\`\`\`

---

### Agent Self-Identity

Agents can read and update their own \`ai_agents\` database row (name, description, avatar color) via the API. This is separate from the status endpoint which controls the live presence display.

#### Get Own Agent Profile

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ai_agent",
    "action": "get"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "agent": {
    "id": "d88f7e3e-...",
    "name": "Sherlock",
    "description": "Investigative AI agent",
    "avatar_color": "#8b5cf6",
    "is_default": true,
    "webhook_secret": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
\`\`\`

#### Update Own Agent Profile

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ai_agent",
    "action": "update",
    "name": "Sherlock",
    "description": "Investigative AI specializing in pattern detection",
    "avatar_color": "#8b5cf6"
  }'
\`\`\`

All fields are optional — only include the ones you want to change. The agent can only update its own row (resolved from the webhook secret).

#### List All Agents

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ai_agent",
    "action": "list"
  }'
\`\`\`

#### Identity vs. Status vs. Self-Identity

| Feature | Request Type | What It Controls |
|---------|-------------|-----------------|
| **Identity Files** | \`identity\` | SOUL, MEMORY, HEARTBEAT, etc. (Markdown documents) |
| **AI Status** | \`status\` | Live presence: online/offline, emoji, status message |
| **Agent Self-Identity** | \`ai_agent\` | Database profile: name, description, avatar color |

> **Tip:** When an agent changes its name via \`ai_agent\` → \`update\`, it should also send a \`status\` update with the new \`agent_name\` to keep the live presence display in sync.

---

## Rate Limits & Best Practices

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Task Queue | 100 requests | per minute |
| Report Webhook | 50 requests | per minute |
| Goal Analyzer | 10 requests | per minute |
| General API | 200 requests | per minute |

### Best Practices

1. **Use Realtime when possible** - Lower latency, fewer API calls
2. **Implement exponential backoff** - On rate limits or errors
3. **Batch operations** - Process multiple tasks in one poll cycle
4. **Claim before processing** - Prevents duplicate processing
5. **Always complete or fail** - Don't leave tasks in "processing" state
6. **Send regular heartbeats** - Keep the UI status accurate
7. **Handle reconnections** - Poll on startup to catch missed tasks

### Recommended Polling Intervals

| Scenario | Interval |
|----------|----------|
| Active usage | 30-60 seconds |
| Idle periods | 2-5 minutes |
| Rate limited | 5-10 minutes |
| After reconnect | Immediate poll |

---

## Changelog

### V1.6.0 (Current)

- Fixed \`logActivity\` helper: \`actor_name\` was hardcoded as \`"Bujji"\` — now uses \`"Ray"\`
- Fixed log creation crash: \`agentRow?.name\` referenced an undeclared variable at line 1524 — replaced with \`logAgentName\` which resolves from \`body.agent_name\` or defaults to \`"Ray"\`
- Fixed \`task_assignees\` FK constraint: re-created \`task_assignees_user_id_fkey\` FK to \`users(id)\` with \`ON DELETE CASCADE\` — resolves PostgREST schema cache error on task list queries
- Schema cache reload: after FK changes, run \`NOTIFY pgrst, 'reload schema';\` to refresh PostgREST metadata

### V1.5.0

- New \`ai_agent\` request type with 3 actions: \`get\`, \`update\`, \`list\` — agents can now read and update their own profile (name, description, avatar_color)
- Fixed hardcoded \`updated_by: "ray"\` in identity file writes — now uses the actual calling agent's name
- Both \`request_type: "ai_agent"\` and \`request_type: "agent"\` are accepted

### V1.4.0

- Added **Arena** and **Boiler Room** site types to Workspace (\`site_type\` field on \`offices\` table)
- New \`arena\` request type with 3 actions: \`configure\`, \`add_score\`, \`get_scores\`
- 3 new database tables: \`arena_scoreboards\`, \`arena_score_categories\`, \`arena_scores\`
- Realtime enabled on \`arena_scores\` for live scoreboard updates
- Primary score events trigger bell-ringing animation in arena canvas
- Arena supports exactly 2 agents in head-to-head competition layout
- Boiler Room supports up to 4 agents in compact high-intensity layout

### V1.3.0

- Added \`manage-office-agent\` edge function with 5 actions (create, update, delete, get, list)
- Added \`bio\` field to office agents for soul/ID card descriptions
- Fixed API Mode: canvas now driven by Realtime subscriptions on \`office_agents\` and \`office_events\`
- Canvas click now opens agent ID card modal (previously only console.log)
- Auto desk assignment for new agents when position not specified
- All workspace cURL examples now use \`x-webhook-secret\` (not \`x-api-key\`)
- Total workspace edge functions: 6

### V1.2.0

- Added Workspace (Office Management) feature with 5 edge functions
- Documented office listing, task creation, agent status updates, office resets, and deliverable uploads
- All workspace functions support dual auth: \`x-api-key\` or \`x-webhook-secret\`
- Added complete workflow examples and Realtime integration guide
- New section 4.15 with 8 subsections

### V1.1.0

- **Breaking:** All task operations now use \`POST\` with \`request_type: "task"\` and an \`action\` field (\`create\`, \`list\`, \`get\`, \`update\`, \`delete\`). Old HTTP-method-based routing (\`GET\`, \`PATCH\`, \`DELETE\`) is no longer supported.
- Task get, update, and delete actions now accept both \`"id"\` and \`"task_id"\` parameter names
- Added optional \`column\` filter for task list action
- Quick Test example updated to use action-based routing

### V1.0.0

- Task Queue architecture with Realtime + Polling
- 16 feature areas documented
- Python and JavaScript SDKs
- Multi-authentication support
- Sub-agent management
- Raw report webhook ingestion

---

## 4.18 Ops Center

The Ops Center provides a component-based app platform using an **Apps → Pages → Blocks → Data** architecture. Modules like Creator Command Centre and Meeting Intelligence Engine are built on this system and installed separately.

### Architecture

\`\`\`
ops_apps (App)
  └── ops_pages (Tabs/Pages)
       └── ops_blocks (UI Components)
            └── ops_data (Data rows)
\`\`\`

### Creating a Creator Command App

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ops",
    "action": "create_app",
    "name": "creator-command",
    "title": "Creator Command",
    "description": "YouTube intelligence dashboard",
    "icon": "youtube"
  }'
\`\`\`

### Adding Pages (Tabs)

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ops",
    "action": "create_page",
    "app_id": "<app-uuid>",
    "name": "dashboard",
    "title": "Dashboard",
    "icon": "layout-dashboard",
    "sort_order": 0
  }'
\`\`\`

Available pages: Dashboard, Competitors, Banger Lab, Pipeline, Scripts, Intel Feed, Outlier Feed

### Adding Blocks to Pages

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ops",
    "action": "create_block",
    "page_id": "<page-uuid>",
    "block_type": "yt_dashboard",
    "title": "YouTube Dashboard",
    "sort_order": 0
  }'
\`\`\`

#### Supported YouTube Block Types

| Block Type | Description |
|-----------|-------------|
| \`yt_dashboard\` | Channel overview, top outliers, digests, insights, metrics |
| \`yt_competitors\` | Competitor channel cards with stats |
| \`yt_banger_lab\` | Video ideas with categories and scoring |
| \`yt_pipeline\` | Content pipeline with production stages |
| \`yt_scripts\` | Script items with outlines and word counts |
| \`yt_intel_feed\` | Intelligence insights feed |
| \`yt_outlier_feed\` | Full outlier video feed with filtering and AI insights |

### Seeding Data

All data is stored in the \`ops_data\` table. Each row needs \`app_id\`, \`block_id\`, \`item_type\`, \`title\`, and a \`data\` JSON object.

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "ops",
    "action": "create_data",
    "app_id": "<app-uuid>",
    "block_id": "<block-uuid>",
    "item_type": "yt_outlier_feed",
    "title": "Best AI tool for getting rich",
    "data": {
      "type": "outlier_video",
      "video_id": "abc123",
      "channel_title": "Dan Martell",
      "thumbnail_url": "https://img.youtube.com/vi/abc123/hqdefault.jpg",
      "published_at": "2025-10-15T10:00:00Z",
      "view_count": 135800,
      "like_count": 6100,
      "comment_count": 91,
      "duration": "PT0H0M59S",
      "outlier_score": 2.0,
      "views_per_hour": 1200,
      "search_query": "build AI agent make money",
      "comment_sentiment": "Positive",
      "youtube_summary": "Dan reviews an AI tool that automates outreach...",
      "why_outlier": "This video received 2x the average views for this channel within 48 hours of publishing.",
      "ai_insights": null
    }
  }'
\`\`\`

#### Data Types by Block

**yt_dashboard** — seed these \`data.type\` values:
- \`channel_summary\`: \`{ type, channel_name, subscriber_count, total_views, niche, last_synced_at }\`
- \`outlier_video\`: Same schema as yt_outlier_feed (see above)
- \`digest\`: \`{ type, summary_html, digest_date, metrics }\`
- \`insight\`: \`{ type, insight_type, content, priority }\`
- \`metric\`: \`{ type, metric_key, value, label, change_pct }\`

**yt_competitors** — seed with \`item_type: "yt_competitors"\`:
\`\`\`json
{
  "type": "competitor",
  "channel_id": "UCxyz",
  "channel_title": "Competitor Name",
  "subscriber_count": 500000,
  "video_count": 200,
  "view_count": 50000000,
  "thumbnail_url": "https://...",
  "handle": "@competitor"
}
\`\`\`

**yt_banger_lab** — seed with \`item_type: "yt_banger_lab"\`:
\`\`\`json
{
  "type": "banger_idea",
  "category": "AI Tools",
  "angle": "Comparison review",
  "outlier_score": 3.5,
  "source_type": "outlier_analysis",
  "thumbnail_concept": "Split screen of two tools",
  "suggested_length": 600,
  "status": "longlist"
}
\`\`\`

**yt_pipeline** — seed with \`item_type: "yt_pipeline"\`:
\`\`\`json
{
  "type": "pipeline_item",
  "stage": "scripting",
  "idea_id": "uuid",
  "assigned_to": "agent-name",
  "due_date": "2026-03-01"
}
\`\`\`

**yt_scripts** — seed with \`item_type: "yt_scripts"\`:
\`\`\`json
{
  "type": "script",
  "word_count": 1500,
  "has_outline": true,
  "has_script": false,
  "status": "draft",
  "content_preview": "Opening hook: Did you know..."
}
\`\`\`

**yt_intel_feed** — seed with \`item_type: "yt_intel_feed"\`:
\`\`\`json
{
  "type": "intel_insight",
  "insight_type": "trend",
  "content": "AI agent videos are trending 3x in the last 30 days",
  "priority": "high",
  "is_pinned": false
}
\`\`\`

**yt_outlier_feed** — seed with \`item_type: "yt_outlier_feed"\`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`type\` | string | Yes | Must be \`"outlier_video"\` |
| \`video_id\` | string | Yes | YouTube video ID |
| \`channel_title\` | string | Yes | Channel name |
| \`thumbnail_url\` | string | No | Thumbnail URL (falls back to YouTube default) |
| \`published_at\` | string | Yes | ISO 8601 date |
| \`view_count\` | number | Yes | Total views |
| \`like_count\` | number | No | Like count |
| \`comment_count\` | number | No | Comment count |
| \`duration\` | string | No | ISO 8601 duration (e.g., PT12M30S) |
| \`outlier_score\` | number | Yes | Multiplier vs channel average (e.g., 2.0 = 2x) |
| \`views_per_hour\` | number | No | View velocity metric |
| \`search_query\` | string | No | Discovery search query |
| \`comment_sentiment\` | string | No | "Positive", "Mixed", or "Negative" |
| \`youtube_summary\` | string | No | AI-generated video summary |
| \`why_outlier\` | string | No | Explanation of why this is an outlier |
| \`ai_insights\` | string | No | HTML/text AI analysis (null triggers "Generate" button) |

> **Tip:** Set \`ai_insights\` to \`null\` initially. Users can click "Generate Insights" in the UI, which creates a \`pending_tasks\` row with \`task_type: "video_analysis"\` and \`action: "generate_outlier_insights"\`. Your agent should pick this up, analyze the video, and update the \`ops_data\` row's \`data.ai_insights\` field.

---

## Direct Database Access

For operations the ai-tasks edge function doesn't support (e.g., bulk reads, deletes, custom queries), use the Supabase REST API directly.

### Base URL

\`\`\`
${supabaseUrl}/rest/v1
\`\`\`

### Required Headers

\`\`\`
apikey: <YOUR_SERVICE_ROLE_KEY>
Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>
Content-Type: application/json
\`\`\`

> **Service Role Key** — Get from Supabase Dashboard → Project Settings → API → service_role key.
> This key bypasses Row Level Security and has full database access. Never expose in client-side code.

### CRUD Examples

**Read (with filters & joins):**
\`\`\`bash
curl "${supabaseUrl}/rest/v1/tasks?select=*,subtasks(*),task_assignees(*)&order=position" \\
  -H "apikey: <SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
\`\`\`

**Insert:**
\`\`\`bash
curl -X POST "${supabaseUrl}/rest/v1/ai_logs" \\
  -H "apikey: <SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"message": "Direct DB write", "category": "general"}'
\`\`\`

**Update:**
\`\`\`bash
curl -X PATCH "${supabaseUrl}/rest/v1/ai_status?agent_name=eq.Sherlock" \\
  -H "apikey: <SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"status_message": "Updated via REST", "ring_color": "green"}'
\`\`\`

**Delete:**
\`\`\`bash
curl -X DELETE "${supabaseUrl}/rest/v1/ai_status?agent_name=eq.Ghost" \\
  -H "apikey: <SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
\`\`\`

### Python Helper

\`\`\`python
import requests

SUPABASE_URL = "${supabaseUrl}"
SERVICE_KEY = "<YOUR_SERVICE_ROLE_KEY>"
HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

def db_read(table, params=""):
    return requests.get(f"{supabaseUrl}/rest/v1/{table}?{params}", headers=HEADERS).json()

def db_insert(table, data):
    h = {**HEADERS, "Prefer": "return=representation"}
    return requests.post(f"{supabaseUrl}/rest/v1/{table}", json=data, headers=h).json()

def db_update(table, filters, data):
    h = {**HEADERS, "Prefer": "return=representation"}
    return requests.patch(f"{supabaseUrl}/rest/v1/{table}?{filters}", json=data, headers=h).json()

def db_delete(table, filters):
    return requests.delete(f"{supabaseUrl}/rest/v1/{table}?{filters}", headers=HEADERS)
\`\`\`

### PostgREST Query Syntax

| Operator | Example | Description |
|----------|---------|-------------|
| \`eq\` | \`?name=eq.Sherlock\` | Equals |
| \`neq\` | \`?status=neq.done\` | Not equals |
| \`gt\`/\`lt\` | \`?priority=gt.5\` | Greater/less than |
| \`in\` | \`?status=in.(new,active)\` | In list |
| \`like\` | \`?name=like.*sherlock*\` | Pattern match |
| \`is\` | \`?deleted_at=is.null\` | IS NULL check |
| \`order\` | \`?order=created_at.desc\` | Sort results |
| \`limit\` | \`?limit=10\` | Limit rows |
| \`select\` | \`?select=*,subtasks(*)\` | Column selection + joins |

### Key Tables

| Table | Description |
|-------|-------------|
| \`tasks\` | Kanban board tasks |
| \`task_assignees\` | Task assignments (user_id = user, ai_agent, or sub_agent UUID) |
| \`subtasks\` | Subtasks nested under tasks |
| \`ai_status\` | Agent presence and ring color |
| \`ai_agents\` | Registered AI agents |
| \`sub_agents\` | Sub-agents / AI employees |
| \`ai_logs\` | Agent journal entries |
| \`ai_questions\` | Questions & approvals |
| \`ai_insights\` | Analytics cards |
| \`reports\` | HTML reports |
| \`board_columns\` | Kanban columns |
| \`users\` | Human users |
| \`skills\` | Skill Factory configs |
| \`ops_apps\` | OpsCenter apps |
| \`ops_pages\` | OpsCenter pages |
| \`ops_blocks\` | OpsCenter blocks |
| \`ops_data\` | OpsCenter data records |
| \`pending_tasks\` | Async task queue |
| \`automations\` | Scheduled automations |
| \`offices\` | Animated office spaces |
| \`office_agents\` | Characters in offices |

---

## Agent Onboarding

Follow these steps every time you onboard a new AI agent, AI employee, or sub-agent.

### Step 1: Register Identity (REQUIRED)

\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "request_type": "agent",
    "action": "create",
    "name": "<AGENT_NAME>",
    "emoji": "<EMOJI>",
    "description": "What this agent does",
    "model": "claude-sonnet-4-20250514"
  }'
\`\`\`

### Step 2: Link Status Record (REQUIRED)

Update the ai_status row with both \`agent_name\` AND \`agent_id\` (from step 1):

\`\`\`bash
curl -X PATCH "${supabaseUrl}/rest/v1/ai_status?agent_name=eq.<AGENT_NAME>" \\
  -H "apikey: <SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"agent_id": "<AGENT_ID>", "agent_name": "<AGENT_NAME>", "agent_emoji": "<EMOJI>"}'
\`\`\`

### Step 3: Add to Animated Office (Optional)

\`\`\`bash
curl -X POST "${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{"action": "create", "name": "<AGENT_NAME>", "role": "Agent role", "status": "idle"}'
\`\`\`

### Step 4: Share Onboarding Prompt (REQUIRED)

Copy the onboarding prompt from the Settings → Onboarding tab and share it with the agent. The prompt includes:
- Connection credentials (API URL, webhook secret)
- Core workflow (create → assign → do → log → done)
- **CRITICAL** assignee rules (EVERY task must have an assignee)
- Status update patterns (agent_name + agent_emoji required)
- Direct database access patterns
- Logging and question/approval rules

### LESSONS LEARNED: Assignee System

The assignee lookup searches **three tables** in order:
1. \`users\` table (by \`name\`)
2. \`ai_agents\` table (by \`name\`)
3. \`sub_agents\` table (by \`display_name\`)

**Rules:**
- EVERY task MUST have an assignee. No exceptions.
- Agent creates task for itself → assign its own name
- Agent creates task for a human → assign the human's name
- Agent creates task for a sub-agent → assign the sub-agent's display_name
- Unassigned tasks appear broken on the Kanban board

---

*Generated for ${aiName} • ClawBuddy Integration Guide V1*
`;
}

export function generateGuideSections(config: GuideConfig): GuideSection[] {
  return [
    {
      id: 'quick-start',
      title: '1. Quick Start',
      icon: 'Zap',
      content: `Get connected in 60 seconds with your credentials and first API call.`
    },
    {
      id: 'authentication',
      title: '2. Authentication',
      icon: 'Key',
      content: `Three methods: Webhook Secret, API Key, and User JWT.`
    },
    {
      id: 'task-queue',
      title: '3. Task Queue Architecture',
      icon: 'Database',
      content: `Reliable task delivery with Realtime streaming and Polling fallback.`
    },
    {
      id: 'feature-reference',
      title: '4. Feature Reference',
      icon: 'Book',
      content: `Complete API documentation for all 18 feature areas.`,
      subsections: [
        { id: 'kanban', title: '4.1 Kanban Board', content: 'Task CRUD operations' },
        { id: 'subtasks', title: '4.2 Subtasks', content: 'Task breakdown' },
        { id: 'assignees', title: '4.3 Assignees', content: 'User assignments' },
        { id: 'budgets', title: '4.4 Budget Tracking', content: 'Cost management' },
        { id: 'ai-log', title: '4.5 AI Log', content: 'Observations & reminders' },
        { id: 'questions', title: '4.6 Questions & Approvals', content: 'Two-way communication' },
        { id: 'status', title: '4.7 AI Status', content: 'Online presence' },
        { id: 'insights', title: '4.8 AI Insights', content: 'Analytics & suggestions' },
        { id: 'memory', title: '4.9 Memory Injection', content: 'Context storage' },
        { id: 'goals', title: '4.10 Goals Lab', content: 'Goal analysis' },
        { id: 'skills', title: '4.11 Skills Factory', content: 'API integrations' },
        { id: 'subagents', title: '4.12 Sub-Agents', content: 'Worker coordination' },
        { id: 'reports', title: '4.13 Reports', content: 'HTML documents' },
        { id: 'raw-reports', title: '4.14 Raw Reports', content: 'Webhook ingestion' },
        { id: 'workspace', title: '4.15 Workspace', content: 'Offices, Arenas, Boiler Rooms & visualization' },
        { id: 'arena', title: '4.15.4 Arena Scoreboard API', content: 'Configure scoreboards, add scores, get standings' },
        { id: 'identity', title: '4.16 Identity & Memory', content: 'File system, daily logs, session context' },
        { id: 'agent-self-identity', title: '4.17 Agent Self-Identity', content: 'Get, update, list agent profiles (name, description, avatar)' },
        { id: 'ops-center', title: '4.18 Ops Center', content: 'Apps, pages, blocks, and data architecture for OpsCenter modules' },
      ]
    },
    {
      id: 'direct-db',
      title: '5. Direct Database Access',
      icon: 'Database',
      content: `Bypass the edge function and talk directly to Supabase via REST API. Includes CRUD examples, Python helper, PostgREST query syntax, and key tables reference.`
    },
    {
      id: 'agent-onboarding',
      title: '6. Agent Onboarding',
      icon: 'UserPlus',
      content: `Step-by-step guide for registering new agents: create identity, link status record, add to office, and share the onboarding prompt. Includes LESSONS LEARNED on the assignee system.`
    },
    {
      id: 'code-examples',
      title: '7. Complete Code Examples',
      icon: 'Code',
      content: `Full Python and JavaScript SDK implementations.`
    },
    {
      id: 'error-handling',
      title: '8. Error Handling',
      icon: 'AlertTriangle',
      content: `Common errors and how to handle them.`
    },
    {
      id: 'best-practices',
      title: '9. Rate Limits & Best Practices',
      icon: 'Shield',
      content: `Rate limits, polling intervals, and recommendations.`
    }
  ];
}
