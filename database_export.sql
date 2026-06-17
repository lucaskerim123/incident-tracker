-- ============================================================
-- INCIDENT TRACKER — DATABASE EXPORT
-- Project: vtltttgmgjjxvaatuyxa
-- Exported: 2026-06-17
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── SEQUENCES ──────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS user_code_seq START 1000;

-- ─── ENUMS ──────────────────────────────────────────────────
CREATE TYPE incident_category AS ENUM (
  'legal', 'mental_health', 'police', 'court', 'avo', 'other'
);

CREATE TYPE incident_status AS ENUM (
  'documented', 'pending', 'resolved'
);

CREATE TYPE user_role AS ENUM (
  'admin', 'lawyer', 'support', 'readonly', 'editor', 'viewer'
);

-- ─── TABLES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date        NOT NULL,
  title            text        NOT NULL,
  category         incident_category NOT NULL DEFAULT 'other',
  description      text        NOT NULL DEFAULT '',
  people_involved  text[]      NOT NULL DEFAULT '{}',
  outcome          text,
  reference_number text,
  status           incident_status NOT NULL DEFAULT 'documented',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS people (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name    text NOT NULL,
  role    text,
  dob     date,
  notes   text
);

CREATE TABLE IF NOT EXISTS cases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number    text,
  charge         text NOT NULL,
  status         text NOT NULL DEFAULT 'active',
  court_date     date,
  court_location text,
  notes          text
);

CREATE TABLE IF NOT EXISTS documents (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  file_path           text,
  google_doc_id       text,
  category            text        NOT NULL DEFAULT 'other',
  related_incident_id uuid        REFERENCES incidents(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by uuid        REFERENCES auth.users(id),
  role       user_role   NOT NULL DEFAULT 'viewer',
  email      text,
  user_code  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS invitations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text,
  role       user_role   NOT NULL DEFAULT 'readonly',
  token      text        NOT NULL UNIQUE DEFAULT (gen_random_uuid())::text,
  invited_by uuid        REFERENCES auth.users(id),
  accepted   boolean     NOT NULL DEFAULT false,
  user_code  text        NOT NULL DEFAULT nextval('user_code_seq')::text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ON incidents (user_id, date DESC);
CREATE INDEX IF NOT EXISTS ON incidents (user_id, category);
CREATE INDEX IF NOT EXISTS ON people    (user_id);
CREATE INDEX IF NOT EXISTS ON cases     (user_id, status);
CREATE INDEX IF NOT EXISTS ON documents (user_id);
CREATE INDEX IF NOT EXISTS ON user_roles (user_id);

-- ─── FUNCTIONS ──────────────────────────────────────────────

-- Bypasses RLS to safely return the current user's role (prevents recursion)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Trigger: auto-assign admin role to the first user who registers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role, email, user_code)
    VALUES (NEW.id, 'admin', NEW.email, nextval('user_code_seq')::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE incidents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE people      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- INCIDENTS
CREATE POLICY "owner_all"     ON incidents FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "shared_read"   ON incidents FOR SELECT USING (get_my_role() IS NOT NULL);
CREATE POLICY "shared_insert" ON incidents FOR INSERT WITH CHECK (get_my_role() IN ('lawyer','support'));
CREATE POLICY "shared_update" ON incidents FOR UPDATE USING (get_my_role() = 'lawyer');

-- PEOPLE
CREATE POLICY "owner_all"     ON people FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "shared_read"   ON people FOR SELECT USING (get_my_role() IS NOT NULL);
CREATE POLICY "shared_manage" ON people FOR ALL    USING (get_my_role() IN ('admin','lawyer'));

-- CASES
CREATE POLICY "owner_all"     ON cases FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "shared_read"   ON cases FOR SELECT USING (get_my_role() IS NOT NULL);
CREATE POLICY "shared_manage" ON cases FOR ALL    USING (get_my_role() IN ('admin','lawyer'));

-- DOCUMENTS
CREATE POLICY "owner_all"    ON documents FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "shared_read"  ON documents FOR SELECT USING (get_my_role() IS NOT NULL);
CREATE POLICY "shared_upload" ON documents FOR INSERT WITH CHECK (get_my_role() IN ('admin','lawyer','support'));

-- USER_ROLES
CREATE POLICY "read_own"  ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_all" ON user_roles FOR ALL    USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- INVITATIONS
CREATE POLICY "admin_all" ON invitations FOR ALL USING (get_my_role() = 'admin' OR invited_by = auth.uid());

-- ─── STORAGE BUCKET ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', false)
  ON CONFLICT DO NOTHING;

CREATE POLICY "auth_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "owner_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "owner_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ─── DATA ───────────────────────────────────────────────────
-- incidents  : 0 rows
-- people     : 0 rows
-- cases      : 0 rows
-- documents  : 0 rows
-- invitations: 0 rows

-- user_roles (1 row — admin user)
INSERT INTO user_roles (id, user_id, invited_by, role, email, user_code, created_at)
VALUES (
  'cad68e41-026c-419c-8c83-248f08e4dd27',
  '731e5795-a1c0-451c-aec1-e0f002b033e4',
  NULL,
  'admin',
  '1000@it.local',
  '1000',
  '2026-06-17T09:27:43.988578+00:00'
) ON CONFLICT (user_id) DO NOTHING;
