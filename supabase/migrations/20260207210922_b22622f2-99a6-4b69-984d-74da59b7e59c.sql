-- Sync all daily_offer_menus prices with their parent daily_offers prices
UPDATE daily_offer_menus dom
SET menu_price_huf = d.price_huf
FROM daily_offers d
WHERE dom.daily_offer_id = d.id
AND d.price_huf IS NOT NULL
AND dom.menu_price_huf != d.price_huf;