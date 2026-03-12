-- Remove birth_year column from profiles; birth_date is now the single source of truth.
-- Float year is derived from birth_date in the frontend (birthDateToFloatYear).
ALTER TABLE profiles DROP COLUMN IF EXISTS birth_year;
