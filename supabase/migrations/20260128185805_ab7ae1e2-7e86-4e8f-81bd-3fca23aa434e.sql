-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board columns (Kanban columns: To Do, Doing, etc)
CREATE TABLE public.board_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (Individual tasks on the board)
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  board_column_id UUID REFERENCES public.board_columns(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ
);

-- Subtasks (Breakdown of tasks)
CREATE TABLE public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task assignees (Many-to-many: tasks can have multiple people)
CREATE TABLE public.task_assignees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON public.users 
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for board_columns (public read, no write for normal users)
CREATE POLICY "Anyone can view board columns" ON public.board_columns 
  FOR SELECT USING (true);

-- RLS Policies for tasks
CREATE POLICY "Authenticated users can view all tasks" ON public.tasks 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tasks" ON public.tasks 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update tasks" ON public.tasks 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete their own tasks" ON public.tasks 
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS Policies for subtasks
CREATE POLICY "Authenticated users can view all subtasks" ON public.subtasks 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create subtasks" ON public.subtasks 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update subtasks" ON public.subtasks 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete subtasks" ON public.subtasks 
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for task_assignees
CREATE POLICY "Authenticated users can view all task assignees" ON public.task_assignees 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create task assignments" ON public.task_assignees 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete task assignments" ON public.task_assignees 
  FOR DELETE TO authenticated USING (true);

-- Insert default board columns
INSERT INTO public.board_columns (name, position, color) VALUES
  ('To Do', 1, '#ef4444'),
  ('Doing', 2, '#f59e0b'),
  ('Needs Input', 3, '#8b5cf6'),
  ('Canceled', 4, '#6b7280'),
  ('Done', 5, '#10b981');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_columns_updated_at
  BEFORE UPDATE ON public.board_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();