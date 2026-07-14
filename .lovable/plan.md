## Záró takarítás + próbálkozás-panel vizsgálat + végleges jelentés

### 1. Overlay-teszt takarítás (dátum-guardos)

10 db `AUDIT TESZT OVERLAY %` rendelés törlése, szigorú dátum-guarddal (`created_at >= '2026-07-13 20:00:00+00'`):

```sql
DELETE FROM order_item_options
WHERE order_item_id IN (
  SELECT id FROM order_items WHERE order_id IN (
    SELECT id FROM orders
    WHERE name LIKE 'AUDIT TESZT OVERLAY%'
      AND created_at >= '2026-07-13 20:00:00+00'
  )
);

DELETE FROM order_items
WHERE order_id IN (
  SELECT id FROM orders
  WHERE name LIKE 'AUDIT TESZT OVERLAY%'
    AND created_at >= '2026-07-13 20:00:00+00'
);

DELETE FROM orders
WHERE name LIKE 'AUDIT TESZT OVERLAY%'
  AND created_at >= '2026-07-13 20:00:00+00';
```

- `email_send_log`-hoz **NEM nyúlok** (a 42 megőrzött bizonyíték-sor védve marad).
- `order_attempts` / `abandoned_carts`: **nem érintem** (a direkt DB INSERT-es overlay-teszt nem hozott létre sort ott — l. 2. pont).

### 2. "1 szerver oldali hiba" — vizsgálat eredménye

Lekérdeztem: az `order_attempts` táblában **1 sor van, és az VALÓDI VEVŐI HIBA, NEM teszt-maradvány**:

| mező | érték |
|---|---|
| Dátum | **2026-07-02 06:05:10 UTC** (jóval a dátum-guard előtt) |
| Vevő | **Dr. Örkényi Erika** |
| Telefon | +36 30 924 7049 |
| Email | drorkenyi66@gmail.com |
| Összeg | 4 740 Ft |
| Kívánt átvétel | 2026-07-02 |
| Hibaüzenet | **"Rendelés mentési hiba"** (magyar, generikus) |
| `error_code` | `NULL` |

**Ítélet:** ez **nem törölhető** — valódi vevő, valódi elveszett rendelés (~4 700 Ft bevétel + reputáció). A dátum-guard (`>= 2026-07-13 20:00`) eleve kizárná, de attól függetlenül is meg kell tartani.

**Jelentendő tulajdonosnak:** a K-3 mapper (mai frissítés) OTA javította a jövőbeni ilyen eseteket — most már konkrét, cselekvésre bíró üzenetet kap a vevő "Rendelés mentési hiba" helyett. Erre a júl. 2-i esetre visszamenőleg érdemes lehet Dr. Örkényi Erikát felhívni/emailt küldeni; ezt a lépést nem automatizálom.

### 3. /admin/activity 0/0 ellenőrzés

Takarítás után lefuttatom:

```sql
SELECT COUNT(*) FROM orders          WHERE name LIKE 'AUDIT TESZT%';
SELECT COUNT(*) FROM order_items     WHERE name_snapshot LIKE 'AUDIT TESZT%';
SELECT COUNT(*) FROM order_attempts  WHERE customer_name LIKE 'AUDIT TESZT%';
SELECT COUNT(*) FROM abandoned_carts WHERE created_at >= '2026-07-13 20:00:00+00';
```

Cél mind a 4-nél: `0`. Ha bármelyik nem 0 → jelentem, magyarázom, nem zárok le.

### 4. Végleges jelentés (a szokott formában)

- **K-3 mapper:** 15/15 Deno teszt ✅ + Checkout ASSERT magyar üzenetre (kódszemle)
- **K-2 audit-maradvány takarítás:** teljes mátrix (orders / order_items / order_attempts / abandoned_carts) — ma esti + korábbi audit körök
- **BACKLOG-2b/2c:** kamu telefonszám eltávolítva 2 hírlevél sablonból, fallback = `info@kiscsibeetterem.hu`
- **BACKLOG-2d:** placeholder cím `1145 Budapest, Vezér utca 12.` → **`1141 Budapest, Vezér u. 110.`** 3 sablonban (send-welcome-newsletter, send-weekly-menu, send-contact-email)
- **Settings seed:** `restaurant_contact = {"email":"info@kiscsibeetterem.hu"}` (phone opcionális, kód phone-képes)
- **Overlay élő teszt:** 1 → 2 → 4 → 10 rendelés, layoutok (kártya / 2-oszlop / 2×2 / 3×3), hang 10=10, mindkét screenshottal igazolva
- **Aktivitás-fül:** 0 teszt-rendelés / 0 teszt-próbálkozás
- **Megőrzött valódi bizonyítékok:** 42 db `email_send_log` sor (érintetlen), 1 db `order_attempts` sor Dr. Örkényi Erika júl. 2-i esetéről (érintetlen, tulajdonosi follow-up javasolt)

### Kérdés

Mehet a takarítás + verifikáció, vagy előbb bármi módosítás?
