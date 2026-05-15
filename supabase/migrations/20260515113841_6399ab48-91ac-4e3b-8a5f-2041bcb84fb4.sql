
WITH new_items AS (
  INSERT INTO menu_items (name, price_huf, category_id, is_active, is_temporary)
  VALUES
    ('Sajtos bundában rántott csirkemell szeletek', 2450, '609f51b6-bddf-4735-8048-b856e6703628', true, true),
    ('Mediterrán csirkés penne sült paprikával', 2450, 'a07dd664-facd-45fc-911b-65c83f993067', true, true),
    ('Rozmaringos sült karaj hagymás pecsenyelével', 2350, 'a8932816-8705-4f39-b915-d29b71fc5dac', true, true),
    ('Stefánia gombóc', 1290, 'd2be8273-1a4a-4fed-8de9-b3e56f1b75a2', true, true),
    ('Menzás piskóta csokoládé öntettel', 1350, '52083402-eb53-4805-9cce-6c704f37213c', true, true),
    ('Zöldfűszeres fetasajttal töltött rántott szelet', 2450, '609f51b6-bddf-4735-8048-b856e6703628', true, true),
    ('Omlós csirkemell paradicsomos-tejszínes szószban', 2450, '46f397ce-2352-4f16-9578-793cff41413d', true, true),
    ('Mézes-teriyaki csirkecomb pirított zöldségekkel', 2350, '46f397ce-2352-4f16-9578-793cff41413d', true, true),
    ('Kertész szelet', 2350, 'a8932816-8705-4f39-b915-d29b71fc5dac', true, true),
    ('Sült tarjaszeletek lecsós-gombás feltéttel', 2350, 'a8932816-8705-4f39-b915-d29b71fc5dac', true, true),
    ('Fokhagymás-tejszínes sertésszelet', 2350, 'a8932816-8705-4f39-b915-d29b71fc5dac', true, true)
  RETURNING id, name
),
mapping AS (
  SELECT id, name,
    CASE name
      WHEN 'Sajtos bundában rántott csirkemell szeletek' THEN '2026-05-19'::date
      WHEN 'Mediterrán csirkés penne sült paprikával' THEN '2026-05-20'::date
      WHEN 'Rozmaringos sült karaj hagymás pecsenyelével' THEN '2026-05-20'::date
      WHEN 'Stefánia gombóc' THEN '2026-05-20'::date
      WHEN 'Menzás piskóta csokoládé öntettel' THEN '2026-05-20'::date
      WHEN 'Zöldfűszeres fetasajttal töltött rántott szelet' THEN '2026-05-20'::date
      WHEN 'Omlós csirkemell paradicsomos-tejszínes szószban' THEN '2026-05-21'::date
      WHEN 'Mézes-teriyaki csirkecomb pirított zöldségekkel' THEN '2026-05-21'::date
      WHEN 'Kertész szelet' THEN '2026-05-21'::date
      WHEN 'Sült tarjaszeletek lecsós-gombás feltéttel' THEN '2026-05-22'::date
      WHEN 'Fokhagymás-tejszínes sertésszelet' THEN '2026-05-22'::date
    END AS d
  FROM new_items
)
INSERT INTO daily_offer_items (daily_offer_id, item_id, is_menu_part, portions_needed)
SELECT do_.id, m.id, false, 1
FROM mapping m
JOIN daily_offers do_ ON do_.date = m.d;
