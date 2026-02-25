import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export const useBoardColumns = () => {
  return useQuery({
    queryKey: ['board-columns'],
    queryFn: async (): Promise<BoardColumn[]> => {
      const { data, error } = await supabase
        .from('board_columns')
        .select('*')
        .order('position');

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });
};
