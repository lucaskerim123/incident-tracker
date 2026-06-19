-- Migration 033: App-wide settings table for admin control panel

CREATE TABLE public.app_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write all settings
CREATE POLICY "admins_all" ON public.app_settings
  FOR ALL USING (get_my_role() = 'admin');

-- Any authenticated user can read the help keys (displayed on Settings page)
CREATE POLICY "authed_read_help" ON public.app_settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND key IN ('help_message', 'help_email')
  );

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('registration_enabled',       'true'),
  ('auto_approve_registrations', 'false'),
  ('feature_incidents',          'true'),
  ('feature_people',             'true'),
  ('feature_cases',              'true'),
  ('feature_documents',          'true'),
  ('help_message',               ''),
  ('help_email',                 '');

-- Update handle_new_user trigger to respect registration settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code         bigint;
  v_reg_enabled  text;
  v_auto_approve text;
BEGIN
  v_code := nextval('user_code_seq');

  SELECT value INTO v_reg_enabled   FROM public.app_settings WHERE key = 'registration_enabled';
  SELECT value INTO v_auto_approve  FROM public.app_settings WHERE key = 'auto_approve_registrations';

  IF NOT EXISTS (SELECT 1 FROM public.users) THEN
    -- First user ever: always admin + active regardless of settings
    INSERT INTO public.users (id, user_code, role, status, display_name, email)
    VALUES (new.id, v_code, 'admin', 'active',
            new.raw_user_meta_data->>'display_name',
            nullif(trim(new.email), ''))
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_reg_enabled = 'false' THEN
    -- Registration closed: block the new account immediately
    INSERT INTO public.users (id, user_code, role, status, display_name, email)
    VALUES (new.id, v_code, 'viewer', 'blocked',
            new.raw_user_meta_data->>'display_name',
            nullif(trim(new.email), ''))
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_auto_approve = 'true' THEN
    -- Auto-approve: skip pending queue, go straight to active
    INSERT INTO public.users (id, user_code, role, status, display_name, email)
    VALUES (new.id, v_code, 'viewer', 'active',
            new.raw_user_meta_data->>'display_name',
            nullif(trim(new.email), ''))
    ON CONFLICT (id) DO NOTHING;

  ELSE
    -- Default: requires admin approval
    INSERT INTO public.users (id, user_code, role, status, display_name, email)
    VALUES (new.id, v_code, 'viewer', 'pending',
            new.raw_user_meta_data->>'display_name',
            nullif(trim(new.email), ''))
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
