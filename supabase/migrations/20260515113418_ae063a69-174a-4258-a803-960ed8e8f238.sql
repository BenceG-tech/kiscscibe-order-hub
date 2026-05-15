
-- Update menu_items prices from Excel
UPDATE menu_items SET price_huf = 1390 WHERE id = 'd3c8e0bb-2e2e-4366-ae53-5ebb9bc77f9c';
UPDATE menu_items SET price_huf = 2450 WHERE id = '88120081-d74f-4990-a494-f0a96a9a279a';
UPDATE menu_items SET price_huf = 2490 WHERE id = 'ab00a982-041a-4182-9cd7-8cecd55c9969';
UPDATE menu_items SET price_huf = 2350 WHERE id = 'daca2095-8b5e-40c3-817c-d94c9ffb88d9';
UPDATE menu_items SET price_huf = 2390 WHERE id = 'aeb27973-2827-42d4-9099-2adc0e669cd4';
UPDATE menu_items SET price_huf = 3450 WHERE id = '0439b7d3-9949-44eb-9b10-dc243c4be38e';
UPDATE menu_items SET price_huf = 590  WHERE id = '33087023-253a-4bad-9816-ef59fe576a0c';
UPDATE menu_items SET price_huf = 1090 WHERE id = 'daba7d5a-0923-4499-b25f-ec4f3899b214';
UPDATE menu_items SET price_huf = 1850 WHERE id = '5b8711a9-8a28-4975-994f-dbad403b99c1';
UPDATE menu_items SET price_huf = 2290 WHERE id = 'b6b22901-afb5-42a0-ba42-abd66f92a7c7';
UPDATE menu_items SET price_huf = 800  WHERE id = '86c24925-cbd8-4568-841a-9d8ba0598752';
UPDATE menu_items SET price_huf = 1350 WHERE id = '62c872b0-8b90-4ec4-bcd3-4be64df41251';
UPDATE menu_items SET price_huf = 2290 WHERE id = '8d31ff71-1ad6-4cce-9f49-5ff810aee951';
UPDATE menu_items SET price_huf = 1850 WHERE id = 'f5c32174-8323-4caa-ae71-b5896e1a07b6';
UPDATE menu_items SET price_huf = 2390 WHERE id = '693c4e2d-1312-4e1b-a330-5d4bb693a104';
UPDATE menu_items SET price_huf = 2390 WHERE id = '8abc057c-c099-4e23-9508-1e648fc8c050';
UPDATE menu_items SET price_huf = 490  WHERE id = 'cbbd7dbe-5628-4aef-b138-72cbe72ad4b4';
UPDATE menu_items SET price_huf = 490  WHERE id = '580b2e0e-bebd-49fd-886c-3db2766ad3a9';
UPDATE menu_items SET price_huf = 1390 WHERE id = 'c93a46e8-aa00-436a-95eb-be61bf54b0f5';
UPDATE menu_items SET price_huf = 850  WHERE id = 'a13d7f00-1af1-45ff-a978-31c3124aa90c';
UPDATE menu_items SET price_huf = 1300 WHERE id = 'd16f1f75-0dbf-4e27-a775-3c267dcac026';
UPDATE menu_items SET price_huf = 2350 WHERE id = '06ffb04c-11d4-48a6-985b-ab740dae901a';
UPDATE menu_items SET price_huf = 2550 WHERE id = '74aaf139-ce80-4a77-a5f7-3ed1035f92fd';
UPDATE menu_items SET price_huf = 1090 WHERE id = '8f2cc77f-005c-4fa7-a020-81f30cad1f94';
UPDATE menu_items SET price_huf = 850  WHERE id = 'bd8a4cf2-1223-4312-bfc4-a662e76c5aa7';
UPDATE menu_items SET price_huf = 1350 WHERE id = '4c5cae0f-bbc7-4510-a7fd-7229fd20f4ad';
UPDATE menu_items SET price_huf = 2290 WHERE id = '76a3b7ed-62e4-4cc4-8096-2135f3328250';
UPDATE menu_items SET price_huf = 2290 WHERE id = 'ee40316e-c696-4088-8184-aa24194530ea';
UPDATE menu_items SET price_huf = 1090 WHERE id = '50afb530-54f4-4d7a-80bf-357f0648c29f';
UPDATE menu_items SET price_huf = 2450 WHERE id = 'da7435a7-4abf-4449-9cd5-d967445da5ff';
UPDATE menu_items SET price_huf = 850  WHERE id = '70416242-d187-4c5f-a3c0-8532fe8d5747';
UPDATE menu_items SET price_huf = 1390 WHERE id = '1a942376-c92a-48c4-8155-a9d35c016713';
UPDATE menu_items SET price_huf = 2450 WHERE id = '0a19c2cd-88f3-4206-b0b0-74f9dd445baa';
UPDATE menu_items SET price_huf = 2290 WHERE id = '9f3bb46e-fb9f-44a7-bfcc-b249cdf42c8c';
UPDATE menu_items SET price_huf = 2850 WHERE id = '8f418a3e-f149-4f17-b9a5-6bbfceacea8d';
UPDATE menu_items SET price_huf = 1690 WHERE id = '22f0ae54-e8a4-4bb1-a1aa-d34001d01546';
UPDATE menu_items SET price_huf = 300  WHERE id = '8198b97f-f694-4121-a6ec-3a1b698c5c8a';
UPDATE menu_items SET price_huf = 1090 WHERE id = 'aa42522e-f130-4646-822f-ad5453b2fa52';
UPDATE menu_items SET price_huf = 2290 WHERE id = '250cbac9-8224-458a-8ecf-a8c1aca298b5';
UPDATE menu_items SET price_huf = 800  WHERE id = '6d1d0383-aea8-4bbd-8c0a-f1bc5d588b34';

