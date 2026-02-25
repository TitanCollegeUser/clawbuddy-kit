import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GuideSection } from './GuideSection';
import { CodeBlock } from './CodeBlock';
import { generateFullGuideMarkdown, generateGuideSections, GuideConfig } from '@/lib/integration-guide-content';
import { toast } from 'sonner';
import {
  Book,
  Copy,
  Check,
  Download,
  ExternalLink,
  Zap,
  Key,
  Database,
  Code,
  AlertTriangle,
  Shield,
  ListTodo,
  Users,
  DollarSign,
  MessageSquare,
  HelpCircle,
  Radio,
  Lightbulb,
  Brain,
  Target,
  Wrench,
  Bot,
  FileText,
  Webhook,
  Swords,
} from 'lucide-react';

interface IntegrationGuideProps {
  config: GuideConfig;
}

export const IntegrationGuide = ({ config }: IntegrationGuideProps) => {
  const [copied, setCopied] = useState(false);
  const [isFullGuideOpen, setIsFullGuideOpen] = useState(false);
  
  const fullMarkdown = generateFullGuideMarkdown(config);
  const sections = generateGuideSections(config);
  
  const handleCopyFullGuide = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    toast.success('Full guide copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownloadGuide = () => {
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clawbuddy-integration-guide-v1.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Guide downloaded');
  };

  const getIconForSection = (id: string) => {
    const icons: Record<string, React.ReactNode> = {
      'quick-start': <Zap className="h-4 w-4" />,
      'authentication': <Key className="h-4 w-4" />,
      'task-queue': <Database className="h-4 w-4" />,
      'feature-reference': <Book className="h-4 w-4" />,
      'code-examples': <Code className="h-4 w-4" />,
      'error-handling': <AlertTriangle className="h-4 w-4" />,
      'best-practices': <Shield className="h-4 w-4" />,
      'arena': <Swords className="h-4 w-4" />,
    };
    return icons[id] || <Book className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="gap-1">
          <Book className="h-3 w-3" />
          V1.0.0
        </Badge>
        <Badge variant="secondary" className="gap-1">
          17 Features
        </Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleCopyFullGuide}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          Copy Full Guide
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadGuide}>
          <Download className="h-4 w-4 mr-2" />
          Download .md
        </Button>
        <Dialog open={isFullGuideOpen} onOpenChange={setIsFullGuideOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>ClawBuddy Integration Guide V1</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-full pr-4">
              <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/90">
                {fullMarkdown}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Webhook Secret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs bg-muted/50 px-2 py-1 rounded block truncate">
              {config.webhookSecret}
            </code>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              API Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs bg-muted/50 px-2 py-1 rounded block truncate">
              {config.apiUrl}
            </code>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              Webhook URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs bg-muted/50 px-2 py-1 rounded block truncate">
              {config.webhookUrl}
            </code>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview Grid */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            Feature Reference
          </CardTitle>
          <CardDescription>
            All 16 feature areas available via the API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Database className="h-4 w-4" />, label: 'Task Queue', type: 'queue' },
              { icon: <ListTodo className="h-4 w-4" />, label: 'Kanban Board', type: 'task' },
              { icon: <ListTodo className="h-4 w-4" />, label: 'Subtasks', type: 'subtask' },
              { icon: <Users className="h-4 w-4" />, label: 'Assignees', type: 'assignee' },
              { icon: <DollarSign className="h-4 w-4" />, label: 'Budgets', type: 'budget' },
              { icon: <MessageSquare className="h-4 w-4" />, label: 'AI Log', type: 'log' },
              { icon: <HelpCircle className="h-4 w-4" />, label: 'Questions', type: 'question' },
              { icon: <Radio className="h-4 w-4" />, label: 'AI Status', type: 'status' },
              { icon: <Lightbulb className="h-4 w-4" />, label: 'Insights', type: 'insight' },
              { icon: <Brain className="h-4 w-4" />, label: 'Memory', type: 'memory' },
              { icon: <Target className="h-4 w-4" />, label: 'Goals Lab', type: 'goal' },
              { icon: <Wrench className="h-4 w-4" />, label: 'Skills', type: 'skill' },
              { icon: <Bot className="h-4 w-4" />, label: 'Sub-Agents', type: 'subagent' },
              { icon: <FileText className="h-4 w-4" />, label: 'Reports', type: 'report' },
              { icon: <Webhook className="h-4 w-4" />, label: 'Raw Reports', type: 'raw_report' },
              { icon: <Swords className="h-4 w-4" />, label: 'Arena', type: 'arena' },
              { icon: <Book className="h-4 w-4" />, label: 'Activity Log', type: 'read-only' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <span className="text-primary">{feature.icon}</span>
                <span className="text-sm font-medium">{feature.label}</span>
                <Badge variant="outline" className="ml-auto text-[10px] px-1">
                  {feature.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Examples */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Quick Examples
          </CardTitle>
          <CardDescription>
            Common API calls with your credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="heartbeat" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="heartbeat">Heartbeat</TabsTrigger>
              <TabsTrigger value="list-tasks">List Tasks</TabsTrigger>
              <TabsTrigger value="create-task">Create Task</TabsTrigger>
              <TabsTrigger value="ask-question">Ask Question</TabsTrigger>
              <TabsTrigger value="create-log">Create Log</TabsTrigger>
              <TabsTrigger value="webhook">Send Webhook</TabsTrigger>
              <TabsTrigger value="arena-score">Arena Score</TabsTrigger>
            </TabsList>
            
            <TabsContent value="heartbeat" className="mt-4">
              <CodeBlock
                title="Send Heartbeat"
                language="bash"
                code={`curl -X POST "${config.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "heartbeat",
    "status_message": "Online and ready"
  }'`}
              />
            </TabsContent>
            
            <TabsContent value="list-tasks" className="mt-4">
              <CodeBlock
                title="List Pending Tasks"
                language="bash"
                code={`curl -X POST "${config.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "request_type": "queue",
    "action": "list",
    "status": "pending"
  }'`}
              />
            </TabsContent>
            
            <TabsContent value="create-task" className="mt-4">
              <CodeBlock
                title="Create Kanban Task"
                language="bash"
                code={`curl -X POST "${config.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "request_type": "task",
    "action": "create",
    "title": "Review Q1 proposal",
    "description": "Check the quarterly proposal draft",
    "column": "To Do",
    "priority": "High",
    "due_date": "2026-02-15",
    "comment": "Created via API"
  }'`}
              />
            </TabsContent>
            
            <TabsContent value="ask-question" className="mt-4">
              <CodeBlock
                title="Ask for Approval"
                language="bash"
                code={`curl -X POST "${config.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "request_type": "question",
    "action": "ask",
    "question": "Should I proceed with the email campaign?",
    "question_type": "approval",
    "priority": "high",
    "context": "Campaign targets 5,000 subscribers. Cost: $150."
  }'`}
              />
            </TabsContent>
            
            <TabsContent value="create-log" className="mt-4">
              <CodeBlock
                title="Create Log Entry"
                language="bash"
                code={`curl -X POST "${config.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "request_type": "log",
    "action": "create",
    "message": "User prefers morning meetings. Noted.",
    "category": "observation"
  }'`}
              />
            </TabsContent>
            
            <TabsContent value="webhook" className="mt-4">
              <CodeBlock
                title="Send Raw Report via Webhook"
                language="bash"
                code={`curl -X POST "${config.webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "source": "salesforce",
    "report_type": "employee",
    "data": {
      "employee_id": "EMP001",
      "name": "John Smith",
      "metrics": { "calls_made": 150, "deals_closed": 12 }
    }
  }'`}
              />
            </TabsContent>
            
            <TabsContent value="arena-score" className="mt-4">
              <CodeBlock
                title="Add Arena Score"
                language="bash"
                code={`curl -X POST "${config.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${config.webhookSecret}" \\
  -d '{
    "request_type": "arena",
    "action": "add_score",
    "office_id": "arena-uuid",
    "category": "Deals Closed",
    "agent_name": "Alpha",
    "value": 1,
    "metadata": { "deal_id": "D-1234" }
  }'`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Collapsible Sections */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            Complete Documentation
          </CardTitle>
          <CardDescription>
            Expand sections to see detailed API documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {sections.map((section) => (
            <GuideSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={getIconForSection(section.id)}
            >
              <p className="text-sm text-muted-foreground mb-4">{section.content}</p>
              {section.subsections && (
                <div className="space-y-1 border-l-2 border-border/50 ml-2">
                  {section.subsections.map((sub) => (
                    <GuideSection
                      key={sub.id}
                      id={sub.id}
                      title={sub.title}
                      level={2}
                    >
                      <p className="text-sm text-muted-foreground">{sub.content}</p>
                    </GuideSection>
                  ))}
                </div>
              )}
            </GuideSection>
          ))}
        </CardContent>
      </Card>

      {/* Footer CTA */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button variant="outline" onClick={handleCopyFullGuide}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          Copy Full Markdown Guide
        </Button>
        <Button onClick={() => setIsFullGuideOpen(true)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Complete Guide
        </Button>
      </div>
    </div>
  );
};
