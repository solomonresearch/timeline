-- ============================================================
-- 015_standardize_persona_lane_names.sql
-- Rename persona_event lane_names to match the standard default
-- lane names used throughout the app.
-- ============================================================

UPDATE public.persona_events SET lane_name = 'Locations'     WHERE lane_name = 'Location';
UPDATE public.persona_events SET lane_name = 'Education'     WHERE lane_name = 'University';
UPDATE public.persona_events SET lane_name = 'Activities'    WHERE lane_name = 'Other Activities';
UPDATE public.persona_events SET lane_name = 'Relationships' WHERE lane_name = 'Relations';
UPDATE public.persona_events SET lane_name = 'Family'        WHERE lane_name = 'Kids';
UPDATE public.persona_events SET lane_name = 'Assets'        WHERE lane_name = 'Wealth';
UPDATE public.persona_events SET lane_name = 'Vehicles'      WHERE lane_name = 'Cars';
