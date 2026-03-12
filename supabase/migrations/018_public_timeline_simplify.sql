-- Simplify public access model: timeline visibility is the single control.
-- A public timeline exposes ALL its lanes and events regardless of per-lane/per-event
-- visibility settings. The profile-level is_public flag no longer gates individual
-- timeline access (it can still be used for profile discovery later).

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
  -- Look up by username only — timeline.visibility controls access,
  -- not the profile-level is_public flag.
  SELECT id INTO v_user_id
  FROM profiles
  WHERE username = p_username;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Safe profile fields only
  SELECT jsonb_build_object(
    'username',     username,
    'display_name', display_name,
    'bio',          bio
  ) INTO v_profile
  FROM profiles WHERE id = v_user_id;

  -- All timelines the user has marked public
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
  WHERE t.user_id = v_user_id
    AND t.visibility = 'public';

  -- ALL lanes belonging to public timelines (no per-lane filter — full timeline is public)
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
    AND t.visibility = 'public';

  -- ALL events belonging to public timelines (no per-event filter — full timeline is public)
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
    AND t.visibility = 'public';

  RETURN jsonb_build_object(
    'profile',   v_profile,
    'timelines', v_timelines,
    'lanes',     v_lanes,
    'events',    v_events
  );
END;
$$;
