import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RunLifecycleEntry } from '@/types/command-center';

/**
 * Given a run_id, fetch all logs + insights for that run and return
 * a unified, chronologically sorted timeline.
 */
export function useRunLifecycle(runId: string | null) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['cc_run_lifecycle', runId],
    queryFn: async () => {
      if (!runId) return { logs: [], insights: [] };

      // Fetch logs and insights in parallel
      const [logsResult, insightsResult] = await Promise.all([
        supabase
          .from('ai_log')
          .select('id, message, category, agent_name, agent_emoji, created_at, data')
          .eq('data->>run_id', runId)
          .order('created_at', { ascending: true }),
        supabase
          .from('ai_insights')
          .select('id, title, content, insight_type, data, created_at')
          .eq('data->>run_id', runId)
          .order('created_at', { ascending: true }),
      ]);

      return {
        logs: logsResult.data ?? [],
        insights: insightsResult.data ?? [],
      };
    },
    enabled: !!user && !!runId,
  });

  const timeline = useMemo((): RunLifecycleEntry[] => {
    if (!query.data) return [];

    const logEntries: RunLifecycleEntry[] = (query.data.logs || []).map((row) => {
      const d = row.data as Record<string, unknown> | null;
      return {
        id: row.id,
        type: 'log' as const,
        timestamp: row.created_at,
        message: row.message,
        category: row.category,
        phase: (d?.phase as string) || undefined,
        agentName: row.agent_name || undefined,
        agentEmoji: row.agent_emoji || undefined,
      };
    });

    const insightEntries: RunLifecycleEntry[] = (query.data.insights || []).map((row) => {
      const d = row.data as Record<string, unknown> | null;
      return {
        id: row.id,
        type: 'insight' as const,
        timestamp: row.created_at,
        message: (row.title as string) || (row.content as string) || '',
        category: row.insight_type || undefined,
        phase: (d?.phase as string) || undefined,
      };
    });

    // Merge and sort chronologically
    return [...logEntries, ...insightEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [query.data]);

  return {
    timeline,
    isLoading: query.isLoading,
    logCount: query.data?.logs?.length ?? 0,
    insightCount: query.data?.insights?.length ?? 0,
  };
}