-- Create daily_offers for Tue-Fri (Mon already exists)
INSERT INTO daily_offers (id, date, price_huf, max_portions, remaining_portions) VALUES
 ('11111111-0519-0000-0000-000000000019','2026-05-19',2200,50,50),
 ('11111111-0520-0000-0000-000000000020','2026-05-20',2200,50,50),
 ('11111111-0521-0000-0000-000000000021','2026-05-21',2200,50,50),
 ('11111111-0522-0000-0000-000000000022','2026-05-22',2200,50,50);

-- Create daily_offer_menus (combo) for all 5 days
INSERT INTO daily_offer_menus (daily_offer_id, menu_price_huf, max_portions, remaining_portions) VALUES
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9',2200,30,30),
 ('11111111-0519-0000-0000-000000000019',2200,30,30),
 ('11111111-0520-0000-0000-000000000020',2200,30,30),
 ('11111111-0521-0000-0000-000000000021',2200,30,30),
 ('11111111-0522-0000-0000-000000000022',2200,30,30);

-- Insert daily_offer_items
INSERT INTO daily_offer_items (daily_offer_id, item_id, is_menu_part, menu_role) VALUES
 -- Hétfő 05-18
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','d3c8e0bb-2e2e-4366-ae53-5ebb9bc77f9c',true,'leves'),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','88120081-d74f-4990-a494-f0a96a9a279a',true,'főétel'),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','ab00a982-041a-4182-9cd7-8cecd55c9969',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','daca2095-8b5e-40c3-817c-d94c9ffb88d9',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','aeb27973-2827-42d4-9099-2adc0e669cd4',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','0439b7d3-9949-44eb-9b10-dc243c4be38e',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','33087023-253a-4bad-9816-ef59fe576a0c',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','daba7d5a-0923-4499-b25f-ec4f3899b214',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','5b8711a9-8a28-4975-994f-dbad403b99c1',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','b6b22901-afb5-42a0-ba42-abd66f92a7c7',false,NULL),
 ('aa8c950a-e78c-40e0-8d7a-28ba8b31b4e9','86c24925-cbd8-4568-841a-9d8ba0598752',false,NULL),
 -- Kedd 05-19
 ('11111111-0519-0000-0000-000000000019','62c872b0-8b90-4ec4-bcd3-4be64df41251',true,'leves'),
 ('11111111-0519-0000-0000-000000000019','8d31ff71-1ad6-4cce-9f49-5ff810aee951',true,'főétel'),
 ('11111111-0519-0000-0000-000000000019','f5c32174-8323-4caa-ae71-b5896e1a07b6',false,NULL),
 ('11111111-0519-0000-0000-000000000019','693c4e2d-1312-4e1b-a330-5d4bb693a104',false,NULL),
 ('11111111-0519-0000-0000-000000000019','8abc057c-c099-4e23-9508-1e648fc8c050',false,NULL),
 ('11111111-0519-0000-0000-000000000019','cbbd7dbe-5628-4aef-b138-72cbe72ad4b4',false,NULL),
 ('11111111-0519-0000-0000-000000000019','580b2e0e-bebd-49fd-886c-3db2766ad3a9',false,NULL),
 ('11111111-0519-0000-0000-000000000019','c93a46e8-aa00-436a-95eb-be61bf54b0f5',false,NULL),
 ('11111111-0519-0000-0000-000000000019','a13d7f00-1af1-45ff-a978-31c3124aa90c',false,NULL),
 -- Szerda 05-20
 ('11111111-0520-0000-0000-000000000020','d16f1f75-0dbf-4e27-a775-3c267dcac026',true,'leves'),
 ('11111111-0520-0000-0000-000000000020','06ffb04c-11d4-48a6-985b-ab740dae901a',true,'főétel'),
 ('11111111-0520-0000-0000-000000000020','74aaf139-ce80-4a77-a5f7-3ed1035f92fd',false,NULL),
 ('11111111-0520-0000-0000-000000000020','8f2cc77f-005c-4fa7-a020-81f30cad1f94',false,NULL),
 ('11111111-0520-0000-0000-000000000020','bd8a4cf2-1223-4312-bfc4-a662e76c5aa7',false,NULL),
 -- Csütörtök 05-21
 ('11111111-0521-0000-0000-000000000021','4c5cae0f-bbc7-4510-a7fd-7229fd20f4ad',true,'leves'),
 ('11111111-0521-0000-0000-000000000021','76a3b7ed-62e4-4cc4-8096-2135f3328250',true,'főétel'),
 ('11111111-0521-0000-0000-000000000021','ee40316e-c696-4088-8184-aa24194530ea',false,NULL),
 ('11111111-0521-0000-0000-000000000021','33087023-253a-4bad-9816-ef59fe576a0c',false,NULL),
 ('11111111-0521-0000-0000-000000000021','50afb530-54f4-4d7a-80bf-357f0648c29f',false,NULL),
 ('11111111-0521-0000-0000-000000000021','6a4667c7-5c9c-4f4c-b369-170205806c29',false,NULL),
 ('11111111-0521-0000-0000-000000000021','da7435a7-4abf-4449-9cd5-d967445da5ff',false,NULL),
 ('11111111-0521-0000-0000-000000000021','70416242-d187-4c5f-a3c0-8532fe8d5747',false,NULL),
 -- Péntek 05-22
 ('11111111-0522-0000-0000-000000000022','1a942376-c92a-48c4-8155-a9d35c016713',true,'leves'),
 ('11111111-0522-0000-0000-000000000022','0a19c2cd-88f3-4206-b0b0-74f9dd445baa',true,'főétel'),
 ('11111111-0522-0000-0000-000000000022','9f3bb46e-fb9f-44a7-bfcc-b249cdf42c8c',false,NULL),
 ('11111111-0522-0000-0000-000000000022','8f418a3e-f149-4f17-b9a5-6bbfceacea8d',false,NULL),
 ('11111111-0522-0000-0000-000000000022','22f0ae54-e8a4-4bb1-a1aa-d34001d01546',false,NULL),
 ('11111111-0522-0000-0000-000000000022','8198b97f-f694-4121-a6ec-3a1b698c5c8a',false,NULL),
 ('11111111-0522-0000-0000-000000000022','aa42522e-f130-4646-822f-ad5453b2fa52',false,NULL),
 ('11111111-0522-0000-0000-000000000022','b1f446fa-bc3f-4420-8414-3fda9d62a2f3',false,NULL),
 ('11111111-0522-0000-0000-000000000022','250cbac9-8224-458a-8ecf-a8c1aca298b5',false,NULL),
 ('11111111-0522-0000-0000-000000000022','6d1d0383-aea8-4bbd-8c0a-f1bc5d588b34',false,NULL);
