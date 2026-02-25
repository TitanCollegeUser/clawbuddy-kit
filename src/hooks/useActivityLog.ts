import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useEffect } from 'react';

export interface ActivityLog {
  id: string;
  task_id: string | null;
  action_type: string;
  actor_name: string;
  actor_id: string | null;
  action_details: Json | null;
  comment: string | null;
  created_at: string;
}

export const useActivityLog = (taskId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['activity_log', taskId],
    queryFn: async (): Promise<ActivityLog[]> => {
      let q = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskId) {
        q = q.eq('task_id', taskId);
      }

      const { data, error } = await q.limit(100);

      if (error) throw error;
      return (data as ActivityLog[]) || [];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('activity_log_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activity_log'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, taskId]);

  return query;
};

export const useCreateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logData: {
      task_id?: string;
      action_type: string;
      actor_name: string;
      actor_id?: string;
      action_details?: Json;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from('activity_log')
        .insert([{
          task_id: logData.task_id || null,
          action_type: logData.action_type,
          actor_name: logData.actor_name,
          actor_id: logData.actor_id || null,
          action_details: logData.action_details || null,
          comment: logData.comment || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
    },
    onError: (error) => {
      console.error('Create activity log error:', error);
    },
  });
};
