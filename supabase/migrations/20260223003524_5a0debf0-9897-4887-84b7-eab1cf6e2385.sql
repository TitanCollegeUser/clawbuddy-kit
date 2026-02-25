
-- Table: ops_center_apps
CREATE TABLE public.ops_center_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'monitor',
  category TEXT DEFAULT 'intelligence',
  status TEXT DEFAULT 'active',
  agent_name TEXT,
  agent_type TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  workspace_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ops_center_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own apps" ON public.ops_center_apps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own apps" ON public.ops_center_apps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own apps" ON public.ops_center_apps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own apps" ON public.ops_center_apps FOR DELETE USING (auth.uid() = user_id);

-- Table: ops_center_items
CREATE TABLE public.ops_center_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.ops_center_apps(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'raw',
  data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  parent_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ops_center_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items" ON public.ops_center_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own items" ON public.ops_center_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.ops_center_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.ops_center_items FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ops_center_apps_user_id ON public.ops_center_apps(user_id);
CREATE INDEX idx_ops_center_items_app_id ON public.ops_center_items(app_id);
CREATE INDEX idx_ops_center_items_user_id ON public.ops_center_items(user_id);
CREATE INDEX idx_ops_center_items_type_status ON public.ops_center_items(item_type, status);
