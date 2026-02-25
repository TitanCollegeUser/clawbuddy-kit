import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OpsPage {
  id: string;
  app_id: string;
  name: string;
  title: string;
  icon: string;
  sort_order: number;
  layout: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const useOpsPages = (appId: string) => {
  return useQuery({
    queryKey: ['ops-pages', appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_pages')
        .select('*')
        .eq('app_id', appId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as OpsPage[];
    },
    enabled: !!appId,
  });
};
