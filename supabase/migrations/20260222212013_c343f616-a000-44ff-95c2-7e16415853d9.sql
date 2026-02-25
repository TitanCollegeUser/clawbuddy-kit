ALTER TABLE public.intelligence_ideas
ADD COLUMN IF NOT EXISTS evolution_history jsonb DEFAULT '[]'::jsonb;