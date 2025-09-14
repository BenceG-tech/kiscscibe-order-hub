-- Update RLS policies for menu_items to allow admin management
DROP POLICY IF EXISTS "Admin can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Active menu items are publicly readable" ON public.menu_items;

-- Create comprehensive RLS policies for menu_items
CREATE POLICY "Anyone can view active menu items" 
ON public.menu_items 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all menu items" 
ON public.menu_items 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert menu items" 
ON public.menu_items 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update menu items" 
ON public.menu_items 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete menu items" 
ON public.menu_items 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Storage policies for menu-images bucket
CREATE POLICY "Public can view menu images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Admins can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'menu-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update menu images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'menu-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'menu-images' AND is_admin(auth.uid()));