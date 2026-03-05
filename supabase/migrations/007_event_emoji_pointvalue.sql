-- Add emoji and point_value columns to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS emoji       text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS point_value real    DEFAULT NULL;
