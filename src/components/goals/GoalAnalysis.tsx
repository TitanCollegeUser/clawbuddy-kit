import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';
import { Assumption, Metric } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

interface GoalAnalysisProps {
  title: string;
  assumptions: Assumption[];
  metrics: Metric[];
}

export const GoalAnalysis = ({ title, assumptions, metrics }: GoalAnalysisProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Goal Analysis</p>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      </div>

      {/* Assumptions */}
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h4 className="font-semibold text-amber-600 dark:text-amber-400">Assumptions</h4>
        </div>
        <div className="space-y-2">
          {assumptions.map((assumption, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-sm"
            >
              <span className="text-amber-500">•</span>
              <div>
                <span className="font-medium text-foreground">{assumption.category}:</span>{' '}
                <span className="text-muted-foreground">{assumption.value}</span>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{assumption.explanation}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-primary">Required Metrics</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-3 rounded-lg bg-background/50 border border-border/50',
                'text-center'
              )}
            >
              <p className="text-lg font-bold text-foreground">
                {metric.value}
                {metric.unit && <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{metric.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
