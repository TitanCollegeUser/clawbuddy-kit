import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AiEmployee {
  id: string;
  user_id: string;
  name: string;
  role: string;
  emoji: string;
  description: string | null;
  platform: string;
  platform_label: string | null;
  department: string;
  status: 'active' | 'idle' | 'on_assignment' | 'training' | 'terminated' | 'coming_soon';
  current_task: string | null;
  current_task_started_at: string | null;
  ops_app_id: string | null;
  skill_names: string[];
  config: Record<string, unknown>;
  metrics: Record<string, unknown>;
  hired_at: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface WorkLogEntry {
  id: string;
  employee_id: string;
  user_id: string;
  work_type: string;
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  outcome: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export const useAiEmployees = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // LIST all employees
  const query = useQuery({
    queryKey: ['ai_employees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .order('hired_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AiEmployee[];
    },
    enabled: !!user,
  });

  // GET single employee with work log
  const useEmployee = (employeeId: string | undefined) => {
    return useQuery({
      queryKey: ['ai_employee', employeeId],
      queryFn: async () => {
        if (!employeeId) return null;
        const { data: employee, error } = await supabase
          .from('ai_employees')
          .select('*')
          .eq('id', employeeId)
          .single();
        if (error) throw error;

        const { data: workLog } = await supabase
          .from('ai_employee_work_log')
          .select('*')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })
          .limit(50);

        return {
          employee: employee as AiEmployee,
          work_log: (workLog ?? []) as WorkLogEntry[],
        };
      },
      enabled: !!employeeId && !!user,
    });
  };

  // CREATE (hire) employee
  const hireEmployee = useMutation({
    mutationFn: async (input: {
      name: string;
      role: string;
      emoji?: string;
      description?: string;
      platform?: string;
      platform_label?: string;
      department?: string;
      skill_names?: string[];
      config?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('ai_employees')
        .insert({
          user_id: user!.id,
          name: input.name,
          role: input.role,
          emoji: input.emoji || '🤖',
          description: input.description || null,
          platform: input.platform || 'claude_code',
          platform_label: input.platform_label || null,
          department: input.department || 'general',
          status: 'idle' as const,
          skill_names: input.skill_names || [],
          config: input.config || {},
          metrics: {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as AiEmployee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_employees'] });
    },
  });

  // UPDATE employee
  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AiEmployee> & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AiEmployee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_employees'] });
      queryClient.invalidateQueries({ queryKey: ['ai_employee'] });
    },
  });

  // DELETE (terminate) employee
  const terminateEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_employees'] });
    },
  });

  // Computed helpers
  const activeCount = (query.data ?? []).filter(e => e.status === 'active' || e.status === 'on_assignment').length;
  const totalCount = (query.data ?? []).length;

  return {
    employees: query.data ?? [],
    isLoading: query.isLoading,
    activeCount,
    totalCount,
    useEmployee,
    hireEmployee,
    updateEmployee,
    terminateEmployee,
  };
};
