-- ============================================================================
-- Lexa Campaign Builder — Database Schema Updates
-- Adds AI prompt columns to campaigns + creates leads table
-- ============================================================================

-- ── ALTER lexa_campaigns — add prompt + config columns ──────────────────────
ALTER TABLE lexa_campaigns ADD COLUMN IF NOT EXISTS ai_prompt TEXT DEFAULT '';
ALTER TABLE lexa_campaigns ADD COLUMN IF NOT EXISTS prompt_variables TEXT[] DEFAULT '{}';
ALTER TABLE lexa_campaigns ADD COLUMN IF NOT EXISTS from_phone TEXT DEFAULT '+17787439520';
ALTER TABLE lexa_campaigns ADD COLUMN IF NOT EXISTS agent_id TEXT DEFAULT '-OmNNf485Na8Bw82RSfz';
ALTER TABLE lexa_campaigns ADD COLUMN IF NOT EXISTS call_delay_seconds INT DEFAULT 5;
ALTER TABLE lexa_campaigns ADD COLUMN IF NOT EXISTS max_retries INT DEFAULT 0;

-- ── CREATE lexa_leads — dedicated lead storage per campaign ─────────────────
CREATE TABLE IF NOT EXISTS lexa_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES lexa_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  custom_fields JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  call_session_id TEXT,
  call_result TEXT,
  call_duration_seconds NUMERIC DEFAULT 0,
  call_sentiment TEXT,
  call_summary TEXT,
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lexa_leads_campaign ON lexa_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lexa_leads_status ON lexa_leads(status);
CREATE INDEX IF NOT EXISTS idx_lexa_leads_phone ON lexa_leads(phone);
CREATE INDEX IF NOT EXISTS idx_lexa_leads_created ON lexa_leads(created_at DESC);

-- RLS
ALTER TABLE lexa_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on lexa_leads"
  ON lexa_leads FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon read access on lexa_leads"
  ON lexa_leads FOR SELECT
  TO anon
  USING (true);

-- Anon insert access (frontend creates leads via batch insert)
CREATE POLICY "Anon insert access on lexa_leads"
  ON lexa_leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER lexa_leads_updated_at
  BEFORE UPDATE ON lexa_leads
  FOR EACH ROW EXECUTE FUNCTION update_lexa_updated_at();

-- Realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE lexa_leads;

-- ── Update block type validator to include lexa_leads ───────────────────────
CREATE OR REPLACE FUNCTION public.validate_ops_block_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.block_type NOT IN (
    'kanban', 'table', 'list', 'metric_cards', 'progress_bar',
    'chart', 'text', 'office', 'feed', 'form', 'embed',
    'timeline', 'calendar', 'gallery', 'agent_card',
    'approval_queue', 'comparison', 'alert_banner', 'countdown',
    'yt_dashboard', 'yt_competitors', 'yt_banger_lab',
    'yt_pipeline', 'yt_scripts', 'yt_intel_feed', 'yt_outlier_feed',
    'yt_analytics',
    'outreach_scoreboard', 'outreach_leads', 'outreach_phone',
    'outreach_email', 'outreach_campaigns', 'outreach_results',
    'meeting_intel',
    'employee_campaign_creator',
    'employee_lead_table',
    'employee_analytics',
    'lexa_dashboard',
    'lexa_call_log',
    'lexa_analytics',
    'lexa_transcripts',
    'lexa_campaigns',
    'lexa_leads'
  ) THEN
    RAISE EXCEPTION 'Invalid ops_blocks block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$function$;
