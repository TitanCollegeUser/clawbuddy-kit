-- ============================================================================
-- Lexa Voice AI Platform — Database Schema
-- Creates tables for call records, campaigns, and daily metrics
-- ============================================================================

-- Table: lexa_calls
-- Stores all call records received via webhook + periodic sync from Millis AI
CREATE TABLE IF NOT EXISTS lexa_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL DEFAULT '-OmNNf485Na8Bw82RSfz',
  call_status TEXT NOT NULL,
  duration_seconds NUMERIC NOT NULL DEFAULT 0,
  transcript JSONB,
  cost_breakdown JSONB,
  total_cost NUMERIC DEFAULT 0,
  call_metrics JSONB,
  voip JSONB,
  caller_number TEXT,
  callee_number TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}',
  sentiment TEXT DEFAULT 'neutral',
  call_type TEXT DEFAULT 'unknown',
  campaign_id TEXT,
  summary TEXT,
  action_items JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lexa_calls_status ON lexa_calls(call_status);
CREATE INDEX IF NOT EXISTS idx_lexa_calls_created ON lexa_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lexa_calls_campaign ON lexa_calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lexa_calls_type ON lexa_calls(call_type);
CREATE INDEX IF NOT EXISTS idx_lexa_calls_session ON lexa_calls(session_id);

-- Table: lexa_campaigns
-- Tracks campaign metadata and progress
CREATE TABLE IF NOT EXISTS lexa_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  millis_campaign_id TEXT UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'idle',
  total_records INT DEFAULT 0,
  calls_made INT DEFAULT 0,
  calls_answered INT DEFAULT 0,
  calls_voicemail INT DEFAULT 0,
  calls_failed INT DEFAULT 0,
  avg_duration_seconds NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  caller_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lexa_daily_metrics
-- Pre-aggregated daily metrics for fast chart rendering
CREATE TABLE IF NOT EXISTS lexa_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_calls INT DEFAULT 0,
  inbound_calls INT DEFAULT 0,
  outbound_calls INT DEFAULT 0,
  campaign_calls INT DEFAULT 0,
  total_duration_seconds NUMERIC DEFAULT 0,
  avg_duration_seconds NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  calls_answered INT DEFAULT 0,
  calls_voicemail INT DEFAULT 0,
  calls_failed INT DEFAULT 0,
  avg_sentiment_score NUMERIC DEFAULT 0,
  avg_latency_ms NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE lexa_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexa_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexa_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access on lexa_calls"
  ON lexa_calls FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on lexa_campaigns"
  ON lexa_campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on lexa_daily_metrics"
  ON lexa_daily_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anon read access (frontend uses anon key)
CREATE POLICY "Anon read access on lexa_calls"
  ON lexa_calls FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read access on lexa_campaigns"
  ON lexa_campaigns FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read access on lexa_daily_metrics"
  ON lexa_daily_metrics FOR SELECT
  TO anon
  USING (true);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_lexa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lexa_calls_updated_at
  BEFORE UPDATE ON lexa_calls
  FOR EACH ROW EXECUTE FUNCTION update_lexa_updated_at();

CREATE TRIGGER lexa_campaigns_updated_at
  BEFORE UPDATE ON lexa_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_lexa_updated_at();

-- Enable realtime on lexa_calls for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE lexa_calls;
