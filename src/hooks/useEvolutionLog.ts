import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mockEvolutionLog } from '@/data/command-center-data';
import type { EvolutionEntry } from '@/types/command-center';

interface EvolutionLogData {
  event_type?: string;
  type?: string;
  file?: string;
  change?: string;
  reason?: string;
  run_id?: string;
}

export function useEvolutionLog() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['cc_evolution_log', user?.id],
    queryFn: async () => {
      // Primary: structured category = 'self_evolution'
      const { data: structured, error: err1 } = await supabase
        .from('ai_log')
        .select('*')
        .eq('category', 'self_evolution')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!err1 && structured && structured.length > 0) return structured;

      // Fallback: legacy message prefix matching (backward compat)
      const { data: legacy, error: err2 } = await supabase
        .from('ai_log')
        .select('*')
        .ilike('message', '%[SELF-EVOLUTION]%')
        .order('created_at', { ascending: false })
        .limit(20);

      if (err2) throw err2;
      return legacy ?? [];
    },
    enabled: !!user,
  });

  const entries = useMemo((): EvolutionEntry[] => {
    if (!query.data || query.data.length === 0) return mockEvolutionLog;

    return query.data.map((row, i) => {
      const msg = (row.message as string) ?? '';
      const d = row.data as unknown as EvolutionLogData | null;

      // Prefer structured data fields, fall back to regex on message
      const type = d?.type || msg.match(/Type:\s*(\w+)/)?.[1] || 'observation';
      const file = d?.file || msg.match(/File:\s*([^\n]+)/)?.[1]?.trim() || '';
      const change = d?.change || msg.match(/Change:\s*([^\n]+)/)?.[1]?.trim() || msg.replace('[SELF-EVOLUTION]', '').trim();
      const trigger = d?.reason || msg.match(/Reason:\s*([^\n]+)/)?.[1]?.trim() || '';

      return {
        id: row.id || String(i),
        date: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        type,
        file,
        change,
        trigger,
      };
    });
  }, [query.data]);

  return { entries, isLoading: query.isLoading };
}
