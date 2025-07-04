-- Table Definition: sale_items
-- Exported from Supabase on: 2025-06-28T15:17:35.515Z

CREATE TABLE public.sale_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sale_id uuid,
  item_id uuid,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);