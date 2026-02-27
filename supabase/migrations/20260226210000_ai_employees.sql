-- =============================================================
-- AI Employees System
-- The HR layer for ClawBuddy's AI Staffing Agency
-- Any agent platform (OpenClaw, Claude Code, etc.) can create
-- and manage employees through the same API.
-- =============================================================

-- 1. Create the ai_employees table
CREATE TABLE public.ai_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core identity
  name TEXT NOT NULL,
  role TEXT NOT NULL,                    -- e.g. "Senior Sales Rep, Voice Division"
  emoji TEXT DEFAULT '🤖',
  description TEXT,

  -- Platform & department
  platform TEXT NOT NULL DEFAULT 'claude_code',  -- 'openclaw', 'claude_code', 'codex', 'custom'
  platform_label TEXT,                            -- Display name: "OpenAI (OpenClaw + Codex)", "Anthropic (Claude Code)"
  department TEXT NOT NULL DEFAULT 'general',     -- 'sales', 'research', 'operations', 'content', 'support', 'general'

  -- Employment status
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('active', 'idle', 'on_assignment', 'training', 'terminated', 'coming_soon')),
  current_task TEXT,                     -- What they're doing right now
  current_task_started_at TIMESTAMPTZ,

  -- OpsCenter integration — each employee gets their own dashboard
  ops_app_id UUID REFERENCES public.ops_apps(id) ON DELETE SET NULL,

  -- Skills & capabilities (references skill names from skills table)
  skill_names TEXT[] DEFAULT '{}',

  -- Configuration (platform-specific settings, model info, etc.)
  config JSONB DEFAULT '{}',
  -- Example config:
  -- {
  --   "model": "gpt-5.3-codex",
  --   "voice_provider": "deepgram",
  --   "phone_provider": "twilio",
  --   "email_provider": "resend",
  --   "system_prompt": "You are Lex, a professional AI sales agent..."
  -- }

  -- Performance metrics (rolling aggregates)
  metrics JSONB DEFAULT '{}'::jsonb,
  -- Example metrics:
  -- {
  --   "calls_made": 786,
  --   "emails_sent": 10500,
  --   "conversations": 234,
  --   "conversions": 47,
  --   "revenue_generated": 4653,
  --   "avg_call_duration": 187,
  --   "conversion_rate": 0.06,
  --   "total_cost": 130
  -- }

  -- Timestamps
  hired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_ai_employees_user_id ON public.ai_employees(user_id);
CREATE INDEX idx_ai_employees_status ON public.ai_employees(status);
CREATE INDEX idx_ai_employees_department ON public.ai_employees(department);
CREATE INDEX idx_ai_employees_platform ON public.ai_employees(platform);
CREATE INDEX idx_ai_employees_ops_app_id ON public.ai_employees(ops_app_id);

-- 3. Row Level Security
ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;

-- Users can view their own employees
CREATE POLICY "Users can view own employees"
  ON public.ai_employees FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create employees
CREATE POLICY "Users can create employees"
  ON public.ai_employees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own employees
CREATE POLICY "Users can update own employees"
  ON public.ai_employees FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own employees
CREATE POLICY "Users can delete own employees"
  ON public.ai_employees FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for edge functions)
CREATE POLICY "Service role full access to employees"
  ON public.ai_employees FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Work log table — tracks individual work items completed by employees
CREATE TABLE public.ai_employee_work_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  work_type TEXT NOT NULL DEFAULT 'task',  -- 'call', 'email', 'research', 'task', 'report'
  title TEXT NOT NULL,
  description TEXT,

  -- Work-specific data
  data JSONB DEFAULT '{}',
  -- Example for a call:
  -- { "lead_name": "Ahmed", "duration": 247, "outcome": "interested", "country": "India" }
  -- Example for an email:
  -- { "recipient": "ahmed@example.com", "subject": "...", "opened": true, "clicked": false }

  outcome TEXT,          -- 'success', 'failed', 'pending', 'no_answer', 'interested', 'declined'
  duration_seconds INT,  -- How long the work took

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_log_employee ON public.ai_employee_work_log(employee_id);
CREATE INDEX idx_work_log_user ON public.ai_employee_work_log(user_id);
CREATE INDEX idx_work_log_type ON public.ai_employee_work_log(work_type);
CREATE INDEX idx_work_log_created ON public.ai_employee_work_log(created_at DESC);

ALTER TABLE public.ai_employee_work_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work logs"
  ON public.ai_employee_work_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create work logs"
  ON public.ai_employee_work_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to work logs"
  ON public.ai_employee_work_log FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Enable realtime on ai_employees for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_employees;

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ai_employees_updated_at
  BEFORE UPDATE ON public.ai_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_employees_updated_at();
