import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import type { CouncilSession, CouncilParticipant, AgentComm } from '@/types/command-center';

export interface CouncilSessionWithDetails extends CouncilSession {
  participants: CouncilParticipant[];
  messages?: AgentComm[];
}

export const useCouncilSessions = (statusFilter?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['council_sessions', statusFilter, user?.id],
    queryFn: async (): Promise<CouncilSessionWithDetails[]> => {
      let q = supabase
        .from('council_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter && statusFilter !== 'all') {
        q = q.eq('status', statusFilter);
      }

      const { data: sessions, error } = await q;
      if (error) throw error;

      const sessionList = (sessions || []) as unknown as CouncilSession[];
      if (sessionList.length === 0) return [];

      // Fetch participants for all sessions
      const sessionIds = sessionList.map(s => s.id);
      const { data: allParts } = await supabase
        .from('council_participants')
        .select('*')
        .in('session_id', sessionIds)
        .order('turn_order', { ascending: true });

      const participants = (allParts || []) as unknown as CouncilParticipant[];
      const partMap = new Map<string, CouncilParticipant[]>();
      for (const p of participants) {
        const arr = partMap.get(p.session_id) || [];
        arr.push(p);
        partMap.set(p.session_id, arr);
      }

      return sessionList.map(s => ({
        ...s,
        participants: partMap.get(s.id) || [],
      }));
    },
    enabled: !!user,
  });

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('council_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'council_sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['council_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['council_session'] });
          queryClient.invalidateQueries({ queryKey: ['council_active_count'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'council_participants' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['council_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['council_session'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_comms', filter: 'to_agent=eq.council' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['council_session'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useCouncilSession = (sessionId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['council_session', sessionId, user?.id],
    queryFn: async (): Promise<CouncilSessionWithDetails & { messages: AgentComm[] }> => {
      // Get session
      const { data: session, error: sessionErr } = await supabase
        .from('council_sessions')
        .select('*')
        .eq('id', sessionId!)
        .eq('user_id', user!.id)
        .single();

      if (sessionErr) throw sessionErr;

      // Get participants
      const { data: parts } = await supabase
        .from('council_participants')
        .select('*')
        .eq('session_id', sessionId!)
        .order('turn_order', { ascending: true });

      // Get messages
      const { data: msgs } = await supabase
        .from('agent_comms')
        .select('*')
        .eq('council_session_id', sessionId!)
        .order('created_at', { ascending: true });

      return {
        ...(session as unknown as CouncilSession),
        participants: (parts || []) as unknown as CouncilParticipant[],
        messages: (msgs || []) as unknown as AgentComm[],
      };
    },
    enabled: !!user && !!sessionId,
    refetchInterval: 3000, // Poll every 3s for live updates during active sessions
  });
};

export const useActiveCouncilCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['council_active_count', user?.id],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('council_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};
