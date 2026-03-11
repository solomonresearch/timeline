-- Add emoji column to lanes
ALTER TABLE public.lanes ADD COLUMN IF NOT EXISTS emoji text;

-- Standardize lane names, set emojis, and merge Kids+Parents → Family
DO $$
DECLARE
  tl RECORD;
  family_lane_id uuid;
  kids_lane_id uuid;
  parents_lane_id uuid;
  next_order integer;
BEGIN
  FOR tl IN SELECT id FROM timelines LOOP

    -- 1. Simple renames (skip if target name already exists in this timeline)
    UPDATE lanes SET name = 'Locations', emoji = '📍'
      WHERE timeline_id = tl.id AND name = 'Location';

    UPDATE lanes SET name = 'Education', emoji = '🎓'
      WHERE timeline_id = tl.id AND name = 'University'
        AND NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Education');

    UPDATE lanes SET name = 'Activities', emoji = '🎯'
      WHERE timeline_id = tl.id AND name = 'Other Activities'
        AND NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Activities');

    UPDATE lanes SET name = 'Items', emoji = '📦'
      WHERE timeline_id = tl.id AND name = 'Type of House'
        AND NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Items');

    UPDATE lanes SET name = 'Relationships', emoji = '❤️‍🔥'
      WHERE timeline_id = tl.id AND name = 'Relations'
        AND NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Relationships');

    UPDATE lanes SET name = 'Vehicles', emoji = '🚗'
      WHERE timeline_id = tl.id AND name = 'Cars'
        AND NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Vehicles');

    -- 2. Set emojis for lanes that already have the correct name
    UPDATE lanes SET emoji = '💼' WHERE timeline_id = tl.id AND name = 'Work'          AND emoji IS NULL;
    UPDATE lanes SET emoji = '💰' WHERE timeline_id = tl.id AND name = 'Assets'        AND emoji IS NULL;
    UPDATE lanes SET emoji = '📍' WHERE timeline_id = tl.id AND name = 'Locations'     AND emoji IS NULL;
    UPDATE lanes SET emoji = '🎓' WHERE timeline_id = tl.id AND name = 'Education'     AND emoji IS NULL;
    UPDATE lanes SET emoji = '🎯' WHERE timeline_id = tl.id AND name = 'Activities'    AND emoji IS NULL;
    UPDATE lanes SET emoji = '📦' WHERE timeline_id = tl.id AND name = 'Items'         AND emoji IS NULL;
    UPDATE lanes SET emoji = '❤️‍🔥' WHERE timeline_id = tl.id AND name = 'Relationships' AND emoji IS NULL;
    UPDATE lanes SET emoji = '🚗' WHERE timeline_id = tl.id AND name = 'Vehicles'      AND emoji IS NULL;
    UPDATE lanes SET emoji = '✈️' WHERE timeline_id = tl.id AND name = 'Travel'        AND emoji IS NULL;
    UPDATE lanes SET emoji = '❤️' WHERE timeline_id = tl.id AND name = 'Health'        AND emoji IS NULL;
    UPDATE lanes SET emoji = '🏆' WHERE timeline_id = tl.id AND name = 'Achievements'  AND emoji IS NULL;
    UPDATE lanes SET emoji = '👨‍👩‍👧' WHERE timeline_id = tl.id AND name = 'Family'       AND emoji IS NULL;

    -- 3. Merge Kids + Parents → Family
    family_lane_id  := NULL;
    kids_lane_id    := NULL;
    parents_lane_id := NULL;

    SELECT id INTO family_lane_id  FROM lanes WHERE timeline_id = tl.id AND name = 'Family'  LIMIT 1;
    SELECT id INTO kids_lane_id    FROM lanes WHERE timeline_id = tl.id AND name = 'Kids'    LIMIT 1;
    SELECT id INTO parents_lane_id FROM lanes WHERE timeline_id = tl.id AND name = 'Parents' LIMIT 1;

    -- If no Family lane yet, promote Kids (or Parents) into one
    IF family_lane_id IS NULL THEN
      IF kids_lane_id IS NOT NULL THEN
        UPDATE lanes SET name = 'Family', emoji = '👨‍👩‍👧' WHERE id = kids_lane_id;
        family_lane_id := kids_lane_id;
        kids_lane_id := NULL;
      ELSIF parents_lane_id IS NOT NULL THEN
        UPDATE lanes SET name = 'Family', emoji = '👨‍👩‍👧' WHERE id = parents_lane_id;
        family_lane_id := parents_lane_id;
        parents_lane_id := NULL;
      END IF;
    END IF;

    -- Move events from Kids → Family, then delete Kids lane
    IF kids_lane_id IS NOT NULL AND family_lane_id IS NOT NULL THEN
      UPDATE events SET lane_id = family_lane_id WHERE lane_id = kids_lane_id;
      DELETE FROM lanes WHERE id = kids_lane_id;
    END IF;

    -- Move events from Parents → Family, then delete Parents lane
    IF parents_lane_id IS NOT NULL AND family_lane_id IS NOT NULL THEN
      UPDATE events SET lane_id = family_lane_id WHERE lane_id = parents_lane_id;
      DELETE FROM lanes WHERE id = parents_lane_id;
    END IF;

    -- 4. Add missing standard lanes at the end
    SELECT COALESCE(MAX("order"), -1) + 1 INTO next_order FROM lanes WHERE timeline_id = tl.id;

    IF NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Travel') THEN
      INSERT INTO lanes (timeline_id, name, color, visible, is_default, "order", emoji)
        VALUES (tl.id, 'Travel', '#0ea5e9', true, true, next_order, '✈️');
      next_order := next_order + 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Health') THEN
      INSERT INTO lanes (timeline_id, name, color, visible, is_default, "order", emoji)
        VALUES (tl.id, 'Health', '#ef4444', true, true, next_order, '❤️');
      next_order := next_order + 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM lanes WHERE timeline_id = tl.id AND name = 'Achievements') THEN
      INSERT INTO lanes (timeline_id, name, color, visible, is_default, "order", emoji)
        VALUES (tl.id, 'Achievements', '#eab308', true, true, next_order, '🏆');
    END IF;

  END LOOP;
