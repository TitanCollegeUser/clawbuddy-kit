
-- Add feedback loop and banger columns to intelligence_ideas
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS user_feedback text;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS ai_response text;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS feedback_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS is_banger boolean DEFAULT false;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS banger_confirmed_at timestamptz;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS community_gate text;
ALTER TABLE intelligence_ideas ADD COLUMN IF NOT EXISTS idea_number integer;
