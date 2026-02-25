-- Drop foreign key constraints that incorrectly reference auth.users
-- These tables should allow user_id to be any valid public.users.id or NULL
-- (The system user "bujji@system.local" exists in public.users but not auth.users)

-- Drop FK from ai_log
ALTER TABLE public.ai_log 
DROP CONSTRAINT IF EXISTS ai_log_user_id_fkey;

-- Drop FK from ai_questions
ALTER TABLE public.ai_questions 
DROP CONSTRAINT IF EXISTS ai_questions_user_id_fkey;

-- Drop FK from ai_status
ALTER TABLE public.ai_status 
DROP CONSTRAINT IF EXISTS ai_status_user_id_fkey;