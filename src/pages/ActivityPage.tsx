import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAiInsights, useMarkInsightAsRead } from '@/hooks/useAiInsights';
import { useActivityLog } from '@/hooks/useActivityLog';
import { format } from 'date-fns';
import { Search, Filter, Bot, User, Lightbulb, CheckCircle, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const actionTypeLabels: Record<string, string> = {
  task_created: 'Created task',
  task_updated: 'Updated task',
  task_moved: 'Moved task',
  task_deleted: 'Deleted task',
  subtask_created: 'Added subtask',
  subtask_toggled: 'Toggled subtask',
  subtask_deleted: 'Removed subtask',
  assignees_added: 'Assigned users',
  assignees_removed: 'Unassigned users',
  budget_updated: 'Updated budget',
  insight_created: 'Created insight',
  question_asked: 'Asked question',
  question_answered: 'Answered question',
};

export const ActivityPage = () => {
  const { data: activities = [], isLoading: activitiesLoading } = useActivityLog();
  const { data: insights = [], isLoading: insightsLoading } = useAiInsights();
  const markAsRead = useMarkInsightAsRead();
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchesSearch =
        search === '' ||
        a.actor_name.toLowerCase().includes(search.toLowerCase()) ||
        a.action_type.toLowerCase().includes(search.toLowerCase()) ||
        (a.comment && a.comment.toLowerCase().includes(search.toLowerCase()));

      const matchesActor = actorFilter === 'all' || a.actor_name === actorFilter;
      const matchesType = typeFilter === 'all' || a.action_type === typeFilter;

      return matchesSearch && matchesActor && matchesType;
    });
  }, [activities, search, actorFilter, typeFilter]);

  const uniqueActors = useMemo(() => {
    return [...new Set(activities.map((a) => a.actor_name))];
  }, [activities]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(activities.map((a) => a.action_type))];
  }, [activities]);

  const unreadInsights = insights.filter((i) => !i.is_read);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-orbitron font-bold text-foreground">Activity</h1>
        <p className="text-muted-foreground mt-1">Track all actions and AI insights</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Log */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 glass"
              />
            </div>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="w-[140px] glass">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actors</SelectItem>
                {uniqueActors.map((actor) => (
                  <SelectItem key={actor} value={actor}>
                    {actor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] glass">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {actionTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Activity List */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activity Log ({filteredActivities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto scrollbar-custom">
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full bg-muted/20" />
                  ))}
                </div>
              ) : filteredActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No activity found</p>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.actor_id === null ? 'bg-violet-500/20' : 'bg-primary/20'
                        }`}
                      >
                        {activity.actor_id === null ? (
                          <Bot className="h-4 w-4 text-violet-400" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{activity.actor_name}</span>{' '}
                          <span className="text-muted-foreground">
                            {actionTypeLabels[activity.action_type] || activity.action_type.replace(/_/g, ' ')}
                          </span>
                        </p>
                        {activity.comment && (
                          <p className="text-sm text-muted-foreground mt-1 italic">"{activity.comment}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.created_at && format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  AI Insights ({unreadInsights.length} new)
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto scrollbar-custom">
                {insightsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full bg-muted/20" />
                    ))}
                  </div>
                ) : insights.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">No insights yet</p>
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          insight.is_read
                            ? 'bg-muted/10 border-border/30'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{insight.content}</p>
                          </div>
                          {!insight.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => markAsRead.mutate(insight.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-amber-400" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {insight.created_at && format(new Date(insight.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
