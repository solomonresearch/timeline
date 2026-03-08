-- Delete all point events (type = 'point') across all users
-- WARNING: This is irreversible. Review the count before running the DELETE.

-- Preview: count how many will be deleted
SELECT COUNT(*) AS point_events_to_delete FROM events WHERE type = 'point';

-- Delete all point events
DELETE FROM events WHERE type = 'point';
