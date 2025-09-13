-- Add RLS policies to allow admins to manage daily offers
CREATE POLICY "Admin can insert daily offers" 
ON daily_offers 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update daily offers" 
ON daily_offers 
FOR UPDATE 
TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admin can delete daily offers" 
ON daily_offers 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- Add RLS policies for daily offer items
CREATE POLICY "Admin can insert daily offer items" 
ON daily_offer_items 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update daily offer items" 
ON daily_offer_items 
FOR UPDATE 
TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admin can delete daily offer items" 
ON daily_offer_items 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_offers_date ON daily_offers(date);
CREATE INDEX IF NOT EXISTS idx_daily_offer_items_offer_id ON daily_offer_items(daily_offer_id);