# Terv — Confirmation javítás + Admin rendelés-kezelés ellenőrzés

## 1. Confirmation oldal — "Rendelt tételek" üres

**Ok:** `order_items` RLS csak admin/staff számára engedélyezi az olvasást, vásárló nem látja.

**Fix:** Új security-definer RPC `get_customer_order_items(order_code, customer_phone)` ami `code + phone` egyezés alapján visszaadja az adott rendelés tételeit + opcióit (JSON). Az `OrderConfirmation.tsx` ezt hívja közvetlen `order_items` select helyett. RLS érintetlen marad.

## 2. Confirmation oldal — Átvétel ideje 00:00 / rossz óra

**Ok:** A `submit-order` edge function a 07:00-t úgy menti az adatbázisba mintha UTC lenne, így Budapest időzónában 09:00-ként jelenik meg. A `formatPickupTime` a böngésző helyi időzónáját használja.

**Fix (kettős):**
- `supabase/functions/submit-order/index.ts`: a `pickup_time` összerakásánál a kiválasztott `YYYY-MM-DD HH:mm`-t **Európa/Budapest** zónaként értelmezzük és UTC-be konvertálva mentjük.
- `OrderConfirmation.tsx` (és az admin/KDS kijelzések, ahol `formatPickupTime`-szerű hívás van) `toLocaleString('hu-HU', { ..., timeZone: 'Europe/Budapest' })` kényszerrel jelenítse meg — így a meglévő jó rekordok minden böngészőben jól látszanak.
- A korábbi hibás teszt-rekord (L89860) kiigazítása migrációval nem szükséges, mivel teszt adat.

## 3. Admin rendelés-kezelés végigtesztelése böngészővel

A felhasználó már be van jelentkezve a previewban (owner: gataibence@gmail.com). Tesztforgatókönyv:

1. `/admin/orders` megnyitása, ellenőrzés hogy a friss `L89860` rendelés megjelenik az "Aktív" tabon, pulzáló kék border + összesítő sáv (kód, név, telefon, átvétel, összeg).
2. Fázis-gombok kattintásos tesztje és valódi hatás ellenőrzése DB-ben (`orders.status`) + `admin_audit_log` + `email_send_log` táblákban:
   - **"Készítés alá veszem"** → `new → prepping`, audit log bejegyzés, email kimegy a vásárlónak.
   - **"Elkészült"** → `prepping → ready`, audit, email.
   - **"Átadva"** → `ready → completed`, audit, email, és a `create_invoice_on_order_complete` trigger létrehoz egy `invoices` rekordot.
3. **"Vissza" gombok**: `ready → prepping`, `prepping → new` — silent (nincs email), audit log igen.
4. **Past tab → "Visszaaktiválás"** ellenőrzése egy completed/cancelled renden.
5. Hibakezelés: konzol, `supabase--edge_function_logs` (send-order-status-email), network panel.

Ha bármelyik fázis nem működik (gomb nem reagál, status nem változik, email nem megy ki, audit nem készül) — javítás az érintett komponensben (`OrdersManagement.tsx`, `updateOrderStatus` hook, vagy `send-order-status-email` edge fn) és újrateszt.

## Érintett fájlok

- `supabase/migrations/<új>.sql` — `get_customer_order_items` RPC (security definer, grant `anon` + `authenticated`).
- `src/pages/OrderConfirmation.tsx` — RPC hívás + `timeZone: 'Europe/Budapest'`.
- `supabase/functions/submit-order/index.ts` — pickup_time Budapest→UTC konverzió.
- `src/pages/admin/OrdersManagement.tsx` / hookok — csak ha a tesztelés problémát talál.

## Mit NEM változtatok

- Üzleti logika, árszámítás, kapacitás, rendelés-séma érintetlen.
- `order_items` RLS-t nem lazítok (külön RPC-vel oldjuk meg).
- A `formatPickupTime` jelenlegi naptári formátumát megtartom, csak a TZ-t fixálom.
