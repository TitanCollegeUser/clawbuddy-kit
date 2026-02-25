import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MemoryInjection {
  id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const useMemoryInjections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['memory_injections', user?.id],
    queryFn: async (): Promise<MemoryInjection[]> => {
      const { data, error } = await supabase
        .from('memory_injections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MemoryInjection[];
    },
    enabled: !!user,
  });
};

export const useSubmitMemory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('User not authenticated');

      // 1. Insert into memory_injections table
      const { data: memoryData, error: memoryError } = await supabase
        .from('memory_injections')
        .insert({
          user_id: user.id,
          content,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (memoryError) throw memoryError;

      // 2. Create bujji_log entry (category: observation)
      const logMessage = `🧠 Memory Injection Request

Mani wants to add this to memory, and this is important context.

---
${content}
---

If you understood that, ask him for approval.`;

      const { data: logData, error: logError } = await supabase
        .from('ai_log')
        .insert({
          message: logMessage,
          category: 'observation',
          is_read: false,
        })
        .select()
        .single();

      if (logError) throw logError;

      // 3. Create ai_questions entry (type: approval)
      const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      
      const { data: questionData, error: questionError } = await supabase
        .from('ai_questions')
        .insert({
          question: `Confirm memory injection?`,
          context: JSON.stringify({
            memory_id: memoryData.id,
            content_preview: contentPreview,
          }),
          question_type: 'approval',
          priority: 'normal',
          status: 'pending',
        })
        .select()
        .single();

      if (questionError) throw questionError;

      return {
        memory_injection: memoryData,
        log_entry: logData,
        question: questionData,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory_injections'] });
      queryClient.invalidateQueries({ queryKey: ['ai_log'] });
      queryClient.invalidateQueries({ queryKey: ['ai_questions'] });
      queryClient.invalidateQueries({ queryKey: ['ai_questions_count'] });
      queryClient.invalidateQueries({ queryKey: ['ai_log_unread_count'] });
      toast.success('Memory submitted for AI approval');
    },
    onError: (error) => {
      console.error('Failed to submit memory:', error);
      toast.error('Failed to submit memory');
    },
  });
};

export const useDeleteMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('memory_injections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory_injections'] });
      toast.success('Memory deleted');
    },
    onError: () => {
      toast.error('Failed to delete memory');
    },
  });
};
