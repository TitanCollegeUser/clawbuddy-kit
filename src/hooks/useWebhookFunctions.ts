import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WebhookFunction {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt_template: string;
  report_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWebhookFunctions = () => {
  return useQuery({
    queryKey: ['webhook_functions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_functions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WebhookFunction[];
    },
  });
};

export const useActiveWebhookFunctions = () => {
  return useQuery({
    queryKey: ['webhook_functions', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_functions')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as WebhookFunction[];
    },
  });
};

export const useCreateWebhookFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description?: string; prompt_template: string; report_type: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('webhook_functions')
        .insert({ ...params, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as WebhookFunction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_functions'] });
    },
  });
};

export const useUpdateWebhookFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; prompt_template?: string; report_type?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('webhook_functions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WebhookFunction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_functions'] });
    },
  });
};

export const useDeleteWebhookFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_functions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_functions'] });
      queryClient.invalidateQueries({ queryKey: ['webhook_endpoints'] });
    },
  });
};
