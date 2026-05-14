
DO $$
DECLARE
  cat_id uuid;
BEGIN
  -- Create or fetch the Reggeli category
  SELECT id INTO cat_id FROM public.menu_categories WHERE name = 'Reggeli' LIMIT 1;
  IF cat_id IS NULL THEN
    INSERT INTO public.menu_categories (name, sort) VALUES ('Reggeli', 0) RETURNING id INTO cat_id;
  ELSE
    UPDATE public.menu_categories SET sort = 0 WHERE id = cat_id;
  END IF;

  -- Insert breakfast items (skip if name already exists in this category)
  INSERT INTO public.menu_items (name, description, price_huf, category_id, is_active, is_always_available, display_order)
  SELECT v.name, v.description, v.price_huf, cat_id, true, true, v.display_order
  FROM (VALUES
    ('Bundáskenyér', 'Választható kenegetőssel (+490 Ft): pestós-sajtos, csokiöntetes, sajtos-tejfölös, magyaros (tejföl, kolbász, lilahagyma)', 1270, 1),
    ('Töltött bundáskenyér (1 db)', 'Sajttal-sonkával töltve', 1250, 2),
    ('Töltött bundáskenyér (2 db)', 'Sajttal-sonkával töltve', 2350, 3),
    ('Óriás melegszendvics', 'Pl. házi gombakrémes, sajtos-sonkás, szalámis', 1750, 4),
    ('Ham & Eggs', '3 tojásból', 1770, 5),
    ('Omlett', '3 tojásból, két feltéttel: pl. kolbászos-hagymás, baconos-hagymás, sonkás-sajtos', 1770, 6),
    ('Szendvicsek (többféle)', 'Választékunktól függően 1 290 – 1 750 Ft', 1290, 7)
  ) AS v(name, description, price_huf, display_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.menu_items mi WHERE mi.category_id = cat_id AND mi.name = v.name
  );
END $$;
