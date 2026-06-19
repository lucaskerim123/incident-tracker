-- 1. Create charges table
CREATE TABLE public.charges (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  charge_number      text,
  date_of_charge     date,
  breach_type        text,
  linked_incident_id uuid REFERENCES public.incidents(id) ON DELETE SET NULL,
  plea               text,
  outcome            text,
  status             text NOT NULL DEFAULT 'pending',
  notes              text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
CREATE INDEX ON public.charges (user_id, status);
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charges_view"   ON public.charges FOR SELECT USING (can_do('view'));
CREATE POLICY "charges_manage" ON public.charges FOR ALL    USING (can_do('manage_cases'));

-- 2. Create court_orders table
CREATE TABLE public.court_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_type     text NOT NULL,
  protecting_who text,
  protected_from text,
  status         text NOT NULL DEFAULT 'active',
  conditions     text,
  expiry_date    date,
  notes          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX ON public.court_orders (user_id, status);
ALTER TABLE public.court_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_view"   ON public.court_orders FOR SELECT USING (can_do('view'));
CREATE POLICY "orders_manage" ON public.court_orders FOR ALL    USING (can_do('manage_cases'));

-- 3. Link incidents to charges / orders
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS linked_charge_id uuid REFERENCES public.charges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_order_id  uuid REFERENCES public.court_orders(id) ON DELETE SET NULL;

-- 4. Link documents to charges / orders
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS related_charge_id uuid REFERENCES public.charges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_order_id  uuid REFERENCES public.court_orders(id) ON DELETE SET NULL;

-- 5. Updated_at triggers
CREATE TRIGGER set_charges_updated_at
  BEFORE UPDATE ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_court_orders_updated_at
  BEFORE UPDATE ON public.court_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
