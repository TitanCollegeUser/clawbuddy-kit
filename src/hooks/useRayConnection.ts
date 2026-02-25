import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RayConnectionStatus {
  isOnline: boolean;
  lastSeen: Date | null;
  statusMessage: string | null;
  connectionState: 'online' | 'recent' | 'offline';
}

const ONLINE_THRESHOLD_MINUTES = 3;
const RECENT_THRESHOLD_MINUTES = 10;

export const useRayConnection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['ray_connection', user?.id],
    queryFn: async () => {
      // Fetch all ai_status rows for the user (multi-agent)
      const { data, error } = await supabase
        .from('ai_status')
        .select('*')
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('ray_connection_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_status',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ray_connection'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Derive connection state from all status rows
  const connectionStatus = useMemo((): RayConnectionStatus => {
    const statuses = query.data;
    
    if (!statuses || statuses.length === 0) {
      return {
        isOnline: false,
        lastSeen: null,
        statusMessage: null,
        connectionState: 'offline',
      };
    }

    const now = new Date();
    let anyOnline = false;
    let anyRecent = false;
    let latestSeen: Date | null = null;
    let latestMessage: string | null = null;

    for (const status of statuses) {
      const lastSeen = status.last_seen ? new Date(status.last_seen) : null;
      if (lastSeen) {
        if (!latestSeen || lastSeen > latestSeen) {
          latestSeen = lastSeen;
          latestMessage = status.status_message;
        }
        const minutesAgo = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
        if (minutesAgo < ONLINE_THRESHOLD_MINUTES) anyOnline = true;
        else if (minutesAgo < RECENT_THRESHOLD_MINUTES) anyRecent = true;
      }
    }

    let connectionState: 'online' | 'recent' | 'offline' = 'offline';
    if (anyOnline) connectionState = 'online';
    else if (anyRecent) connectionState = 'recent';

    return {
      isOnline: anyOnline,
      lastSeen: latestSeen,
      statusMessage: latestMessage,
      connectionState,
    };
  }, [query.data]);

  // Count how many agents are online
  const agentCounts = useMemo(() => {
    const statuses = query.data ?? [];
    const now = new Date();
    let online = 0;
    const total = statuses.length;
    for (const s of statuses) {
      if (s.last_seen) {
        const mins = (now.getTime() - new Date(s.last_seen).getTime()) / (1000 * 60);
        if (mins < ONLINE_THRESHOLD_MINUTES) online++;
      }
    }
    return { online, total };
  }, [query.data]);

  return {
    ...query,
    connectionStatus,
    agentCounts,
  };
};

// Format last seen time for display
export const formatLastSeen = (lastSeen: Date | null): string => {
  if (!lastSeen) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
