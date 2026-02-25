import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  cron_expression: string;
  timezone: string;
  prompt: string;
  model: string;
  max_turns: number;
  timeout_seconds: number;
  channels: { type: string; config: Record<string, unknown> }[];
  template_id: string | null;
  template_config: Record<string, unknown>;
  ops_app_id: string | null;
  tags: string[];
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  run_count: number;
  fail_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  agent_name: string | null;
  function_name: string | null;
  function_config: Record<string, unknown> | null;
}

export interface AutomationExecution {
  id: string;
  automation_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  output: string | null;
  output_html: string | null;
  error: string | null;
  deliveries: { channel: string; status: string; sent_at?: string; error?: string }[];
  tokens_used: number;
  created_at: string;
  trigger_source: string;
  triggered_by: string | null;
}

export interface AutomationChannel {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  is_default: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useAutomations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Automation[];
    },
    enabled: !!user,
  });
}

export function useAutomation(id: string | undefined) {
  return useQuery({
    queryKey: ['automations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as Automation;
    },
    enabled: !!id,
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Automation>) => {
      const { data, error } = await supabase
        .from('automations')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Automation> & { id: string }) => {
      const { data, error } = await supabase
        .from('automations')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('automations')
        .update({ enabled } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ['automations'] });
      const prev = qc.getQueryData<Automation[]>(['automations']);
      qc.setQueryData<Automation[]>(['automations'], (old) =>
        old?.map((a) => (a.id === id ? { ...a, enabled } : a))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['automations'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useAutomationExecutions(automationId: string | undefined) {
  return useQuery({
    queryKey: ['automation_executions', automationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('automation_id', automationId!)
        .order('started_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data || []) as unknown as AutomationExecution[];
    },
    enabled: !!automationId,
  });
}

export function useAutomationChannels() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['automation_channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_channels')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AutomationChannel[];
    },
    enabled: !!user,
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AutomationChannel>) => {
      const { data, error } = await supabase
        .from('automation_channels')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AutomationChannel;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation_channels'] }),
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationChannel> & { id: string }) => {
      const { error } = await supabase
        .from('automation_channels')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation_channels'] }),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automation_channels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation_channels'] }),
  });
}

export function useFailedAutomationsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['automations', 'failed_count'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('automations')
        .select('*', { count: 'exact', head: true })
        .eq('last_status', 'failed')
        .gte('last_run_at', since);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}
