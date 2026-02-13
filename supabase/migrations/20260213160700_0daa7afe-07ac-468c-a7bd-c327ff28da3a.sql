-- Allow public read access for the 'announcement' key in settings
CREATE POLICY "Public can read announcement settings"
ON public.settings
FOR SELECT
USING (key = 'announcement');