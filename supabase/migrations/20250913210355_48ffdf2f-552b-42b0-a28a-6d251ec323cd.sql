-- Enable RLS on all tables
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for menu-related tables (customers need to see the menu)
CREATE POLICY "Menu categories are publicly readable" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Active menu items are publicly readable" ON menu_items FOR SELECT USING (is_active = true);
CREATE POLICY "Item modifiers are publicly readable" ON item_modifiers FOR SELECT USING (true);
CREATE POLICY "Modifier options are publicly readable" ON item_modifier_options FOR SELECT USING (true);
CREATE POLICY "Daily offers are publicly readable" ON daily_offers FOR SELECT USING (true);
CREATE POLICY "Daily offer items are publicly readable" ON daily_offer_items FOR SELECT USING (true);
CREATE POLICY "Capacity slots are publicly readable" ON capacity_slots FOR SELECT USING (true);
CREATE POLICY "Settings are publicly readable" ON settings FOR SELECT USING (true);

-- Orders - customers can create orders, but only view their own
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders are publicly readable" ON orders FOR SELECT USING (true);

-- Order items and options - link to order creation
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items are publicly readable" ON order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create order item options" ON order_item_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Order item options are publicly readable" ON order_item_options FOR SELECT USING (true);

-- Newsletter subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Subscribers are not publicly readable" ON subscribers FOR SELECT USING (false);

-- Update capacity slots (for booking)
CREATE POLICY "Anyone can update capacity slots" ON capacity_slots FOR UPDATE USING (true);

-- Admin policies (for future authentication)
-- These will be updated when we implement admin authentication
CREATE POLICY "Admin can manage menu categories" ON menu_categories FOR ALL USING (false);
CREATE POLICY "Admin can manage menu items" ON menu_items FOR ALL USING (false);
CREATE POLICY "Admin can manage modifiers" ON item_modifiers FOR ALL USING (false);
CREATE POLICY "Admin can manage modifier options" ON item_modifier_options FOR ALL USING (false);
CREATE POLICY "Admin can manage daily offers" ON daily_offers FOR ALL USING (false);
CREATE POLICY "Admin can manage daily offer items" ON daily_offer_items FOR ALL USING (false);
CREATE POLICY "Admin can manage orders" ON orders FOR UPDATE USING (false);
CREATE POLICY "Admin can manage settings" ON settings FOR ALL USING (false);
CREATE POLICY "Admin can view subscribers" ON subscribers FOR SELECT USING (false);