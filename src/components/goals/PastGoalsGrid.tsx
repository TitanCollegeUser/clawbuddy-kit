import { motion } from 'framer-motion';
import { Target, Calendar, ListTodo, LayoutGrid, Clock } from 'lucide-react';
import { Goal } from '@/hooks/useGoals';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface PastGoalsGridProps {
  goals: Goal[];
  onSelectGoal?: (goal: Goal) => void;
}

const statusColors = {
  draft: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  sent_to_bujji: 'bg-green-500/10 text-green-500 border-green-500/30',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  completed: 'bg-green-500/10 text-green-500 border-green-500/30',
};

const statusLabels = {
  draft: 'Draft',
  sent_to_bujji: 'On Board',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const typeIcons = {
  weekly: '📅',
  monthly: '🗓️',
  quarterly: '📊',
  yearly: '🎯',
};

export const PastGoalsGrid = ({ goals, onSelectGoal }: PastGoalsGridProps) => {
  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No past goals yet</p>
        <p className="text-sm">Your analyzed goals will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal, index) => (
        <motion.div
          key={goal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectGoal?.(goal)}
          className={cn(
            'p-4 rounded-xl border transition-all cursor-pointer',
            'bg-card/50 border-border/50 hover:border-primary/30',
            'hover:shadow-lg hover:shadow-primary/5'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeIcons[goal.goal_type]}</span>
              <Badge variant="outline" className={cn('text-xs', statusColors[goal.status])}>
                {statusLabels[goal.status]}
              </Badge>
            </div>
            {goal.sent_to_bujji_at && (
              <LayoutGrid className="h-4 w-4 text-green-500" />
            )}
          </div>

          <h4 className="font-semibold text-foreground mb-2 line-clamp-2">{goal.title}</h4>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              {goal.action_items?.length || 0} items
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {goal.goal_type}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground/70 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(goal.created_at), { addSuffix: true })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
