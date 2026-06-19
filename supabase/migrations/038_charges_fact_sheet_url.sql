-- Add fact sheet URL to charges for linking to external documents

ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS fact_sheet_url text;
