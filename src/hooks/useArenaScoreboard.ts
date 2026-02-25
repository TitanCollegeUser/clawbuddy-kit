import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArenaScoreboard {
  id: string;
  office_id: string;
  primary_metric_name: string;
  primary_metric_unit: string;
  created_at: string;
  updated_at: string;
}

export interface ArenaScoreCategory {
  id: string;
  scoreboard_id: string;
  name: string;
  is_primary: boolean;
  position: number;
  created_at: string;
}

export interface ArenaScore {
  id: string;
  category_id: string;
  agent_name: string;
  value: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useArenaScoreboard = (officeId: string) => {
  return useQuery({
    queryKey: ['arena-scoreboard', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arena_scoreboards')
        .select('*')
        .eq('office_id', officeId)
        .maybeSingle();
      if (error) throw error;
      return data as ArenaScoreboard | null;
    },
    enabled: !!officeId,
  });
};

export const useArenaCategories = (scoreboardId: string | undefined) => {
  return useQuery({
    queryKey: ['arena-categories', scoreboardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arena_score_categories')
        .select('*')
        .eq('scoreboard_id', scoreboardId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as ArenaScoreCategory[];
    },
    enabled: !!scoreboardId,
  });
};

export const useArenaScores = (categoryIds: string[]) => {
  return useQuery({
    queryKey: ['arena-scores', categoryIds],
    queryFn: async () => {
      if (categoryIds.length === 0) return [];
      const { data, error } = await supabase
        .from('arena_scores')
        .select('*')
        .in('category_id', categoryIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ArenaScore[];
    },
    enabled: categoryIds.length > 0,
  });
};

export const useCreateArenaScoreboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      office_id: string;
      primary_metric_name: string;
      primary_metric_unit: string;
    }) => {
      const { data, error } = await supabase
        .from('arena_scoreboards')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as ArenaScoreboard;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['arena-scoreboard', vars.office_id] });
    },
  });
};

export const useCreateArenaCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      scoreboard_id: string;
      name: string;
      is_primary: boolean;
      position: number;
    }) => {
      const { data, error } = await supabase
        .from('arena_score_categories')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as ArenaScoreCategory;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['arena-categories', vars.scoreboard_id] });
    },
  });
};
