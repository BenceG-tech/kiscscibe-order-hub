-- Ensure menu_role has proper constraint
ALTER TABLE daily_offer_items 
DROP CONSTRAINT IF EXISTS daily_offer_items_menu_role_check;

ALTER TABLE daily_offer_items 
ADD CONSTRAINT daily_offer_items_menu_role_check 
CHECK (menu_role IS NULL OR menu_role IN ('leves', 'főétel'));

-- Add index for better performance on menu role queries
CREATE INDEX IF NOT EXISTS idx_daily_offer_items_menu_role 
ON daily_offer_items(menu_role) WHERE is_menu_part = true;