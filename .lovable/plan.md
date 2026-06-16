# Cél

Minden új rendelésnél MINDIG szóljon a hangjelzés és jelenjen meg a felugró ablak — ne csak akkor, amikor a Realtime csatorna "épp működik".

# Miért nem szól most mindig?

Három valódi hibát találtam a `useGlobalOrderNotifications` hookban és az `OrdersManagement` oldalban:

**1. Versengő Realtime csatornák ugyanarra a táblára**
Az `OrdersManagement.tsx` saját csatornát nyit (`orders-updates`), a globális értesítő hook pedig egy másikat (`order-notifications-…`). Mindkettő ugyanazt az `orders` INSERT eseményt figyeli. A Supabase Realtime ilyenkor időnként az egyiknek kézbesít, a másiknak nem — ezért látod a rendelést a listában, de hang/popup nem jön.

**2. Indulási versenyhelyzet ("a rendelés már ismert")**
Induláskor a hook betölti a legutóbbi 100 rendelés azonosítóját `knownOrderIdsRef`-be, hogy ne pittyegjen vissza a régiekre. Ha egy új rendelés pont a betöltés és a csatorna `SUBSCRIBED` állapota közti pár másodpercben érkezik, az ID-ja bekerül az "ismert" halmazba — utána sem a csatorna, sem a 60 mp-es söprés nem szólal meg rá, mert a dedupe szűrő kidobja.

**3. A `CLOSED` állapotot nem kezeljük**
A retry csak `CHANNEL_ERROR` és `TIMED_OUT` esetén indul újra. Token frissítéskor vagy átmeneti hálózati hibánál a csatorna `CLOSED` állapotba mehet és ott marad a következő tab-váltásig — közben hangjelzés sincs.

# Javítás

## 1. Egy közös csatorna, kurzor-alapú söprés
- Töröljük az `OrdersManagement.tsx`-beli külön Realtime csatornát. Helyette az `OrderNotificationsContext` ad ki egy `lastNewOrderAt` jelzést, amire az `OrdersManagement` reagálva újrahívja a `fetchOrders`-t. Egy csatorna marad, kevesebb ütközés.
- A duplikátum-szűrést azonosító-halmaz helyett **`created_at` kurzorra** állítjuk: csak az `lastSeenAtRef`-nél későbbi rendelések szólalnak meg. Így az indulási résben érkező rendelés is biztosan értesít.
- Az indulási `known IDs` betöltést megtartjuk, de csak a kurzor inicializálására használjuk (a legfrissebb `created_at`-et vesszük), nem ID-halmazként.

## 2. `CLOSED` retry + heartbeat
- A `subscribe()` callbackben a `CLOSED` állapotra is exponenciális retry induljon.
- A meglévő 60 mp-es safety sweep mellé bekerül egy **30 mp-es ping**: ha a csatorna utolsó `SUBSCRIBED` óta > 90 mp telt el INSERT esemény nélkül, automatikusan újrasubscribe.

## 3. Söprés mindig értesít a kurzorhoz képest
A `sweepMissedOrders` jelenleg `handleNewOrder`-on át megy, ami az ID-szűrő miatt elnyelheti az eseményt. Az új kurzor-logikával ez megszűnik: minden a `lastSeenAtRef`-nél újabb rendelés értesít, függetlenül attól, hogy a csatorna már látta-e.

# Technikai részletek

Érintett fájlok:
- `src/hooks/useGlobalOrderNotifications.tsx` — kurzor-alapú dedupe, `CLOSED` kezelés, 30 mp heartbeat, közös `lastNewOrderAt` kiadása.
- `src/contexts/OrderNotificationsContext.tsx` — `lastNewOrderAt: string | null` mező hozzáadása a contexthez.
- `src/pages/admin/OrdersManagement.tsx` — a saját Realtime csatorna eltávolítása; helyette `useEffect` a context `lastNewOrderAt` változására, ami `fetchOrders()`-t hív.
- `src/pages/staff/StaffOrders.tsx` — ha van saját csatornája, ugyanígy átállítjuk (ellenőrzöm implementáláskor).

Nem módosítom:
- a hangjelzés és vibráció logikáját (működik),
- a felugró modal UI-t,
- az audio-unlock kezelést,
- a backend / edge function / DB részt.

# Ellenőrzés implementálás után

1. Böngészőben `/admin/orders` megnyitva, console-ban: `[Notifications] ✅ Successfully subscribed` látszik.
2. Új rendelés leadása másik tabon → hang + popup azonnal.
3. Tab háttérbe küldése 2 percre, új rendelés közben → visszatéréskor sweep elsüti a hangot és popup-ot.
4. Hálózat ki-be kapcsolása → automatikus reconnect logban, és a közben érkezett rendelés értesít.
