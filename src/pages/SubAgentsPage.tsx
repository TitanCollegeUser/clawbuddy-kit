import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Plus, RefreshCw, Zap, Activity, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubAgents, useUpdateSubAgent, SubAgent } from '@/hooks/useSubAgents';
import { SubAgentCard } from '@/components/subagents/SubAgentCard';
import { CreateAgentModal } from '@/components/subagents/CreateAgentModal';
import { AgentSettingsPanel } from '@/components/subagents/AgentSettingsPanel';
import { toast } from 'sonner';

export const SubAgentsPage = () => {
  const { data: agents = [], isLoading, refetch } = useSubAgents();
  const updateAgent = useUpdateSubAgent();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsAgent, setSettingsAgent] = useState<SubAgent | null>(null);

  const runningAgents = agents.filter(a => a.status === 'running').length;
  const totalSessions = agents.reduce((sum, a) => sum + a.total_sessions, 0);
  const avgSuccessRate = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.success_rate, 0) / agents.length
    : 0;
  const totalCost = agents.reduce((sum, a) => sum + a.cost_this_month, 0);

  const handlePause = async (agentId: string) => {
    try {
      await updateAgent.mutateAsync({ id: agentId, status: 'paused' });
      toast.success('Agent paused');
    } catch (error) {
      toast.error('Failed to pause agent');
    }
  };

  const handleResume = async (agentId: string) => {
    try {
      await updateAgent.mutateAsync({ id: agentId, status: 'idle' });
      toast.success('Agent resumed');
    } catch (error) {
      toast.error('Failed to resume agent');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-orbitron flex items-center gap-3">
            <Bot className="h-7 w-7 text-primary" />
            Sub-Agents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your AI sub-agents and monitor their activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sub-Agent
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {runningAgents}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ {agents.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bot className="h-4 w-4 text-green-500" />
              Avg Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{avgSuccessRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Cost This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-card/50" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Bot className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Sub-Agents Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first sub-agent to start delegating tasks
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sub-Agent
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <SubAgentCard
                agent={agent}
                onPause={() => handlePause(agent.id)}
                onResume={() => handleResume(agent.id)}
                onSettings={() => setSettingsAgent(agent)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      <CreateAgentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      {/* Settings Panel */}
      <AgentSettingsPanel
        agent={settingsAgent}
        open={!!settingsAgent}
        onOpenChange={(open) => !open && setSettingsAgent(null)}
      />
    </div>
  );
};
