-- Add menu-related columns to daily_offer_items
ALTER TABLE daily_offer_items 
ADD COLUMN is_menu_part boolean NOT NULL DEFAULT false,
ADD COLUMN menu_role text CHECK (menu_role IN ('leves', 'főétel'));

-- Create daily_offer_menus table for menu-specific information
CREATE TABLE daily_offer_menus (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_offer_id uuid NOT NULL REFERENCES daily_offers(id) ON DELETE CASCADE,
    menu_price_huf integer NOT NULL CHECK (menu_price_huf > 0),
    max_portions integer NOT NULL DEFAULT 30 CHECK (max_portions >= 0),
    remaining_portions integer NOT NULL DEFAULT 30 CHECK (remaining_portions >= 0),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(daily_offer_id) -- One menu per daily offer
);

-- Enable RLS on daily_offer_menus
ALTER TABLE daily_offer_menus ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_offer_menus
CREATE POLICY "Daily offer menus are publicly readable" 
ON daily_offer_menus 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert daily offer menus" 
ON daily_offer_menus 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update daily offer menus" 
ON daily_offer_menus 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete daily offer menus" 
ON daily_offer_menus 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_daily_offer_menus_updated_at
    BEFORE UPDATE ON daily_offer_menus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to validate menu composition (1 soup + 1 main course)
CREATE OR REPLACE FUNCTION validate_menu_composition(offer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    soup_count integer;
    main_count integer;
BEGIN
    -- Count soup items
    SELECT COUNT(*) INTO soup_count
    FROM daily_offer_items
    WHERE daily_offer_id = offer_id 
    AND is_menu_part = true 
    AND menu_role = 'leves';
    
    -- Count main course items
    SELECT COUNT(*) INTO main_count
    FROM daily_offer_items
    WHERE daily_offer_id = offer_id 
    AND is_menu_part = true 
    AND menu_role = 'főétel';
    
    -- Valid menu: exactly 1 soup and 1 main course
    RETURN soup_count = 1 AND main_count = 1;
END;
$$;