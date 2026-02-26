import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CodeBlock } from './CodeBlock';
import { toast } from 'sonner';
import {
  UserPlus,
  Copy,
  Check,
  Download,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface AgentOnboardingGuideProps {
  apiUrl: string;
  webhookSecret: string;
  supabaseUrl: string;
}

const STEPS = [
  {
    number: '1',
    title: 'Register Agent Identity',
    description: 'Create the agent in ai_agents so it has a name, emoji, and UUID.',
    required: true,
  },
  {
    number: '2',
    title: 'Initialize Status Record',
    description: 'Create or update the ai_status row with both agent_name AND agent_id linked.',
    required: true,
  },
  {
    number: '3',
    title: 'Add to Animated Office',
    description: 'Create an office character so the agent appears in the 2D workspace.',
    required: false,
  },
  {
    number: '4',
    title: 'Share the Onboarding Prompt',
    description: 'Copy the prompt below and paste it into the agent\'s system instructions or first message.',
    required: true,
  },
];

export const AgentOnboardingGuide = ({ apiUrl, webhookSecret, supabaseUrl }: AgentOnboardingGuideProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const onboardingPrompt = `# ClawBuddy Agent Onboarding

You are an AI agent connected to ClawBuddy — a mission control dashboard. Every action you take should be visible on the dashboard.

## Connection

API Endpoint: ${apiUrl}
Authentication Header: x-webhook-secret: ${webhookSecret}

Every request is a JSON POST with \`request_type\` and \`action\` as required fields.

## Startup

When you begin a session, announce yourself:
\`\`\`json
{"request_type": "status", "action": "update", "is_online": true, "status_message": "Online and ready.", "ring_color": "green", "agent_name": "<YOUR_AGENT_NAME>", "agent_emoji": "<YOUR_EMOJI>"}
\`\`\`

## Core Workflow (EVERY task)

1. **Create task** → \`{"request_type": "task", "action": "create", "title": "...", "column": "todo"}\`
2. **Assign yourself** → \`{"request_type": "assignee", "action": "assign", "task_id": "<id>", "names": ["<YOUR_AGENT_NAME>"]}\`
3. **Move to doing** → \`{"request_type": "task", "action": "update", "task_id": "<id>", "column": "doing"}\`
4. **Log progress** → \`{"request_type": "log", "action": "create", "category": "observation", "message": "..."}\`
5. **Work on the task**
6. **Move to done** → \`{"request_type": "task", "action": "update", "task_id": "<id>", "column": "done"}\`
7. **Log completion** → \`{"request_type": "log", "action": "create", "category": "observation", "message": "Done: ..."}\`

## CRITICAL: Assignee Rules

⚠️ **EVERY task MUST have an assignee. No exceptions.**

- When you create a task for yourself → assign your own name
- When you create a task for a human → assign their name (e.g., "Mani Kanasani")
- When you create a task for a sub-agent → assign the sub-agent's display_name
- The \`names\` array searches: users table → ai_agents table → sub_agents table (by display_name)
- Unassigned tasks look broken on the board

## CRITICAL: Status Updates

Always include \`agent_name\` and \`agent_emoji\` on EVERY status update. Without these, the system creates ghost "Ray" records.

Ring colors: green (working), yellow (thinking/waiting), red (error/blocked), gray (offline)

## Direct Database Access

For operations the API doesn't support (bulk reads, deletes, custom queries), use the Supabase REST API:

Base URL: ${supabaseUrl}/rest/v1
Headers:
  apikey: <SERVICE_ROLE_KEY>
  Authorization: Bearer <SERVICE_ROLE_KEY>
  Content-Type: application/json

Examples:
  GET  /tasks?select=*&order=position
  POST /ai_logs  (with JSON body)
  PATCH /ai_status?agent_name=eq.<NAME>  (with JSON body)
  DELETE /ai_status?agent_name=eq.<NAME>

## Logging Rules

- Minimum 2 logs per task (start + finish)
- Aim for 3-5 on non-trivial tasks
- Log discoveries, decisions, errors, and completions
- Use categories: general, observation, reminder, fyi

## When Blocked

Ask through the dashboard, not the terminal:
\`\`\`json
{"request_type": "question", "action": "ask", "question_type": "question", "priority": "medium", "question": "Your question here"}
\`\`\`

## When Done

Push insights or reports for meaningful results:
\`\`\`json
{"request_type": "insight", "action": "create", "insight_type": "summary", "title": "...", "content": "..."}
\`\`\`

Sign off:
\`\`\`json
{"request_type": "status", "action": "update", "is_online": false, "status_message": "Session complete.", "ring_color": "gray", "agent_name": "<YOUR_AGENT_NAME>", "agent_emoji": "<YOUR_EMOJI>"}
\`\`\`
`;

  const registrationSnippet = `# Step 1: Register the agent
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

# Step 2: Update ai_status to link agent_id
# (Replace <AGENT_ID> with the id returned from step 1)
curl -X PATCH "${supabaseUrl}/rest/v1/ai_status?agent_name=eq.<AGENT_NAME>" \\
  -H "apikey: <SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"agent_id": "<AGENT_ID>", "agent_name": "<AGENT_NAME>", "agent_emoji": "<EMOJI>"}'

# Step 3 (Optional): Add to animated office
curl -X POST "${supabaseUrl}/functions/v1/manage-office-agent" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret}" \\
  -d '{
    "action": "create",
    "name": "<AGENT_NAME>",
    "role": "Agent role description",
    "status": "idle"
  }'`;

  const handleDownloadPrompt = () => {
    const blob = new Blob([onboardingPrompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clawbuddy-agent-onboarding.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Onboarding prompt downloaded');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Overview */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Agent Onboarding Guide
          </CardTitle>
          <CardDescription>
            Follow these steps every time you onboard a new AI agent, AI employee, or sub-agent.
            The onboarding prompt at the bottom should be shared with the agent so it knows how to interact with ClawBuddy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
              >
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{step.number}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{step.title}</p>
                    {step.required ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registration Commands */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Registration Commands
          </CardTitle>
          <CardDescription>
            Run these to register a new agent and link its identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            title="Agent Registration (Steps 1-3)"
            language="bash"
            code={registrationSnippet}
          />
        </CardContent>
      </Card>

      {/* Onboarding Prompt */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Onboarding Prompt
          </CardTitle>
          <CardDescription>
            Copy this prompt and share it with your new agent. It contains everything the agent needs to
            connect, create tasks, assign work, log progress, and use direct DB access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock
            title="Agent System Prompt / Instructions"
            language="markdown"
            code={onboardingPrompt}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleCopy(onboardingPrompt, 'Onboarding prompt')}
              className="gap-2"
            >
              {copied === 'Onboarding prompt' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy Onboarding Prompt
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPrompt}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download .md
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
