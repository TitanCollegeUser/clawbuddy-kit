import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mockBuildHistory } from '@/data/command-center-data';
import type { BuildEntry } from '@/types/command-center';

interface BuildInsightData {
  event_type?: string;
  phases_completed?: number;
  total_phases?: number;
  duration?: string;
  self_heals?: number;
  heal_attempts?: number;
  alignment_score?: number;
  alignment?: number;
  run_id?: string;
}

export function useBuildHistory() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['cc_build_history', user?.id],
    queryFn: async () => {
      // Primary: structured event_type in data JSON
      const { data: structured, error: err1 } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('data->>event_type', 'build_summary')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!err1 && structured && structured.length > 0) return structured;

      // Fallback: legacy insight_type matching (backward compat)
      const { data: legacy, error: err2 } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('insight_type', 'summary')
        .order('created_at', { ascending: false })
        .limit(20);

      if (err2) throw err2;
      return legacy ?? [];
    },
    enabled: !!user,
  });

  const builds = useMemo((): BuildEntry[] => {
    if (!query.data || query.data.length === 0) return mockBuildHistory;

    return query.data.map((row, i) => {
      const d = row.data as unknown as BuildInsightData | null;
      return {
        id: row.id || String(i),
        date: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        title:
          (row.title as string)
            .replace(/^(Session Report|Build Complete|Overnight Build Report)\s*[—-]\s*/, '')
            .trim() || (row.title as string),
        phasesCompleted: d?.phases_completed ?? 8,
        totalPhases: d?.total_phases ?? 8,
        duration: d?.duration ?? '',
        healAttempts: d?.self_heals ?? d?.heal_attempts ?? 0,
        alignmentScore: d?.alignment_score ?? d?.alignment ?? 0,
        runId: d?.run_id || undefined,
      };
    });
  }, [query.data]);

  return { builds, isLoading: query.isLoading };
}
