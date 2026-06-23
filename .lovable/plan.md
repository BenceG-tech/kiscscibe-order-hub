# Admin frissítések — egyesített rendeléskezelés + új funkciók

## 1. Félbehagyott/sikertelen rendelések ÁTHELYEZÉSE
- A különálló `/admin/failed-orders` oldalt **megszüntetjük**
- A meglévő `/admin/orders` (Rendelések) oldalon új fülek kerülnek a tetejére:
  - **Aktív rendelések** (jelenlegi tartalom)
  - **Sikertelen próbálkozások** (a hibára futott rendelések — név, telefon, kosár, hibaüzenet, „Visszahívás" gomb)
  - **Félbehagyott kosarak** (5+ perce inaktív, nem véglegesített — név, telefon, meddig jutott)
- A „Több" menüből kivesszük a „Félbehagyott" linket
- App.tsx-ből kivesszük a `/admin/failed-orders` route-ot

## 2. „Frissítések" banner az admin tetején (napokig látszik)
- Új komponens: `AdminUpdatesBanner.tsx` az admin layout tetejére (sticky header alatt)
- A `CHANGELOG` utolsó **7 napos** bejegyzéseit mutatja, lapozható
- „Megtekintve" gombbal egyenként elrejthető (localStorage-ban tárolva ID szerint)
- „Mind elrejtése" gombbal egyszerre eltüntethető
- 7 napnál régebbi bejegyzések automatikusan eltűnnek
- Új CHANGELOG bejegyzések hozzáadva a tegnapi/mai munkáról

## 3. Rendszer önellenőrző gomb
Új edge function: `system-health-check`
Új admin komponens: `SystemHealthCheck.tsx` az Irányítópult tetején — „Rendszer ellenőrzés futtatása" gomb.

**Mit ellenőriz (egy gombnyomásra, ~10 mp):**
1. **Napi ajánlat ma** — létezik-e mai dátumra, van-e leves+főétel, ár beállítva
2. **Kapacitás idősávok** — vannak-e mai napra `capacity_slots`
3. **Submit-order edge function** — teszt rendelést küld `dry_run: true` flaggel; végigfuttatja a validációt, de nem ment
4. **Adatbázis írási jog** — próba `order_attempts` rekord beszúrása és törlése
5. **E-mail szolgáltatás** — Resend ping
6. **Régóta új rendelés** — > 30 perce „new" státuszban figyelmeztetés
7. **Sold-out tételek** — figyelmeztet, ha minden napi tétel kifogyott

**UI:** zöld ✓ / sárga ⚠ / piros ✗ minden tételhez, részletes hibaüzenettel, utolsó futás időpontja.

## 4. Admin kézikönyv frissítés (`adminHelpContent.ts`)
- Új szekció: **Sikertelen / Félbehagyott rendelések** (most a Rendelések oldalon)
- Új szekció: **Rendszer önellenőrzés** használata
- Új szekció: **Frissítések banner** értelmezése

## Technikai részletek
- **Új fájlok:**
  - `src/components/admin/AdminUpdatesBanner.tsx`
  - `src/components/admin/SystemHealthCheck.tsx`
  - `src/components/admin/orders/FailedAttemptsTab.tsx` (vagy inline a Orders-ben)
  - `src/components/admin/orders/AbandonedCartsTab.tsx`
  - `supabase/functions/system-health-check/index.ts`
- **Módosítások:**
  - `src/pages/admin/Orders.tsx` — Tabs hozzáadása, 3 nézet
  - `src/pages/admin/AdminLayout.tsx` — banner + „Félbehagyott" link eltávolítása
  - `src/pages/admin/Dashboard.tsx` — Health Check panel
  - `src/App.tsx` — `/admin/failed-orders` route eltávolítása
  - `src/data/adminHelpContent.ts` + `adminChangelog.ts`
  - `supabase/functions/submit-order/index.ts` — `dry_run` opció (validál, de nem ment)
- **Törölt fájl:** `src/pages/admin/FailedOrders.tsx`

## Mit NEM változtatunk
- Brand, szín, font, layout, meglévő rendelés flow érintetlen