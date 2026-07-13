
# Terv — 3 döntés végrehajtása + adaptív értesítő panel

## 1) P1 — Érthető hibaüzenetek (submit-order)

**Cél:** A nyers Postgres trigger-hibák helyett magyar, vevőnek érthető szövegek jelenjenek meg.

**Feltárás:** A `supabase/functions/submit-order/index.ts` catch-ágában és a validációknál átnézzük az összes ismert trigger/RPC hibaforrást:
- `validate_order_date` → „Cannot place orders for past dates or times" / „Pickup time is outside business hours"
- `validate_daily_item_date` → „Cannot create daily items for past dates"
- `update_capacity_slot` → „Az időpont közben betelt (foglalt: X, max: Y)" (ez már magyar, marad)
- `update_daily_portions` → „Insufficient portions available"
- `atomic_coupon_increment` false → kupon lejárt/elfogyott
- `validate_coupon_code` üzenetek (már magyar)
- generikus fallback: „Rendelés mentési hiba"

**Megoldás:** Bevezetünk egy `mapDbErrorToHungarian(err: unknown): string` helper-t a submit-order fv. tetején, ami stringmatch alapján ismert hibákat leképez:

| Trigger üzenet (részlet) | Vevőnek megjelenő magyar |
|---|---|
| `past dates or times` | „A választott átvételi idő már elmúlt — kérjük, válassz későbbi időpontot." |
| `outside business hours` | „A választott időpont nyitvatartási időn kívül esik (H–P 07:00–16:00)." |
| `Insufficient portions` | „Sajnos időközben elfogyott az adag ebből az ételből." |
| `Az időpont közben betelt` | változatlanul továbbadva |
| `daily items for past dates` | „A választott nap már lezárult, nem rendelhető." |
| bármi más | „Rendelés mentési hiba — kérjük próbáld újra, vagy hívj minket." |

A `submit-order` minden hibaválaszában (`return new Response(... status: 4xx/5xx ...)`) ezen keresztül megy a `error` mező.

## 2) Hírlevél feladók javítása (BACKLOG-2b, 2c)

**Egy commit, két fájl:**

- `supabase/functions/send-welcome-newsletter/index.ts`:
  - `from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>'`
  - `reply_to: 'info@kiscsibeetterem.hu'` hozzáadása
  - Message ID naplózása console-ba (mint a többi fv-ben)
  - **A meglévő 6 feliratkozónak semmi nem megy** — a fv. csak új feliratkozáskor fut, ez már így van (5 perces friss-feliratkozás check védelem)
- `supabase/functions/send-weekly-menu/index.ts`:
  - Ugyanez a `from` + `reply_to` csere minden `resend.emails.send` hívásnál

**Verifikáció:**
- `send-welcome-newsletter`: valódi TESZT feliratkozás beszúrása a `subscribers` táblába (`AUDIT TESZT WELCOME` prefix), fv. meghívása, message ID naplózás, majd a teszt sor törlése
- `send-weekly-menu`: dry-run meghívás egy TESZT email címre (owner címére) — message ID rögzítés

## 3) Adaptív értesítő overlay több egyidejű rendeléshez

**Meglévő architektúra:**
- `useGlobalOrderNotifications` hook: Realtime + polling + `newOrdersQueue` state (nem tudom pontos struktúráját — build módban megnézem), egyetlen hang forrás (K1 dedupe)
- `OrderNotificationsProvider` → `OrderNotificationModal` (jelenleg egyesével jelenít meg egy `currentNotification`-t + `pendingCount`-ot)

**Új komponens:** `src/components/admin/OrderNotificationOverlay.tsx`

**Props (a hookból):**
```
orders: PendingOrder[]         // az összes még nem nyugtázott új rendelés
onDismissOne: (id) => void     // egy kártya X
onDismissAll: () => void       // "Összes bezárása"
onViewOne: (id) => void        // navigate + nyugtáz
onViewAll: () => void          // navigate lista + nyugtáz mindet
navigateTo: string
```

