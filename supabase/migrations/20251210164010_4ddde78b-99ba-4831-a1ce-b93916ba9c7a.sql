-- First, delete existing categories if any (to avoid duplicates)
DELETE FROM menu_categories WHERE name IN (
  'Levesek', 'Tészta ételek', 'Főzelékek', 'Rántott ételek', 'Desszertek',
  'Csirkés-zöldséges ételek', 'Extra köretek', 'Csirkemájas ételek', 
  'Marhahúsos ételek', 'Halételek', 'Egytál ételek', 'Saláták',
  'Hagyományos köretek', 'Főételek', 'Prémium ételek', 'Tokány / Pörkölt / Ragu'
);

-- Add new categories based on the Excel file structure
INSERT INTO menu_categories (name, sort) VALUES
  ('Levesek', 1),
  ('Tészta ételek', 2),
  ('Főzelékek', 3),
  ('Rántott ételek', 4),
  ('Desszertek', 5),
  ('Csirkés-zöldséges ételek', 6),
  ('Extra köretek', 7),
  ('Csirkemájas ételek', 8),
  ('Marhahúsos ételek', 9),
  ('Halételek', 10),
  ('Egytál ételek', 11),
  ('Saláták', 12),
  ('Hagyományos köretek', 13),
  ('Főételek', 14),
  ('Prémium ételek', 15),
  ('Tokány / Pörkölt / Ragu', 16);