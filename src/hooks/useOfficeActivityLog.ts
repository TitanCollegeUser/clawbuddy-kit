import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficeActivityLogEntry {
  id: string;
  office_id: string;
  agent_name: string;
  action: string;
  log_type: string;
  detail: string | null;
  task_id: string | null;
  created_at: string;
}

export const useOfficeActivityLog = (officeId: string) => {
  return useQuery({
    queryKey: ['office-activity-log', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_activity_log')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as OfficeActivityLogEntry[];
    },
    enabled: !!officeId,
  });
};
