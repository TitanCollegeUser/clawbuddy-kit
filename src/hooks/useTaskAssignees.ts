import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAssignUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('task_assignees')
        .insert({ task_id: taskId, user_id: userId })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('User assigned');
    },
    onError: (error) => {
      toast.error('Failed to assign user');
      console.error('Assign user error:', error);
    },
  });
};

export const useUnassignUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assigneeId: string) => {
      const { error } = await supabase
        .from('task_assignees')
        .delete()
        .eq('id', assigneeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('User unassigned');
    },
    onError: (error) => {
      toast.error('Failed to unassign user');
      console.error('Unassign user error:', error);
    },
  });
};
