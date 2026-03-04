import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mockAlignmentChecks } from '@/data/command-center-data';
import type { AlignmentCheck } from '@/types/command-center';

interface AlignmentInsightData {
  event_type?: string;
  score?: number;
  grade?: string;
  run_id?: string;
  task_id?: string;
  details?: Array<{
    check: string;
    status: string;
    detail: string;
    description?: string;
  }>;
}

export function useAlignmentScore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cc_alignment_score', user?.id],
    queryFn: async () => {
      // Primary: structured event_type in data JSON
      const { data: structured, error: err1 } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('data->>event_type', 'alignment_score')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!err1 && structured && structured.length > 0) return structured[0];

      // Fallback: legacy title matching (backward compat)
      const { data: legacy, error: err2 } = await supabase
        .from('ai_insights')
        .select('*')
        .ilike('title', '%Alignment Score%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (err2) throw err2;
      return legacy?.[0] ?? null;
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cc-alignment-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_insights' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cc_alignment_score'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const result = useMemo(() => {
    const row = query.data;
    if (!row) {
      return {
        score: 83,
        grade: 'B',
        checks: mockAlignmentChecks,
        lastRun: '',
      };
    }

    const d = row.data as unknown as AlignmentInsightData | null;
    const score = d?.score ?? 83;
    const grade = d?.grade ?? 'B';
    const checks: AlignmentCheck[] = d?.details
      ? d.details.map((c, i) => ({
          id: String(i),
          name: c.check,
          status: c.status as 'pass' | 'warn' | 'fail',
          detail: c.detail,
          description: c.description || '',
        }))
      : mockAlignmentChecks;

    const lastRun = new Date(row.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return { score, grade, checks, lastRun };
  }, [query.data]);

  return { ...result, isLoading: query.isLoading };
}
