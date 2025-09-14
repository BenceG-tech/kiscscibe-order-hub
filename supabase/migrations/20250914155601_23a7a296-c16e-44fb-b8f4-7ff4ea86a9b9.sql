-- Clean up existing weekend data
DELETE FROM daily_offer_items WHERE daily_offer_id IN (
  SELECT id FROM daily_offers WHERE EXTRACT(DOW FROM date) IN (0, 6)
);

DELETE FROM daily_offers WHERE EXTRACT(DOW FROM date) IN (0, 6);

DELETE FROM daily_menu_items WHERE daily_menu_id IN (
  SELECT id FROM daily_menus WHERE EXTRACT(DOW FROM date) IN (0, 6)
);

DELETE FROM daily_menus WHERE EXTRACT(DOW FROM date) IN (0, 6);

-- Add function to check if date is weekend
CREATE OR REPLACE FUNCTION is_weekend(check_date date) 
RETURNS boolean AS $$
BEGIN
  RETURN EXTRACT(DOW FROM check_date) IN (0, 6); -- 0 = Sunday, 6 = Saturday
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraints to prevent weekend entries
ALTER TABLE daily_offers 
ADD CONSTRAINT no_weekend_offers 
CHECK (NOT is_weekend(date));

ALTER TABLE daily_menus 
ADD CONSTRAINT no_weekend_menus 
CHECK (NOT is_weekend(date));