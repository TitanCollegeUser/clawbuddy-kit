-- Add bujji_log table for non-task related messages
CREATE TABLE public.bujji_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general', 'observation', 'reminder', 'fyi')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bujji_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view log" ON public.bujji_log FOR SELECT USING (true);
CREATE POLICY "Anyone can create log" ON public.bujji_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update log" ON public.bujji_log FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete log" ON public.bujji_log FOR DELETE USING (true);

-- Add approval columns to bujji_questions
ALTER TABLE public.bujji_questions
  ADD COLUMN question_type text DEFAULT 'question' CHECK (question_type IN ('question', 'approval')),
  ADD COLUMN approval_response boolean;