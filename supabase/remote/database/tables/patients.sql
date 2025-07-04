-- Table Definition: patients
-- Exported from Supabase on: 2025-06-28T15:17:35.515Z

CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying(100) NOT NULL,
  gender character varying(10),
  birth_date date,
  address text,
  phone character varying(20),
  email character varying(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text
);