-- Create bujji_questions table for AI to ask Mani questions
CREATE TABLE public.bujji_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  context text,
  related_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed')),
  answer text,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bujji_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view questions" ON public.bujji_questions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create questions" ON public.bujji_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update questions" ON public.bujji_questions
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_bujji_questions_updated_at
  BEFORE UPDATE ON public.bujji_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();