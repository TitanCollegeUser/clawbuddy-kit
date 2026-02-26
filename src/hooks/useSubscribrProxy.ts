import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProxyRequest {
  endpoint: string;
  method?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string | number>;
}

export const useSubscribrProxy = () => {
  return useMutation({
    mutationFn: async (request: ProxyRequest) => {
      const { data, error } = await supabase.functions.invoke('subscribr-proxy', {
        body: request,
      });
      if (error) throw error;
      return data;
    },
  });
};
