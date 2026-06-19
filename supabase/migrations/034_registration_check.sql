-- Migration 034: Registration check RPC + fix trigger to raise exception instead of creating blocked users

-- Anon-accessible RPC to check if registration is open (used by frontend before signUp)
CREATE OR REPLACE FUNCTION public.is_registration_open()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT value = 'true' FROM public.app_settings WHERE key = 'registration_enabled'),
    true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_registration_open() TO anon;

-- Update handle_new_user: raise exception when registration is closed so the entire
-- auth.users insert transaction is rolled back — no orphaned blocked accounts created.
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
    -- Registration closed: raise exception to roll back the auth.users insert entirely
    RAISE EXCEPTION 'Registration is currently closed.';

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
