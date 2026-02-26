-- Drop the FK constraint on task_assignees.user_id so AI agents and sub-agents can be assigned to tasks
-- The frontend useAssignableEntities hook already supports users, ai_agents, and sub_agents
-- The user_id column stores IDs from any of these 3 tables
ALTER TABLE public.task_assignees DROP CONSTRAINT IF EXISTS task_assignees_user_id_fkey;
