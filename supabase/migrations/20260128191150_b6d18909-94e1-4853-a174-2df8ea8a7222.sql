-- Add a "created_by_bujji" flag to tasks instead of requiring a user record
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by_bujji boolean DEFAULT false;

-- Add deadline and assignee to subtasks
ALTER TABLE public.subtasks 
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- Create action log table for tracking all changes
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_name text NOT NULL, -- 'Bujji' or user's name
  actor_id uuid, -- null for Bujji, user id for humans
  action_type text NOT NULL, -- 'created', 'updated', 'moved', 'completed', 'deleted', 'comment'
  action_details jsonb, -- stores old/new values, column changes, etc.
  comment text, -- for comment type actions
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Everyone can view the activity log
CREATE POLICY "Anyone can view activity log"
ON public.activity_log FOR SELECT
USING (true);

-- Anyone can create log entries (for Bujji via API)
CREATE POLICY "Anyone can create log entries"
ON public.activity_log FOR INSERT
WITH CHECK (true);

-- Create AI insights table for Mani with budget tracking
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid, -- who the insight is for (Mani)
  insight_type text NOT NULL, -- 'budget', 'productivity', 'suggestion', 'summary'
  title text NOT NULL,
  content text NOT NULL,
  data jsonb, -- for budget amounts, metrics, etc.
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ai_insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Users can view all insights
CREATE POLICY "Anyone can view insights"
ON public.ai_insights FOR SELECT
USING (true);

-- Anyone can manage insights (for Bujji via API)
CREATE POLICY "Anyone can create insights"
ON public.ai_insights FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update insights"
ON public.ai_insights FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete insights"
ON public.ai_insights FOR DELETE
USING (true);

-- Create budget tracking table
CREATE TABLE IF NOT EXISTS public.task_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE UNIQUE,
  estimated_cost decimal(10,2),
  actual_cost decimal(10,2),
  currency text DEFAULT 'USD',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on task_budgets
ALTER TABLE public.task_budgets ENABLE ROW LEVEL SECURITY;

-- Anyone can view budgets
CREATE POLICY "Anyone can view budgets"
ON public.task_budgets FOR SELECT
USING (true);

-- Anyone can manage budgets (for Bujji via API)
CREATE POLICY "Anyone can create budgets"
ON public.task_budgets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update budgets"
ON public.task_budgets FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete budgets"
ON public.task_budgets FOR DELETE
USING (true);

-- Add trigger for updated_at on ai_insights
CREATE TRIGGER update_ai_insights_updated_at
BEFORE UPDATE ON public.ai_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on task_budgets
CREATE TRIGGER update_task_budgets_updated_at
BEFORE UPDATE ON public.task_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();