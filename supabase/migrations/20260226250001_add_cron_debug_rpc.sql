-- Temporary RPC to check pg_cron job status and pg_net response queue
CREATE OR REPLACE FUNCTION public.list_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport int,
  database text,
  username text,
  active boolean,
  jobname text
) LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname
  FROM cron.job
  ORDER BY jobname;
$$;

CREATE OR REPLACE FUNCTION public.list_cron_job_run_details()
RETURNS TABLE (
  jobid bigint,
  runid bigint,
  job_pid int,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time
  FROM cron.job_run_details
  ORDER BY start_time DESC
  LIMIT 30;
$$;
