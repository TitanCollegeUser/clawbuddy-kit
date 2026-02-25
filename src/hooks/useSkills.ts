import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export type SkillStatus = 'draft' | 'ready' | 'archived';
export type AuthType = 'bearer' | 'api_key' | 'basic';
export type ProtocolType = 'rest' | 'smtp' | 'graphql' | 'webhook' | 'custom';
export type AgentReviewStatus = 'pending' | 'processing' | 'accepted' | 'needs_info' | 'rejected';

export interface Skill {
  id: string;
  name: string;
  title: string;
  description: string | null;
  use_cases: string[];
  api_base_url: string;
  auth_type: AuthType;
  auth_header: string;
  auth_format: string;
  api_key_encrypted: string | null;
  status: SkillStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // New flexible config fields
  protocol_type: ProtocolType;
  connection_config: Json;
  additional_notes: string | null;
  bujji_status: AgentReviewStatus;
  bujji_feedback: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  // Skill Factory fields
  agent_name: string | null;
  agent_type: string;
  skill_markdown: string | null;
  allowed_tools: string[];
  input_schema: Json;
  output_format: string;
}

export interface CreateSkillData {
  name: string;
  title: string;
  description?: string;
  use_cases?: string[];
  api_base_url: string;
  auth_type?: AuthType;
  auth_header?: string;
  auth_format?: string;
  api_key_encrypted?: string;
  status?: SkillStatus;
  created_by: string;
  // New fields
  protocol_type?: ProtocolType;
  connection_config?: Json;
  additional_notes?: string;
  agent_name?: string;
  agent_type?: string;
  skill_markdown?: string;
  allowed_tools?: string[];
  input_schema?: Json;
  output_format?: string;
}

export interface UpdateSkillData {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  use_cases?: string[];
  api_base_url?: string;
  auth_type?: AuthType;
  auth_header?: string;
  auth_format?: string;
  api_key_encrypted?: string | null;
  status?: SkillStatus;
  // New fields
  protocol_type?: ProtocolType;
  connection_config?: Json;
  additional_notes?: string | null;
  bujji_status?: AgentReviewStatus;
  bujji_feedback?: string | null;
  submitted_at?: string | null;
  agent_name?: string | null;
  agent_type?: string;
  skill_markdown?: string | null;
  allowed_tools?: string[];
  input_schema?: Json;
  output_format?: string;
}

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async (): Promise<Skill[]> => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Skill[];
    },
  });
};

export const useSkill = (id: string | undefined) => {
  return useQuery({
    queryKey: ['skills', id],
    queryFn: async (): Promise<Skill | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Skill | null;
    },
    enabled: !!id,
  });
};

export const useCreateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skillData: CreateSkillData): Promise<Skill> => {
      const { data, error } = await supabase
        .from('skills')
        .insert(skillData)
        .select()
        .single();

      if (error) throw error;
      return data as Skill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast({ title: 'Skill created successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateSkillData): Promise<Skill> => {
      const { data, error } = await supabase
        .from('skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Skill;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills', data.id] });
      toast({ title: 'Skill updated successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast({ title: 'Skill deleted successfully!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCheckSkillName = () => {
  return useMutation({
    mutationFn: async (name: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from('skills')
        .select('id')
        .eq('name', name)
        .maybeSingle();

      if (error) throw error;
      return !data; // Returns true if name is available
    },
  });
};

export const useSubmitSkillForReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skillId: string): Promise<{
      skill: Skill;
      validation: string[];
      issues: string[];
      status: AgentReviewStatus;
      feedback: string;
    }> => {
      const { data, error } = await supabase.functions.invoke('ai-tasks', {
        body: {
          type: 'skill',
          action: 'submit',
          skill_id: skillId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills', data.skill.id] });
      
      if (data.status === 'accepted') {
        toast({ title: 'Skill accepted!', description: 'Your skill is now ready to use.' });
      } else if (data.status === 'needs_info') {
        toast({ 
          title: 'More info needed', 
          description: 'Please review the feedback and update your skill.',
          variant: 'default',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const validateSkillName = (name: string): boolean => {
  return /^[a-z][a-z0-9-]{2,49}$/.test(name);
};