**Adaptív rács (Tailwind, `orders.length` alapján):**

| Darab | Elrendezés | Kártya-méret |
|---|---|---|
| 1 | jelenlegi nagy középső kártya | változatlan |
| 2 | `grid-cols-2` | közepesen kicsi |
| 3–4 | `grid-cols-2` (2×2) | közepes |
| 5–9 | `grid-cols-3` (3×3) | kompakt |
| 10+ | `grid-cols-3`, `max-h-[80vh] overflow-y-auto`, fejlécben számláló | kompakt |

**Mobil (`useIsMobile`):** mindig `grid-cols-1`, `max-h-[85vh] overflow-y-auto`, gombok `h-12`.

**Kártya-tartalom (minden méretben):** kód (`#XXXXX`), összeg (Ft), átvételi idő, beérkezés ideje, „Megtekintés" gomb, X gomb. Kompakt módban ikonok kisebbek, fontok skálázódnak.

**Overlay fejléc:** „N új rendelés érkezett!" + „Összes megtekintése" + „Összes bezárása" gombok.

**Rendezés:** `pickup_time ASC NULLS LAST` — legsürgősebb elöl. Új rendelés érkezésekor a helyére szúródik, meglévők nem ugrálnak (React key = order.id).

**Hang-dedupe (K1) megőrzése:**
- A `useGlobalOrderNotifications` hook továbbra is az egyetlen hangforrás
- Új rendelésenként egyszer szól a hang (a meglévő logikát nem módosítjuk)
- Verifikációban `console.log('[notification-sound] play', orderId)` a hook-ban, hogy Playwright-tal megszámoljuk

**Last-seen mechanizmus:** a meglévő localStorage `lastSeenOrderId` / `dismissed` set-re építünk — nyugtázott kártya oldal-frissítés után nem jelenik meg újra.

**Kontextus-API változás (`OrderNotificationsContext`):**
- A hook mostantól `pendingOrders: PendingOrder[]` listát ad vissza (nem csak `currentNotification`)
- Új: `dismissOrder(id)`, `dismissAll()` a `dismissNotification` helyett/mellett
- `OrderNotificationsProvider` az új overlay-t rendereli, ha `pendingOrders.length > 0`

**Régi `OrderNotificationModal.tsx`:** megtartjuk 1-es esetre reusable kártyaként (`OrderNotificationCard` néven kiemelve), vagy inline az overlay-ben — build közben döntjük el a legkisebb diff alapján.

## 4) Verifikáció (build végén, egy Playwright futásban)

**Hibaüzenetek:** manuális invoke a `submit-order`-re múltbeli `pickup_time`-mal, ASSERT a magyar üzenetre.

**Overlay:** direkt DB `INSERT`-tel 1, 2, 4, 10 db TESZT rendelés (érvényes jövőbeli `pickup_time`, `AUDIT TESZT OVERLAY` prefixű `name`), `/admin/orders`-en Playwright screenshot mindegyik elrendezésről (1280×1800). Konzol logokból megszámoljuk a hang-eseményeket: 10 új rendelés → 10 log, nem több.

**Takarítás:**
- `UPDATE email_send_log SET order_id = NULL WHERE order_id IN (teszt id-k)` majd DELETE rendelések/items/coupon usages
- Subscribers TESZT sor törlése
- `email_send_log` sorok megmaradnak bizonyítékként

## 5) Záró jelentés

- Változtatás-lista fájlonként
- Küldött emailek táblázata (funkció, cím, Resend message ID, Europe/Budapest időbélyeg)
- Hibaüzenet-mapping tábla
- Overlay screenshotok (1, 2, 4, 10 rendelés + mobil)
- Hang-dedupe bizonyíték (console log count)

## Fegyelem

- Egy hiba → egy fix → verifikáció, max 3 ciklus
- Nem nyúlunk DB triggerekhez, secretekhez, RLS-hez
- A K1 hang-dedupe-ot nem törjük vissza
- A meglévő `useGlobalOrderNotifications` polling/Realtime logika változatlan
