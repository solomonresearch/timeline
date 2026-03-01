-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL,
  timeline_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  type text NOT NULL CHECK (type = ANY (ARRAY['range'::text, 'point'::text])),
  start_year real NOT NULL,
  end_year real,
  color text,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_lane_id_fkey FOREIGN KEY (lane_id) REFERENCES public.lanes(id),
  CONSTRAINT events_timeline_id_fkey FOREIGN KEY (timeline_id) REFERENCES public.timelines(id)
);
CREATE TABLE public.kanban_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'::text CHECK (status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text])),
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kanban_cards_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.lanes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timeline_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6'::text,
  visible boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  order integer NOT NULL DEFAULT 0,
  CONSTRAINT lanes_pkey PRIMARY KEY (id),
  CONSTRAINT lanes_timeline_id_fkey FOREIGN KEY (timeline_id) REFERENCES public.timelines(id)
);
CREATE TABLE public.persona_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL,
  lane_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  type text NOT NULL CHECK (type = ANY (ARRAY['range'::text, 'point'::text])),
  start_year real NOT NULL,
  end_year real,
  color text,
  CONSTRAINT persona_events_pkey PRIMARY KEY (id),
  CONSTRAINT persona_events_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id)
);
CREATE TABLE public.personas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text NOT NULL DEFAULT ''::text,
  birth_year integer NOT NULL,
  death_year integer,
  CONSTRAINT personas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text NOT NULL DEFAULT ''::text,
  bio text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  birth_date date,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.timelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Life'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT timelines_pkey PRIMARY KEY (id),
  CONSTRAINT timelines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);