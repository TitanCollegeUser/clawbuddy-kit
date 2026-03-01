import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ForgeItem {
  name: string;
  type: 'skill' | 'ops_app' | 'automation' | 'edge_function' | 'tool' | 'make_scenario';
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  recommended_agent: string;
  recommended_model: string;
  build_steps: string[];
  apis_needed: string[];
  estimated_effort: string;
  priority: 'high' | 'medium' | 'low';
  selected?: boolean;
  notes?: string;
  override_agent?: string;
}

export interface ForgeAnalysis {
  summary: string;
  source_type: string;
  items: ForgeItem[];
  total_items: number;
  key_technologies: string[];
}

export interface ForgeRecord {
  id: string;
  input_type: string;
  input_source: string | null;
  status: string;
  analysis: ForgeAnalysis | null;
  tasks_created: string[] | null;
  created_at: string;
}

export type ForgeInputType = 'transcript' | 'url' | 'api_docs' | 'mcp_spec' | 'text';

export const useForgeAnalyses = () => {
  return useQuery({
    queryKey: ['forge-analyses'],
    queryFn: async (): Promise<ForgeRecord[]> => {
      const { data, error } = await supabase
        .from('forge_analyses' as any)
        .select('id, input_type, input_source, status, analysis, tasks_created, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as ForgeRecord[];
    },
  });
};

export const useForgeAnalyze = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      inputType,
      content,
      url,
      urls,
    }: {
      inputType: ForgeInputType;
      content?: string;
      url?: string;
      urls?: string[];
    }): Promise<{ id: string; analysis: ForgeAnalysis }> => {
      const response = await supabase.functions.invoke('forge-analyzer', {
        body: { action: 'analyze', input_type: inputType, content, url, urls },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      // Add selected: true to all items by default
      const analysis = response.data.analysis as ForgeAnalysis;
      analysis.items = analysis.items.map((item: ForgeItem) => ({
        ...item,
        selected: true,
      }));

      return { id: response.data.id, analysis };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forge-analyses'] });
    },
    onError: (error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useForgeVideoInfo = () => {
  return useMutation({
    mutationFn: async (url: string): Promise<{ title: string; author: string; videoId: string }> => {
      const response = await supabase.functions.invoke('forge-analyzer', {
        body: { action: 'video_info', url },
      });
      if (response.error) throw response.error;
      return response.data;
    },
  });
};

export const useCreateTasksFromForge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      analysisId,
      items,
      assignAgent,
    }: {
      analysisId: string;
      items: ForgeItem[];
      assignAgent?: string;
    }) => {
      const selectedItems = items.filter(item => item.selected !== false);
      if (selectedItems.length === 0) throw new Error('No items selected');

      const createdTasks: string[] = [];
      for (const item of selectedItems) {
        const description = [
          item.description,
          '',
          `Type: ${item.type}`,
          `Complexity: ${item.complexity}`,
          `Recommended Model: ${item.recommended_model}`,
          item.apis_needed.length > 0 ? `APIs Needed: ${item.apis_needed.join(', ')}` : '',
          `Estimated Effort: ${item.estimated_effort}`,
          '',
          ...(item.build_steps.length > 0 ? ['Build Steps:', ...item.build_steps.map((s, i) => `${i + 1}. ${s}`)] : []),
          ...(item.notes ? ['', `Notes: ${item.notes}`] : []),
        ].filter(Boolean).join('\n');

        const resp = await supabase.functions.invoke('ai-tasks', {
          body: {
            request_type: 'task',
            action: 'create',
            title: `[Forge] ${item.name}`,
            description,
            column: 'todo',
            priority: item.priority === 'high' ? 'High' : item.priority === 'low' ? 'Low' : 'Medium',
          },
        });

        if (resp.data?.task?.id) {
          createdTasks.push(resp.data.task.id);

          // Assign the task — per-item override takes priority
          const agentName = item.override_agent || assignAgent || item.recommended_agent;
          const names = [agentName, 'Mani Kanasani'].filter(Boolean);
          await supabase.functions.invoke('ai-tasks', {
            body: {
              request_type: 'assignee',
              action: 'assign',
              task_id: resp.data.task.id,
              names,
            },
          });
        }
      }

      // Update forge_analyses with created task IDs
      await supabase
        .from('forge_analyses' as any)
        .update({
          tasks_created: createdTasks,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      // Log it
      await supabase.functions.invoke('ai-tasks', {
        body: {
          request_type: 'log',
          action: 'create',
          category: 'observation',
          message: `Forge: Created ${createdTasks.length} tasks from analysis. Items: ${selectedItems.map(i => i.name).join(', ')}`,
        },
      });

      return { success: true, tasksCreated: createdTasks.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forge-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: `${data.tasksCreated} tasks created`,
        description: 'Build items are now on your Kanban board.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating tasks',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
