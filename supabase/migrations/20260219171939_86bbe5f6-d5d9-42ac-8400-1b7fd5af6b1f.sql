
-- Create identity_files table
CREATE TABLE public.identity_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_key text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, file_key)
);

ALTER TABLE public.identity_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own identity files"
  ON public.identity_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own identity files"
  ON public.identity_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own identity files"
  ON public.identity_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own identity files"
  ON public.identity_files FOR DELETE
  USING (auth.uid() = user_id);

-- Create daily_memory_logs table
CREATE TABLE public.daily_memory_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  log_date date NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'ray',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE public.daily_memory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily logs"
  ON public.daily_memory_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logs"
  ON public.daily_memory_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
  ON public.daily_memory_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
  ON public.daily_memory_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_memory_logs;
