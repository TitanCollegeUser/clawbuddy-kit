import { motion } from 'framer-motion';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AgentAvatar } from '@/components/agent/AgentAvatar';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle2, Edit, ArrowRight, Plus, DollarSign } from 'lucide-react';

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'task_created':
      return Plus;
    case 'task_updated':
      return Edit;
    case 'task_moved':
      return ArrowRight;
    case 'subtask_created':
    case 'subtask_toggled':
      return CheckCircle2;
    case 'budget_updated':
      return DollarSign;
    default:
      return Activity;
  }
};

const formatActionText = (actionType: string, details: Record<string, unknown> | null) => {
  switch (actionType) {
    case 'task_created':
      return `created task "${details?.title || 'Unknown'}"`;
    case 'task_updated':
      return `updated "${details?.title || 'a task'}"`;
    case 'task_moved':
      return `moved "${details?.title || 'a task'}" to ${details?.to_column || 'another column'}`;
    case 'subtask_created':
      return `added subtask "${details?.subtask_title || ''}"`;
    case 'subtask_toggled':
      return `${details?.completed ? 'completed' : 'uncompleted'} a subtask`;
    case 'budget_updated':
      return 'updated budget';
    case 'insight_created':
      return `created insight "${details?.insight_title || ''}"`;
    default:
      return actionType.replace(/_/g, ' ');
  }
};

export const ActivityLogPanel = () => {
  const { data: activities = [], isLoading } = useActivityLog();
  const { agents = [] } = useAiStatus();
  const aiAgentNames = new Set(agents.map((a) => a.agent_name));
  const recentActivities = activities.slice(0, 10);

  if (isLoading) {
    return (
      <div className="bg-card/30 rounded-2xl border border-border/30 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold font-exo text-foreground">Activity Log</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentActivities.length === 0) {
    return (
      <div className="bg-card/30 rounded-2xl border border-border/30 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold font-exo text-foreground">Activity Log</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Activity className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No activity yet</p>
          <p className="text-xs mt-1">Actions will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/30 rounded-2xl border border-border/30 backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold font-exo text-foreground">Activity Log</h3>
      </div>
      
      <ScrollArea className="h-[280px] pr-3">
        <div className="space-y-3">
          {recentActivities.map((activity, index) => {
            const Icon = getActionIcon(activity.action_type);
            const isAiAgent = aiAgentNames.has(activity.actor_name);
            const details = activity.action_details as Record<string, unknown> | null;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="flex items-start gap-3 group pb-3 border-b border-white/5 last:border-0 last:pb-0"
              >
                <div className="relative flex-shrink-0">
                  {isAiAgent ? (
                    <AgentAvatar size="sm" isOnline={false} showStatus={false} />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground">
                        {activity.actor_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-background flex items-center justify-center">
                    <Icon className="h-2.5 w-2.5 text-foreground/50" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.actor_name}</span>
                    {' '}
                    <span className="text-foreground/60">
                      {formatActionText(activity.action_type, details)}
                    </span>
                  </p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {formatDistanceToNow(new Date(activity.created_at!), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
