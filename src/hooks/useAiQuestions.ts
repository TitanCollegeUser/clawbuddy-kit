import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AiQuestion {
  id: string;
  question: string;
  context: string | null;
  related_task_id: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'answered' | 'dismissed';
  question_type: 'question' | 'approval';
  answer: string | null;
  approval_response: boolean | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  agent_name: string | null;
  agent_emoji: string | null;
  related_task?: {
    id: string;
    title: string;
  } | null;
}

export const useAiQuestions = (status?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai_questions', status, user?.id],
    queryFn: async (): Promise<AiQuestion[]> => {
      let query = supabase
        .from('ai_questions')
        .select(`
          *,
          related_task:tasks(id, title)
        `)
        .order('created_at', { ascending: false });

      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AiQuestion[];
    },
    enabled: !!user,
  });
};

export const usePendingQuestionsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai_questions_count', user?.id],
    queryFn: async (): Promise<number> => {
      let query = supabase
        .from('ai_questions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

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

export const useAnswerQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const { error } = await supabase
        .from('ai_questions')
        .update({
          answer,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_questions'] });
      queryClient.invalidateQueries({ queryKey: ['ai_questions_count'] });
    },
  });
};

export const useApproveQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approved, note }: { id: string; approved: boolean; note?: string }) => {
      const { error } = await supabase
        .from('ai_questions')
        .update({
          approval_response: approved,
          answer: note || null,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_questions'] });
      queryClient.invalidateQueries({ queryKey: ['ai_questions_count'] });
    },
  });
};

export const useDismissQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_questions')
        .update({ status: 'dismissed' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_questions'] });
      queryClient.invalidateQueries({ queryKey: ['ai_questions_count'] });
    },
  });
};
