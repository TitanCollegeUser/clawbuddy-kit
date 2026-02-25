-- Create reports table for HTML reports from Bujji
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('employee', 'insight')),
  html_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow all operations for Bujji API access
CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Anyone can create reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reports" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete reports" ON public.reports FOR DELETE USING (true);