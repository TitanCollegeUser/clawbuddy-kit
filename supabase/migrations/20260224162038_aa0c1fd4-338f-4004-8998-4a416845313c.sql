
-- ============================================================
-- 1. Add agent/creator tracking to automations table
-- ============================================================
ALTER TABLE automations ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'user';
ALTER TABLE automations ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS function_name TEXT;
ALTER TABLE automations ADD COLUMN IF NOT EXISTS function_config JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- 2. Add trigger source to execution history
-- ============================================================
ALTER TABLE automation_executions ADD COLUMN IF NOT EXISTS trigger_source TEXT NOT NULL DEFAULT 'scheduled';
ALTER TABLE automation_executions ADD COLUMN IF NOT EXISTS triggered_by TEXT;

-- ============================================================
-- 3. Update validate_channel_type to include agentmail
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_channel_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type NOT IN ('telegram', 'discord', 'email', 'dashboard', 'agentmail') THEN
    RAISE EXCEPTION 'Invalid channel type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 4. Service-role RLS policies
-- ============================================================
CREATE POLICY "Service role can manage all automations"
  ON automations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all executions"
  ON automation_executions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all channels"
  ON automation_channels FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 5. Enable extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 6. calculate_next_run placeholder
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, tz TEXT DEFAULT 'America/Vancouver')
RETURNS TIMESTAMPTZ AS $fn$
BEGIN
  RETURN now() + interval '1 hour';
END;
$fn$ LANGUAGE plpgsql SET search_path TO 'public';

-- ============================================================
-- 7. sync_automation_cron trigger
-- ============================================================
CREATE OR REPLACE FUNCTION sync_automation_cron()
RETURNS TRIGGER AS $trig$
DECLARE
  job_name TEXT;
  edge_fn_url TEXT;
  service_key TEXT;
  cron_sql TEXT;
BEGIN
  job_name := 'automation_' || NEW.id::TEXT;
  edge_fn_url := current_setting('app.settings.supabase_url', true);
  IF edge_fn_url IS NULL OR edge_fn_url = '' THEN
    edge_fn_url := 'https://cgitzpughnoghwotmtjv.supabase.co';
  END IF;
  edge_fn_url := edge_fn_url || '/functions/v1/automation-runner';

  service_key := current_setting('app.settings.service_role_key', true);
  IF service_key IS NULL OR service_key = '' THEN
    service_key := 'service-role-key-not-configured';
  END IF;

  BEGIN
    PERFORM cron.unschedule(job_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF NEW.enabled = true THEN
    cron_sql := format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb)',
      edge_fn_url,
      '{"Content-Type": "application/json", "Authorization": "Bearer ' || service_key || '"}',
      '{"automation_id": "' || NEW.id::TEXT || '"}'
    );

    PERFORM cron.schedule(job_name, NEW.cron_expression, cron_sql);
    NEW.next_run_at := calculate_next_run(NEW.cron_expression, NEW.timezone);
  ELSE
    NEW.next_run_at := NULL;
  END IF;

  RETURN NEW;
END;
$trig$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS sync_automation_cron_trigger ON automations;
CREATE TRIGGER sync_automation_cron_trigger
  BEFORE INSERT OR UPDATE OF enabled, cron_expression, timezone
  ON automations
  FOR EACH ROW
  EXECUTE FUNCTION sync_automation_cron();

-- ============================================================
-- 8. unschedule_automation_cron trigger
-- ============================================================
CREATE OR REPLACE FUNCTION unschedule_automation_cron()
RETURNS TRIGGER AS $trig2$
BEGIN
  BEGIN
    PERFORM cron.unschedule('automation_' || OLD.id::TEXT);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN OLD;
END;
$trig2$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS unschedule_automation_cron_trigger ON automations;
CREATE TRIGGER unschedule_automation_cron_trigger
  BEFORE DELETE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION unschedule_automation_cron();

-- ============================================================
-- 9. musashi_state table
-- ============================================================
CREATE TABLE IF NOT EXISTS musashi_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  last_used_numbers INTEGER[] DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE musashi_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their musashi state"
  ON musashi_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage musashi state"
  ON musashi_state FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 10. Validation triggers for new columns
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_automation_created_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $vcb$
BEGIN
  IF NEW.created_by NOT IN ('user', 'agent') THEN
    RAISE EXCEPTION 'Invalid created_by: %. Must be user or agent', NEW.created_by;
  END IF;
  RETURN NEW;
END;
$vcb$;

DROP TRIGGER IF EXISTS validate_automation_created_by_trigger ON automations;
CREATE TRIGGER validate_automation_created_by_trigger
  BEFORE INSERT OR UPDATE OF created_by ON automations
  FOR EACH ROW EXECUTE FUNCTION validate_automation_created_by();

CREATE OR REPLACE FUNCTION public.validate_execution_trigger_source()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $vts$
BEGIN
  IF NEW.trigger_source NOT IN ('scheduled', 'manual', 'agent', 'webhook') THEN
    RAISE EXCEPTION 'Invalid trigger_source: %. Must be scheduled, manual, agent, or webhook', NEW.trigger_source;
  END IF;
  RETURN NEW;
END;
$vts$;

DROP TRIGGER IF EXISTS validate_execution_trigger_source_trigger ON automation_executions;
CREATE TRIGGER validate_execution_trigger_source_trigger
  BEFORE INSERT OR UPDATE OF trigger_source ON automation_executions
  FOR EACH ROW EXECUTE FUNCTION validate_execution_trigger_source();
