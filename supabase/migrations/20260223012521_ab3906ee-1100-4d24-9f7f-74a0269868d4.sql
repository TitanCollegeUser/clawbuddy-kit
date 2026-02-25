
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
    'approval_queue', 'comparison', 'alert_banner', 'countdown'
  ) THEN
    RAISE EXCEPTION 'Invalid ops_blocks block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$function$;
