
-- Fix 1: Restrict users table SELECT to own profile only
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Create a safe view excluding sensitive fields for cross-user lookups
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT id, name, avatar_url, created_at
FROM public.users;

GRANT SELECT ON public.user_profiles TO authenticated;
