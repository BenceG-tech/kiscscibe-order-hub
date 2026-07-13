
## Idővonal-válasz (megismételve, egyértelműen)

`SELECT version, name FROM supabase_migrations.schema_migrations WHERE version >= '20260625' ORDER BY version;` már lefutott az előző körben. Eredmény:

| version | mit csinált (releváns rész) |
|---|---|
| 20260630093708 | `get_daily_data` létrehozás |
| 20260630093724 | `REVOKE EXECUTE … get_daily_data FROM PUBLIC` + `GRANT … anon` (csak ez az egy fv) |
| **20260702072303** | `validate_pickup_time` ablak **10:30–15:00**-ra szűkítve |
| 20260702144801 | idempotency_key + `validate_order_date` 5 perc grace |
| 20260713145510 | `update_daily_portions` + `daily_offer_menus` ág, `validate_pickup_time` → **07:00–16:00** javítás |
| 20260713153108 | abandoned_carts dedupe |
| **20260713154724** | tömeges `REVOKE EXECUTE … is_admin/is_admin_or_staff/is_staff/is_owner/has_role FROM anon` |
| 20260713180046 | mai RLS-fix (általunk) |

**Az anon EXECUTE először 2026-07-13 15:47 UTC-kor lett megvonva** (20260713154724). Ez **nem** magyarázza a 07-02-i leállást.

### Döntés: „második ok gyanú" — kettős gyökérok

A 07-02 óta tartó rendelés-leállás bizonyíték-alapú gyökéroka a **20260702072303**: `validate_pickup_time` **10:30–15:00**-ra szűkült. Következmény: minden 07:00–10:29 közötti reggeli és 15:01–16:00 közötti délutáni pickup INSERT-nél a `validate_order_date` trigger `RAISE EXCEPTION 'Pickup time is outside business hours'` → rollback → nincs `orders` sor → admin nem lát semmit → email nem indul. A 20260713145510 migráció commit-üzenete ezt explicit dokumentálja („previous lunch-only 10:30–15:00").

A 07-13-i RLS regresszió (154724) ehhez képest egy második, független hiba: már csak az étlap anon olvasását törte, néhány órán át.

**Mindkét gyökérok javítva:** validate_pickup_time (20260713145510), RLS anon (20260713180046). Verifikációhoz futni fog: `postgres_logs` grep `Pickup time is outside business hours` 07-02–07-13 közti retention-en → ha a mintázat 10:00 és 15:30 körüli időpontokra tömeges → diagnózis lezárva.

---

## K1 verifikációs terv (build módban futtatva)

Egyetlen turn-ben, három bizonyítékkal + idővonal-log-vizsgálattal.

### 1. Anon E2E — Playwright inkognitó, hard reload

Script: `/ + /etlap + kosárba tétel + /checkout-ig navigálás (submit nélkül)`. Rögzít: minden Supabase network kérés státusza, screenshot. **Elvárás: 0 db 4xx/5xx a supabase.co és functions.supabase.co host-ra.**

### 2. K1-specifikus admin teszt — bejelentkezett tulaj sessionnel

Playwright script `LOVABLE_BROWSER_SUPABASE_*` env-el restore-olva, `/admin/orders` betöltése, `console` capture bekapcsolva. Lépések:

**(a) Egyetlen forrás:** grep a console-ban `useRealtimeOrders` vs `[Notifications]` toast/hang előfordulást. Elvárás: `useRealtimeOrders` **nem** logol értesítést, csak `[Notifications] 🔔 New order` jön.

**(b) Egyszeri értesítés — kontrollált INSERT/DELETE:**
```sql
INSERT INTO orders (code, name, phone, total_huf, status, payment_method, pickup_time, notes)
VALUES ('TEST_K1', 'TEST_K1_dedupe', '+36301234567', 100, 'new', 'cash',
        (NOW() + INTERVAL '2 hours')::timestamptz, 'K1_TEST_MARKER');
-- 3s várakozás, screenshot, majd:
DELETE FROM orders WHERE notes = 'K1_TEST_MARKER';
```
Idő: azonnal a teszt elején, hogy a tulaj ne kapja el. Elvárás: `[Notifications] 🔔 New order: TEST_K1` **pontosan 1×**, `OrderNotificationModal` render **1×**, `useRealtimeOrders` INSERT handler is lefut (lista frissül) de nem szól. Rögzített időbélyeg-diff INSERT ↔ két csatorna realtime event között.

**(c) Exponenciális backoff:** böngészőben `supabase.removeChannel(channel)` + `channel.unsubscribe()` erőltetéssel, majd offline/online togglerrel csatornahiba szimuláció. Grep: `[useRealtimeOrders] Channel status=... — reconnect in Xms (attempt N)`. Elvárás: **2000 → 4000 → 8000 → 16000 ms** progresszió, nem fix 3000.

### 3. postgres_logs — teszt-ablak

A teszt ISO-timestamp-tartományában: `event_message ILIKE '%permission denied%'` count = **0**. Egyben lefuttatom a régi `Pickup time is outside business hours` grep-et is 07-02–07-13-ra a retention határáig, hogy az idővonal-diagnózis második okát empirikusan is lezárjam.

### Kimenet

Egyetlen verifikációs jelentés a chatben, benne:
- 1., 2a., 2b., 2c. bizonyítékok (log-részlet + screenshot-utalás)
- 3. `permission denied` count = 0
- Idővonal-log ítélet: „diagnózis teljes: kettős gyökérok igazolva" **vagy** „harmadik ok gyanú: X"

## Ha zöld → M5+M4

Külön migráció:
- `email_send_log` tábla: `id`, `order_id`, `recipient`, `email_type` (`customer`|`owner`|`bence`), `status` (`sent`|`failed`), `error text NULL`, `resend_message_id text NULL`, `created_at`. GRANTs: `authenticated` SELECT, `service_role` ALL. RLS: `is_admin_or_staff` SELECT.
- `orders` publikációhoz kapcsolva marad; új tábla nem realtime.

Edge function (`submit-order`):
- bcc-szétbontás: `resend.emails.send` külön hívás tulaj (`kiscsibeetterem@gmail.com`) és Bence címére. Egyenként log-sor.
- vevőnek küldött email is log-sort ír.
- minden send hívás try/catch, hiba esetén status=`failed` + error message rögzítve, de a rendelés-válasz sikeres marad (nem blokkoló).

Frontend (`OrdersManagement`/rendeléslista):
- új oszlop/badge: „Email" — összesített státusz az adott rendelésre (`email_send_log` join a rendeléshez). Ikonok: ✓ (mind sent), ⚠ (van failed), — (nincs sor).
- Rendelés-részletnél lista: melyik címre mikor ment, mi a status/error.

Verifikáció M5+M4 után: Playwright anon TELJES rendelés (submit-tel is), majd admin oldal ellenőrzés — 3 log sor (customer, owner, bence), mind ✓, `resend_message_id` kitöltve.
