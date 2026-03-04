import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CCSkill } from '@/types/command-center';

// Skill category icon mapping
const categoryIcons: Record<string, string> = {
  'YouTube Pipeline': '📊',
  'YouTube Production Pipeline': '📊',
  'Daily Automations': '📋',
  'Platform Operations': '🚀',
  'Intelligence': '🔍',
  'Communication': '📧',
};

export function useCommandCenterSkills() {
  const query = useQuery({
    queryKey: ['cc_skills_display'],
    queryFn: async () => {
      // Get skills with their operation counts
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, title, status, agent_type')
        .eq('bujji_status', 'accepted')
        .order('created_at', { ascending: false });

      if (skillsError) throw skillsError;
      if (!skills || skills.length === 0) return [];

      // Get operation counts per skill
      const { data: ops, error: opsError } = await supabase
        .from('skill_operations')
        .select('skill_id');

      if (opsError) throw opsError;

      const opCounts = new Map<string, number>();
      (ops ?? []).forEach((op) => {
        opCounts.set(op.skill_id, (opCounts.get(op.skill_id) ?? 0) + 1);
      });

      return skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        title: skill.title,
        status: skill.status as CCSkill['status'],
        agentType: skill.agent_type ?? '',
        operations: opCounts.get(skill.id) ?? 0,
      }));
    },
  });

  const skills = useMemo((): CCSkill[] => {
    if (!query.data || query.data.length === 0) return [];

    return query.data.map((s) => {
      // Derive category from agent_type or fallback
      const category = s.agentType || 'Platform Operations';
      return {
        id: s.id,
        name: s.name,
        category,
        operations: s.operations,
        status: s.status === 'ready' ? 'ready' : s.status === 'archived' ? 'error' : 'building',
        icon: categoryIcons[category] || '⚡',
      };
    });
  }, [query.data]);

  return { skills, isLoading: query.isLoading };
}
