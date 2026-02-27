import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useRayConnection, formatLastSeen } from '@/hooks/useRayConnection';
import { usePendingQuestionsCount } from '@/hooks/useAiQuestions';
import { useAiLog } from '@/hooks/useAiLog';
import { useTasks } from '@/hooks/useTasks';
import { useAiSettings } from '@/contexts/AiSettingsContext';
import { useSubAgents } from '@/hooks/useSubAgents';
import { useUnreadReportsCount } from '@/hooks/useReports';
import { useOffices } from '@/hooks/useOffices';
import { useAuth } from '@/contexts/AuthContext';
import { TaskStatsChart } from '@/components/charts/TaskStatsChart';
import { PriorityChart } from '@/components/charts/PriorityChart';
import { WeeklyProgressChart } from '@/components/charts/WeeklyProgressChart';
import { AiImpactPanel } from '@/components/dashboard/AiImpactPanel';
import { AiAssistantAvatar } from '@/components/ai-assistant/AiAssistantAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2, ListTodo, AlertCircle, Bot, TrendingUp,
  MessageCircleQuestion, Building2, FileText, Wifi, WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { useMemo } from 'react';
import { useBoardColumns } from '@/hooks/useBoardColumns';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

export const DashboardPage = () => {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useTaskStats();
  const { data: boardColumns = [] } = useBoardColumns();
  const { agents, isActuallyOnline } = useAiStatus();
  const primaryAgent = agents[0];
  const { connectionStatus } = useRayConnection();
  const { data: pendingQuestions = 0 } = usePendingQuestionsCount();
  const { data: aiLogEntries = [] } = useAiLog();
  const { data: tasks = [] } = useTasks();
  const { settings } = useAiSettings();
  const { data: subAgents = [] } = useSubAgents();
  const { data: unreadReports = 0 } = useUnreadReportsCount();
  const { data: offices = [] } = useOffices();

  const runningAgents = subAgents.filter(a => a.status === 'running').length;
  const idleAgents = subAgents.filter(a => a.status === 'idle').length;

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    tasks.forEach((t) => {
      const p = t.priority || 'Medium';
      if (p in counts) counts[p as keyof typeof counts]++;
    });
    return [
      { name: 'Low', value: counts.Low, color: 'hsl(160 84% 39%)' },
      { name: 'Medium', value: counts.Medium, color: 'hsl(38 92% 50%)' },
      { name: 'High', value: counts.High, color: 'hsl(0 84% 60%)' },
      { name: 'Urgent', value: counts.Urgent, color: 'hsl(258 90% 66%)' },
    ];
  }, [tasks]);

  // Weekly progress
  const weeklyData = useMemo(() => {
    const doneCol = boardColumns.find(c => c.name.toLowerCase() === 'done');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));
      const completed = doneCol
        ? tasks.filter(t =>
            t.board_column_id === doneCol.id &&
            t.updated_at &&
            isAfter(new Date(t.updated_at), dayStart) &&
            !isAfter(new Date(t.updated_at), dayEnd)
          ).length
        : 0;
      days.push({ day: format(date, 'EEE'), completed });
    }
    return days;
  }, [tasks, boardColumns]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = user?.user_metadata?.name || 'Commander';

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo, accent: 'hsl(var(--foreground))' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, accent: 'hsl(160 84% 39%)' },
    { label: 'Needs Input', value: stats.needsInput, icon: AlertCircle, accent: 'hsl(38 92% 50%)' },
    { label: 'AI Tasks', value: stats.bujjiTasks, icon: Bot, accent: 'hsl(258 90% 66%)' },
    { label: 'Sub-Agents', value: subAgents.length, icon: Bot, accent: 'hsl(var(--primary))' },
  ];

  const connectionColor =
    connectionStatus.connectionState === 'online' ? 'hsl(160 84% 39%)' :
    connectionStatus.connectionState === 'recent' ? 'hsl(38 92% 50%)' :
    'hsl(var(--muted-foreground))';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Row 1: Welcome + Ray Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <motion.div {...fadeUp(0)}>
          <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-foreground">
            {greeting}, {userName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · {stats.total - stats.done} tasks remaining
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.1)}>
          <Card className="glass">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="relative">
                <AiAssistantAvatar
                  size="sm"
                  isOnline={isActuallyOnline}
                  ringColor={primaryAgent?.ring_color || undefined}
                />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {isActuallyOnline ? (
                    <Wifi className="h-3 w-3" style={{ color: connectionColor }} />
                  ) : (
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">{primaryAgent?.agent_name || 'AI'}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isActuallyOnline
                    ? primaryAgent?.status_message || 'Online'
                    : connectionStatus.lastSeen
                      ? `Last seen ${formatLastSeen(connectionStatus.lastSeen)}`
                      : 'Offline'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2: Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {statsLoading
          ? [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-card/30" />)
          : statCards.map((card, index) => (
              <motion.div key={card.label} {...fadeUp(0.05 * index)}>
                <Card className="glass hover:scale-[1.02] transition-transform overflow-hidden">
                  <div className="h-0.5" style={{ backgroundColor: card.accent, opacity: 0.6 }} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{card.label}</p>
                        <p className="text-2xl font-orbitron font-bold mt-1 text-foreground">{card.value}</p>
                      </div>
                      <card.icon className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Row 2.5: AI Impact */}
      <motion.div {...fadeUp(0.15)}>
        <AiImpactPanel />
      </motion.div>

      {/* Row 3: Charts + Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Completion + Priority side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div {...fadeUp(0.2)}>
              <Card className="glass h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <TaskStatsChart completed={stats.done} total={stats.total} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeUp(0.25)}>
              <Card className="glass h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PriorityChart data={priorityData} />
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {priorityData.map((p) => (
                      <div key={p.name} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Weekly Progress */}
          <motion.div {...fadeUp(0.3)}>
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyProgressChart data={weeklyData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Panels */}
        <div className="space-y-6">
          {/* Pending Questions */}
          <motion.div {...fadeUp(0.2)}>
            <Link to="/questions">
              <Card className="glass hover:bg-primary/5 transition-colors cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageCircleQuestion className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-orbitron font-bold text-foreground">{pendingQuestions}</p>
                      <p className="text-xs text-muted-foreground">Pending Questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* AI Log */}
          <motion.div {...fadeUp(0.3)}>
            <Card className="glass">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Log</CardTitle>
                <Link to="/log" className="text-xs text-primary hover:underline">View log</Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {aiLogEntries.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2.5 text-sm">
                      <div className="w-1 h-6 mt-0.5 rounded-full bg-primary/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate text-xs">
                          {entry.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.created_at && format(new Date(entry.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {aiLogEntries.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">No log entries yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Row 4: System Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div {...fadeUp(0.4)}>
          <Link to="/sub-agents">
            <Card className="glass hover:bg-primary/5 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sub-Agents</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xl font-orbitron font-bold text-foreground">{subAgents.length}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(160 84% 39%)' }} />
                    <span className="text-xs text-muted-foreground">{runningAgents} running</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground">{idleAgents} idle</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.45)}>
          <Link to="/workspace">
            <Card className="glass hover:bg-primary/5 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Workspace</CardTitle>
                </div>
                <p className="text-xl font-orbitron font-bold text-foreground">{offices.length}</p>
                <p className="text-[10px] text-muted-foreground">{offices.length === 1 ? 'Office' : 'Offices'} created</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.5)}>
          <Link to="/reports">
            <Card className="glass hover:bg-primary/5 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle>
                </div>
                <p className="text-xl font-orbitron font-bold text-foreground">{unreadReports}</p>
                <p className="text-[10px] text-muted-foreground">Unread reports</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
