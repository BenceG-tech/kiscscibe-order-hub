-- Add requires_side_selection field to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN requires_side_selection boolean NOT NULL DEFAULT false;