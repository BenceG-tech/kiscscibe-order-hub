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