import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface SubAgent {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  model: string;
  workspace: string;
  status: string;
  config: Record<string, unknown>;
  allowed_tools: string[];
  max_concurrent_tasks: number;
  timeout_minutes: number;
  system_prompt: string | null;
  total_sessions: number;
  total_tasks_completed: number;
  avg_task_duration_ms: number;
  error_count: number;
  success_rate: number;
  monthly_token_budget: number;
  tokens_used_this_month: number;
  monthly_cost_budget: number;
  cost_this_month: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_active: string | null;
}

export interface SubAgentSession {
  id: string;
  agent_id: string;
  session_key: string;
  task_description: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  result_summary: string | null;
  result_full: string | null;
  tokens_used: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  error_message: string | null;
  error_code: string | null;
  messages_count: number;
  tools_used: string[];
  input_params: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateAgentInput {
  name: string;
  display_name: string;
  description?: string;
  model: string;
  workspace: string;
  allowed_tools?: string[];
  max_concurrent_tasks?: number;
  timeout_minutes?: number;
  system_prompt?: string;
  monthly_token_budget?: number;
  monthly_cost_budget?: number;
}

export interface UpdateAgentInput {
  id: string;
  display_name?: string;
  description?: string;
  model?: string;
  workspace?: string;
  status?: string;
  allowed_tools?: string[];
  max_concurrent_tasks?: number;
  timeout_minutes?: number;
  system_prompt?: string;
  monthly_token_budget?: number;
  monthly_cost_budget?: number;
}

// Fetch all sub-agents
export function useSubAgents() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sub-agents'],
    queryFn: async (): Promise<SubAgent[]> => {
      const { data, error } = await supabase
        .from('sub_agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as SubAgent[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('sub-agents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sub_agents' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sub-agents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Fetch single sub-agent by ID
export function useSubAgent(id: string | undefined) {
  return useQuery({
    queryKey: ['sub-agent', id],
    queryFn: async (): Promise<SubAgent | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('sub_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as SubAgent;
    },
    enabled: !!id,
  });
}

// Fetch sessions for a sub-agent
export function useSubAgentSessions(agentId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sub-agent-sessions', agentId],
    queryFn: async (): Promise<SubAgentSession[]> => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from('sub_agent_sessions')
        .select('*')
        .eq('agent_id', agentId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as SubAgentSession[];
    },
    enabled: !!agentId,
  });

  // Subscribe to realtime session updates
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`sub-agent-sessions-${agentId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'sub_agent_sessions',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sub-agent-sessions', agentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);

  return query;
}

// Create a new sub-agent
export function useCreateSubAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgentInput): Promise<SubAgent> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sub_agents')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SubAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-agents'] });
    },
  });
}

// Update a sub-agent
export function useUpdateSubAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAgentInput): Promise<SubAgent> => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('sub_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SubAgent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sub-agents'] });
      queryClient.invalidateQueries({ queryKey: ['sub-agent', data.id] });
    },
  });
}

// Delete a sub-agent
export function useDeleteSubAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('sub_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-agents'] });
    },
  });
}

// Get count of running sub-agents
export function useRunningAgentsCount() {
  return useQuery({
    queryKey: ['running-agents-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('sub_agents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');

      if (error) throw error;
      return count || 0;
    },
  });
}
