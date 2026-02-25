
-- Create webhook_functions table
CREATE TABLE public.webhook_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL DEFAULT 'Process the following data and generate a report:\n\n{{raw_data}}',
  report_type TEXT NOT NULL DEFAULT 'insight',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook functions"
  ON public.webhook_functions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook functions"
  ON public.webhook_functions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook functions"
  ON public.webhook_functions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook functions"
  ON public.webhook_functions FOR DELETE
  USING (auth.uid() = user_id);

-- Create webhook_endpoints table
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  function_id UUID NOT NULL REFERENCES public.webhook_functions(id) ON DELETE CASCADE,
  secret TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  auto_process BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook endpoints"
  ON public.webhook_endpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook endpoints"
  ON public.webhook_endpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook endpoints"
  ON public.webhook_endpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook endpoints"
  ON public.webhook_endpoints FOR DELETE
  USING (auth.uid() = user_id);

-- Alter raw_reports to add FK columns
ALTER TABLE public.raw_reports
  ADD COLUMN webhook_endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE SET NULL,
  ADD COLUMN function_id UUID REFERENCES public.webhook_functions(id) ON DELETE SET NULL;
