
CREATE TABLE public.travel_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code text NOT NULL UNIQUE,
  creator_phone text NOT NULL,
  creator_name text,
  group_name text,
  status text NOT NULL DEFAULT 'collecting',
  travel_dates text,
  budget_range text,
  final_recommendation jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.travel_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.travel_groups(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  member_name text,
  preferences jsonb DEFAULT '{}',
  is_ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, phone_number)
);

ALTER TABLE public.travel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage travel_groups" ON public.travel_groups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage travel_group_members" ON public.travel_group_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert travel_groups" ON public.travel_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can select travel_groups" ON public.travel_groups FOR SELECT USING (true);
CREATE POLICY "Service can update travel_groups" ON public.travel_groups FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Service can insert travel_group_members" ON public.travel_group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can select travel_group_members" ON public.travel_group_members FOR SELECT USING (true);
CREATE POLICY "Service can update travel_group_members" ON public.travel_group_members FOR UPDATE USING (true) WITH CHECK (true);