END $$;

-- Update create_default_timeline RPC to use standardized lanes with emojis
CREATE OR REPLACE FUNCTION public.create_default_timeline(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_timeline_id uuid;
BEGIN
  INSERT INTO timelines (user_id, name)
    VALUES (p_user_id, 'My Life')
    RETURNING id INTO v_timeline_id;

  INSERT INTO lanes (timeline_id, name, color, visible, is_default, "order", emoji) VALUES
    (v_timeline_id, 'Locations',     '#3b82f6', true, true,  0, '📍'),
    (v_timeline_id, 'Work',          '#10b981', true, true,  1, '💼'),
    (v_timeline_id, 'Travel',        '#0ea5e9', true, true,  2, '✈️'),
    (v_timeline_id, 'Health',        '#ef4444', true, true,  3, '❤️'),
    (v_timeline_id, 'Family',        '#f97316', true, true,  4, '👨‍👩‍👧'),
    (v_timeline_id, 'Relationships', '#ec4899', true, true,  5, '❤️‍🔥'),
    (v_timeline_id, 'Education',     '#8b5cf6', true, true,  6, '🎓'),
    (v_timeline_id, 'Activities',    '#f59e0b', true, true,  7, '🎯'),
    (v_timeline_id, 'Assets',        '#14b8a6', true, true,  8, '💰'),
    (v_timeline_id, 'Vehicles',      '#64748b', true, true,  9, '🚗'),
    (v_timeline_id, 'Items',         '#6366f1', true, true, 10, '📦'),
    (v_timeline_id, 'Achievements',  '#eab308', true, true, 11, '🏆');

  RETURN v_timeline_id;
END;
$$;
