import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSkillOperationsCounts = (skillIds: string[]) => {
  return useQuery({
    queryKey: ['skill-operations-counts', skillIds],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!skillIds.length) return {};

      const { data, error } = await supabase
        .from('skill_operations')
        .select('skill_id')
        .in('skill_id', skillIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach(op => {
        counts[op.skill_id] = (counts[op.skill_id] || 0) + 1;
      });
      return counts;
    },
    enabled: skillIds.length > 0,
  });
};
