-- Add start_year, end_year, color, and emoji to timelines
ALTER TABLE public.timelines
  ADD COLUMN IF NOT EXISTS start_year real,
  ADD COLUMN IF NOT EXISTS end_year  real,
  ADD COLUMN IF NOT EXISTS color     text,
  ADD COLUMN IF NOT EXISTS emoji     text;
