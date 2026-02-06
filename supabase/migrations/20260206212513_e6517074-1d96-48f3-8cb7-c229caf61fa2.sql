-- Allow public (anonymous) users to read legal page content from settings
CREATE POLICY "Public can read legal settings"
ON public.settings
FOR SELECT
USING (key LIKE 'legal_%');