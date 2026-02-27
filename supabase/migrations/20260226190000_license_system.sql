-- License System for ClawBuddy Kit
-- This table lives on Mani's central Supabase (not in the kit).
-- Users activate their license code here, get a signed token back.

CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code text UNIQUE NOT NULL,
  -- Who owns this license
  owner_email text,
  owner_name text,
  -- Their Supabase project ref (set on activation)
  project_ref text,
  -- License state
  status text NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'active', 'revoked', 'expired')),
  -- When it was activated
  activated_at timestamptz,
  -- Optional expiry (NULL = lifetime)
  expires_at timestamptz,
  -- Metadata
  plan text DEFAULT 'community',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast activation lookups
CREATE INDEX IF NOT EXISTS idx_licenses_activation_code ON licenses(activation_code);
CREATE INDEX IF NOT EXISTS idx_licenses_project_ref ON licenses(project_ref);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS licenses_updated_at ON licenses;
CREATE TRIGGER licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

-- RLS: Only service role can access (edge functions use service role)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- No public policies — only service_role can read/write
-- This keeps the license table completely locked down
