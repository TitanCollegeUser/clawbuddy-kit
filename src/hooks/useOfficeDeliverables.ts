import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficeDeliverable {
  id: string;
  office_id: string;
  task_id: string;
  agent_name: string;
  file_name: string;
  file_type: string;
  file_url: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useOfficeDeliverables = (officeId: string, taskId?: string) => {
  return useQuery({
    queryKey: ['office-deliverables', officeId, taskId],
    queryFn: async () => {
      let query = supabase
        .from('office_deliverables')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (taskId) query = query.eq('task_id', taskId);
      const { data, error } = await query;
      if (error) throw error;
      return data as OfficeDeliverable[];
    },
    enabled: !!officeId,
  });
};
