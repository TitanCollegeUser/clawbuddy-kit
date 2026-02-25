import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Skill } from './useSkills';

interface SkillWithOperationsCount extends Skill {
  operations_count: number;
}

interface OperationsCountMap {
  [skillId: string]: number;
}

export const useActiveSkillsWithOperations = () => {
  return useQuery({
    queryKey: ['skills', 'accepted', 'with-operations'],
    queryFn: async (): Promise<{ skills: Skill[]; operationsCounts: OperationsCountMap }> => {
      // Fetch accepted skills
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('bujji_status', 'accepted')
        .order('reviewed_at', { ascending: false });

      if (skillsError) throw skillsError;
      if (!skills || skills.length === 0) {
        return { skills: [], operationsCounts: {} };
      }

      // Fetch operations counts for these skills
      const skillIds = skills.map(s => s.id);
      const { data: operations, error: opsError } = await supabase
        .from('skill_operations')
        .select('skill_id')
        .in('skill_id', skillIds);

      if (opsError) throw opsError;

      // Count operations per skill
      const operationsCounts: OperationsCountMap = {};
      (operations || []).forEach(op => {
        operationsCounts[op.skill_id] = (operationsCounts[op.skill_id] || 0) + 1;
      });

      return {
        skills: skills as Skill[],
        operationsCounts,
      };
    },
  });
};
