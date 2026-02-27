-- Fix: Remove "Ray" defaults from ai_status columns
-- Previously, agent_name defaulted to 'Ray' and agent_emoji to '⚡'
-- This caused ghost "Ray" records when rows were inserted without explicit agent_name
-- Now: agent_name defaults to 'AI' and agent_emoji to '🤖' as neutral fallbacks

ALTER TABLE ai_status ALTER COLUMN agent_name SET DEFAULT 'AI';
ALTER TABLE ai_status ALTER COLUMN agent_emoji SET DEFAULT '🤖';

-- Also fix ai_log defaults if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_log' AND column_name = 'agent_name' AND column_default LIKE '%Ray%'
  ) THEN
    ALTER TABLE ai_log ALTER COLUMN agent_name SET DEFAULT 'AI';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_log' AND column_name = 'agent_emoji'
  ) THEN
    ALTER TABLE ai_log ALTER COLUMN agent_emoji SET DEFAULT '🤖';
  END IF;
END $$;
