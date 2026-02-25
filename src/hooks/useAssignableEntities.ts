import { useMemo } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useSubAgents } from '@/hooks/useSubAgents';
import { useAgents } from '@/hooks/useAgents';
import { useAiStatus } from '@/hooks/useAiStatus';

export interface AssignableEntity {
  id: string;
  name: string;
  type: 'user' | 'sub_agent' | 'ai_agent';
  avatar_url?: string | null;
  model?: string;
  emoji?: string;
}

export function useAssignableEntities() {
  const { data: users = [] } = useUsers();
  const { data: subAgents = [] } = useSubAgents();
  const { agents: aiAgents } = useAgents();
  const { agents: aiStatuses } = useAiStatus();

  const entities = useMemo<AssignableEntity[]>(() => {
    const userEntities: AssignableEntity[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      type: 'user' as const,
      avatar_url: u.avatar_url,
    }));

    // Build emoji lookup from ai_status by agent_name
    const emojiMap = new Map<string, string>();
    aiStatuses.forEach((s) => {
      if (s.agent_name && s.agent_emoji) {
        emojiMap.set(s.agent_name, s.agent_emoji);
      }
    });

    const aiAgentEntities: AssignableEntity[] = aiAgents.map((a) => ({
      id: a.id,
      name: a.name,
      type: 'ai_agent' as const,
      emoji: emojiMap.get(a.name) || '⚡',
    }));

    const agentEntities: AssignableEntity[] = subAgents.map((a) => ({
      id: a.id,
      name: a.display_name,
      type: 'sub_agent' as const,
      model: a.model,
    }));

    return [...userEntities, ...aiAgentEntities, ...agentEntities];
  }, [users, subAgents, aiAgents, aiStatuses]);

  const entityMap = useMemo(() => {
    const map = new Map<string, AssignableEntity>();
    entities.forEach((e) => map.set(e.id, e));
    return map;
  }, [entities]);

  return { entities, entityMap, users, subAgents, aiAgents };
}
