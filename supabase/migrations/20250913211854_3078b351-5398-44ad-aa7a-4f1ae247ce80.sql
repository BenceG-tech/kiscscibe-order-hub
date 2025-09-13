-- Add some sample menu data for testing
INSERT INTO menu_items (id, category_id, name, description, price_huf, is_active, is_featured, allergens) VALUES
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Levesek'), 'Paradicsomleves', 'Friss paradicsomból készült leves, bazsalikommal', 890, true, false, '{}'),
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Levesek'), 'Húsgombóc leves', 'Házi húsgombóc zöldségekkel', 1290, true, true, '{}'),
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Főételek'), 'Rántott szelet burgonyával', 'Házi rántott hús, friss burgonyával', 1890, true, true, '{}'),
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Főételek'), 'Csirkemell grillezve', 'Grillezett csirkemell, friss salátával', 2190, true, false, '{}'),
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Főételek'), 'Vegetáriánus lasagne', 'Zöldséges lasagne, sajtos tetővel', 1590, true, false, ARRAY['tejtermék']),
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Köretek'), 'Hasábburgonya', 'Ropogós hasábburgonya', 690, true, false, '{}'),
  (gen_random_uuid(), (SELECT id FROM menu_categories WHERE name = 'Köretek'), 'Zöld saláta', 'Friss kevert saláta', 590, true, false, '{}');

-- Add some capacity slots for today and tomorrow
INSERT INTO capacity_slots (date, timeslot, max_orders, booked_orders) VALUES
  (CURRENT_DATE, '11:00:00', 8, 2),
  (CURRENT_DATE, '11:30:00', 8, 1),
  (CURRENT_DATE, '12:00:00', 8, 5),
  (CURRENT_DATE, '12:30:00', 8, 8),
  (CURRENT_DATE, '13:00:00', 8, 3),
  (CURRENT_DATE, '13:30:00', 8, 0),
  (CURRENT_DATE + INTERVAL '1 day', '11:00:00', 8, 0),
  (CURRENT_DATE + INTERVAL '1 day', '11:30:00', 8, 0),
  (CURRENT_DATE + INTERVAL '1 day', '12:00:00', 8, 0),
  (CURRENT_DATE + INTERVAL '1 day', '12:30:00', 8, 0),
  (CURRENT_DATE + INTERVAL '1 day', '13:00:00', 8, 0),
  (CURRENT_DATE + INTERVAL '1 day', '13:30:00', 8, 0)
ON CONFLICT (date, timeslot) DO NOTHING;