-- Fix anon RLS regression from 2026-07-13 security migration
-- Root cause: many {public}-scoped policies reference is_admin*/is_staff/is_owner/has_role in their qual/with_check.
-- The 07-13 fix revoked EXECUTE on these SECURITY DEFINER functions from anon.
-- Postgres evaluates all applicable policies for a query; the function call fails at planning time with 42501
-- for anon, breaking anon reads even when a permissive OR-branch would otherwise allow them.

-- =========================================================================
-- Part 1: Minta B — split policies that mix a public-read predicate with an admin bypass
-- =========================================================================

-- menu_items: keep existing "Anyone can view active menu items" (qual is_active=true, function-free).
-- Move admin-view policy to authenticated only.
ALTER POLICY "Admins can view all menu items" ON public.menu_items TO authenticated;

-- gallery_images: keep existing "Gallery images are publicly readable" (qual is_active=true).
ALTER POLICY "Admins can view all gallery images" ON public.gallery_images TO authenticated;

-- daily_offers: split
DROP POLICY IF EXISTS "Public can view published daily offers" ON public.daily_offers;
CREATE POLICY "Anon can view published daily offers"
  ON public.daily_offers FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY "Authenticated can view daily offers"
  ON public.daily_offers FOR SELECT TO authenticated
  USING (is_published = true OR public.is_admin_or_staff(auth.uid()));

-- daily_offer_items: split
DROP POLICY IF EXISTS "Public can view items of published daily offers" ON public.daily_offer_items;
CREATE POLICY "Anon can view items of published daily offers"
  ON public.daily_offer_items FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.daily_offers o
    WHERE o.id = daily_offer_items.daily_offer_id AND o.is_published = true
  ));
CREATE POLICY "Authenticated can view daily offer items"
  ON public.daily_offer_items FOR SELECT TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.daily_offers o
      WHERE o.id = daily_offer_items.daily_offer_id AND o.is_published = true
    )
  );

-- daily_offer_menus: split
DROP POLICY IF EXISTS "Public can view menus of published daily offers" ON public.daily_offer_menus;
CREATE POLICY "Anon can view menus of published daily offers"
  ON public.daily_offer_menus FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.daily_offers o
    WHERE o.id = daily_offer_menus.daily_offer_id AND o.is_published = true
  ));
CREATE POLICY "Authenticated can view daily offer menus"
  ON public.daily_offer_menus FOR SELECT TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.daily_offers o
      WHERE o.id = daily_offer_menus.daily_offer_id AND o.is_published = true
    )
  );

-- =========================================================================
-- Part 2: Minta A — scope every remaining {public} policy that references
-- admin-check functions down to {authenticated}. Preserves qual/with_check unchanged.
-- The Minta B rewrites above are already done, so this loop skips them by name.
-- =========================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles::text = '{public}'
      AND (
        COALESCE(qual, '')       ~ 'is_admin|is_admin_or_staff|is_staff|is_owner|has_role'
        OR COALESCE(with_check,'') ~ 'is_admin|is_admin_or_staff|is_staff|is_owner|has_role'
      )
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =========================================================================
-- Part 3: Verification barrier — fail the migration if any {public} policy
-- still references the restricted functions. This guarantees the sweep was complete.
-- =========================================================================
DO $$
DECLARE leftover int;
BEGIN
  SELECT count(*) INTO leftover
  FROM pg_policies
  WHERE schemaname = 'public'
    AND roles::text = '{public}'
    AND (
      COALESCE(qual, '')       ~ 'is_admin|is_admin_or_staff|is_staff|is_owner|has_role'
      OR COALESCE(with_check,'') ~ 'is_admin|is_admin_or_staff|is_staff|is_owner|has_role'
    );
  IF leftover > 0 THEN
    RAISE EXCEPTION 'RLS sweep incomplete: % public-scoped policies still reference admin functions', leftover;
  END IF;
END $$;