-- Create raw_reports table to queue incoming webhook data
CREATE TABLE public.raw_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('employee', 'insight')),
  raw_data JSONB NOT NULL,
  metadata JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_report_id UUID REFERENCES public.reports(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.raw_reports ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for webhook access
CREATE POLICY "Anyone can view raw_reports" ON public.raw_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can create raw_reports" ON public.raw_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update raw_reports" ON public.raw_reports FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete raw_reports" ON public.raw_reports FOR DELETE USING (true);

-- Index for efficient querying by status
CREATE INDEX idx_raw_reports_status ON public.raw_reports(status);
CREATE INDEX idx_raw_reports_created_at ON public.raw_reports(created_at DESC);