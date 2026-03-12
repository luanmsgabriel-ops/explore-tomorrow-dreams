
-- Table: school_progress (dedicated persistence for Téo School)
CREATE TABLE public.school_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  client_name text,
  language text DEFAULT 'en',
  level text DEFAULT 'beginner',
  current_module int DEFAULT 1,
  current_lesson int DEFAULT 1,
  total_score int DEFAULT 0,
  streak_days int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_study_date date,
  lessons_completed int DEFAULT 0,
  modules_completed int DEFAULT 0,
  badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.school_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to school_progress"
  ON public.school_progress FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- Table: school_badges (standardized reusable badge images)
CREATE TABLE public.school_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text UNIQUE NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.school_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to school_badges"
  ON public.school_badges FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);
