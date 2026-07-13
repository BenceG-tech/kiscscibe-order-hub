
## 1. Idővonal-diagnózis — eredmény

Migrációk `>= 20260625` (schema_migrations):

| version | mit csinált |
|---|---|
| 20260630093708 | `get_daily_data` létrehozás, `menu_items.portion_size/unit` |
| 20260630093724 | `REVOKE EXECUTE … get_daily_data FROM PUBLIC; GRANT … anon` (csak get_daily_data) |
| **20260702072303** | `validate_pickup_time` — ablak **10:30–15:00** |
| **20260702144801** | idempotency_key + `atomic_coupon_increment` + `validate_order_date` (5 perc grace) |
| 20260713145510 | `update_daily_portions` — hozzáadva `daily_offer_menus` ág; `validate_pickup_time` → **07:00–16:00** |
| 20260713153108 | abandoned_carts dedupe + idempotency uniq index |
| **20260713154724** | tömeges `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated` MINDEN SECURITY DEFINER függvényre, is_admin* csak `authenticated` |
| 20260713180046 | mai RLS-fix (általunk kiadott) |

### Döntés: **„második ok gyanú"** — a diagnózis NEM teljes.

Az `is_admin` / `is_admin_or_staff` anon EXECUTE revoke **először 2026-07-13 15:47 UTC-kor** történt (20260713154724). Ez nem magyarázza a 07-02-i leállást.

Amit a 07-02-i migrációk viszont megmagyaráznak — erős második gyökérok-jelölt:

- **20260702072303**: `validate_pickup_time` ablakot **10:30–15:00**-ra szűkítette. A 07-13-i migráció ezt korrigálta 07:00–16:00-ra egy explicit üzenettel: *„The edge function keeps the finer-grained rule (breakfast items → 07:00–10:00, lunch items → 10:30–16:00), but the DB-level guard just needs to allow the full daily window instead of the previous lunch-only 10:30–15:00."*
- Következmény: **2026-07-02 és 2026-07-13 között** minden 07:00–10:29 közötti reggeli időpont + minden 15:01–16:00 közötti délutáni időpont → `validate_order_date` trigger `RAISE EXCEPTION 'Pickup time is outside business hours'` → INSERT rollback → **rendelés nem íródik az `orders` táblába, admin nem lát semmit, email nem indul**.
- 20260713145510 megjegyzése expliciten dokumentálja: a szűk ablak élesben rendeléseket törölt.
- A 07-13-i RLS regresszió (154724) ezután, néhány órán belül lezárta még az étlap-olvasást is anon-nak → a mai állapot.

### Javaslat verifikációra (nem kód, csak lekérdezés)

Mielőtt zárom a diagnózist, futtatnám:
- `postgres_logs` grep `Pickup time is outside business hours` 07-02–07-13 közti retention-en belüli része
- `orders` count 07-02–07-13 vs. 06-15–07-01 összehasonlítás, pickup_time óra-hisztogram
Ha a logban / hiányban látszik, hogy tömegesen dobta a triggert 10:00 és 15:30 körüli időpontokra → **kettős gyökérok igazolva**, mindkettő már javítva (145510 + 154724 + a mai policy fix). Zárható.

Ha nem látszik ilyen minta → tovább kell keresni (edge function logok, deploy history).

---

## 2. Fix-prioritás — jóváhagyott sorrend

Elfogadva, egyesével, minden lépés után Playwright anon E2E + postgres_logs verifikáció, csak utána a következő:

1. **K1** — Realtime dedupe: `useRealtimeOrders` már csak lista frissít (toast/hang eltávolítva), `useGlobalOrderNotifications` az egyetlen forrás. Fix 3s reconnect → exponenciális backoff (2s → 4s → 8s → … max 60s, ugyanaz a flap-védelem mint a másik hookban).
2. **M5+M4** — `email_send_log(order_id, recipient, status, error, created_at)` tábla + GRANTs + RLS (admin/staff read, service_role write). `submit-order` minden `resend.emails.send` hívást logol, a bcc → két külön hívás (tulaj + Bence, két külön log sor). Admin rendeléslistán ikon oszlop: ✓ küldve / ⚠ hiba / — nincs.
3. **M1** — idempotency_key generálás a kliensen (submit előtt UUID), payment_method mindig kitöltve, `submit-order` visszaadja a meglévő rendelést 409 helyett 200 + `duplicate: true`.
4. **K3** — DST-fix előkészítés: `budapestWallTimeToUtcIso` cseréje `Intl.DateTimeFormat`-alapúra unit tesztekkel a márciusi (2027-03-28) és októberi (2026-10-25) váltó napokra. Nem éles refaktor még, csak PR-készenlét backlogban.
5. **K2** — `create_order_with_items` tranzakció-RPC: **csak akkor**, ha éles forgalomban megjelenik order_items nélküli fantom `orders` sor. Addig backlog, `email_send_log` + admin badge elég a megfigyeléshez.

### Első teendő build módban

Ha a fenti idővonal-eredményt elfogadod (**„második ok gyanú, valószínűleg validate_pickup_time szűk ablak — mindkettő már javítva"**), K1-gyel kezdek. Ha előbb a postgres_logs verifikációt szeretnéd („Pickup time is outside business hours" gyakoriság 07-02–07-13), azt kérésre lefuttatom, mielőtt egy sor kód is íródik.
