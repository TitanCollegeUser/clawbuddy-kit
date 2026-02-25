
-- Intelligence Competitors
CREATE TABLE public.intelligence_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  channel_id text NOT NULL,
  subscribr_id integer,
  handle text,
  title text NOT NULL,
  subscriber_count integer DEFAULT 0,
  video_count integer DEFAULT 0,
  view_count bigint DEFAULT 0,
  thumbnail_url text,
  country text,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, channel_id)
);

ALTER TABLE public.intelligence_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own competitors" ON public.intelligence_competitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own competitors" ON public.intelligence_competitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own competitors" ON public.intelligence_competitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own competitors" ON public.intelligence_competitors FOR DELETE USING (auth.uid() = user_id);

-- Intelligence Videos
CREATE TABLE public.intelligence_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  video_id text NOT NULL,
  channel_id text,
  channel_title text,
  title text NOT NULL,
  published_at timestamptz,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  duration text,
  outlier_score decimal(3,1),
  thumbnail_url text,
  views_per_hour decimal(10,2),
  is_outlier boolean DEFAULT false,
  first_seen_at timestamptz DEFAULT now(),
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, video_id)
);

ALTER TABLE public.intelligence_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos" ON public.intelligence_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own videos" ON public.intelligence_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON public.intelligence_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" ON public.intelligence_videos FOR DELETE USING (auth.uid() = user_id);

-- Intelligence Ideas
CREATE TABLE public.intelligence_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  subscribr_idea_id integer,
  title text NOT NULL,
  topic text,
  angle text,
  suggested_length integer,
  thumbnail_concept text,
  source_type text DEFAULT 'manual',
  source_reference text,
  status text DEFAULT 'longlist',
  priority integer DEFAULT 0,
  notes text,
  sherlock_insights text,
  outlier_score decimal(3,1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.intelligence_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ideas" ON public.intelligence_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideas" ON public.intelligence_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideas" ON public.intelligence_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideas" ON public.intelligence_ideas FOR DELETE USING (auth.uid() = user_id);

-- Intelligence Scripts
CREATE TABLE public.intelligence_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  idea_id uuid REFERENCES public.intelligence_ideas(id),
  subscribr_script_id integer,
  title text NOT NULL,
  topic text,
  angle text,
  word_count integer,
  status text DEFAULT 'draft',
  production_status text,
  canvas_url text,
  has_outline boolean DEFAULT false,
  has_script boolean DEFAULT false,
  content_preview text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.intelligence_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scripts" ON public.intelligence_scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scripts" ON public.intelligence_scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scripts" ON public.intelligence_scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scripts" ON public.intelligence_scripts FOR DELETE USING (auth.uid() = user_id);

-- Intelligence Digests
CREATE TABLE public.intelligence_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  digest_date date NOT NULL,
  title text,
  summary_html text,
  competitor_highlights jsonb,
  top_performers jsonb,
  insights jsonb,
  metrics jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, digest_date)
);

ALTER TABLE public.intelligence_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own digests" ON public.intelligence_digests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own digests" ON public.intelligence_digests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own digests" ON public.intelligence_digests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own digests" ON public.intelligence_digests FOR DELETE USING (auth.uid() = user_id);

-- Intelligence Insights
CREATE TABLE public.intelligence_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  insight_type text DEFAULT 'observation',
  title text NOT NULL,
  content text NOT NULL,
  data jsonb,
  priority text DEFAULT 'medium',
  is_read boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.intelligence_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" ON public.intelligence_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insights" ON public.intelligence_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insights" ON public.intelligence_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insights" ON public.intelligence_insights FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_digests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_ideas;
