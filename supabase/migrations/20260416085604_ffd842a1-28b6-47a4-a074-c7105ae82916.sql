-- Allow public read access to FAQ settings
CREATE POLICY "Public can read FAQ settings"
ON public.settings
FOR SELECT
TO public
USING (key = 'faq_items');