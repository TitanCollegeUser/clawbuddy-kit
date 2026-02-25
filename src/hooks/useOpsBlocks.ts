import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OpsBlock {
  id: string;
  page_id: string;
  block_type: string;
  title: string | null;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const useOpsBlocks = (pageId: string) => {
  return useQuery({
    queryKey: ['ops-blocks', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as OpsBlock[];
    },
    enabled: !!pageId,
  });
};
