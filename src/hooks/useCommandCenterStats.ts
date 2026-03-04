import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskCounts } from '@/types/command-center';

const COLUMN_IDS = {
  todo: '29739efc-ecac-4037-adff-bd0a8ea9cd2a',
  doing: 'a886c067-d4d3-4e77-9ac3-5cc231dddc35',
  needs_input: '9d39bd42-cd5f-4c46-a440-ce54b671d0ae',
  canceled: '95c0cd62-c173-4494-8a00-bf9da98a6bc9',
  done: 'b22cc561-298f-48e1-8c9a-4123b0f7e0db',
};

export function useCommandCenterStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cc_task_stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, board_column_id, updated_at');

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cc-tasks-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cc_task_stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const counts = useMemo((): TaskCounts => {
    if (!query.data) {
      return { todo: 0, doing: 0, needs_input: 0, done: 0, doneThisWeek: 0, inFlight: 0 };
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todo = query.data.filter((t) => t.board_column_id === COLUMN_IDS.todo).length;
    const doing = query.data.filter((t) => t.board_column_id === COLUMN_IDS.doing).length;
    const needs_input = query.data.filter((t) => t.board_column_id === COLUMN_IDS.needs_input).length;
    const doneTasks = query.data.filter((t) => t.board_column_id === COLUMN_IDS.done);
    const done = doneTasks.length;
    const doneThisWeek = doneTasks.filter((t) => new Date(t.updated_at) > weekAgo).length;

    return { todo, doing, needs_input, done, doneThisWeek, inFlight: doing + needs_input };
  }, [query.data]);

  return { counts, isLoading: query.isLoading };
}
