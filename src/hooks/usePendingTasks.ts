import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface PendingTask {
  id: string;
  user_id: string;
  task_type: string;
  action: string;
  payload: Record<string, unknown>;
  priority: string;
  status: string;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export const usePendingTasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['pending_tasks', user?.id],
    queryFn: async (): Promise<PendingTask[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('pending_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as PendingTask[]) || [];
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates for instant notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pending_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Pending task change:', payload);
          queryClient.invalidateQueries({ queryKey: ['pending_tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  return query;
};

// Get count of pending tasks
export const usePendingTasksCount = () => {
  const { data: tasks = [] } = usePendingTasks();
  return tasks.filter(t => t.status === 'pending').length;
};

// Get count of processing tasks
export const useProcessingTasksCount = () => {
  const { data: tasks = [] } = usePendingTasks();
  return tasks.filter(t => t.status === 'processing').length;
};

// Hook to create a new pending task
export const useCreatePendingTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: {
      task_type: string;
      action: string;
      payload: Record<string, unknown>;
      priority?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pending_tasks')
        .insert([{
          user_id: user.id,
          task_type: task.task_type,
          action: task.action,
          payload: task.payload as Json,
          priority: task.priority || 'normal',
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return data as PendingTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_tasks'] });
    },
  });
};
