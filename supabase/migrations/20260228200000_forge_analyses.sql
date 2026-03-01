-- Forge Analyses table
-- Stores AI analysis results from the Forge feature
-- Input: YouTube transcripts, API docs, MCP specs, URLs
-- Output: Buildable skills, tools, OpsCenter apps

CREATE TABLE IF NOT EXISTS forge_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('transcript', 'url', 'api_docs', 'mcp_spec', 'text')),
  input_source TEXT,
  input_text TEXT NOT NULL,
  analysis JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'complete', 'failed', 'assigned')),
  tasks_created UUID[] DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE forge_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analyses"
  ON forge_analyses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on forge_analyses"
  ON forge_analyses FOR ALL
  USING (auth.role() = 'service_role');

-- Index for listing
CREATE INDEX idx_forge_analyses_user_created
  ON forge_analyses (user_id, created_at DESC);
