import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useTaskStats } from '@/hooks/useTaskStats';
import { CheckCircle2, ListTodo, User, Bot, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardStats = () => {
  const { stats, isLoading } = useTaskStats();

  const statCards = [
    { 
      key: 'total' as const, 
      label: 'Total Tasks', 
      icon: ListTodo,
      colorClass: 'text-foreground',
      bgClass: 'bg-card/50',
      borderClass: 'border-border/50',
    },
    { 
      key: 'done' as const, 
      label: 'Completed', 
      icon: CheckCircle2,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
    },
    { 
      key: 'myTasks' as const, 
      label: 'My Tasks', 
      icon: User,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      borderClass: 'border-primary/30',
    },
    { 
      key: 'bujjiTasks' as const, 
      label: 'AI Tasks', 
      icon: Bot,
      colorClass: 'text-violet-400',
      bgClass: 'bg-violet-500/10',
      borderClass: 'border-violet-500/30',
    },
    { 
      key: 'needsInput' as const, 
      label: 'Needs Input', 
      icon: AlertCircle,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-card/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className={`${card.bgClass} ${card.borderClass} border backdrop-blur-sm hover:scale-[1.02] transition-transform cursor-default`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground/70 font-medium uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-bold font-exo mt-1 ${card.colorClass}`}>
                    {stats[card.key]}
                  </p>
                </div>
                <card.icon className={`h-8 w-8 ${card.colorClass} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
