-- 1. Remove per-lane and per-event visibility (null them out, make column nullable)
ALTER TABLE public.events ALTER COLUMN visibility DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN visibility SET DEFAULT NULL;
UPDATE public.events SET visibility = NULL;

ALTER TABLE public.lanes ALTER COLUMN visibility DROP NOT NULL;
ALTER TABLE public.lanes ALTER COLUMN visibility SET DEFAULT NULL;
UPDATE public.lanes SET visibility = NULL;

-- 2. Timelines default to private; reset all existing to private
ALTER TABLE public.timelines ALTER COLUMN visibility SET DEFAULT 'private';
UPDATE public.timelines SET visibility = 'private';

-- 3. timeline_shares table
CREATE TABLE IF NOT EXISTS public.timeline_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL REFERENCES public.timelines(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(timeline_id, shared_with_id)
);
ALTER TABLE public.timeline_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages shares"
  ON public.timeline_shares FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "shared user sees own share"
  ON public.timeline_shares FOR SELECT TO authenticated
  USING (shared_with_id = auth.uid());

-- 4. RLS: shared users can read timelines/lanes/events shared with them
CREATE POLICY "shared users can read shared timelines"
  ON public.timelines FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.timeline_shares ts
    WHERE ts.timeline_id = id AND ts.shared_with_id = auth.uid()
  ));

CREATE POLICY "shared users can read lanes"
  ON public.lanes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.timeline_shares ts
    WHERE ts.timeline_id = timeline_id AND ts.shared_with_id = auth.uid()
  ));

CREATE POLICY "shared users can read events"
  ON public.events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.timeline_shares ts
    WHERE ts.timeline_id = timeline_id AND ts.shared_with_id = auth.uid()
  ));

-- 5. RPC: get timelines shared with me
CREATE OR REPLACE FUNCTION public.get_shared_with_me()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid; v_result jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'share_id',  ts.id,
    'timeline',  jsonb_build_object(
      'id', t.id, 'name', t.name, 'color', t.color, 'emoji', t.emoji,
      'start_year', t.start_year, 'end_year', t.end_year, 'created_at', t.created_at
    ),
    'owner', jsonb_build_object(
      'username', p.username, 'display_name', p.display_name
    )
  ) ORDER BY t.created_at), '[]'::jsonb) INTO v_result
  FROM timeline_shares ts
  JOIN timelines t ON t.id = ts.timeline_id
  JOIN profiles p ON p.id = ts.owner_id
  WHERE ts.shared_with_id = v_uid;
  RETURN v_result;
END; $$;

-- 6. RPC: get timeline data (lanes + events) — accessible if public OR shared with caller
CREATE OR REPLACE FUNCTION public.get_timeline_data(p_timeline_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid; v_tl timelines%ROWTYPE; v_lanes jsonb; v_events jsonb;
BEGIN
  v_uid := auth.uid();
  SELECT * INTO v_tl FROM timelines WHERE id = p_timeline_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  -- Check access: public OR shared with caller
  IF v_tl.visibility <> 'public' THEN
    IF v_uid IS NULL THEN RETURN NULL; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM timeline_shares WHERE timeline_id = p_timeline_id AND shared_with_id = v_uid
    ) THEN RETURN NULL; END IF;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', l.id, 'timeline_id', l.timeline_id, 'name', l.name,
    'color', l.color, 'emoji', l.emoji, 'order', l.order
  ) ORDER BY l.order), '[]'::jsonb) INTO v_lanes FROM lanes l WHERE l.timeline_id = p_timeline_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', e.id, 'lane_id', e.lane_id, 'timeline_id', e.timeline_id,
    'title', e.title, 'description', e.description,
    'start_time', e.start_time, 'end_time', e.end_time,
    'color', e.color, 'emoji', e.emoji
  ) ORDER BY e.start_time), '[]'::jsonb) INTO v_events FROM events e WHERE e.timeline_id = p_timeline_id;
  RETURN jsonb_build_object('lanes', v_lanes, 'events', v_events);
END; $$;

-- 7. RPC: get shares for a specific timeline (owner only)
CREATE OR REPLACE FUNCTION public.get_timeline_shares(p_timeline_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid; v_result jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RETURN '[]'::jsonb; END IF;
  -- Verify caller owns the timeline
  IF NOT EXISTS (SELECT 1 FROM timelines WHERE id = p_timeline_id AND user_id = v_uid) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'share_id', ts.id,
    'user_id', ts.shared_with_id,
    'username', p.username,
    'display_name', p.display_name
  ) ORDER BY ts.created_at), '[]'::jsonb) INTO v_result
  FROM timeline_shares ts
  JOIN profiles p ON p.id = ts.shared_with_id
  WHERE ts.timeline_id = p_timeline_id;
  RETURN v_result;
END; $$;
