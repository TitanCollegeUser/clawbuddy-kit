
-- Add new columns for Skill Factory
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'openclaw';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS skill_markdown TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS allowed_tools TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS input_schema JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS output_format TEXT NOT NULL DEFAULT 'text';

-- Make api_base_url nullable for claude-code skills
ALTER TABLE public.skills ALTER COLUMN api_base_url DROP NOT NULL;
ALTER TABLE public.skills ALTER COLUMN api_base_url SET DEFAULT '';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.skills;
