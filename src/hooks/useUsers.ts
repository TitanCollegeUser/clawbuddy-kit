import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      // Use the safe user_profiles view that excludes sensitive fields
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .order('name');

      if (error) throw error;
      return (data || []).map(u => ({ ...u, email: '', avatar_url: u.avatar_url }));
    },
  });
};
