import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OpsApp {
  id: string;
  name: string;
  title: string;
  description: string | null;
  icon: string;
  status: string;
  agent_name: string | null;
  agent_type: string | null;
  theme: Record<string, unknown>;
  config: Record<string, unknown>;
  page_order: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useOpsCenterApps = () => {
  return useQuery({
    queryKey: ['ops-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_apps')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as OpsApp[];
    },
  });
};

export const useOpsAppByName = (name: string) => {
  return useQuery({
    queryKey: ['ops-app', name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_apps')
        .select('*')
        .eq('name', name)
        .maybeSingle();
      if (error) throw error;
      return data as OpsApp | null;
    },
    enabled: !!name,
  });
};
