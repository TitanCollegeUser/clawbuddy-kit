
-- Drop old V1 tables
DROP TABLE IF EXISTS ops_center_items CASCADE;
DROP TABLE IF EXISTS ops_center_apps CASCADE;

-- ============================================
-- ops_apps: App registry
-- ============================================
CREATE TABLE public.ops_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'monitor',
  status TEXT DEFAULT 'active',
  agent_name TEXT,
  agent_type TEXT,
  theme JSONB DEFAULT '{"accent": "#ef4444", "style": "default"}',
  config JSONB DEFAULT '{}',
  page_order TEXT[] DEFAULT '{}',
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ops_pages: Tabs within an app
-- ============================================
CREATE TABLE public.ops_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.ops_apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'file',
  sort_order INTEGER DEFAULT 0,
  layout TEXT DEFAULT 'stack',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, name)
);

-- ============================================
-- ops_blocks: UI components on a page
-- ============================================
CREATE TABLE public.ops_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.ops_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ops_data: Universal data store
-- ============================================
CREATE TABLE public.ops_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.ops_apps(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.ops_blocks(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  column_id TEXT,
  sort_order INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Validation triggers (instead of CHECK constraints)
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_ops_app_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'setup', 'archived') THEN
    RAISE EXCEPTION 'Invalid ops_apps status: %. Must be active, setup, or archived', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_ops_app_status_trigger
BEFORE INSERT OR UPDATE ON public.ops_apps
FOR EACH ROW EXECUTE FUNCTION public.validate_ops_app_status();

CREATE OR REPLACE FUNCTION public.validate_ops_page_layout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.layout NOT IN ('stack', 'grid', 'sidebar') THEN
    RAISE EXCEPTION 'Invalid ops_pages layout: %. Must be stack, grid, or sidebar', NEW.layout;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_ops_page_layout_trigger
BEFORE INSERT OR UPDATE ON public.ops_pages
FOR EACH ROW EXECUTE FUNCTION public.validate_ops_page_layout();

CREATE OR REPLACE FUNCTION public.validate_ops_block_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.block_type NOT IN ('kanban', 'table', 'list', 'metric_cards', 'progress_bar', 'chart', 'text', 'office', 'feed', 'form', 'embed') THEN
    RAISE EXCEPTION 'Invalid ops_blocks block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_ops_block_type_trigger
BEFORE INSERT OR UPDATE ON public.ops_blocks
FOR EACH ROW EXECUTE FUNCTION public.validate_ops_block_type();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.ops_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_data ENABLE ROW LEVEL SECURITY;

-- ops_apps: user owns their apps
CREATE POLICY "Users can view their own ops apps" ON public.ops_apps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ops apps" ON public.ops_apps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ops apps" ON public.ops_apps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ops apps" ON public.ops_apps FOR DELETE USING (auth.uid() = user_id);

-- Security definer function to check app ownership (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.owns_ops_app(_app_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ops_apps WHERE id = _app_id AND user_id = auth.uid()
  )
$$;

-- Security definer to check page ownership via app
CREATE OR REPLACE FUNCTION public.owns_ops_page(_page_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ops_pages p
    JOIN public.ops_apps a ON a.id = p.app_id
    WHERE p.id = _page_id AND a.user_id = auth.uid()
  )
$$;

-- ops_pages: via app ownership
CREATE POLICY "Users can view their ops pages" ON public.ops_pages FOR SELECT USING (owns_ops_app(app_id));
CREATE POLICY "Users can create their ops pages" ON public.ops_pages FOR INSERT WITH CHECK (owns_ops_app(app_id));
CREATE POLICY "Users can update their ops pages" ON public.ops_pages FOR UPDATE USING (owns_ops_app(app_id));
CREATE POLICY "Users can delete their ops pages" ON public.ops_pages FOR DELETE USING (owns_ops_app(app_id));

-- ops_blocks: via page -> app ownership
CREATE POLICY "Users can view their ops blocks" ON public.ops_blocks FOR SELECT USING (owns_ops_page(page_id));
CREATE POLICY "Users can create their ops blocks" ON public.ops_blocks FOR INSERT WITH CHECK (owns_ops_page(page_id));
CREATE POLICY "Users can update their ops blocks" ON public.ops_blocks FOR UPDATE USING (owns_ops_page(page_id));
CREATE POLICY "Users can delete their ops blocks" ON public.ops_blocks FOR DELETE USING (owns_ops_page(page_id));

-- ops_data: user owns their data
CREATE POLICY "Users can view their own ops data" ON public.ops_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ops data" ON public.ops_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ops data" ON public.ops_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ops data" ON public.ops_data FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_ops_apps_user_id ON public.ops_apps(user_id);
CREATE INDEX idx_ops_pages_app_id ON public.ops_pages(app_id);
CREATE INDEX idx_ops_blocks_page_id ON public.ops_blocks(page_id);
CREATE INDEX idx_ops_data_app_id ON public.ops_data(app_id);
CREATE INDEX idx_ops_data_block_id ON public.ops_data(block_id);
CREATE INDEX idx_ops_data_user_id ON public.ops_data(user_id);
CREATE INDEX idx_ops_data_app_type_status ON public.ops_data(app_id, item_type, status);

-- ============================================
-- Realtime on ops_data
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ops_data;

-- ============================================
-- Updated_at triggers
-- ============================================
CREATE TRIGGER update_ops_apps_updated_at BEFORE UPDATE ON public.ops_apps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ops_pages_updated_at BEFORE UPDATE ON public.ops_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ops_blocks_updated_at BEFORE UPDATE ON public.ops_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ops_data_updated_at BEFORE UPDATE ON public.ops_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
