import { useMemo } from 'react';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useAgents } from '@/hooks/useAgents';
import type { CCAgent, AgentStatus, FreshnessLevel } from '@/types/command-center';

const FRESH_THRESHOLD_MS = 2 * 60 * 1000;   // < 2 min = fresh
const STALE_THRESHOLD_MS = 10 * 60 * 1000;  // 2–10 min = stale, > 10 min = dead

function getFreshness(lastSeen: string): FreshnessLevel {
  const age = Date.now() - new Date(lastSeen).getTime();
  if (age < FRESH_THRESHOLD_MS) return 'fresh';
  if (age < STALE_THRESHOLD_MS) return 'stale';
  return 'dead';
}

function mapRingToStatus(
  ringColor: string | null,
  isOnline: boolean,
  freshness: FreshnessLevel
): AgentStatus {
  // Heartbeat decay overrides — stale/dead agents can't be trusted as "online"
  if (freshness === 'dead') return 'offline';
  if (freshness === 'stale') return 'thinking'; // yellow — uncertain

  if (!isOnline) return 'offline';
  if (ringColor === '#ef4444' || ringColor === 'red') return 'error';
  if (ringColor === '#f59e0b' || ringColor === '#eab308' || ringColor === 'yellow') return 'thinking';
  return 'online';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function useCommandCenterAgents() {
  const { agents: statusAgents, isLoading: statusLoading } = useAiStatus();
  const { agents: profileAgents, isLoading: profileLoading } = useAgents();

  const agents = useMemo((): CCAgent[] => {
    if (!statusAgents || statusAgents.length === 0) return [];

    return statusAgents.map((s) => {
      const profile = profileAgents.find(
        (p) => p.name.toLowerCase() === s.agent_name.toLowerCase()
      );
      const freshness = getFreshness(s.last_seen);
      const status = mapRingToStatus(s.ring_color, s.isActuallyOnline, freshness);

      return {
        id: s.id,
        name: s.agent_name,
        emoji: s.agent_emoji || '🤖',
        role: profile?.description || 'AI Employee',
        model: 'Claude',
        status,
        statusMessage: s.status_message || '',
        ringColor: s.ring_color || '#6b7280',
        lastActive: timeAgo(s.last_seen),
        joinedDate: profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '',
        alignmentScore: 0,
        freshness,
        lastSeenRaw: s.last_seen,
      };
    });
  }, [statusAgents, profileAgents]);

  return {
    agents,
    isLoading: statusLoading || profileLoading,
  };
}
