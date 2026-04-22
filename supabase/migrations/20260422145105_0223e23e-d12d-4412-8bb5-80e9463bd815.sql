CREATE TABLE IF NOT EXISTS public.admin_email_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'admin',
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_email text,
  actor_name text,
  action text NOT NULL,
  module text NOT NULL,
  entity_table text NOT NULL,
  entity_id text,
  entity_label text,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  page_route text,
  context_label text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_by uuid,
  created_by_email text,
  created_by_name text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view allowlist" ON public.admin_email_allowlist;
CREATE POLICY "Admins can view allowlist"
ON public.admin_email_allowlist
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage allowlist" ON public.admin_email_allowlist;
CREATE POLICY "Service role can manage allowlist"
ON public.admin_email_allowlist
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Audit inserts from authenticated admins" ON public.admin_audit_log;
CREATE POLICY "Audit inserts from authenticated admins"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can view notes" ON public.admin_notes;
CREATE POLICY "Admins can view notes"
ON public.admin_notes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can create notes" ON public.admin_notes;
CREATE POLICY "Admins can create notes"
ON public.admin_notes
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update notes" ON public.admin_notes;
CREATE POLICY "Admins can update notes"
ON public.admin_notes
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_module ON public.admin_audit_log (module);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON public.admin_audit_log (actor_email);
CREATE INDEX IF NOT EXISTS idx_admin_notes_status ON public.admin_notes (status);
CREATE INDEX IF NOT EXISTS idx_admin_notes_created_at ON public.admin_notes (created_at DESC);

CREATE OR REPLACE FUNCTION public.is_owner(check_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(COALESCE(check_user_id, auth.uid()), 'owner')
$$;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(COALESCE(check_user_id, auth.uid()), 'admin')
      OR public.has_role(COALESCE(check_user_id, auth.uid()), 'owner')
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(COALESCE(_user_id, auth.uid()), 'admin')
      OR public.has_role(COALESCE(_user_id, auth.uid()), 'owner')
      OR public.has_role(COALESCE(_user_id, auth.uid()), 'staff')
$$;

CREATE OR REPLACE FUNCTION public.claim_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_email text;
  allowed_role public.app_role;
BEGIN
  SELECT lower(email) INTO current_email
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF current_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO allowed_role
  FROM public.admin_email_allowlist
  WHERE lower(email) = current_email
    AND is_active = true
  LIMIT 1;

  IF allowed_role IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), allowed_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF allowed_role = 'owner' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text FROM public.user_roles 
  WHERE user_id = COALESCE(check_user_id, auth.uid())
  ORDER BY CASE role::text WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'staff' THEN 3 ELSE 4 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_admin_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IN ('done', 'rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.resolved_at = now();
    NEW.resolved_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_admin_notes_updated_at ON public.admin_notes;
CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_notes_updated_at();

CREATE OR REPLACE FUNCTION public.audit_changed_fields(before_row jsonb, after_row jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(key ORDER BY key), '{}')
  FROM (
    SELECT COALESCE(b.key, a.key) AS key
    FROM jsonb_each(before_row) b
    FULL OUTER JOIN jsonb_each(after_row) a USING (key)
    WHERE b.value IS DISTINCT FROM a.value
  ) diff
$$;

CREATE OR REPLACE FUNCTION public.audit_entity_label(row_data jsonb, table_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE(
    row_data ->> 'name',
    row_data ->> 'title',
    row_data ->> 'partner_name',
    row_data ->> 'invoice_number',
    row_data ->> 'code',
    row_data ->> 'date',
    row_data ->> 'key',
    table_name || ' rekord'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_module_for_table(table_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN table_name IN ('documents', 'document_folders', 'document_tags', 'document_activity') THEN 'documents'
    WHEN table_name IN ('menu_items', 'menu_categories', 'menu_item_sides', 'item_modifiers', 'item_modifier_options') THEN 'menu'
    WHEN table_name IN ('daily_offers', 'daily_offer_items', 'daily_offer_menus', 'daily_menus', 'daily_menu_items', 'daily_offer_templates') THEN 'daily_offer'
    WHEN table_name IN ('invoices', 'invoice_items', 'recurring_invoices') THEN 'invoices'
    WHEN table_name IN ('partners') THEN 'partners'
    WHEN table_name IN ('settings', 'gallery_images', 'coupons', 'capacity_slots', 'capacity_templates', 'blackout_dates', 'daily_waste_log') THEN 'content'
    ELSE 'admin'
  END
$$;

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  before_json jsonb;
  after_json jsonb;
  row_json jsonb;
  actor_profile record;
BEGIN
  before_json := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END;
  after_json := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  row_json := COALESCE(after_json, before_json);

  SELECT email, full_name INTO actor_profile
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.admin_audit_log (
    actor_user_id, actor_email, actor_name, action, module, entity_table,
    entity_id, entity_label, before_data, after_data, changed_fields
  ) VALUES (
    auth.uid(), actor_profile.email, actor_profile.full_name, lower(TG_OP), public.audit_module_for_table(TG_TABLE_NAME), TG_TABLE_NAME,
    row_json ->> 'id', public.audit_entity_label(row_json, TG_TABLE_NAME), before_json, after_json,
    CASE WHEN TG_OP = 'UPDATE' THEN public.audit_changed_fields(before_json, after_json) ELSE '{}' END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'documents','document_folders','document_tags','menu_items','menu_categories','menu_item_sides',
    'daily_offers','daily_offer_items','daily_offer_menus','daily_menus','daily_menu_items','daily_offer_templates',
    'invoices','invoice_items','recurring_invoices','partners','settings','gallery_images','coupons',
    'capacity_slots','capacity_templates','blackout_dates','daily_waste_log'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger()', table_name, table_name);
  END LOOP;
END $$;

INSERT INTO public.admin_email_allowlist (email, role, label, is_active)
VALUES
  ('gataibence@gmail.com', 'owner', 'Főadmin / tulaj', true),
  ('info@kiscsibeetterem.hu', 'admin', 'Tulaj', true),
  ('iroda@kiscsibeetterem.hu', 'admin', 'Asszisztens', true)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active,
  updated_at = now();