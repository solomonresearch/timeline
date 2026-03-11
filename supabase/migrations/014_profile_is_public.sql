-- Add is_public column to profiles (default true = public)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Update get_public_profile RPC: return NULL if profile is private
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
  WHERE username = p_username
    AND is_public = true;

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
