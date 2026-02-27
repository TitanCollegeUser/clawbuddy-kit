import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBoardColumns } from './useBoardColumns';

export const useNeedsInputCount = () => {
  const { data: columns = [] } = useBoardColumns();
  const needsInputColumn = columns.find(c => c.name.toLowerCase() === 'needs input');

  return useQuery({
    queryKey: ['needs-input-count', needsInputColumn?.id],
    queryFn: async (): Promise<number> => {
      if (!needsInputColumn) return 0;
      const { count, error } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('board_column_id', needsInputColumn.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!needsInputColumn,
    refetchInterval: 5000,
  });
};
