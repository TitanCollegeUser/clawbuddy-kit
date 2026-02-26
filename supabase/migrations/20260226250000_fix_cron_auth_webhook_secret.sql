-- Fix: pg_cron jobs use x-webhook-secret instead of Authorization Bearer header
-- The SUPABASE_SERVICE_ROLE_KEY env var inside edge functions doesn't match the
-- hardcoded service key in pg_cron jobs, causing "Unauthorized" errors.
-- Using x-webhook-secret (AI_TASKS_API_KEY / WEBHOOK_SECRET) works reliably.

CREATE OR REPLACE FUNCTION sync_automation_cron()
RETURNS TRIGGER AS $trig$
DECLARE
  job_name TEXT;
  edge_fn_url TEXT;
  webhook_secret TEXT;
  cron_sql TEXT;
BEGIN
  job_name := 'automation_' || NEW.id::TEXT;
  edge_fn_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/automation-runner';
  webhook_secret := 'YOUR_WEBHOOK_SECRET';

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
      '{"Content-Type": "application/json", "x-webhook-secret": "' || webhook_secret || '"}',
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
