-- ============================================================================
-- Nova AI Email Employee — Database Schema
-- Creates tables for email templates, sequences, campaigns, emails, and metrics
-- ============================================================================

-- Table: nova_templates
-- Email template library with {{variables}}, categories, and performance stats
CREATE TABLE IF NOT EXISTS nova_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'outreach',
  tags TEXT[] DEFAULT '{}',
  usage_count INT DEFAULT 0,
  avg_open_rate NUMERIC DEFAULT 0,
  avg_reply_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: nova_sequences
-- Multi-step email sequences with JSONB steps array
CREATE TABLE IF NOT EXISTS nova_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  steps JSONB NOT NULL DEFAULT '[]',
  total_enrolled INT DEFAULT 0,
  active_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  stopped_count INT DEFAULT 0,
  avg_completion_rate NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: nova_campaigns
-- Campaigns with FKs to templates/sequences, send settings, and aggregate stats
CREATE TABLE IF NOT EXISTS nova_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  sequence_id UUID REFERENCES nova_sequences(id) ON DELETE SET NULL,
  template_id UUID REFERENCES nova_templates(id) ON DELETE SET NULL,
  from_address TEXT DEFAULT 'nova@verticalsystems.io',
  total_leads INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  emails_delivered INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,
  emails_replied INT DEFAULT 0,
  emails_bounced INT DEFAULT 0,
  meetings_booked INT DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  click_rate NUMERIC DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  personalization_level TEXT DEFAULT 'standard',
  send_limit_per_day INT DEFAULT 50,
  send_window_start TEXT DEFAULT '09:00',
  send_window_end TEXT DEFAULT '17:00',
  timezone TEXT DEFAULT 'America/Vancouver',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: nova_emails
-- Individual emails with full lifecycle tracking (queued → replied/bounced)
CREATE TABLE IF NOT EXISTS nova_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resend_id TEXT UNIQUE,
  campaign_id UUID REFERENCES nova_campaigns(id) ON DELETE SET NULL,
  sequence_id UUID REFERENCES nova_sequences(id) ON DELETE SET NULL,
  sequence_step INT,
  template_id UUID REFERENCES nova_templates(id) ON DELETE SET NULL,
  lead_id TEXT,
  from_address TEXT NOT NULL DEFAULT 'nova@verticalsystems.io',
  to_address TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  personalization_fields JSONB DEFAULT '{}',
  status TEXT DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  first_open_at TIMESTAMPTZ,
  open_count INT DEFAULT 0,
  clicked_at TIMESTAMPTZ,
  click_count INT DEFAULT 0,
  replied_at TIMESTAMPTZ,
  reply_snippet TEXT,
  bounced_at TIMESTAMPTZ,
  bounce_type TEXT,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  meeting_booked BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nova_emails_status ON nova_emails(status);
CREATE INDEX IF NOT EXISTS idx_nova_emails_created ON nova_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nova_emails_campaign ON nova_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_nova_emails_sequence ON nova_emails(sequence_id);
CREATE INDEX IF NOT EXISTS idx_nova_emails_resend ON nova_emails(resend_id);
CREATE INDEX IF NOT EXISTS idx_nova_emails_to ON nova_emails(to_address);

-- Table: nova_daily_metrics
-- Pre-aggregated daily stats for fast chart rendering
CREATE TABLE IF NOT EXISTS nova_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  emails_sent INT DEFAULT 0,
  emails_delivered INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,
  emails_replied INT DEFAULT 0,
  emails_bounced INT DEFAULT 0,
  meetings_booked INT DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  click_rate NUMERIC DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  avg_open_time_hours NUMERIC DEFAULT 0,
  top_subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE nova_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access on nova_templates"
  ON nova_templates FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on nova_sequences"
  ON nova_sequences FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on nova_campaigns"
  ON nova_campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on nova_emails"
  ON nova_emails FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on nova_daily_metrics"
  ON nova_daily_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anon read access (frontend uses anon key)
CREATE POLICY "Anon read access on nova_templates"
  ON nova_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read access on nova_sequences"
  ON nova_sequences FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read access on nova_campaigns"
  ON nova_campaigns FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read access on nova_emails"
  ON nova_emails FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read access on nova_daily_metrics"
  ON nova_daily_metrics FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- Updated_at trigger function (reuse if exists)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_nova_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nova_templates_updated_at
  BEFORE UPDATE ON nova_templates
  FOR EACH ROW EXECUTE FUNCTION update_nova_updated_at();

CREATE TRIGGER nova_sequences_updated_at
  BEFORE UPDATE ON nova_sequences
  FOR EACH ROW EXECUTE FUNCTION update_nova_updated_at();

CREATE TRIGGER nova_campaigns_updated_at
  BEFORE UPDATE ON nova_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_nova_updated_at();

CREATE TRIGGER nova_emails_updated_at
  BEFORE UPDATE ON nova_emails
  FOR EACH ROW EXECUTE FUNCTION update_nova_updated_at();

-- ============================================================================
-- Enable realtime on nova_emails for live outbox updates
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE nova_emails;

-- ============================================================================
-- Register Nova block types in OpsCenter validator
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_ops_block_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
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
    'lexa_leads',
    'nova_dashboard',
    'nova_outbox',
    'nova_templates',
    'nova_sequences',
    'nova_campaigns',
    'nova_analytics'
  ) THEN
    RAISE EXCEPTION 'Invalid ops_blocks block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$function$;
