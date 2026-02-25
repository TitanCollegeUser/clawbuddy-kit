import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Assumption {
  category: string;
  value: string;
  explanation: string;
}

export interface Metric {
  name: string;
  value: string | number;
  unit?: string;
}

export interface ActionItem {
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  description: string;
  estimated_time: string;
  metric_impact: string;
  selected?: boolean;
}

export interface GoalAnalysis {
  title: string;
  assumptions: Assumption[];
  metrics: Metric[];
  action_items: ActionItem[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  target_value: number | null;
  target_unit: string | null;
  assumptions: Assumption[];
  action_items: ActionItem[];
  user_notes: string | null;
  status: 'draft' | 'sent_to_bujji' | 'in_progress' | 'completed';  // sent_to_bujji = legacy, mapped to "On Board" in UI
  sent_to_bujji_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type-cast the JSONB fields properly
      return (data || []).map((goal: any) => ({
        ...goal,
        assumptions: (goal.assumptions || []) as Assumption[],
        action_items: (goal.action_items || []) as ActionItem[],
      }));
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (goal: {
      title: string;
      description: string;
      goal_type: string;
      target_value?: number;
      target_unit?: string;
      assumptions: Assumption[];
      action_items: ActionItem[];
      user_notes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('goals' as any)
        .insert({
          title: goal.title,
          description: goal.description,
          goal_type: goal.goal_type,
          target_value: goal.target_value,
          target_unit: goal.target_unit,
          assumptions: goal.assumptions,
          action_items: goal.action_items,
          user_notes: goal.user_notes,
          user_id: userData.user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: 'Goal saved',
        description: 'Your analyzed goal has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      // Convert complex types to JSON-compatible format
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.assumptions) {
        dbUpdates.assumptions = updates.assumptions as unknown as Record<string, unknown>[];
      }
      if (updates.action_items) {
        dbUpdates.action_items = updates.action_items as unknown as Record<string, unknown>[];
      }
      
      const { data, error } = await supabase
        .from('goals' as any)
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCreateGoalTasks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      goalId,
      title,
      goalType,
      actionItems,
      userNotes,
    }: {
      goalId: string;
      title: string;
      goalType: string;
      actionItems: ActionItem[];
      userNotes?: string;
    }) => {
      const selectedItems = actionItems.filter(item => item.selected !== false);
      if (selectedItems.length === 0) throw new Error('No action items selected');

      // Create Kanban tasks directly via ai-tasks edge function
      const createdTasks: string[] = [];
      for (const item of selectedItems) {
        const resp = await supabase.functions.invoke('ai-tasks', {
          body: {
            request_type: 'task',
            action: 'create',
            title: item.title,
            description: `${item.description}\n\nGoal: ${title} (${goalType})\nPriority: ${item.priority}\nEstimated: ${item.estimated_time}\nImpact: ${item.metric_impact}${userNotes ? '\nNotes: ' + userNotes : ''}`,
            column: 'todo',
          },
        });
        if (resp.data?.task?.id) {
          createdTasks.push(resp.data.task.id);
        }
      }

      // Update goal status to in_progress
      const { error: goalError } = await supabase
        .from('goals' as any)
        .update({
          status: 'in_progress',
          sent_to_bujji_at: new Date().toISOString(),
        })
        .eq('id', goalId);

      if (goalError) throw goalError;

      // Log the creation for dashboard visibility
      await supabase.functions.invoke('ai-tasks', {
        body: {
          request_type: 'log',
          action: 'create',
          category: 'observation',
          message: `Goals Lab: Created ${createdTasks.length} Kanban tasks from ${goalType} goal "${title}". Items: ${selectedItems.map(i => i.title).join(', ')}`,
        },
      });

      return { success: true, tasksCreated: createdTasks.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: `${data.tasksCreated} tasks created`,
        description: 'Action items are now on your Kanban board in the To Do column.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating tasks',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAnalyzeGoal = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      goal,
      goal_type,
      user_notes,
    }: {
      goal: string;
      goal_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      user_notes?: string;
    }): Promise<GoalAnalysis> => {
      const response = await supabase.functions.invoke('goal-analyzer', {
        body: { goal, goal_type, user_notes },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      // Add selected: true to all action items by default
      const analysis = response.data as GoalAnalysis;
      analysis.action_items = analysis.action_items.map(item => ({
        ...item,
        selected: true,
      }));

      return analysis;
    },
    onError: (error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
