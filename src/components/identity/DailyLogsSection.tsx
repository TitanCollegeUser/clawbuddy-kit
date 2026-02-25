import { useState } from 'react';
import { useDailyLogs, DailyMemoryLog } from '@/hooks/useIdentityFiles';
import { DailyLogCard } from './DailyLogCard';
import { DailyLogModal } from './DailyLogModal';
import { ScrollText } from 'lucide-react';

interface DailyLogsSectionProps {
  agentId?: string;
  agentName?: string;
}

export const DailyLogsSection = ({ agentId, agentName }: DailyLogsSectionProps) => {
  const { data: logs = [] } = useDailyLogs(agentId);
  const [selectedLog, setSelectedLog] = useState<DailyMemoryLog | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-orbitron font-bold">Daily Memory Logs</h2>
        <span className="text-xs text-muted-foreground">({logs.length})</span>
      </div>

      {logs.length === 0 ? (
        <div className="glass rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">No daily logs yet. Your AI agents will create these during sessions.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <DailyLogCard key={log.id} log={log} onClick={() => setSelectedLog(log)} agentName={agentName} />
          ))}
        </div>
      )}

      <DailyLogModal
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        log={selectedLog}
        agentName={agentName}
        agentId={agentId}
      />
    </div>
  );
};
