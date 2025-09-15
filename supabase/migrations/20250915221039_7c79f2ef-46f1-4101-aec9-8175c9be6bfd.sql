-- Create menu_item_sides table for mandatory side dish selection
CREATE TABLE public.menu_item_sides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  side_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  is_required boolean NOT NULL DEFAULT true,
  min_select integer NOT NULL DEFAULT 1,
  max_select integer NOT NULL DEFAULT 1,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_menu_item_sides_main_item_id ON public.menu_item_sides(main_item_id);
CREATE INDEX idx_menu_item_sides_side_item_id ON public.menu_item_sides(side_item_id);

-- Enable Row Level Security
ALTER TABLE public.menu_item_sides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Menu item sides are publicly readable"
ON public.menu_item_sides
FOR SELECT
USING (true);

CREATE POLICY "Admin can insert menu item sides"
ON public.menu_item_sides
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update menu item sides" 
ON public.menu_item_sides
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete menu item sides"
ON public.menu_item_sides
FOR DELETE
USING (is_admin(auth.uid()));

-- Add option_type column to order_item_options for better categorization
ALTER TABLE public.order_item_options ADD COLUMN option_type text DEFAULT 'modifier';
ALTER TABLE public.order_item_options ADD COLUMN side_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL;