import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useBoardColumns } from '@/hooks/useBoardColumns';
import { useReports } from '@/hooks/useReports';
import { useAiInsights } from '@/hooks/useAiInsights';
import { useAiLog } from '@/hooks/useAiLog';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { isToday, isThisWeek } from 'date-fns';
import { CheckCircle2, FileText, Lightbulb, ScrollText, TrendingUp, Zap } from 'lucide-react';

export const AiImpactPanel = () => {
  const { user } = useAuth();
  const { data: tasks = [] } = useTasks();
  const { data: columns = [] } = useBoardColumns();
  const { data: reports = [] } = useReports('all');
  const { data: insights = [] } = useAiInsights(user?.id);
  const { data: logEntries = [] } = useAiLog();

  const metrics = useMemo(() => {
    const doneCol = columns.find(c => c.name.toLowerCase() === 'done');

    const completedToday = doneCol
      ? tasks.filter(t =>
          t.board_column_id === doneCol.id &&
          t.updated_at && isToday(new Date(t.updated_at))
        ).length
      : 0;

    const completedThisWeek = doneCol
      ? tasks.filter(t =>
          t.board_column_id === doneCol.id &&
          t.updated_at && isThisWeek(new Date(t.updated_at))
        ).length
      : 0;

    const reportsToday = reports
      ? reports.filter(r => isToday(new Date(r.created_at))).length
      : 0;

    const insightsToday = insights
      ? insights.filter(i => isToday(new Date(i.created_at))).length
      : 0;

    const logsToday = logEntries
      ? logEntries.filter(l => l.created_at && isToday(new Date(l.created_at))).length
      : 0;

    return { completedToday, completedThisWeek, reportsToday, insightsToday, logsToday };
  }, [tasks, columns, reports, insights, logEntries]);

  const items = [
    { label: 'Tasks Done Today', value: metrics.completedToday, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'This Week', value: metrics.completedThisWeek, icon: TrendingUp, color: 'text-primary' },
    { label: 'Reports', value: metrics.reportsToday, icon: FileText, color: 'text-blue-400' },
    { label: 'Insights', value: metrics.insightsToday, icon: Lightbulb, color: 'text-amber-400' },
    { label: 'Log Entries', value: metrics.logsToday, icon: ScrollText, color: 'text-muted-foreground' },
  ];

  const totalActivity = metrics.completedToday + metrics.reportsToday + metrics.insightsToday + metrics.logsToday;

  return (
    <Card className="glass overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-primary to-amber-500 opacity-60" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          AI Impact — Today
          {totalActivity > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {totalActivity} actions
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white/[0.02] border border-border/20 hover:border-border/40 transition-colors"
            >
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <p className="text-2xl font-orbitron font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground text-center leading-tight">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
