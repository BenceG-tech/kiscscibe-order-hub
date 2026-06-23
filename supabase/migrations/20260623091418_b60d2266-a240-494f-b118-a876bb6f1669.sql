-- 1. Add column with default true so existing rows are auto-published (no UPDATE = no trigger)
ALTER TABLE public.daily_offers
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- 2. Switch default to false for future inserts (new offers start as draft)
ALTER TABLE public.daily_offers
  ALTER COLUMN is_published SET DEFAULT false;

-- 3. RLS: public sees only published; admin/staff sees all
DROP POLICY IF EXISTS "Daily offers are viewable by everyone" ON public.daily_offers;
DROP POLICY IF EXISTS "Anyone can view daily offers" ON public.daily_offers;
DROP POLICY IF EXISTS "Public can view daily offers" ON public.daily_offers;
DROP POLICY IF EXISTS "Public can view published daily offers" ON public.daily_offers;

CREATE POLICY "Public can view published daily offers"
  ON public.daily_offers
  FOR SELECT
  USING (is_published = true OR public.is_admin_or_staff(auth.uid()));

-- 4. daily_offer_items gating
DROP POLICY IF EXISTS "Daily offer items are viewable by everyone" ON public.daily_offer_items;
DROP POLICY IF EXISTS "Anyone can view daily offer items" ON public.daily_offer_items;
DROP POLICY IF EXISTS "Public can view daily offer items" ON public.daily_offer_items;
DROP POLICY IF EXISTS "Public can view items of published daily offers" ON public.daily_offer_items;

CREATE POLICY "Public can view items of published daily offers"
  ON public.daily_offer_items
  FOR SELECT
  USING (
    public.is_admin_or_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.daily_offers o
      WHERE o.id = daily_offer_items.daily_offer_id
        AND o.is_published = true
    )
  );

-- 5. daily_offer_menus gating
DROP POLICY IF EXISTS "Daily offer menus are viewable by everyone" ON public.daily_offer_menus;
DROP POLICY IF EXISTS "Anyone can view daily offer menus" ON public.daily_offer_menus;
DROP POLICY IF EXISTS "Public can view daily offer menus" ON public.daily_offer_menus;
DROP POLICY IF EXISTS "Public can view menus of published daily offers" ON public.daily_offer_menus;

CREATE POLICY "Public can view menus of published daily offers"
  ON public.daily_offer_menus
  FOR SELECT
  USING (
    public.is_admin_or_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.daily_offers o
      WHERE o.id = daily_offer_menus.daily_offer_id
        AND o.is_published = true
    )
  );