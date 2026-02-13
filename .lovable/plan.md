

# Kettős fejlesztés: Naptár mobilos javítás + Staff KDS bővítés

## Probléma 1: Naptár mobilon elcsúszik + nem egyértelmű a hétváltás

A screenshotokon látható, hogy a "HÉTFŐ" felirat bal oldalon levágódik, és péntek délután 6-kor a felhasználó egy üres hetet néz anélkül, hogy egyértelmű lenne, hogy a következő hétre kell navigálni.

### Javítások

**a) WeeklyDateStrip mobilos méretezés**
- A `min-w-[56px]` túl széles 5 cellánál kis kijelzőn (5x56 = 280px + gap + nyilak = túlcsordulás)
- Csökkentés: `min-w-[48px]` mobilon, `md:min-w-[72px]` desktopon
- A napnevek rövidítése mobilon: "H", "K", "SZE", "CS", "P" (jelenleg "Hétfő", "Kedd", stb.)
- A gap csökkentése: `gap-1` mobilon

**b) Automatikus hétváltás zárás után**
- A `getSmartInitialDate()` (dateUtils.ts) már jól működik: péntek 15:00 után hétfőre ugrik
- DE a `WeeklyDateStrip` mindig `weekOffset=0`-ról indul, ami az aktuális hetet mutatja
- Javítás: ha a `selectedDate` (ami a smart date) a következő hétre esik, a `weekOffset` automatikusan 1-gyel induljon
- A `useEffect`-ben kiszámoljuk: ha a selectedDate nem az aktuális héten van, weekOffset = megfelelő offset

**c) "Következő hét" vizuális jelzés**
- Ha az aktuális hét minden napja "múltbeli" (isPast), egy banner jelenik meg a naptár alatt: "Ez a hét lezárult. Nézd meg a következő hét menüjét!" egy feltűnő nyíl gombbal
- A jobb oldali ChevronRight gomb kap egy pulzáló animációt ha az aktuális hét "üres" (nincs jövőbeli nap)

## Probléma 2: Staff KDS fejlesztések

A jelenlegi KDS működik (Kanban oszlopok, swipe, hangjelzések), de hiányzik néhány fontos segédeszköz a személyzet számára.

### Új elemek a Staff oldalon

**a) Napi összesítő sáv (a StatusSummaryBar fölé)**
Egy kompakt info-sor 3-4 adattal:
- **Mai rendelések:** darabszám (csak completed + active, nem cancelled)
- **Aktív most:** new + preparing + ready összesítve
- **Következő átvétel:** a legközelebbi pickup_time countdown ("12:15 — 8 perc múlva"), vagy "Nincs" ha üres
- Minden 30 másodpercben frissül (a meglévő tick timer-rel)

**b) Tételösszesítő (Items to Prepare)**
- Új összecsukható szekció a Kanban oszlopok felett
- Aggregálja a `new` + `preparing` státuszú rendelések tételeit: "14x Gulyásleves, 8x Rántott csirke, 6x Túrós rétes"
- Segít a konyhai batch-főzés tervezésében
- Alapból összecsukott állapotban (nem foglal helyet)

**c) Pickup idő szerinti rendezés**
- Az aktív rendelések a `pickup_time` szerint rendezettek (legkorábbi elöl), nem a `created_at` szerint
- Ha nincs pickup_time, a created_at a fallback

### Ami NEM változik a Staff oldalon
- Nem lát bevételi adatokat (total_huf marad a kártyákon, de nincs összesítő)
- Nem lát email címet (csak telefon)
- Nem lát analytics/menu szerkesztést
- A KDS kártya mérete, színkódolás, gombok nem változnak

---

## Technikai részletek

### Módosítandó fájlok

| Fájl | Változás |
|------|----------|
| `src/components/WeeklyDateStrip.tsx` | Mobilos méretezés javítás, rövidebb napnevek, auto weekOffset számítás, "következő hét" jelzés |
| `src/lib/dateUtils.ts` | Új segédfüggvény: `getWeekOffset(selectedDate)` — kiszámolja hogy a selectedDate melyik hétre esik az aktuálishoz képest |
| `src/pages/staff/StaffOrders.tsx` | Napi összesítő sáv, tételösszesítő szekció, pickup_time szerinti rendezés |
| `src/components/staff/StatusSummaryBar.tsx` | NEM változik (megmarad ahogy van) |

### Új fájlok

| Fájl | Leírás |
|------|--------|
| `src/components/staff/DailyStaffSummary.tsx` | Napi összesítő sáv: rendelésszám, aktív, következő átvétel |
| `src/components/staff/ItemsToPrepareSummary.tsx` | Összecsukható tételösszesítő lista |

### Adatforrások
- Minden adat a már meglévő `orders` + `order_items` lekérdezésekből jön (StaffOrders.tsx már lekéri ezeket)
- Nincs új Supabase query szükséges — az aggregáció frontenden történik a meglévő adatokból

### Nem módosul
- Rendelési/kosár/checkout logika
- Admin dashboard/analytics
- KDS kártya design és gombok
- Backend/edge function-ok
- Adatbázis séma

