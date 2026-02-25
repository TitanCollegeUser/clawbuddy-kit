
-- identity_files: add agent_id, drop old constraint, add new one
ALTER TABLE identity_files ADD COLUMN agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE;
ALTER TABLE identity_files DROP CONSTRAINT IF EXISTS identity_files_user_id_file_key_key;
ALTER TABLE identity_files ADD CONSTRAINT identity_files_user_agent_file_key UNIQUE (user_id, agent_id, file_key);

-- daily_memory_logs: add agent_id, drop old constraint, add new one
ALTER TABLE daily_memory_logs ADD COLUMN agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE;
ALTER TABLE daily_memory_logs DROP CONSTRAINT IF EXISTS daily_memory_logs_user_id_log_date_key;
ALTER TABLE daily_memory_logs ADD CONSTRAINT daily_memory_logs_user_agent_date UNIQUE (user_id, agent_id, log_date);
