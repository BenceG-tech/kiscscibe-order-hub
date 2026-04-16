
-- Insert new category "Főzelék feltét" after Főzelékek (sort=3), shifting others
-- Using sort=3.5 approach — we'll use sort=4 and bump existing sort=4+ by 1
UPDATE menu_categories SET sort = sort + 1 WHERE sort >= 4;
INSERT INTO menu_categories (name, sort) VALUES ('Főzelék feltét', 4);

-- Deduplicate menu items: for each duplicate name group, keep the oldest, 
-- redirect daily_offer_items references, then deactivate the duplicates
DO $$
DECLARE
  rec RECORD;
  keeper_id uuid;
  dup_id uuid;
  dup_ids uuid[];
BEGIN
  FOR rec IN
    SELECT LOWER(name) as lname, array_agg(id ORDER BY created_at) as ids
    FROM menu_items
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
  LOOP
    keeper_id := rec.ids[1];
    dup_ids := rec.ids[2:array_length(rec.ids, 1)];
    
    -- Update references in daily_offer_items
    FOREACH dup_id IN ARRAY dup_ids LOOP
      UPDATE daily_offer_items SET item_id = keeper_id WHERE item_id = dup_id;
      UPDATE daily_menu_items SET item_id = keeper_id WHERE item_id = dup_id;
      UPDATE order_items SET item_id = keeper_id WHERE item_id = dup_id;
      UPDATE menu_item_sides SET main_item_id = keeper_id WHERE main_item_id = dup_id;
      UPDATE menu_item_sides SET side_item_id = keeper_id WHERE side_item_id = dup_id;
    END LOOP;
    
    -- Deactivate duplicates
    UPDATE menu_items SET is_active = false WHERE id = ANY(dup_ids);
  END LOOP;
END $$;
