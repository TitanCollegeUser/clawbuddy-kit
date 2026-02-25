-- Bujji status table for tracking online/offline state
CREATE TABLE public.bujji_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_online boolean DEFAULT false,
  status_message text,
  last_seen timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert initial status row
INSERT INTO public.bujji_status (is_online, status_message) 
VALUES (false, 'Bujji is sleeping...');

-- Enable RLS with public read
ALTER TABLE public.bujji_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view Bujji status" 
ON public.bujji_status 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_bujji_status_updated_at
BEFORE UPDATE ON public.bujji_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE bujji_status;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;