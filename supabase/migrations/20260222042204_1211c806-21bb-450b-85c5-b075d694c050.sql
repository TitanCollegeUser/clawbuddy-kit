
-- Add agent_name and agent_emoji columns to ai_status
ALTER TABLE ai_status ADD COLUMN agent_name TEXT DEFAULT 'Ray';
ALTER TABLE ai_status ADD COLUMN agent_emoji TEXT DEFAULT '⚡';

-- Add composite unique constraint for multi-agent support
ALTER TABLE ai_status ADD CONSTRAINT ai_status_user_agent_unique UNIQUE (user_id, agent_name);
