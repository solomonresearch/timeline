-- Add value tracking columns to events
-- value_points: array of {year, value} historical data points
-- value_projection: {growthPercent, deposits: [{id, label, amount, frequency, startYear, endYear}]}
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS value_points    jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS value_projection jsonb DEFAULT NULL;
