import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficeAgent {
  id: string;
  office_id: string;
  name: string;
  role: string;
  species: string;
  neon_color: string;
  fur_color: string;
  fur_highlight: string;
  suit_color: string;
  desk_position_x: number;
  desk_position_y: number;
  status: string;
  current_thought: string | null;
  target_agent: string | null;
  current_task_id: string | null;
  metadata: Record<string, unknown>;
  persona: string | null;
  skills: string[];
  secret_sauce: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export const useOfficeAgents = (officeId: string) => {
  return useQuery({
    queryKey: ['office-agents', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_agents')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as OfficeAgent[];
    },
    enabled: !!officeId,
  });
};

export const useCreateOfficeAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agent: Omit<OfficeAgent, 'id' | 'created_at' | 'updated_at' | 'status' | 'current_thought' | 'target_agent' | 'current_task_id'>) => {
      const { data, error } = await supabase
        .from('office_agents')
        .insert([agent as any])
        .select()
        .single();
      if (error) throw error;
      return data as OfficeAgent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['office-agents', variables.office_id] });
      queryClient.invalidateQueries({ queryKey: ['office-agent-count'] });
    },
  });
};
