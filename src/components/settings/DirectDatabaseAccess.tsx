import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CodeBlock } from './CodeBlock';
import { toast } from 'sonner';
import {
  Database,
  Copy,
  Check,
  Table2,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface DirectDatabaseAccessProps {
  supabaseUrl: string;
  anonKey: string;
}

const KEY_TABLES = [
  { name: 'tasks', description: 'Kanban board tasks with title, description, column, priority, due_date' },
  { name: 'task_assignees', description: 'Task assignments — user_id can be a user, ai_agent, or sub_agent UUID' },
  { name: 'subtasks', description: 'Subtasks nested under tasks — title, completed, task_id' },
  { name: 'ai_status', description: 'Agent presence — agent_name, ring_color, status_message, is_online' },
  { name: 'ai_agents', description: 'Registered AI agents — name, emoji, model, system_prompt' },
  { name: 'sub_agents', description: 'Sub-agents / AI employees — display_name, model, system_prompt' },
  { name: 'ai_logs', description: 'Agent journal entries — message, category, is_read' },
  { name: 'ai_questions', description: 'Questions & approvals — question, answer, priority, status' },
  { name: 'ai_insights', description: 'Analytics cards — title, content, insight_type, data (JSONB)' },
  { name: 'reports', description: 'HTML reports — title, html_content, report_type' },
  { name: 'board_columns', description: 'Kanban columns — name, position (To Do, Doing, Needs Input, Canceled, Done)' },
  { name: 'users', description: 'Human users — name, email, id' },
  { name: 'skills', description: 'Skill Factory configs — name, agent_name, protocol_type, status' },
  { name: 'skill_operations', description: 'Skill endpoints — skill_id, operation_name, http_method, url' },
  { name: 'ops_apps', description: 'OpsCenter apps — name, title, description, icon' },
  { name: 'ops_pages', description: 'OpsCenter pages — app_id, name, title, layout, sort_order' },
  { name: 'ops_blocks', description: 'OpsCenter blocks — page_id, block_type, title, config (JSONB)' },
  { name: 'ops_data', description: 'OpsCenter data records — app_id, block_id, item_type, title, status, data (JSONB)' },
  { name: 'pending_tasks', description: 'Async task queue — task_type, action, status, payload, result' },
  { name: 'automations', description: 'Scheduled automations — name, cron_expression, edge_function, enabled' },
  { name: 'offices', description: 'Animated office spaces — name, type (office/arena/boiler_room)' },
  { name: 'office_agents', description: 'Characters in offices — office_id, name, role, status, current_activity' },
];

export const DirectDatabaseAccess = ({ supabaseUrl, anonKey }: DirectDatabaseAccessProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const restBaseUrl = `${supabaseUrl}/rest/v1`;

  const fullSnippet = `# Supabase Direct Database Access
# Base URL: ${restBaseUrl}

# Headers (use service_role key for full access):
# apikey: <YOUR_SERVICE_ROLE_KEY>
# Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>
# Content-Type: application/json

# ── READ all tasks ──
curl "${restBaseUrl}/tasks?select=*,subtasks(*),task_assignees(*)&order=position" \\
  -H "apikey: <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>"

# ── READ with filters ──
curl "${restBaseUrl}/ai_status?agent_name=eq.Sherlock&select=*" \\
  -H "apikey: <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>"

# ── INSERT a record ──
curl -X POST "${restBaseUrl}/ai_logs" \\
  -H "apikey: <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"message": "Direct DB write test", "category": "general"}'

# ── UPDATE a record ──
curl -X PATCH "${restBaseUrl}/ai_status?agent_name=eq.Sherlock" \\
  -H "apikey: <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{"status_message": "Updated via REST", "ring_color": "green"}'

# ── DELETE a record ──
curl -X DELETE "${restBaseUrl}/ai_status?agent_name=eq.OpenClaw" \\
  -H "apikey: <YOUR_SERVICE_ROLE_KEY>" \\
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>"`;

  const pythonSnippet = `import requests

SUPABASE_URL = "${supabaseUrl}"
SERVICE_KEY = "<YOUR_SERVICE_ROLE_KEY>"
HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

def db_read(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    return requests.get(url, headers=HEADERS).json()

def db_insert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    h = {**HEADERS, "Prefer": "return=representation"}
    return requests.post(url, json=data, headers=h).json()

def db_update(table, filters, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    h = {**HEADERS, "Prefer": "return=representation"}
    return requests.patch(url, json=data, headers=h).json()

def db_delete(table, filters):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    return requests.delete(url, headers=HEADERS)

# Examples:
# db_read("tasks", "select=*,subtasks(*),task_assignees(*)&order=position")
# db_insert("ai_logs", {"message": "Hello", "category": "general"})
# db_update("ai_status", "agent_name=eq.Sherlock", {"ring_color": "green"})
# db_delete("ai_status", "agent_name=eq.Ghost")`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Overview Card */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Direct Database Access
          </CardTitle>
          <CardDescription>
            Bypass the edge function and talk directly to Supabase via REST API.
            Use this when the ai-tasks API doesn't support what you need (e.g., deleting records, bulk reads, custom queries).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" /> REST Base URL
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted/30 rounded text-sm font-mono truncate">
                {restBaseUrl}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleCopy(restBaseUrl, 'REST URL')}
              >
                {copied === 'REST URL' ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Auth Headers */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Required Headers</p>
            <div className="bg-muted/30 rounded-lg p-4 text-sm font-mono space-y-1">
              <p><span className="text-primary">apikey:</span> {'<YOUR_SERVICE_ROLE_KEY>'}</p>
              <p><span className="text-primary">Authorization:</span> Bearer {'<YOUR_SERVICE_ROLE_KEY>'}</p>
              <p><span className="text-primary">Content-Type:</span> application/json</p>
            </div>
            <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Service Role Key</strong> — Get this from your
                Supabase Dashboard → Project Settings → API → service_role key.
                This key bypasses Row Level Security and has full database access.
                Never expose it in client-side code.
              </p>
            </div>
          </div>

          <Separator />

          {/* Query Syntax */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              PostgREST Query Syntax
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/20 p-2 rounded">
                <code className="text-primary">?select=*</code>
                <span className="text-muted-foreground ml-2">— All columns</span>
              </div>
              <div className="bg-muted/20 p-2 rounded">
                <code className="text-primary">?name=eq.Sherlock</code>
                <span className="text-muted-foreground ml-2">— Filter by value</span>
              </div>
              <div className="bg-muted/20 p-2 rounded">
                <code className="text-primary">?order=created_at.desc</code>
                <span className="text-muted-foreground ml-2">— Sort results</span>
              </div>
              <div className="bg-muted/20 p-2 rounded">
                <code className="text-primary">?limit=10</code>
                <span className="text-muted-foreground ml-2">— Limit rows</span>
              </div>
              <div className="bg-muted/20 p-2 rounded">
                <code className="text-primary">?select=*,subtasks(*)</code>
                <span className="text-muted-foreground ml-2">— Join related tables</span>
              </div>
              <div className="bg-muted/20 p-2 rounded">
                <code className="text-primary">Prefer: return=representation</code>
                <span className="text-muted-foreground ml-2">— Return inserted row</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Quick Reference Snippets
          </CardTitle>
          <CardDescription>
            Copy these and replace {'<YOUR_SERVICE_ROLE_KEY>'} with your actual key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            title="cURL Examples (Read, Insert, Update, Delete)"
            language="bash"
            code={fullSnippet}
          />
          <CodeBlock
            title="Python Helper Functions"
            language="python"
            code={pythonSnippet}
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(fullSnippet + '\n\n' + pythonSnippet, 'All snippets')}
            >
              {copied === 'All snippets' ? (
                <Check className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy All Snippets
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Tables Reference */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Table2 className="h-4 w-4 text-primary" />
            Key Tables
          </CardTitle>
          <CardDescription>
            {KEY_TABLES.length} tables available via REST API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-1 max-h-[500px] overflow-y-auto pr-2">
            {KEY_TABLES.map((table) => (
              <div
                key={table.name}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors group"
              >
                <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono shrink-0 mt-0.5">
                  {table.name}
                </code>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {table.description}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleCopy(`${restBaseUrl}/${table.name}?select=*`, table.name)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
