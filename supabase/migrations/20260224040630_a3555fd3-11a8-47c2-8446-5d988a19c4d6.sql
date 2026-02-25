
-- Automation jobs table
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  cron_expression TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Vancouver',
  prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-sonnet',
  max_turns INTEGER NOT NULL DEFAULT 10,
  timeout_seconds INTEGER NOT NULL DEFAULT 120,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_id TEXT,
  template_config JSONB DEFAULT '{}'::jsonb,
  ops_app_id UUID REFERENCES public.ops_apps(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status TEXT,
  run_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execution history
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  output TEXT,
  output_html TEXT,
  error TEXT,
  deliveries JSONB DEFAULT '[]'::jsonb,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Channel presets
CREATE TABLE IF NOT EXISTS public.automation_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_user ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_enabled ON public.automations(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON public.automations(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_automation_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_started ON public.automation_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_channels_user ON public.automation_channels(user_id);

-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own automations"
  ON public.automations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view executions of their automations"
  ON public.automation_executions FOR ALL
  USING (automation_id IN (SELECT id FROM public.automations WHERE user_id = auth.uid()))
  WITH CHECK (automation_id IN (SELECT id FROM public.automations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own channels"
  ON public.automation_channels FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Validation triggers
CREATE OR REPLACE FUNCTION public.validate_automation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_status IS NOT NULL AND NEW.last_status NOT IN ('success', 'failed', 'running', 'skipped') THEN
    RAISE EXCEPTION 'Invalid automation last_status: %', NEW.last_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_automation_status_trigger
  BEFORE INSERT OR UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.validate_automation_status();

CREATE OR REPLACE FUNCTION public.validate_execution_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('running', 'success', 'failed', 'skipped', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid execution status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_execution_status_trigger
  BEFORE INSERT OR UPDATE ON public.automation_executions
  FOR EACH ROW EXECUTE FUNCTION public.validate_execution_status();

CREATE OR REPLACE FUNCTION public.validate_channel_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type NOT IN ('telegram', 'discord', 'email', 'dashboard') THEN
    RAISE EXCEPTION 'Invalid channel type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_channel_type_trigger
  BEFORE INSERT OR UPDATE ON public.automation_channels
  FOR EACH ROW EXECUTE FUNCTION public.validate_channel_type();

-- Updated_at triggers
CREATE TRIGGER automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER automation_channels_updated_at
  BEFORE UPDATE ON public.automation_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
