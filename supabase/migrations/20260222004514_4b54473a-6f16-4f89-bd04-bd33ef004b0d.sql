
-- 1. Add site_type column to offices
ALTER TABLE public.offices ADD COLUMN site_type text NOT NULL DEFAULT 'office';

-- 2. Create arena_scoreboards table
CREATE TABLE public.arena_scoreboards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  primary_metric_name text NOT NULL DEFAULT 'Score',
  primary_metric_unit text NOT NULL DEFAULT 'pts',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(office_id)
);

ALTER TABLE public.arena_scoreboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their arena scoreboards" ON public.arena_scoreboards FOR SELECT USING (owns_office(office_id));
CREATE POLICY "Users can create arena scoreboards" ON public.arena_scoreboards FOR INSERT WITH CHECK (owns_office(office_id));
CREATE POLICY "Users can update their arena scoreboards" ON public.arena_scoreboards FOR UPDATE USING (owns_office(office_id));
CREATE POLICY "Users can delete their arena scoreboards" ON public.arena_scoreboards FOR DELETE USING (owns_office(office_id));

-- 3. Create arena_score_categories table
CREATE TABLE public.arena_score_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scoreboard_id uuid NOT NULL REFERENCES public.arena_scoreboards(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arena_score_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view arena score categories" ON public.arena_score_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.arena_scoreboards s WHERE s.id = scoreboard_id AND owns_office(s.office_id)));
CREATE POLICY "Users can create arena score categories" ON public.arena_score_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.arena_scoreboards s WHERE s.id = scoreboard_id AND owns_office(s.office_id)));
CREATE POLICY "Users can update arena score categories" ON public.arena_score_categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.arena_scoreboards s WHERE s.id = scoreboard_id AND owns_office(s.office_id)));
CREATE POLICY "Users can delete arena score categories" ON public.arena_score_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.arena_scoreboards s WHERE s.id = scoreboard_id AND owns_office(s.office_id)));

-- 4. Create arena_scores table
CREATE TABLE public.arena_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.arena_score_categories(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arena_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view arena scores" ON public.arena_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.arena_score_categories c
    JOIN public.arena_scoreboards s ON s.id = c.scoreboard_id
    WHERE c.id = category_id AND owns_office(s.office_id)
  ));
CREATE POLICY "Users can create arena scores" ON public.arena_scores FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.arena_score_categories c
    JOIN public.arena_scoreboards s ON s.id = c.scoreboard_id
    WHERE c.id = category_id AND owns_office(s.office_id)
  ));
CREATE POLICY "Users can delete arena scores" ON public.arena_scores FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.arena_score_categories c
    JOIN public.arena_scoreboards s ON s.id = c.scoreboard_id
    WHERE c.id = category_id AND owns_office(s.office_id)
  ));

-- 5. Enable realtime on arena_scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_scores;

-- 6. Indexes
CREATE INDEX idx_arena_scoreboards_office ON public.arena_scoreboards(office_id);
CREATE INDEX idx_arena_score_categories_scoreboard ON public.arena_score_categories(scoreboard_id);
CREATE INDEX idx_arena_scores_category ON public.arena_scores(category_id);
CREATE INDEX idx_offices_site_type ON public.offices(site_type);
