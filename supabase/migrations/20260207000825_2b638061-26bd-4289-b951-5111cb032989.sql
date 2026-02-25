-- Create pending_tasks table for reliable task queue
CREATE TABLE public.pending_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_type text NOT NULL, -- task, report, goal, memory, skill, status
  action text NOT NULL, -- create, update, process, notify, heartbeat
  payload jsonb NOT NULL DEFAULT '{}',
  priority text NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  result jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.pending_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user isolation
CREATE POLICY "Users can view their own pending tasks" 
ON public.pending_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending tasks" 
ON public.pending_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending tasks" 
ON public.pending_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending tasks" 
ON public.pending_tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_pending_tasks_user_status ON public.pending_tasks(user_id, status);
CREATE INDEX idx_pending_tasks_created_at ON public.pending_tasks(created_at);
CREATE INDEX idx_pending_tasks_expires_at ON public.pending_tasks(expires_at) WHERE status = 'pending';

-- Enable Realtime for instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_tasks;