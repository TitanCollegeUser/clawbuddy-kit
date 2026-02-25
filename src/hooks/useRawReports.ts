import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RawReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RawReport {
  id: string;
  source: string;
  report_type: 'employee' | 'insight';
  raw_data: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  status: RawReportStatus;
  processed_report_id: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  webhook_endpoint_id: string | null;
  function_id: string | null;
}

export const useRawReports = (status?: RawReportStatus | 'all') => {
  return useQuery({
    queryKey: ['raw_reports', status],
    queryFn: async () => {
      let query = supabase
        .from('raw_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RawReport[];
    },
  });
};

export const usePendingRawReportsCount = () => {
  return useQuery({
    queryKey: ['raw_reports', 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('raw_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useDeleteRawReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('raw_reports')
        .delete()
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw_reports'] });
    },
  });
};

export const useSubmitForProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, functionId }: { reportId: string; functionId?: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-tasks', {
        body: {
          request_type: 'raw_report',
          action: 'submit',
          report_id: reportId,
          function_id: functionId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw_reports'] });
    },
  });
};

export const useUpdateRawReportFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, functionId }: { reportId: string; functionId: string }) => {
      const { error } = await supabase
        .from('raw_reports')
        .update({ function_id: functionId })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw_reports'] });
    },
  });
};
