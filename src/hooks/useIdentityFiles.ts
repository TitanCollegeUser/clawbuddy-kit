import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface IdentityFile {
  id: string;
  user_id: string;
  file_key: string;
  content: string;
  updated_at: string;
  updated_by: string;
  created_at: string;
  agent_id: string | null;
}

export interface DailyMemoryLog {
  id: string;
  user_id: string;
  log_date: string;
  content: string;
  updated_at: string;
  updated_by: string;
  created_at: string;
  agent_id: string | null;
}

export const IDENTITY_FILE_KEYS = [
  'SOUL', 'IDENTITY', 'USER', 'MEMORY', 'AGENTS', 'TOOLS', 'HEARTBEAT'
] as const;

export type IdentityFileKey = typeof IDENTITY_FILE_KEYS[number];

export interface FileDefinition {
  key: IdentityFileKey;
  name: string;
  description: string;
  icon: string;
  editable: 'yes' | 'caution';
}

export const FILE_DEFINITIONS: FileDefinition[] = [
  { key: 'SOUL', name: 'SOUL.md', description: 'Core identity & operating principles', icon: 'Heart', editable: 'yes' },
  { key: 'IDENTITY', name: 'IDENTITY.md', description: 'Personal metadata (name, creature, vibe)', icon: 'Fingerprint', editable: 'yes' },
  { key: 'USER', name: 'USER.md', description: 'User profile (your context & preferences)', icon: 'User', editable: 'yes' },
  { key: 'MEMORY', name: 'MEMORY.md', description: 'Long-term curated memory', icon: 'Brain', editable: 'yes' },
  { key: 'AGENTS', name: 'AGENTS.md', description: 'System instructions & session checklist', icon: 'Cog', editable: 'caution' },
  { key: 'TOOLS', name: 'TOOLS.md', description: 'Tool preferences & verified data', icon: 'Wrench', editable: 'yes' },
  { key: 'HEARTBEAT', name: 'HEARTBEAT.md', description: 'Periodic task checklist', icon: 'Activity', editable: 'yes' },
];

export function useIdentityFiles(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['identity-files', user?.id, agentId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('identity_files')
        .select('*')
        .eq('user_id', user.id)
        .order('file_key');
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      } else {
        query = query.is('agent_id', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as IdentityFile[];
    },
    enabled: !!user,
  });
}

export function useUpdateIdentityFile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ fileKey, content, agentId }: { fileKey: string; content: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('identity_files')
        .upsert(
          {
            user_id: user.id,
            file_key: fileKey,
            content,
            updated_by: 'user',
            updated_at: new Date().toISOString(),
            ...(agentId ? { agent_id: agentId } : {}),
          },
          { onConflict: agentId ? 'user_id,agent_id,file_key' : 'user_id,agent_id,file_key' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as IdentityFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity-files'] });
    },
  });
}

export function useDailyLogs(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily-logs', user?.id, agentId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('daily_memory_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      } else {
        query = query.is('agent_id', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DailyMemoryLog[];
    },
    enabled: !!user,
  });
}

export function useUpdateDailyLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ logDate, content, agentId }: { logDate: string; content: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('daily_memory_logs')
        .upsert(
          {
            user_id: user.id,
            log_date: logDate,
            content,
            updated_by: 'user',
            updated_at: new Date().toISOString(),
            ...(agentId ? { agent_id: agentId } : {}),
          },
          { onConflict: agentId ? 'user_id,agent_id,log_date' : 'user_id,agent_id,log_date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as DailyMemoryLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
    },
  });
}
