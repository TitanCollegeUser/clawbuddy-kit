import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface OpsDataItem {
  id: string;
  app_id: string;
  block_id: string | null;
  item_type: string;
  title: string;
  description: string | null;
  status: string;
  column_id: string | null;
  sort_order: number;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseOpsDataOptions {
  appId: string;
  blockId?: string;
  itemType?: string;
  status?: string;
}

export const useOpsData = ({ appId, blockId, itemType, status }: UseOpsDataOptions) => {
  const queryClient = useQueryClient();

  const queryKey = ['ops-data', appId, blockId, itemType, status];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const allData: OpsDataItem[] = [];
      let offset = 0;
      const batchSize = 1000;
      while (true) {
        let q = supabase
          .from('ops_data')
          .select('*')
          .eq('app_id', appId)
          .order('sort_order')
          .order('created_at', { ascending: false })
          .range(offset, offset + batchSize - 1);
        if (blockId) q = q.eq('block_id', blockId);
        if (itemType) q = q.eq('item_type', itemType);
        if (status) q = q.eq('status', status);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...(data as OpsDataItem[]));
        if (data.length < batchSize) break;
        offset += batchSize;
      }
      return allData;
    },
    enabled: !!appId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!appId) return;
    const channel = supabase
      .channel(`ops-data-${appId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ops_data',
        filter: `app_id=eq.${appId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [appId, queryClient]);

  return query;
};

export const useMoveOpsData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, columnId, sortOrder }: { id: string; columnId: string; sortOrder?: number }) => {
      const updates: Record<string, unknown> = { column_id: columnId };
      if (sortOrder !== undefined) updates.sort_order = sortOrder;
      const { error } = await supabase.from('ops_data').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-data'] });
    },
  });
};
