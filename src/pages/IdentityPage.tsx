import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Fingerprint, Bot } from 'lucide-react';

export const IdentityPage = () => {
  const { agents, isLoading } = useAgents();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold text-glow">
              Identity System
            </h1>
            <p className="text-muted-foreground font-exo">
              AI-managed identity files — read-only view
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl bg-card/30" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Bot className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No agents configured</h3>
          <p className="text-sm text-muted-foreground">
            Add an agent in Settings → Agents to get started with the identity system.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer glass hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300 h-full"
                onClick={() => navigate(`/identity/${agent.id}`)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
                      style={{ backgroundColor: agent.avatar_color }}
                    >
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-orbitron font-semibold text-foreground truncate">
                          {agent.name}
                        </p>
                        {agent.is_default && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.description || 'AI Agent'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to view identity files, memory, and daily logs
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
