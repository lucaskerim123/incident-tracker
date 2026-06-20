-- Add conviction_status column and migrate old status values

ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS conviction_status text;

UPDATE public.charges SET status = 'active' WHERE status IN ('pending', 'adjourned');
UPDATE public.charges SET status = 'closed'  WHERE status = 'finalised';
