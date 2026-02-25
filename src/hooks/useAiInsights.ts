import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface AiInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  data: Json | null;
  target_user_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useAiInsights = (userId?: string) => {
  return useQuery({
    queryKey: ['ai_insights', userId],
    queryFn: async (): Promise<AiInsight[]> => {
      let query = supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`target_user_id.eq.${userId},target_user_id.is.null`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return (data as AiInsight[]) || [];
    },
  });
};

export const useUnreadInsightsCount = (userId?: string) => {
  return useQuery({
    queryKey: ['ai_insights_unread_count', userId],
    queryFn: async (): Promise<number> => {
      let query = supabase
        .from('ai_insights')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (userId) {
        query = query.or(`target_user_id.eq.${userId},target_user_id.is.null`);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useMarkInsightAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (insightId: string) => {
      const { data, error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_insights'] });
      queryClient.invalidateQueries({ queryKey: ['ai_insights_unread_count'] });
    },
  });
};

export const useDeleteInsight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .delete()
        .eq('id', insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_insights'] });
      queryClient.invalidateQueries({ queryKey: ['ai_insights_unread_count'] });
      toast.success('Insight dismissed');
    },
    onError: (error) => {
      toast.error('Failed to delete insight');
      console.error('Delete insight error:', error);
    },
  });
};
