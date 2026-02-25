
-- Create ai_agents table
CREATE TABLE public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Ray',
  webhook_secret text NOT NULL DEFAULT (gen_random_uuid())::text,
  is_default boolean NOT NULL DEFAULT false,
  avatar_color text NOT NULL DEFAULT '#3b82f6',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own agents"
  ON public.ai_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
  ON public.ai_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON public.ai_agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON public.ai_agents FOR DELETE
  USING (auth.uid() = user_id);

-- Add agent_id to ai_status
ALTER TABLE public.ai_status
  ADD COLUMN agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL;

-- Seed existing users into ai_agents
INSERT INTO public.ai_agents (user_id, name, webhook_secret, is_default)
SELECT id, ai_name, COALESCE(webhook_secret, (gen_random_uuid())::text), true
FROM public.users;

-- Enable realtime for ai_agents
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agents;
