-- Table Definition: gemini_api_logs
-- Exported from Supabase on: 2025-06-28T15:17:35.514Z

CREATE TABLE public.gemini_api_logs (
  id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  request_type text,
  status USER-DEFINED NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  response_data jsonb,
  file_info jsonb,
  error_message text
);