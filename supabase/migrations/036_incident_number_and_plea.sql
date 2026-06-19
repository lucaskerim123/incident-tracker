-- Add sequential incident number and plea field to incidents

CREATE SEQUENCE IF NOT EXISTS public.incidents_number_seq START 1;

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS incident_number integer DEFAULT nextval('public.incidents_number_seq'),
  ADD COLUMN IF NOT EXISTS plea text;

CREATE UNIQUE INDEX IF NOT EXISTS incidents_number_unique ON public.incidents (incident_number);
