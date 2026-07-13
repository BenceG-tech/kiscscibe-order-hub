## Diagnosztikai futtatás — B → A sorrend

Célja: eldönteni, hogy a rendelés-elakadás oka **RLS-regresszió** (`is_admin` permission denied az anon útvonalon), **Realtime hiba**, vagy **egyik sem**. Kód-változtatás nincs, csak bizonyíték-gyűjtés.

### B) Anon frontend smoke (először)

1. **Direkt anon REST curl-ök** a Supabase REST-en, `apikey=<anon>` + `Authorization: Bearer <anon>` fejlécekkel, pontosan a frontend query-kre:
   - `GET /rest/v1/menu_items?select=*&is_active=eq.true`
   - `GET /rest/v1/daily_menus?select=*&date=eq.<ma>`
   - `GET /rest/v1/daily_menu_items?select=*`
   - `GET /rest/v1/daily_offer_menus?select=*`
   - `GET /rest/v1/capacity_slots?select=*&date=eq.<ma>`
   - `POST /rest/v1/rpc/get_daily_data` body `{ "target_date": "<ma>" }`
   
   Minden hívás HTTP státuszát + response bodyt rögzítem. `permission denied for function is_admin` = találat.

2. **Playwright** headless Chromium, `viewport 1280x1800`, cache kikapcsolva (`context = browser.new_context(bypass_csp=True)` + `page.route` cache-headerekkel), incognito-szerű friss context, hard reload a `/` és `/etlap` oldalakra. Console + network hibák kigyűjtése, screenshot.

3. **Ha bármelyik REST hívás elesik**: `supabase--read_query` `EXPLAIN`-nel `authenticated` role szimulációval (`SET LOCAL role authenticated`), és a `pg_policies` táblából lekérdezem a table policy-ket, hogy megnevezhessem melyik policy ág hivatkozik `is_admin`-ra. Két fix-javaslatot jelentek, de **nem javítok**:
   - (a) `GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon` visszaadása, vagy
   - (b) policy átírás: `is_admin` hívás áthelyezése `SELECT public.is_admin(...)` szubszelekt alá vagy két külön policy szétválasztása (`FOR SELECT TO anon USING (is_published)` + `FOR SELECT TO authenticated USING (is_admin(...) OR is_published)`).

### A) T9 Realtime INSERT smoke (B után)

Előfeltételek betartva:
- `pickup_time` = **holnap 10:00 Europe/Budapest** (hétköznap; ha holnap hétvége, a legközelebbi hétköznap 10:00). Elkerüli a `validate_order_date_trigger`-t.
- `code = 'TEST_' || substr(gen_random_uuid()::text,1,6)`, `name='RENDSZERTESZT'`, `phone='+36000000000'`, `total_huf=1`, `status='new'`, `payment_method='cash'`, `notes='T9 smoke — törlendő'`.
- **Figyelmeztetés a tulajnak**: pontos időpontot előre jelzek üzenetben ("Most futtatom, ~10 mp múlva TEST_ értesítés jöhet"). Az `A` szakaszt csak azután indítom.

Lépések:
1. Playwright script indít egy háttér-listener klienset (anon apikey nem elég — Realtime a `orders`-re az `SELECT` policy alapján fut; szükség lehet egy staff/admin session-re). A preview-session token használata itt megfelelő, mert az admin csatornát pont ő látja.
2. Két csatornára feliratkozom párhuzamosan, ahogy a frontend teszi: `order-notifications-*` és bármely `orders-changes-*` mintát is figyelek. Rögzítem a `SUBSCRIBED` ack idejét.
3. `supabase--insert` INSERT a fenti sorral. `t0 = INSERT válasz`. Rögzítem: `t1_channel1`, `t1_channel2` — Realtime esemény beérkezésének idői, delta ms-ben.
4. Azonnali cleanup: `DELETE FROM orders WHERE code = '<test_code>'`, plusz `order_items` / `capacity_slots` (nincs is, hiszen nem hívjuk a submit-order edge fn-t) — csak az orders sor.
5. Rögzítem: `edge_logs` (`submit-order`) érintetlen (nem hívtuk); `postgres_logs`-ban látszik-e a trigger sikere.

### Kimenet, amit adok

Táblázat:
- **Hipotézis:** RLS-regresszió (`is_admin` anon-nak) — igazolt / cáfolt, bizonyítékkal (HTTP státusz + policy név).
- **Hipotézis:** Realtime — igazolt / cáfolt (delta ms + mindkét csatorna kapta-e).
- **Egyéb váratlan lelet** ha van.
- **Következő javaslat**: melyik fixet kellene elsőként jóváhagyni (K3/RLS vs. K1/Realtime dedup vs. K2/tranzakció). **Kódot nem módosítok**, csak jelentek.

### Kockázatkezelés

- T9 INSERT `bypass`-olja a `submit-order` edge fn-t, tehát: nem küld emailt (Resend nem hívódik), nem foglal kapacitást (`capacity_slots` érintetlen), nem hoz létre `order_items`-et. Tiszta Realtime-teszt.
- A törlés az INSERT után max 5 mp-en belül lefut → invoice-trigger nem sül el (csak `status='completed'`-re fut).
- Ha a tulaj offline: 0 hangos értesítés kockázat. Ha online: max 1 rövid teszt-hang, előre bejelentve.
