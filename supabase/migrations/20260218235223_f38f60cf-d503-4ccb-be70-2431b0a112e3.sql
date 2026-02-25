
-- =============================================
-- Phase 1: Workspace Tables
-- =============================================

-- 1. offices
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  director_name TEXT NOT NULL DEFAULT 'Director',
  director_species TEXT NOT NULL DEFAULT 'fox',
  director_color TEXT NOT NULL DEFAULT '#3b82f6',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own offices" ON public.offices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own offices" ON public.offices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offices" ON public.offices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offices" ON public.offices FOR DELETE USING (auth.uid() = user_id);

-- 2. office_agents
CREATE TABLE public.office_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  species TEXT NOT NULL DEFAULT 'cat',
  neon_color TEXT NOT NULL DEFAULT '#f97316',
  fur_color TEXT NOT NULL DEFAULT '#8B6914',
  fur_highlight TEXT NOT NULL DEFAULT '#C4A44A',
  suit_color TEXT NOT NULL DEFAULT '#1e293b',
  desk_position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  desk_position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idle',
  current_thought TEXT,
  target_agent TEXT,
  current_task_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  persona TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}'::text[],
  secret_sauce TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_agents ENABLE ROW LEVEL SECURITY;

-- Helper function to check office ownership
CREATE OR REPLACE FUNCTION public.owns_office(_office_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.offices WHERE id = _office_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view agents in their offices" ON public.office_agents FOR SELECT USING (public.owns_office(office_id));
CREATE POLICY "Users can create agents in their offices" ON public.office_agents FOR INSERT WITH CHECK (public.owns_office(office_id));
CREATE POLICY "Users can update agents in their offices" ON public.office_agents FOR UPDATE USING (public.owns_office(office_id));
CREATE POLICY "Users can delete agents in their offices" ON public.office_agents FOR DELETE USING (public.owns_office(office_id));

-- 3. office_tasks
CREATE TABLE public.office_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_agents TEXT[] NOT NULL DEFAULT '{}'::text[],
  completed_agents TEXT[] NOT NULL DEFAULT '{}'::text[],
  total_agents INTEGER NOT NULL DEFAULT 0,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their offices" ON public.office_tasks FOR SELECT USING (public.owns_office(office_id));
CREATE POLICY "Users can create tasks in their offices" ON public.office_tasks FOR INSERT WITH CHECK (public.owns_office(office_id));
CREATE POLICY "Users can update tasks in their offices" ON public.office_tasks FOR UPDATE USING (public.owns_office(office_id));
CREATE POLICY "Users can delete tasks in their offices" ON public.office_tasks FOR DELETE USING (public.owns_office(office_id));

-- 4. office_events
CREATE TABLE public.office_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  task_id UUID,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their offices" ON public.office_events FOR SELECT USING (public.owns_office(office_id));
CREATE POLICY "Users can create events in their offices" ON public.office_events FOR INSERT WITH CHECK (public.owns_office(office_id));
CREATE POLICY "Users can update events in their offices" ON public.office_events FOR UPDATE USING (public.owns_office(office_id));
CREATE POLICY "Users can delete events in their offices" ON public.office_events FOR DELETE USING (public.owns_office(office_id));

-- 5. office_activity_log
CREATE TABLE public.office_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  log_type TEXT NOT NULL DEFAULT 'info',
  detail TEXT,
  task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity in their offices" ON public.office_activity_log FOR SELECT USING (public.owns_office(office_id));
CREATE POLICY "Users can create activity in their offices" ON public.office_activity_log FOR INSERT WITH CHECK (public.owns_office(office_id));
CREATE POLICY "Users can delete activity in their offices" ON public.office_activity_log FOR DELETE USING (public.owns_office(office_id));

-- 6. office_deliverables
CREATE TABLE public.office_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  file_url TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliverables in their offices" ON public.office_deliverables FOR SELECT USING (public.owns_office(office_id));
CREATE POLICY "Users can create deliverables in their offices" ON public.office_deliverables FOR INSERT WITH CHECK (public.owns_office(office_id));
CREATE POLICY "Users can delete deliverables in their offices" ON public.office_deliverables FOR DELETE USING (public.owns_office(office_id));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.office_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.office_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.office_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.office_tasks;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('office-deliverables', 'office-deliverables', true);

CREATE POLICY "Anyone can view office deliverables" ON storage.objects FOR SELECT USING (bucket_id = 'office-deliverables');
CREATE POLICY "Authenticated users can upload office deliverables" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'office-deliverables' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete office deliverables" ON storage.objects FOR DELETE USING (bucket_id = 'office-deliverables' AND auth.role() = 'authenticated');

-- Trigger for updated_at on office_agents
CREATE TRIGGER update_office_agents_updated_at
  BEFORE UPDATE ON public.office_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
