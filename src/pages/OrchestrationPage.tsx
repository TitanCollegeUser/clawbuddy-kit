import { motion } from 'framer-motion';
import { GitMerge, Zap, Inbox, History } from 'lucide-react';
import { ActiveDispatches } from '@/components/orchestration/ActiveDispatches';
import { QueuePanel } from '@/components/orchestration/QueuePanel';
import { RunHistory } from '@/components/orchestration/RunHistory';
import { useOrchestrationRealtime } from '@/hooks/useOrchestration';

export const OrchestrationPage = () => {
  // Wire up realtime
  useOrchestrationRealtime();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <GitMerge className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orchestration</h1>
          <p className="text-sm text-muted-foreground">
            Dispatch pipeline, queue status, and run lifecycle
          </p>
        </div>
      </motion.div>

      {/* Section 1: Active Dispatches */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Active Dispatches</h2>
        </div>
        <ActiveDispatches />
      </motion.section>

      {/* Section 2: Queue */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Pending Queue</h2>
        </div>
        <QueuePanel />
      </motion.section>

      {/* Section 3: Run History */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Run History</h2>
        </div>
        <RunHistory />
      </motion.section>
    </div>
  );
};
