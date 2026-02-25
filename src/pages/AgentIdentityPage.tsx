import { useParams, Link } from 'react-router-dom';
import { FileCardGrid } from '@/components/identity/FileCardGrid';
import { DailyLogsSection } from '@/components/identity/DailyLogsSection';
import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const AgentIdentityPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, isLoading } = useAgents();
  const agent = agents.find((a) => a.id === agentId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Agent not found</p>
        <Link to="/identity">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Identity
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/identity">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" /> All Agents
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: agent.avatar_color }}
          >
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-orbitron font-bold text-glow">
                {agent.name}
              </h1>
              {agent.is_default && (
                <Badge variant="secondary" className="text-[10px]">Default</Badge>
              )}
            </div>
            <p className="text-muted-foreground font-exo">
              {agent.description || 'AI-managed identity files and daily logs'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FileCardGrid agentId={agentId!} agentName={agent.name} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <DailyLogsSection agentId={agentId!} agentName={agent.name} />
      </motion.div>
    </div>
  );
};
