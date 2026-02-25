import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { Skill } from './useSkills';

export const useSkillsByAgent = (agentName?: string | null) => {
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('skills_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skills' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['skills'] });
          queryClient.invalidateQueries({ queryKey: ['skill_counts'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const skillsQuery = useQuery({
    queryKey: ['skills', 'by_agent', agentName],
    queryFn: async (): Promise<Skill[]> => {
      let query = supabase.from('skills').select('*').order('created_at', { ascending: false });
      if (agentName) {
        query = query.eq('agent_name', agentName);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Skill[];
    },
  });

  return skillsQuery;
};

export const useSkillCounts = () => {
  return useQuery({
    queryKey: ['skill_counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('skills')
        .select('agent_name');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { agent_name: string | null }) => {
        const name = row.agent_name || 'unassigned';
        counts[name] = (counts[name] || 0) + 1;
      });
      return counts;
    },
  });
};
