
-- Seed Sherlock's youtube-automation skill (5th remaining skill - others already seeded)
DO $$
DECLARE
  v_user_id uuid;
  v_skill_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  INSERT INTO public.skills (name, title, description, protocol_type, api_base_url, auth_type, auth_header, auth_format, agent_type, agent_name, status, bujji_status, reviewed_at, created_by, use_cases, additional_notes)
  VALUES ('youtube-automation', 'YouTube 30-Day Automation Pipeline', 'End-to-end YouTube channel automation for the 30-day challenge. Research, ideate, script, produce, publish.', 'custom', '', 'bearer', 'Authorization', 'Bearer {KEY}', 'claude-code', 'Sherlock', 'ready', 'accepted', now(), v_user_id, ARRAY['Daily competitive research and outlier detection', 'Generate daily intelligence digests', 'Iterate on video ideas in Banger Lab', 'Produce video scripts via Subscribr', 'Track 30-day challenge metrics'], 'Day 1 started Feb 22, 2026. Banger Idea #13. Combines subscribr-api, intelligence-sync, and clawbuddy-core skills.')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_skill_id FROM public.skills WHERE name = 'youtube-automation';
  IF v_skill_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.skill_operations WHERE skill_id = v_skill_id LIMIT 1) THEN
    INSERT INTO public.skill_operations (skill_id, name, title, description, http_method, endpoint_path, request_body_schema, position) VALUES
      (v_skill_id, 'morning_research', 'Morning Research Cycle', 'Daily 6 AM routine: scan competitors, detect outliers, generate digest', 'POST', '/', '{"action":"morning_research","date":"string"}', 0),
      (v_skill_id, 'idea_analysis', 'Analyze Idea Feedback', 'Process Mani feedback on Banger Lab idea with data-driven analysis', 'POST', '/', '{"action":"idea_analysis","idea_id":"uuid","feedback":"string"}', 1),
      (v_skill_id, 'script_production', 'Script Production', 'Take approved banger idea and produce full video script', 'POST', '/', '{"action":"script_production","idea_id":"uuid","target_length":"number"}', 2),
      (v_skill_id, 'daily_metrics', 'Track Daily Metrics', 'Capture daily channel metrics for 30-day challenge tracking', 'POST', '/', '{"action":"daily_metrics","day_number":"number","metrics":"object"}', 3);
  END IF;
END $$;
