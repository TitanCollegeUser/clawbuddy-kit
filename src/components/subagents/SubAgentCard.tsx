import { motion } from 'framer-motion';
import { Bot, Settings, Pause, Play, Eye, Clock, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubAgentStatusRing } from './SubAgentStatusRing';
import { SubAgent } from '@/hooks/useSubAgents';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SubAgentCardProps {
  agent: SubAgent;
  currentTask?: string;
  onPause?: () => void;
  onResume?: () => void;
  onSettings?: () => void;
}

export const SubAgentCard = ({
  agent,
  currentTask,
  onPause,
  onResume,
  onSettings,
}: SubAgentCardProps) => {
  const navigate = useNavigate();
  const isRunning = agent.status === 'running';
  const isPaused = agent.status === 'paused';

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getModelShortName = (model: string): string => {
    const parts = model.split('/');
    return parts[parts.length - 1].replace(/-\d+$/, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm',
        'hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
        'transition-all duration-300',
        isRunning && 'border-primary/30'
      )}>
        {/* Holographic accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Status Ring */}
            <div className="relative">
              <SubAgentStatusRing status={agent.status} size="md" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="h-5 w-5 text-foreground" />
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{agent.display_name}</h3>
                <Badge variant="outline" className="text-xs font-mono">
                  {getModelShortName(agent.model)}
                </Badge>
              </div>

              {/* Current task or description */}
              <p className="text-sm text-muted-foreground truncate mb-3">
                {isRunning && currentTask ? (
                  <span className="text-primary">{currentTask}</span>
                ) : (
                  agent.description || 'No description'
                )}
              </p>

              {/* Metrics Row */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span>{agent.total_sessions} sessions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <span>{agent.success_rate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>{formatDuration(agent.avg_task_duration_ms)}</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(
                'capitalize',
                agent.status === 'running' && 'border-primary/50 text-primary bg-primary/10',
                agent.status === 'idle' && 'border-amber-500/50 text-amber-500 bg-amber-500/10',
                agent.status === 'paused' && 'border-orange-500/50 text-orange-500 bg-orange-500/10',
                agent.status === 'error' && 'border-destructive/50 text-destructive bg-destructive/10'
              )}
            >
              {agent.status}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={() => navigate(`/sub-agents/${agent.id}`)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View
            </Button>
            
            {isRunning || isPaused ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={isRunning ? onPause : onResume}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-1.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Resume
                  </>
                )}
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onSettings}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
