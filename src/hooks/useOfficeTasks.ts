import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficeTask {
  id: string;
  office_id: string;
  title: string;
  client_name: string | null;
  description: string | null;
  status: string;
  assigned_agents: string[];
  completed_agents: string[];
  total_agents: number;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useOfficeTasks = (officeId: string) => {
  return useQuery({
    queryKey: ['office-tasks', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_tasks')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OfficeTask[];
    },
    enabled: !!officeId,
  });
};
