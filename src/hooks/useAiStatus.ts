import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AiAgentStatus {
  id: string;
  is_online: boolean;
  status_message: string | null;
  ring_color: string | null;
  last_seen: string;
  updated_at: string;
  user_id: string | null;
  agent_name: string;
  agent_emoji: string;
}

const ONLINE_THRESHOLD_MINUTES = 3;

export const useAiStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['ai_status', user?.id],
    queryFn: async (): Promise<AiAgentStatus[]> => {
      const { data, error } = await supabase
        .from('ai_status')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return (data as unknown as AiAgentStatus[]) ?? [];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('ai_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_status',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai_status'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Enrich each agent with computed online state
  const agents = useMemo((): (AiAgentStatus & { isActuallyOnline: boolean })[] => {
    const statuses = query.data ?? [];
    return statuses.map((s) => {
      const lastSeen = s.last_seen ? new Date(s.last_seen) : null;
      const minutesAgo = lastSeen ? (Date.now() - lastSeen.getTime()) / (1000 * 60) : Infinity;
      return {
        ...s,
        isActuallyOnline: minutesAgo < ONLINE_THRESHOLD_MINUTES,
      };
    });
  }, [query.data]);

  // Legacy single-agent compat
  const isActuallyOnline = agents.some((a) => a.isActuallyOnline);

  return { ...query, agents, isActuallyOnline };
};
