-- Trigger: set_updated_at on table doctors
-- Exported from Supabase on: 2025-06-28T15:17:35.445Z

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();