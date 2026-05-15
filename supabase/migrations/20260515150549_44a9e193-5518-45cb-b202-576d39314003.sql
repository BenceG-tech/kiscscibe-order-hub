
DROP POLICY IF EXISTS "Anyone can insert order ratings" ON public.order_ratings;

DROP POLICY IF EXISTS "Public can read legal settings" ON public.settings;
CREATE POLICY "Public can read legal settings"
ON public.settings
FOR SELECT
TO anon, authenticated
USING (key IN ('legal_impresszum', 'legal_privacy', 'legal_terms', 'legal_cookies'));
