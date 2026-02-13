CREATE POLICY "Public can read about page settings"
ON public.settings
FOR SELECT
USING (key = 'about_page');