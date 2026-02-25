import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface SkillOperation {
  id: string;
  skill_id: string;
  name: string;
  title: string;
  description: string | null;
  http_method: HttpMethod;
  endpoint_path: string;
  request_body_schema: Json;
  response_schema: Json;
  example_request: Json;
  example_response: Json;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOperationData {
  skill_id: string;
  name: string;
  title: string;
  description?: string;
  http_method?: HttpMethod;
  endpoint_path: string;
  request_body_schema?: Json;
  response_schema?: Json;
  example_request?: Json;
  example_response?: Json;
  position?: number;
}

export interface UpdateOperationData {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  http_method?: HttpMethod;
  endpoint_path?: string;
  request_body_schema?: Json;
  response_schema?: Json;
  example_request?: Json;
  example_response?: Json;
  position?: number;
}

export const useSkillOperations = (skillId: string | undefined) => {
  return useQuery({
    queryKey: ['skill_operations', skillId],
    queryFn: async (): Promise<SkillOperation[]> => {
      if (!skillId) return [];
      
      const { data, error } = await supabase
        .from('skill_operations')
        .select('*')
        .eq('skill_id', skillId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as SkillOperation[];
    },
    enabled: !!skillId,
  });
};

export const useCreateOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operationData: CreateOperationData): Promise<SkillOperation> => {
      const { data, error } = await supabase
        .from('skill_operations')
        .insert(operationData)
        .select()
        .single();

      if (error) throw error;
      return data as SkillOperation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skill_operations', data.skill_id] });
      toast({ title: 'Operation created successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating operation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateOperationData): Promise<SkillOperation> => {
      const { data, error } = await supabase
        .from('skill_operations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SkillOperation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skill_operations', data.skill_id] });
      toast({ title: 'Operation updated successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating operation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, skillId }: { id: string; skillId: string }): Promise<void> => {
      const { error } = await supabase
        .from('skill_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['skill_operations', variables.skillId] });
      toast({ title: 'Operation deleted successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting operation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const validateOperationName = (name: string): boolean => {
  return /^[a-z][a-z0-9_]{1,49}$/.test(name);
};
