-- Table Definition: users
-- Exported from Supabase on: 2025-06-28T15:17:35.515Z

CREATE TABLE public.users (
  id uuid NOT NULL,
  name character varying(100) NOT NULL,
  email character varying(100) NOT NULL,
  role character varying(20) NOT NULL DEFAULT 'staff'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  profilephoto text,
  profilephoto_path text
);