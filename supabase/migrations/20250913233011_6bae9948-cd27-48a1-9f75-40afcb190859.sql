-- Create daily_menus table (cheaper daily options)
CREATE TABLE public.daily_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  price_huf INTEGER,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create daily_menu_items table (relationship between daily menus and menu items)
CREATE TABLE public.daily_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_menu_id UUID REFERENCES public.daily_menus(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE
);

-- Add portion tracking to daily offers and menus
ALTER TABLE public.daily_offers ADD COLUMN max_portions INTEGER DEFAULT 50;
ALTER TABLE public.daily_offers ADD COLUMN remaining_portions INTEGER DEFAULT 50;

ALTER TABLE public.daily_menus ADD COLUMN max_portions INTEGER DEFAULT 30;
ALTER TABLE public.daily_menus ADD COLUMN remaining_portions INTEGER DEFAULT 30;

-- Enable RLS on new tables
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_menus
CREATE POLICY "Daily menus are publicly readable" 
ON public.daily_menus 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert daily menus" 
ON public.daily_menus 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update daily menus" 
ON public.daily_menus 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete daily menus" 
ON public.daily_menus 
FOR DELETE 
USING (is_admin(auth.uid()));

-- RLS policies for daily_menu_items
CREATE POLICY "Daily menu items are publicly readable" 
ON public.daily_menu_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert daily menu items" 
ON public.daily_menu_items 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update daily menu items" 
ON public.daily_menu_items 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete daily menu items" 
ON public.daily_menu_items 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Storage policies for menu images
CREATE POLICY "Menu images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Admin can upload menu images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'menu-images' AND is_admin(auth.uid()));

CREATE POLICY "Admin can update menu images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'menu-images' AND is_admin(auth.uid()));

CREATE POLICY "Admin can delete menu images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'menu-images' AND is_admin(auth.uid()));

-- Create trigger for updating timestamps
CREATE TRIGGER update_daily_menus_updated_at
BEFORE UPDATE ON public.daily_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();