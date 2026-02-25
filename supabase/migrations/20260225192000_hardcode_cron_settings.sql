-- Fix sync_automation_cron: hardcode correct Supabase URL and service role key
-- current_setting('app.settings.*') doesn't work on Supabase hosted
-- so we hardcode the values directly in the trigger function

CREATE OR REPLACE FUNCTION sync_automation_cron()
RETURNS TRIGGER AS $trig$
DECLARE
  job_name TEXT;
  edge_fn_url TEXT;
  service_key TEXT;
  cron_sql TEXT;
BEGIN
  job_name := 'automation_' || NEW.id::TEXT;
  -- IMPORTANT: Replace with YOUR Supabase project URL and service role key
  edge_fn_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/automation-runner';
  service_key := 'YOUR_SERVICE_ROLE_KEY';

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

-- Re-toggle all enabled automations to recreate pg_cron jobs with correct auth
DO $$
DECLARE
  auto_record RECORD;
BEGIN
  FOR auto_record IN SELECT id FROM automations WHERE enabled = true LOOP
    UPDATE automations SET enabled = false WHERE id = auto_record.id;
    UPDATE automations SET enabled = true WHERE id = auto_record.id;
  END LOOP;
END $$;
