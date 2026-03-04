import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import type { AiLogEntry, RunGroup, PendingTask } from '@/types/command-center';

export type { PendingTask, AiLogEntry, RunGroup };

function groupRuns(rows: Record<string, unknown>[]): RunGroup[] {
  const map = new Map<string, AiLogEntry[]>();
  for (const row of rows) {
    const d = row.data as Record<string, unknown> | null;
    const runId = (d?.run_id as string) || 'unknown';
    if (!map.has(runId)) map.set(runId, []);
    map.get(runId)!.push(row as unknown as AiLogEntry);
  }
  const groups: RunGroup[] = [];
  for (const [runId, events] of map) {
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const summary = events.find(e => (e.data as Record<string, unknown> | null)?.event_type === 'build_summary')
      || events.find(e => (e.data as Record<string, unknown> | null)?.event_type === 'run_end');
    const summaryData = (summary?.data || {}) as Record<string, unknown>;
    groups.push({
      runId,
      events,
      outcome: (summaryData.outcome as string) || 'unknown',
      taskTitle: (summaryData.title as string) || events[0]?.message || 'Unknown Task',
      startedAt: events[0]?.created_at || new Date().toISOString(),
      duration: (summaryData.duration as string) || null,
      phases: (summaryData.phases_completed as number) ?? null,
      heals: (summaryData.heals as number) ?? (summaryData.self_heals as number) ?? null,
      alignment: (summaryData.alignment as number) ?? (summaryData.alignment_score as number) ?? null,
    });
  }
  groups.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return groups;
}

// Active dispatches — pending_tasks with status = 'processing'
export const useActiveDispatches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orchestration_active', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_tasks')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'processing')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Pending queue — pending_tasks with status = 'pending'
export const usePendingQueue = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orchestration_queue', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_tasks')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

// Run history — ai_log entries with run lifecycle event_types, grouped by run_id
export const useRunHistory = () => {
  const { user } = useAuth();

  return useQuery<RunGroup[]>({
    queryKey: ['orchestration_runs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_log')
        .select('*')
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .not('data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Filter to run lifecycle events client-side
      const runEventTypes = new Set([
        'run_start',
        'run_end',
        'build_summary',
        'agent_dispatch',
        'dispatch_claimed',
        'phase_complete',
        'self_heal',
      ]);

      const filtered = (data || []).filter((row: Record<string, unknown>) => {
        const d = row.data as Record<string, unknown> | null;
        return d && typeof d.event_type === 'string' && runEventTypes.has(d.event_type);
      });

      return groupRuns(filtered);
    },
    enabled: !!user,
  });
};

// Delete a run (all log entries + insights for a run_id)
export const useDeleteRun = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      // Delete from ai_log (all entries for this run, including system stale_progress alerts)
      const { error: logError, count: logCount } = await supabase
        .from('ai_log')
        .delete({ count: 'exact' })
        .filter('data->>run_id', 'eq', runId);

      if (logError) throw logError;

      // Delete from ai_insights
      const { error: insightError, count: insightCount } = await supabase
        .from('ai_insights')
        .delete({ count: 'exact' })
        .filter('data->>run_id', 'eq', runId);

      if (insightError) console.warn('Failed to delete insights for run:', insightError);

      return { logCount: logCount || 0, insightCount: insightCount || 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration_runs'] });
      queryClient.invalidateQueries({ queryKey: ['build_history'] });
    },
  });
};

// Realtime subscription for orchestration tables
export const useOrchestrationRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('orchestration_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orchestration_active'] });
          queryClient.invalidateQueries({ queryKey: ['orchestration_queue'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_log' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orchestration_runs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
