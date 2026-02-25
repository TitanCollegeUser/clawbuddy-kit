-- Fix sync_automation_cron: correct Supabase URL and ensure pg_cron jobs exist
-- The previous migration hardcoded the wrong project URL as fallback

CREATE OR REPLACE FUNCTION sync_automation_cron()
RETURNS TRIGGER AS $trig$
DECLARE
  job_name TEXT;
  edge_fn_url TEXT;
  service_key TEXT;
  cron_sql TEXT;
BEGIN
  job_name := 'automation_' || NEW.id::TEXT;

  -- Use the correct Supabase project URL
  edge_fn_url := current_setting('app.settings.supabase_url', true);
  IF edge_fn_url IS NULL OR edge_fn_url = '' THEN
    edge_fn_url := 'https://YOUR_PROJECT_REF.supabase.co';
  END IF;
  edge_fn_url := edge_fn_url || '/functions/v1/automation-runner';

  service_key := current_setting('app.settings.service_role_key', true);
  IF service_key IS NULL OR service_key = '' THEN
    service_key := current_setting('supabase.service_role_key', true);
  END IF;
  IF service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'service_role_key not configured in app.settings — pg_cron job will fail auth';
    service_key := 'service-role-key-not-configured';
  END IF;

  -- Unschedule existing job
  BEGIN
    PERFORM cron.unschedule(job_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Schedule if enabled
  IF NEW.enabled = true THEN
    cron_sql := format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb)',
      edge_fn_url,
      '{"Content-Type": "application/json", "Authorization": "Bearer ' || service_key || '"}',
      '{"automation_id": "' || NEW.id::TEXT || '"}'
    );

    PERFORM cron.schedule(job_name, NEW.cron_expression, cron_sql);
    NEW.next_run_at := now() + interval '1 hour';
  ELSE
    NEW.next_run_at := NULL;
  END IF;

  RETURN NEW;
END;
$trig$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Re-fire the trigger for all enabled automations by toggling enabled
-- This forces pg_cron job (re)creation with the correct URL
UPDATE automations SET enabled = false WHERE enabled = true;
UPDATE automations SET enabled = true WHERE enabled = false;
