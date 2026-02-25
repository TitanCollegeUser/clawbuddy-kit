
CREATE OR REPLACE FUNCTION public.validate_ops_block_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.block_type NOT IN (
    'kanban', 'table', 'list', 'metric_cards', 'progress_bar',
    'chart', 'text', 'office', 'feed', 'form', 'embed',
    'timeline', 'calendar', 'gallery', 'agent_card',
    'approval_queue', 'comparison', 'alert_banner', 'countdown',
    'yt_dashboard', 'yt_competitors', 'yt_banger_lab',
    'yt_pipeline', 'yt_scripts', 'yt_intel_feed',
    'outreach_scoreboard', 'outreach_leads', 'outreach_phone',
    'outreach_email', 'outreach_campaigns', 'outreach_results'
  ) THEN
    RAISE EXCEPTION 'Invalid ops_blocks block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$function$;
