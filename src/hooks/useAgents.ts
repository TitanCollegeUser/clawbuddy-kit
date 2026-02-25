import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AiAgent {
  id: string;
  user_id: string;
  name: string;
  webhook_secret: string;
  is_default: boolean;
  avatar_color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useAgents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai_agents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AiAgent[];
    },
    enabled: !!user,
  });

  const createAgent = useMutation({
    mutationFn: async (agent: { name: string; description?: string; avatar_color?: string }) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({ ...agent, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as AiAgent;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai_agents'] }),
  });

  const updateAgent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AiAgent> & { id: string }) => {
      const { error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai_agents'] }),
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai_agents'] }),
  });

  const setDefault = useMutation({
    mutationFn: async (agentId: string) => {
      // Unset all defaults first
      await supabase
        .from('ai_agents')
        .update({ is_default: false })
        .eq('user_id', user!.id);
      // Set the new default
      const { error } = await supabase
        .from('ai_agents')
        .update({ is_default: true })
        .eq('id', agentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai_agents'] }),
  });

  const defaultAgent = query.data?.find((a) => a.is_default) ?? query.data?.[0] ?? null;

  return {
    agents: query.data ?? [],
    isLoading: query.isLoading,
    defaultAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    setDefault,
  };
};
