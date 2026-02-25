import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaskBudget {
  id: string;
  task_id: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useTaskBudget = (taskId: string) => {
  return useQuery({
    queryKey: ['task_budget', taskId],
    queryFn: async (): Promise<TaskBudget | null> => {
      const { data, error } = await supabase
        .from('task_budgets')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      if (error) throw error;
      return data as TaskBudget | null;
    },
    enabled: !!taskId,
  });
};

export const useAllTaskBudgets = () => {
  return useQuery({
    queryKey: ['task_budgets'],
    queryFn: async (): Promise<TaskBudget[]> => {
      const { data, error } = await supabase
        .from('task_budgets')
        .select('*');

      if (error) throw error;
      return (data as TaskBudget[]) || [];
    },
  });
};

export const useCreateTaskBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetData: {
      task_id: string;
      estimated_cost?: number;
      actual_cost?: number;
      currency?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_budgets')
        .insert([budgetData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task_budget', variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task_budgets'] });
      toast.success('Budget created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create budget');
      console.error('Create budget error:', error);
    },
  });
};

export const useUpdateTaskBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskBudget> & { id: string }) => {
      const { data, error } = await supabase
        .from('task_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task_budget', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task_budgets'] });
      toast.success('Budget updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update budget');
      console.error('Update budget error:', error);
    },
  });
};
