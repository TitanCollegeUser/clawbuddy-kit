-- Fix calculate_next_run to actually parse cron expressions
-- Previously was a placeholder returning now() + 1 hour

CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, tz TEXT DEFAULT 'America/Vancouver')
RETURNS TIMESTAMPTZ AS $fn$
DECLARE
  parts TEXT[];
  cron_min TEXT;
  cron_hour TEXT;
  cron_dom TEXT;
  cron_mon TEXT;
  cron_dow TEXT;
  now_local TIMESTAMP;
  candidate TIMESTAMP;
  candidate_min INT;
  candidate_hour INT;
  min_val INT;
  hour_val INT;
  i INT;
BEGIN
  -- Parse the 5-part cron expression: min hour dom month dow
  parts := string_to_array(trim(cron_expr), ' ');
  IF array_length(parts, 1) < 5 THEN
    RETURN now() + interval '1 hour';
  END IF;

  cron_min  := parts[1];
  cron_hour := parts[2];
  cron_dom  := parts[3];
  cron_mon  := parts[4];
  cron_dow  := parts[5];

  -- Get current time in the automation's timezone
  now_local := (now() AT TIME ZONE tz);

  -- Handle common patterns:

  -- Pattern: */N * * * * (every N minutes)
  IF cron_min LIKE '*/%' AND cron_hour = '*' THEN
    min_val := (regexp_replace(cron_min, '\*/', ''))::INT;
    IF min_val > 0 THEN
      candidate_min := (EXTRACT(MINUTE FROM now_local)::INT / min_val + 1) * min_val;
      IF candidate_min >= 60 THEN
        RETURN (now_local + interval '1 hour')::TIMESTAMP AT TIME ZONE tz;
      END IF;
      candidate := date_trunc('hour', now_local) + (candidate_min || ' minutes')::INTERVAL;
      IF candidate <= now_local THEN
        candidate := candidate + (min_val || ' minutes')::INTERVAL;
      END IF;
      RETURN candidate AT TIME ZONE tz;
    END IF;
  END IF;

  -- Pattern: N N * * * (specific minute and hour, daily)
  -- Pattern: N N * * N (specific minute and hour, specific day of week)
  IF cron_min ~ '^\d+$' AND cron_hour ~ '^\d+$' THEN
    min_val  := cron_min::INT;
    hour_val := cron_hour::INT;

    -- Start from today at the specified time
    candidate := date_trunc('day', now_local) + (hour_val || ' hours')::INTERVAL + (min_val || ' minutes')::INTERVAL;

    -- If that time already passed today, start from tomorrow
    IF candidate <= now_local THEN
      candidate := candidate + interval '1 day';
    END IF;

    -- If day-of-week is specified (not *), advance to next matching day
    IF cron_dow ~ '^\d+$' THEN
      FOR i IN 0..7 LOOP
        IF EXTRACT(DOW FROM candidate)::INT = cron_dow::INT THEN
          RETURN candidate AT TIME ZONE tz;
        END IF;
        candidate := candidate + interval '1 day';
      END LOOP;
    END IF;

    RETURN candidate AT TIME ZONE tz;
  END IF;

  -- Pattern: N */N * * * (specific minute, every N hours)
  IF cron_min ~ '^\d+$' AND cron_hour LIKE '*/%' THEN
    min_val  := cron_min::INT;
    hour_val := (regexp_replace(cron_hour, '\*/', ''))::INT;
    IF hour_val > 0 THEN
      candidate_hour := (EXTRACT(HOUR FROM now_local)::INT / hour_val + 1) * hour_val;
      IF candidate_hour >= 24 THEN
        candidate := date_trunc('day', now_local) + interval '1 day' + (min_val || ' minutes')::INTERVAL;
      ELSE
        candidate := date_trunc('day', now_local) + (candidate_hour || ' hours')::INTERVAL + (min_val || ' minutes')::INTERVAL;
      END IF;
      IF candidate <= now_local THEN
        candidate := candidate + (hour_val || ' hours')::INTERVAL;
      END IF;
      RETURN candidate AT TIME ZONE tz;
    END IF;
  END IF;

  -- Fallback: next hour
  RETURN now() + interval '1 hour';
END;
$fn$ LANGUAGE plpgsql SET search_path TO 'public';

-- RPC wrapper so automation-runner can call it after each execution
CREATE OR REPLACE FUNCTION calculate_next_run_for_automation(aid UUID)
RETURNS VOID AS $fn$
BEGIN
  UPDATE automations
  SET next_run_at = calculate_next_run(cron_expression, COALESCE(timezone, 'America/Vancouver'))
  WHERE id = aid AND enabled = true;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recalculate next_run_at for all enabled automations right now
UPDATE automations
SET next_run_at = calculate_next_run(cron_expression, COALESCE(timezone, 'America/Vancouver'))
WHERE enabled = true;
