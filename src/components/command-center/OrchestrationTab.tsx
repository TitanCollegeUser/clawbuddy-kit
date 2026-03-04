import { motion } from 'framer-motion';
import { Zap, Inbox, History } from 'lucide-react';
import { ActiveDispatches } from '@/components/orchestration/ActiveDispatches';
import { QueuePanel } from '@/components/orchestration/QueuePanel';
import { RunHistory } from '@/components/orchestration/RunHistory';
import { useOrchestrationRealtime } from '@/hooks/useOrchestration';

export function OrchestrationTab() {
  useOrchestrationRealtime();

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="section-heading"><Zap className="h-4 w-4 text-primary icon-glow" />Active Dispatches</h2>
        <ActiveDispatches />
      </motion.section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="section-heading"><Inbox className="h-4 w-4 text-primary icon-glow" />Pending Queue</h2>
        <QueuePanel />
      </motion.section>

      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="section-heading"><History className="h-4 w-4 text-primary icon-glow" />Run History</h2>
        <RunHistory />
      </motion.section>
    </div>
  );
}
