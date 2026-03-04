import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import type { AgentComm } from '@/types/command-center';

export type { AgentComm };

export const useAgentComms = (filters?: {
  agent?: string;
  status?: string;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['agent_comms', filters?.agent, filters?.status, user?.id],
    queryFn: async (): Promise<AgentComm[]> => {
      let q = supabase
        .from('agent_comms')
        .select('*')
        .eq('user_id', user!.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.agent && filters.agent !== 'all') {
        q = q.or(`from_agent.eq.${filters.agent},to_agent.eq.${filters.agent}`);
      }

      if (filters?.status && filters.status !== 'all') {
        q = q.eq('status', filters.status);
      }

      const { data, error } = await q;
      if (error) throw error;

      const parents = (data || []) as unknown as AgentComm[];
      if (parents.length === 0) return parents;

      // Fetch replies for all parent messages
      const parentIds = parents.map((p) => p.id);
      const { data: repliesData, error: repliesError } = await supabase
        .from('agent_comms')
        .select('*')
        .eq('user_id', user!.id)
        .in('parent_id', parentIds)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      const replies = (repliesData || []) as unknown as AgentComm[];
      const replyMap = new Map<string, AgentComm[]>();
      for (const r of replies) {
        const arr = replyMap.get(r.parent_id!) || [];
        arr.push(r);
        replyMap.set(r.parent_id!, arr);
      }

      return parents.map((p) => ({
        ...p,
        replies: replyMap.get(p.id) || [],
      }));
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('agent_comms_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_comms' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['agent_comms'] });
          queryClient.invalidateQueries({ queryKey: ['agent_comms_unread'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useUnreadCommsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent_comms_unread', user?.id],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('agent_comms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};
