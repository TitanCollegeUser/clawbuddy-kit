-- Phase 5: Sherlock Brain — Self-Improving Autonomous Agent
-- Migration: agent_learning_log table + columns on automations + automation_executions

-- =============================================================
-- 1. New table: agent_learning_log
-- =============================================================
CREATE TABLE public.agent_learning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  agent_name TEXT NOT NULL DEFAULT 'Sherlock',
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'execution_analysis', 'tune_decision', 'task_discovery',
    'pattern_detected', 'anomaly_alert', 'self_assessment'
  )),
  source_automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  source_execution_ids UUID[] DEFAULT '{}',
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_taken BOOLEAN DEFAULT false,
  action_details TEXT,
  reviewed BOOLEAN DEFAULT false,
  review_outcome TEXT CHECK (review_outcome IN ('approved', 'rejected', 'modified')),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_learning_log_user ON public.agent_learning_log(user_id);
CREATE INDEX idx_learning_log_type ON public.agent_learning_log(entry_type);
CREATE INDEX idx_learning_log_created ON public.agent_learning_log(created_at DESC);
CREATE INDEX idx_learning_log_automation ON public.agent_learning_log(source_automation_id) WHERE source_automation_id IS NOT NULL;
CREATE INDEX idx_learning_log_unreviewed ON public.agent_learning_log(reviewed) WHERE reviewed = false;

-- RLS
ALTER TABLE public.agent_learning_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage learning log"
  ON public.agent_learning_log FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own learning log"
  ON public.agent_learning_log FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================
-- 2. Add columns to automations
-- =============================================================
ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS health_score NUMERIC(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_tuned_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tune_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_enabled BOOLEAN DEFAULT true;

-- =============================================================
-- 3. Add columns to automation_executions
-- =============================================================
ALTER TABLE public.automation_executions
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quality_signals JSONB DEFAULT NULL;

-- =============================================================
-- 4. Update trigger_source check to include 'autonomous'
-- =============================================================
-- Drop old constraint, add new one with 'autonomous'
ALTER TABLE public.automation_executions
  DROP CONSTRAINT IF EXISTS automation_executions_trigger_source_check;

ALTER TABLE public.automation_executions
  ADD CONSTRAINT automation_executions_trigger_source_check
  CHECK (trigger_source IN ('scheduled', 'manual', 'agent', 'webhook', 'autonomous'));
