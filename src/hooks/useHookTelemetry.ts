import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HookExecutionRow {
  id: string;
  created_at: string;
  data: {
    event_type?: string;
    hook_name?: string;
    result?: string;
  } | null;
}

export interface HookTelemetry {
  hookName: string;
  lastFired: string; // relative time string
  lastFiredAt: Date | null;
  executionCount: number;
  lastResult: string; // 'pass' | 'block' | 'fail'
}

/** Map hook_name from telemetry data → static hook config ID */
const HOOK_NAME_TO_ID: Record<string, string> = {
  'command-guard': '1',
  'pre-compact-save': '2',
  'session-start': '3',
  'typecheck': '4',
};

/** Format a date as relative time (e.g., "3m ago", "2h ago") */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Fetches hook execution telemetry from ai_log where
 * data->>'event_type' = 'hook_execution'.
 * Returns per-hook stats: last fired, count, last result.
 */
export function useHookTelemetry() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['cc_hook_telemetry', user?.id],
    queryFn: async (): Promise<HookExecutionRow[]> => {
      const { data, error } = await supabase
        .from('ai_log')
        .select('id, created_at, data')
        .eq('data->>event_type', 'hook_execution')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data as unknown as HookExecutionRow[]) ?? [];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const telemetryMap = useMemo((): Map<string, HookTelemetry> => {
    const map = new Map<string, HookTelemetry>();
    if (!query.data) return map;

    // Group by hook_name
    const groups = new Map<string, HookExecutionRow[]>();
    for (const row of query.data) {
      const hookName = row.data?.hook_name;
      if (!hookName) continue;
      if (!groups.has(hookName)) groups.set(hookName, []);
      groups.get(hookName)!.push(row);
    }

    for (const [hookName, rows] of groups) {
      const latest = rows[0]; // already sorted desc
      const lastFiredAt = new Date(latest.created_at);
      map.set(hookName, {
        hookName,
        lastFired: formatRelativeTime(lastFiredAt),
        lastFiredAt,
        executionCount: rows.length,
        lastResult: latest.data?.result || 'pass',
      });
    }

    return map;
  }, [query.data]);

  return { telemetryMap, hookNameToId: HOOK_NAME_TO_ID, isLoading: query.isLoading };
}
