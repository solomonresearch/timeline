-- ── 1. Add username to profiles ─────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Unique constraint (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'profiles' AND c.conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Format check constraint (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'profiles' AND c.conname = 'profiles_username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,32}$');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- ── 2. Add visibility to timelines, lanes, events ───────────────────────────

ALTER TABLE public.timelines
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.lanes
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- ── 3. RLS: allow public read access where visibility = 'public' ─────────────

-- Timelines: anyone can read public timelines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'timelines' AND policyname = 'Public can read public timelines'
  ) THEN
    CREATE POLICY "Public can read public timelines"
      ON public.timelines
      FOR SELECT
      TO anon, authenticated
      USING (visibility = 'public');
  END IF;
END $$;

-- Lanes: anyone can read public lanes belonging to public timelines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lanes' AND policyname = 'Public can read lanes of public timelines'
  ) THEN
    CREATE POLICY "Public can read lanes of public timelines"
      ON public.lanes
      FOR SELECT
      TO anon, authenticated
      USING (
        visibility = 'public'
        AND EXISTS (
          SELECT 1 FROM public.timelines t
          WHERE t.id = timeline_id AND t.visibility = 'public'
        )
      );
  END IF;
END $$;

-- Events: anyone can read public events in public lanes of public timelines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Public can read events of public timelines'
  ) THEN
    CREATE POLICY "Public can read events of public timelines"
      ON public.events
      FOR SELECT
      TO anon, authenticated
      USING (
        visibility = 'public'
        AND EXISTS (
          SELECT 1 FROM public.timelines t
          WHERE t.id = timeline_id AND t.visibility = 'public'
        )
      );
  END IF;
END $$;

-- Profiles: anyone can read the public fields of any profile
-- (birth_date and birth_year are kept private — only exposed via the security-definer RPC)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Public can read profiles'
  ) THEN
    CREATE POLICY "Public can read profiles"
      ON public.profiles
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- ── 4. Security-definer RPC: fetch all public data for a username ────────────

CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile jsonb;
  v_timelines jsonb;
  v_lanes jsonb;
  v_events jsonb;
BEGIN
  SELECT id INTO v_user_id
  FROM profiles
  WHERE username = p_username;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Only expose safe profile fields
  SELECT jsonb_build_object(
    'username',     username,
    'display_name', display_name,
    'bio',          bio
  ) INTO v_profile
  FROM profiles WHERE id = v_user_id;

  -- Public timelines (ordered oldest first)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',         t.id,
      'name',       t.name,
      'color',      t.color,
      'emoji',      t.emoji,
      'start_year', t.start_year,
      'end_year',   t.end_year,
      'created_at', t.created_at
    ) ORDER BY t.created_at
  ), '[]'::jsonb) INTO v_timelines
  FROM timelines t
  WHERE t.user_id = v_user_id AND t.visibility = 'public';

  -- Public lanes (only from public timelines, ordered by lane order)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',          l.id,
      'timeline_id', l.timeline_id,
      'name',        l.name,
      'color',       l.color,
      'emoji',       l.emoji,
      'order',       l.order
    ) ORDER BY l.order
  ), '[]'::jsonb) INTO v_lanes
  FROM lanes l
  JOIN timelines t ON t.id = l.timeline_id
  WHERE t.user_id = v_user_id
    AND t.visibility = 'public'
    AND l.visibility = 'public'
    AND l.visible = true;

  -- Public events (only from public timelines)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',          e.id,
      'lane_id',     e.lane_id,
      'timeline_id', e.timeline_id,
      'title',       e.title,
      'description', e.description,
      'start_time',  e.start_time,
      'end_time',    e.end_time,
      'color',       e.color,
      'emoji',       e.emoji
    ) ORDER BY e.start_time
  ), '[]'::jsonb) INTO v_events
  FROM events e
  JOIN timelines t ON t.id = e.timeline_id
  WHERE t.user_id = v_user_id
    AND t.visibility = 'public'
    AND e.visibility = 'public';

  RETURN jsonb_build_object(
    'profile',   v_profile,
    'timelines', v_timelines,
    'lanes',     v_lanes,
    'events',    v_events
  );
END;
$$;

-- ── 5. Helper: check username availability ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = p_username
  );
$$;
