-- Add case folder URL to incidents for linking to external document folders

ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS case_folder_url text;
