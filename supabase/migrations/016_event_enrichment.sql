-- Add enrichment fields to events table
-- url: link to source article, post, Strava activity, Outlook event, etc.
-- location: place name or address (Outlook, Strava, Instagram)
-- rating: 1-5 star rating (movies, trips, restaurants)
-- metadata: JSONB for image_url, tags[], external_id, source_data (bulk import)
-- source: already existed as column, ensure present

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS metadata jsonb;
