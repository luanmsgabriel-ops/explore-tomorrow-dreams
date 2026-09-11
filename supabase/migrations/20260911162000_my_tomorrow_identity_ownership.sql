-- My Tomorrow Phase 1 — identity, ownership and authenticated isolation.
-- Additive migration: preserves all existing guest Trip Composer sessions.

ALTER TABLE public.trip_sessions
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS claimed_access_token_hash text;

CREATE INDEX IF NOT EXISTS idx_trip_sessions_owner_activity
  ON public.trip_sessions (owner_user_id, last_activity_at DESC)
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_sessions_claimed_access_token_hash
  ON public.trip_sessions (claimed_access_token_hash)
  WHERE claimed_access_token_hash IS NOT NULL;

-- Authenticated owners can manage only their own planning sessions.
DROP POLICY IF EXISTS "Users can view own trip sessions" ON public.trip_sessions;
CREATE POLICY "Users can view own trip sessions"
ON public.trip_sessions
FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own trip sessions" ON public.trip_sessions;
CREATE POLICY "Users can create own trip sessions"
ON public.trip_sessions
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own trip sessions" ON public.trip_sessions;
CREATE POLICY "Users can update own trip sessions"
ON public.trip_sessions
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own trip sessions" ON public.trip_sessions;
CREATE POLICY "Users can delete own trip sessions"
ON public.trip_sessions
FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid());

-- Traveler profile remains optional. Authorization is by auth user, never by email/WhatsApp.
DROP POLICY IF EXISTS "Users can view own traveler profile" ON public.traveler_profiles;
CREATE POLICY "Users can view own traveler profile"
ON public.traveler_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own traveler profile" ON public.traveler_profiles;
CREATE POLICY "Users can create own traveler profile"
ON public.traveler_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own traveler profile" ON public.traveler_profiles;
CREATE POLICY "Users can update own traveler profile"
ON public.traveler_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own traveler profile" ON public.traveler_profiles;
CREATE POLICY "Users can delete own traveler profile"
ON public.traveler_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Child entities authorize through the owned trip session chain.
DROP POLICY IF EXISTS "Users can view own trip preferences" ON public.trip_preferences;
CREATE POLICY "Users can view own trip preferences"
ON public.trip_preferences
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_preferences.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can create own trip preferences" ON public.trip_preferences;
CREATE POLICY "Users can create own trip preferences"
ON public.trip_preferences
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_preferences.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update own trip preferences" ON public.trip_preferences;
CREATE POLICY "Users can update own trip preferences"
ON public.trip_preferences
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_preferences.trip_session_id
    AND s.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_preferences.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can delete own trip preferences" ON public.trip_preferences;
CREATE POLICY "Users can delete own trip preferences"
ON public.trip_preferences
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_preferences.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can view own trip days" ON public.trip_days;
CREATE POLICY "Users can view own trip days"
ON public.trip_days
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_days.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can create own trip days" ON public.trip_days;
CREATE POLICY "Users can create own trip days"
ON public.trip_days
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_days.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update own trip days" ON public.trip_days;
CREATE POLICY "Users can update own trip days"
ON public.trip_days
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_days.trip_session_id
    AND s.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_days.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can delete own trip days" ON public.trip_days;
CREATE POLICY "Users can delete own trip days"
ON public.trip_days
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trip_sessions s
  WHERE s.id = trip_days.trip_session_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can view own trip day items" ON public.trip_day_items;
CREATE POLICY "Users can view own trip day items"
ON public.trip_day_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.trip_days d
  JOIN public.trip_sessions s ON s.id = d.trip_session_id
  WHERE d.id = trip_day_items.trip_day_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can create own trip day items" ON public.trip_day_items;
CREATE POLICY "Users can create own trip day items"
ON public.trip_day_items
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.trip_days d
  JOIN public.trip_sessions s ON s.id = d.trip_session_id
  WHERE d.id = trip_day_items.trip_day_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update own trip day items" ON public.trip_day_items;
CREATE POLICY "Users can update own trip day items"
ON public.trip_day_items
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.trip_days d
  JOIN public.trip_sessions s ON s.id = d.trip_session_id
  WHERE d.id = trip_day_items.trip_day_id
    AND s.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.trip_days d
  JOIN public.trip_sessions s ON s.id = d.trip_session_id
  WHERE d.id = trip_day_items.trip_day_id
    AND s.owner_user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can delete own trip day items" ON public.trip_day_items;
CREATE POLICY "Users can delete own trip day items"
ON public.trip_day_items
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.trip_days d
  JOIN public.trip_sessions s ON s.id = d.trip_session_id
  WHERE d.id = trip_day_items.trip_day_id
    AND s.owner_user_id = auth.uid()
));

-- Atomic guest-session claim. The active token hash is invalidated on first claim.
-- claimed_access_token_hash exists only to make a same-owner retry idempotent;
-- it is never accepted by the guest session endpoint.
CREATE OR REPLACE FUNCTION public.claim_trip_session(p_access_token_hash text)
RETURNS TABLE(session_id uuid, claim_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.trip_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;

  IF p_access_token_hash IS NULL OR length(p_access_token_hash) <> 64 THEN
    RAISE EXCEPTION 'invalid_access_token' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_session
  FROM public.trip_sessions
  WHERE access_token_hash = p_access_token_hash
     OR (claimed_access_token_hash = p_access_token_hash AND owner_user_id = v_user_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.owner_user_id IS NOT NULL AND v_session.owner_user_id <> v_user_id THEN
    RAISE EXCEPTION 'session_already_owned' USING ERRCODE = '23505';
  END IF;

  IF v_session.owner_user_id = v_user_id AND v_session.access_token_hash IS NULL THEN
    RETURN QUERY SELECT v_session.id, 'already_claimed'::text;
    RETURN;
  END IF;

  UPDATE public.trip_sessions
  SET owner_user_id = v_user_id,
      claimed_access_token_hash = p_access_token_hash,
      access_token_hash = NULL,
      last_activity_at = now(),
      updated_at = now()
  WHERE id = v_session.id;

  RETURN QUERY SELECT v_session.id, 'claimed'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trip_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_trip_session(text) TO authenticated;
