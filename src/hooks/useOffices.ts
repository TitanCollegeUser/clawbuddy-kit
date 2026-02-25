import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Office {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  director_name: string;
  director_species: string;
  director_color: string;
  site_type: 'office' | 'arena' | 'boiler_room' | 'intelligence';
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useOffices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Office[];
    },
    enabled: !!user,
  });
};

export const useCreateOffice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (office: {
      name: string;
      description?: string;
      director_name: string;
      director_species: string;
      director_color: string;
      site_type?: 'office' | 'arena' | 'boiler_room' | 'intelligence';
    }) => {
      const { data, error } = await supabase
        .from('offices')
        .insert({ ...office, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Office;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });
};

export const useDeleteOffice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });
};

export const useOfficeAgentCount = (officeId: string) => {
  return useQuery({
    queryKey: ['office-agent-count', officeId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('office_agents')
        .select('*', { count: 'exact', head: true })
        .eq('office_id', officeId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!officeId,
  });
};
