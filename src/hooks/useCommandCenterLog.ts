import { useMemo } from 'react';
import { useAiLog } from '@/hooks/useAiLog';
import type { ActivityEntry } from '@/types/command-center';

export function useCommandCenterLog() {
  const { data: logEntries, isLoading } = useAiLog();

  const entries = useMemo((): ActivityEntry[] => {
    if (!logEntries || logEntries.length === 0) return [];

    return logEntries.slice(0, 30).map((entry) => {
      const d = (entry as Record<string, unknown>).data as Record<string, unknown> | null;
      return {
        id: entry.id,
        time: new Date(entry.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        agentEmoji: entry.agent_emoji || '🤖',
        agentName: entry.agent_name || 'Agent',
        category: entry.category as ActivityEntry['category'],
        message: entry.message,
        runId: (d?.run_id as string) || undefined,
      };
    });
  }, [logEntries]);

  return { entries, isLoading };
}
