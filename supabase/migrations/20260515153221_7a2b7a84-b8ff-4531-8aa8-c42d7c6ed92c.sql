-- Restrict order_ratings INSERT to service_role only (submit-rating edge function uses service role)
DROP POLICY IF EXISTS "Admin or staff can insert ratings" ON public.order_ratings;
DROP POLICY IF EXISTS "is_admin_or_staff can insert ratings" ON public.order_ratings;
DROP POLICY IF EXISTS "Authenticated admin/staff can insert ratings" ON public.order_ratings;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename='order_ratings' AND schemaname='public' AND cmd='INSERT' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_ratings', pol.policyname);
  END LOOP;
END $$;

-- No INSERT policy: only service_role (bypasses RLS) via the submit-rating edge function can insert.