import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficeEvent {
  id: string;
  office_id: string;
  agent_name: string;
  event_type: string;
  payload: Record<string, unknown>;
  task_id: string | null;
  processed: boolean;
  created_at: string;
}

export const useOfficeEvents = (officeId: string) => {
  return useQuery({
    queryKey: ['office-events', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_events')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as OfficeEvent[];
    },
    enabled: !!officeId,
  });
};
