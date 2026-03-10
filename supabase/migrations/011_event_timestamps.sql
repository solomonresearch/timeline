-- Migrate events from fractional-year floats to proper timestamptz columns.
-- start_year / end_year (real) → start_time / end_time (timestamptz)
-- The `type` column is retired; 'point' vs 'range' is derived from end_time IS NULL.

-- Step 1: Add new nullable timestamp columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time   timestamptz;

-- Step 2: Backfill by converting fractional years to timestamps.
-- Formula: Jan 1 of floor(frac_year) + fractional_part * seconds_in_that_year
UPDATE public.events
SET
  start_time = (
    make_date(
      GREATEST(1, floor(start_year)::int),
      1, 1
    )::timestamptz
    + (
        (start_year - floor(start_year))
        * EXTRACT(epoch FROM (
            make_date(GREATEST(1, floor(start_year)::int) + 1, 1, 1)::timestamptz
            - make_date(GREATEST(1, floor(start_year)::int), 1, 1)::timestamptz
          ))
      ) * interval '1 second'
  ),
  end_time = CASE
    WHEN end_year IS NOT NULL THEN (
      make_date(
        GREATEST(1, floor(end_year)::int),
        1, 1
      )::timestamptz
      + (
          (end_year - floor(end_year))
          * EXTRACT(epoch FROM (
              make_date(GREATEST(1, floor(end_year)::int) + 1, 1, 1)::timestamptz
              - make_date(GREATEST(1, floor(end_year)::int), 1, 1)::timestamptz
            ))
        ) * interval '1 second'
    )
    ELSE NULL
  END
WHERE start_year IS NOT NULL;

-- Step 3: Enforce NOT NULL on start_time
ALTER TABLE public.events
  ALTER COLUMN start_time SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE public.events
  DROP COLUMN IF EXISTS start_year,
  DROP COLUMN IF EXISTS end_year,
  DROP COLUMN IF EXISTS type;

-- Step 5: Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS events_start_time_idx ON public.events (start_time);
CREATE INDEX IF NOT EXISTS events_end_time_idx   ON public.events (end_time);
CREATE INDEX IF NOT EXISTS events_timeline_start_idx ON public.events (timeline_id, start_time);
