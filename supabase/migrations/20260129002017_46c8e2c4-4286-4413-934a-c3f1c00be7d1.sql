-- Add flexible configuration columns for Skills Factory
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS protocol_type text DEFAULT 'rest',
  ADD COLUMN IF NOT EXISTS connection_config jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_notes text,
  ADD COLUMN IF NOT EXISTS bujji_feedback text,
  ADD COLUMN IF NOT EXISTS bujji_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Create validation trigger for protocol_type
CREATE OR REPLACE FUNCTION public.validate_skill_protocol_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocol_type NOT IN ('rest', 'smtp', 'graphql', 'webhook', 'custom') THEN
    RAISE EXCEPTION 'Invalid protocol_type: %. Must be one of: rest, smtp, graphql, webhook, custom', NEW.protocol_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create validation trigger for bujji_status
CREATE OR REPLACE FUNCTION public.validate_skill_bujji_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bujji_status NOT IN ('pending', 'processing', 'accepted', 'needs_info', 'rejected') THEN
    RAISE EXCEPTION 'Invalid bujji_status: %. Must be one of: pending, processing, accepted, needs_info, rejected', NEW.bujji_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Attach triggers
DROP TRIGGER IF EXISTS validate_skill_protocol_type_trigger ON skills;
CREATE TRIGGER validate_skill_protocol_type_trigger
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_skill_protocol_type();

DROP TRIGGER IF EXISTS validate_skill_bujji_status_trigger ON skills;
CREATE TRIGGER validate_skill_bujji_status_trigger
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_skill_bujji_status();