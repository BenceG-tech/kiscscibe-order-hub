-- Add is_temporary field to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN is_temporary boolean NOT NULL DEFAULT false;

-- Add new menu categories for drinks, desserts, and other items
INSERT INTO public.menu_categories (name, sort) VALUES 
('Italok', 100),
('Desszertek', 110),
('Köretek', 120),
('Egyéb', 130);

-- Create index for better performance on temporary items
CREATE INDEX idx_menu_items_is_temporary ON public.menu_items(is_temporary);

-- Update RLS policy to include temporary items for admins
DROP POLICY IF EXISTS "Active menu items are publicly readable" ON public.menu_items;

CREATE POLICY "Active menu items are publicly readable" 
ON public.menu_items 
FOR SELECT 
USING (is_active = true AND is_temporary = false);

CREATE POLICY "Admin can view all menu items including temporary" 
ON public.menu_items 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admin can insert menu items" 
ON public.menu_items 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update menu items" 
ON public.menu_items 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admin can delete menu items" 
ON public.menu_items 
FOR DELETE 
USING (public.is_admin());