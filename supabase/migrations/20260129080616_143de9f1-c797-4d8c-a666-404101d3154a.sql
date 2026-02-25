-- ============================================
-- SUB-AGENTS MANAGEMENT SYSTEM
-- ============================================

-- Table 1: sub_agents - Stores AI agent configurations
CREATE TABLE public.sub_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  workspace TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  config JSONB DEFAULT '{}'::jsonb,
  allowed_tools TEXT[] DEFAULT '{}'::text[],
  max_concurrent_tasks INTEGER DEFAULT 3,
  timeout_minutes INTEGER DEFAULT 60,
  system_prompt TEXT,
  total_sessions INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  avg_task_duration_ms FLOAT DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 100,
  monthly_token_budget INTEGER DEFAULT 1000000,
  tokens_used_this_month INTEGER DEFAULT 0,
  monthly_cost_budget FLOAT DEFAULT 50,
  cost_this_month FLOAT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ
);

-- Table 2: sub_agent_sessions - Tracks individual execution sessions
CREATE TABLE public.sub_agent_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sub_agents(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,
  task_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result_summary TEXT,
  result_full TEXT,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost FLOAT DEFAULT 0,
  error_message TEXT,
  error_code TEXT,
  messages_count INTEGER DEFAULT 0,
  tools_used TEXT[] DEFAULT '{}'::text[],
  input_params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 3: sub_agent_tasks - Links sub-agent work to Kanban tasks
CREATE TABLE public.sub_agent_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sub_agents(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sub_agent_sessions(id) ON DELETE SET NULL,
  kanban_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_by TEXT NOT NULL DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_sub_agents_status ON public.sub_agents(status);
CREATE INDEX idx_sub_agents_name ON public.sub_agents(name);
CREATE INDEX idx_sub_agent_sessions_agent_id ON public.sub_agent_sessions(agent_id);
CREATE INDEX idx_sub_agent_sessions_status ON public.sub_agent_sessions(status);
CREATE INDEX idx_sub_agent_tasks_agent_id ON public.sub_agent_tasks(agent_id);
CREATE INDEX idx_sub_agent_tasks_kanban_task_id ON public.sub_agent_tasks(kanban_task_id);

-- Enable Row Level Security
ALTER TABLE public.sub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_agents
CREATE POLICY "Authenticated users can view all sub_agents"
  ON public.sub_agents FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sub_agents"
  ON public.sub_agents FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update sub_agents"
  ON public.sub_agents FOR UPDATE
  USING (true);

CREATE POLICY "Creators can delete their sub_agents"
  ON public.sub_agents FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for sub_agent_sessions
CREATE POLICY "Authenticated users can view all sessions"
  ON public.sub_agent_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON public.sub_agent_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON public.sub_agent_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete sessions"
  ON public.sub_agent_sessions FOR DELETE
  USING (true);

-- RLS Policies for sub_agent_tasks
CREATE POLICY "Authenticated users can view all sub_agent_tasks"
  ON public.sub_agent_tasks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sub_agent_tasks"
  ON public.sub_agent_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sub_agent_tasks"
  ON public.sub_agent_tasks FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete sub_agent_tasks"
  ON public.sub_agent_tasks FOR DELETE
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_sub_agents_updated_at
  BEFORE UPDATE ON public.sub_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_agent_sessions;

-- Seed with existing agents (Coder and Thinker)
INSERT INTO public.sub_agents (name, display_name, model, workspace, description, allowed_tools, status)
VALUES 
  ('coder', 'Coder Agent', 'anthropic/claude-sonnet-4-20250514', 
   '/path/to/agent-workspace',
   'Builds features, writes code, designs architecture. Expert in React, TypeScript, and full-stack development.',
   ARRAY['file_read', 'exec', 'browser', 'web_search'],
   'idle'),
  ('thinker', 'Thinker Agent', 'azure/gpt-4.1',
   '/path/to/agent-workspace',
   'Deep analysis, strategic thinking, decision-making. Excels at breaking down complex problems.',
   ARRAY['file_read', 'web_search', 'image'],
   'idle');