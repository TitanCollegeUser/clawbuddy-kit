import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  function_id: string;
  secret: string;
  auto_process: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  webhook_functions?: {
    name: string;
    report_type: string;
  };
}

export const useWebhookEndpoints = () => {
  return useQuery({
    queryKey: ['webhook_endpoints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*, webhook_functions(name, report_type)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WebhookEndpoint[];
    },
  });
};

export const useCreateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; slug: string; function_id: string; auto_process?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert({ ...params, user_id: user.id })
        .select('*, webhook_functions(name, report_type)')
        .single();
      if (error) throw error;
      return data as WebhookEndpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_endpoints'] });
    },
  });
};

export const useUpdateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; slug?: string; function_id?: string; auto_process?: boolean; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, webhook_functions(name, report_type)')
        .single();
      if (error) throw error;
      return data as WebhookEndpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_endpoints'] });
    },
  });
};

export const useDeleteWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_endpoints'] });
    },
  });
};
