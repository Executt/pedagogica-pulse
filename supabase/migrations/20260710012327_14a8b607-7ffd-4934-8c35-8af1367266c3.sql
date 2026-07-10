
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS time_range_start timestamptz,
  ADD COLUMN IF NOT EXISTS time_range_end timestamptz,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS sync_error text;

CREATE INDEX IF NOT EXISTS materials_synced_at_idx ON public.materials(synced_at);
CREATE INDEX IF NOT EXISTS materials_time_range_idx ON public.materials(time_range_start, time_range_end);
