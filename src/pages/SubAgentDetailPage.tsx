import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Bot, ArrowLeft, Settings, Pause, Play, Trash2, 
  Clock, Zap, CheckCircle, XCircle, DollarSign, 
  Activity, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubAgent, useSubAgentSessions, useUpdateSubAgent, useDeleteSubAgent, SubAgentSession } from '@/hooks/useSubAgents';
import { SubAgentStatusRing } from '@/components/subagents/SubAgentStatusRing';
import { SessionCard } from '@/components/subagents/SessionCard';
import { SessionDetailModal } from '@/components/subagents/SessionDetailModal';
import { AgentSettingsPanel } from '@/components/subagents/AgentSettingsPanel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const SubAgentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isLoading: agentLoading } = useSubAgent(id);
  const { data: sessions = [], isLoading: sessionsLoading } = useSubAgentSessions(id);
  const updateAgent = useUpdateSubAgent();
  const deleteAgent = useDeleteSubAgent();
  const [selectedSession, setSelectedSession] = useState<SubAgentSession | null>(null);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  const handlePause = async () => {
    if (!agent) return;
    try {
      await updateAgent.mutateAsync({ id: agent.id, status: 'paused' });
      toast.success('Agent paused');
    } catch {
      toast.error('Failed to pause agent');
    }
  };

  const handleResume = async () => {
    if (!agent) return;
    try {
      await updateAgent.mutateAsync({ id: agent.id, status: 'idle' });
      toast.success('Agent resumed');
    } catch {
      toast.error('Failed to resume agent');
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    if (!confirm(`Are you sure you want to delete "${agent.display_name}"?`)) return;
    try {
      await deleteAgent.mutateAsync(agent.id);
      toast.success('Agent deleted');
      navigate('/sub-agents');
    } catch {
      toast.error('Failed to delete agent');
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (agentLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Agent not found</p>
        <Button variant="outline" onClick={() => navigate('/sub-agents')} className="mt-4">
          Back to Sub-Agents
        </Button>
      </div>
    );
  }

  const tokenUsagePercent = (agent.tokens_used_this_month / agent.monthly_token_budget) * 100;
  const costUsagePercent = (agent.cost_this_month / agent.monthly_cost_budget) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sub-agents')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SubAgentStatusRing status={agent.status} size="lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-orbitron">{agent.display_name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{agent.name}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs">{agent.model.split('/').pop()}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {agent.status === 'running' ? (
            <Button variant="outline" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : agent.status === 'paused' ? (
            <Button onClick={handleResume}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => setSettingsPanelOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3.5 w-3.5" />
              Total Sessions
            </div>
            <div className="text-xl font-bold">{agent.total_sessions}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              Success Rate
            </div>
            <div className="text-xl font-bold text-green-500">{agent.success_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              Errors
            </div>
            <div className="text-xl font-bold">{agent.error_count}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Avg Duration
            </div>
            <div className="text-xl font-bold">{formatDuration(agent.avg_task_duration_ms)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Tokens (Month)
            </div>
            <div className="text-xl font-bold">{(agent.tokens_used_this_month / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5 text-green-500" />
              Cost (Month)
            </div>
            <div className="text-xl font-bold">${agent.cost_this_month.toFixed(2)}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between">
              <span>Token Budget</span>
              <span className="text-muted-foreground font-normal">
                {(agent.tokens_used_this_month / 1000).toFixed(0)}K / {(agent.monthly_token_budget / 1000).toFixed(0)}K
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={Math.min(tokenUsagePercent, 100)} 
              className={cn('h-2', tokenUsagePercent > 90 && '[&>div]:bg-destructive')}
            />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between">
              <span>Cost Budget</span>
              <span className="text-muted-foreground font-normal">
                ${agent.cost_this_month.toFixed(2)} / ${agent.monthly_cost_budget.toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={Math.min(costUsagePercent, 100)} 
              className={cn('h-2', costUsagePercent > 90 && '[&>div]:bg-destructive')}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">
            <Zap className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-32 animate-pulse bg-card/50" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SessionCard
                    session={session}
                    onViewDetails={() => setSelectedSession(session)}
                    onRerun={() => toast.info('Rerun coming soon')}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Model</h4>
                  <p className="font-mono text-sm">{agent.model}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Workspace</h4>
                  <p className="font-mono text-sm">{agent.workspace}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Max Concurrent Tasks</h4>
                  <p>{agent.max_concurrent_tasks}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Timeout</h4>
                  <p>{agent.timeout_minutes} minutes</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p>{format(new Date(agent.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Active</h4>
                  <p>{agent.last_active ? format(new Date(agent.last_active), 'MMM d, h:mm a') : 'Never'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Allowed Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.allowed_tools.map(tool => (
                    <Badge key={tool} variant="secondary">{tool}</Badge>
                  ))}
                </div>
              </div>

              {agent.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{agent.description}</p>
                </div>
              )}

              {agent.system_prompt && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">System Prompt</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">{agent.system_prompt}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      {/* Agent Settings Panel */}
      <AgentSettingsPanel
        agent={agent}
        open={settingsPanelOpen}
        onOpenChange={setSettingsPanelOpen}
      />
    </div>
  );
};
