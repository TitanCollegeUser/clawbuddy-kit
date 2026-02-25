import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AiLogEntry {
  id: string;
  message: string;
  category: 'general' | 'observation' | 'reminder' | 'fyi';
  is_read: boolean;
  created_at: string;
  user_id: string | null;
  agent_name: string | null;
  agent_emoji: string | null;
}

export const useAiLog = (category?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai_log', category, user?.id],
    queryFn: async (): Promise<AiLogEntry[]> => {
      let query = supabase
        .from('ai_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AiLogEntry[];
    },
    enabled: !!user,
  });
};

export const useUnreadLogCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai_log_unread_count', user?.id],
    queryFn: async (): Promise<number> => {
      let query = supabase
        .from('ai_log')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};

export const useMarkLogRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_log')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_log'] });
      queryClient.invalidateQueries({ queryKey: ['ai_log_unread_count'] });
    },
  });
};

export const useMarkAllLogRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      let query = supabase
        .from('ai_log')
        .update({ is_read: true })
        .eq('is_read', false);

      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }

      const { error } = await query;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_log'] });
      queryClient.invalidateQueries({ queryKey: ['ai_log_unread_count'] });
    },
  });
};

export const useDeleteLogEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_log')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_log'] });
      queryClient.invalidateQueries({ queryKey: ['ai_log_unread_count'] });
    },
  });
};
