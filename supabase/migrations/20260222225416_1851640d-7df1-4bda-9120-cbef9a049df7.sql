
-- Clean up ai_status: delete orphan, fix agent_name on real row
DELETE FROM public.ai_status
WHERE id = 'd5764467-250a-46f3-9137-f5c100eba741';

UPDATE public.ai_status
SET agent_name = 'Sherlock', agent_emoji = '🔍'
WHERE id = '45b6ae0b-629b-4383-a137-4f1654ebe8fc';

-- Clean up orphan task_assignees that reference non-existent users
DELETE FROM public.task_assignees
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Now add the foreign key
ALTER TABLE public.task_assignees
  ADD CONSTRAINT task_assignees_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
