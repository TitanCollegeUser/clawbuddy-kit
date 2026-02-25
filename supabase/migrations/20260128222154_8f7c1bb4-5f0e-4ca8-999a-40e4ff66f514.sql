-- Drop the restrictive DELETE policy
DROP POLICY IF EXISTS "Authenticated users can delete their own tasks" ON public.tasks;

-- Create new policy allowing any authenticated user to delete tasks
CREATE POLICY "Authenticated users can delete any task"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (true);