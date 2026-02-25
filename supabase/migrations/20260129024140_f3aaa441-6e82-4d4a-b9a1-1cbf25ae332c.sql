-- Create memory_injections table
CREATE TABLE public.memory_injections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memory_injections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own memory injections"
ON public.memory_injections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory injections"
ON public.memory_injections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory injections"
ON public.memory_injections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory injections"
ON public.memory_injections FOR DELETE
USING (auth.uid() = user_id);