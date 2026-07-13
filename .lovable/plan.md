## Amit most látok

- Az `orders` táblában a legutóbbi rendelés 2026-07-02, tehát jelenleg nem arról van szó, hogy az admin felület szűri el a friss rendeléseket.
- Az `order_attempts` táblában is csak egy régi, július 2-i sikertelen próbálkozás van.
- Az `abandoned_carts` üres, tehát a checkout nyomkövetés sem jelez friss beírt/elhagyott rendelést.
- A Supabase function edge HTTP logokban nem látszik friss `submit-order` hívás.
- A mai napi ajánlatok publikusak és van készlet, blackout nincs.

Ez alapján a legvalószínűbb hiba: a vendég oldali rendelési folyamat nem jut el a `submit-order` edge function hívásig, vagy a function hívás nincs megfelelően naplózva/diagnosztizálva. Emiatt az étterem nem lát sem rendelést, sem sikertelen próbálkozást.

## Sürgős javítási terv

### 1. Checkout hibanyom megfogása kliens oldalon
- A `Checkout` oldalon minden submit-kísérletnél azonnal rögzítek egy diagnosztikai sort az `abandoned_carts` táblába `step='submit_attempt'` értékkel.
- Ha a `submit-order` function hibával tér vissza, timeoutol, vagy hálózati hibát dob, frissítem ugyanazt a sort `step='submit_failed'` állapotra a hibaüzenettel.
- Így akkor is látni fogjátok az adminban, hogy valaki rendelni próbált, ha maga az order insert nem sikerült.

### 2. Function-hívás timeout és barátságos hiba
- A `submit-order` hívást explicit timeouttal védem, hogy a vendég ne ragadjon végtelen spinnerben.
- Hiba esetén érthető üzenetet kap: „A rendelési kísérletet rögzítettük, az étterem látni fogja. Kérjük próbáld újra vagy jelezd az étteremnek.”

### 3. Admin „Sikertelen/Félbehagyott” láthatóság erősítése
- A rendeléskezelő felület fejlécében kiemelem, ha van friss sikertelen vagy submit-kísérlet.
- A „Sikertelen” / „Félbehagyott” füleken badge számláló jelenjen meg, ne kelljen rákattintani ahhoz, hogy feltűnjön.
- A listában külön jelölöm a `submit_attempt` és `submit_failed` állapotokat.

### 4. Backend diagnosztika a `submit-order` functionben
- A function elején és minden fő hibaponton megbízhatóbb `order_attempts` rögzítést tartok fenn.
- A `complete_menu` mezőket ellenőrzöm: a frontend már `daily_id ?? menu_id` értéket küld, de a TypeScript típusban a `complete_menu` hiányzik; ezt javítom, hogy ne legyen rejtett típushiba.
- A még fennmaradó audit-kockázatokból a közvetlen rendelésvesztést okozókat javítom: opció insert hibák ne legyenek csendben elnyelve, kupon rollback kerüljön be, kapacitás-slot race kezelése.

### 5. Ellenőrzés
- Ellenőrzöm a mai menü/kosár útvonalat böngészőből.
- Leadási próbával validálom, hogy legalább a submit-kísérlet megjelenik az adminban akkor is, ha a rendelés mentése hibázna.
- Megnézem újra az `orders`, `order_attempts`, `abandoned_carts` táblákat és a function logokat.

## Technikai részletek

Érintett területek:
- `src/pages/Checkout.tsx`
- `src/hooks/useAbandonedCartTracking.tsx`
- `src/components/admin/orders/FailedAndAbandoned.tsx`
- `src/pages/admin/OrdersManagement.tsx`
- `supabase/functions/submit-order/index.ts`

Adatbázis-séma módosítás várhatóan nem kell, mert az `abandoned_carts` már tartalmazza a szükséges mezőket: `step`, `cart_snapshot`, `customer_*`, `last_activity_at`.

## Prioritás

Először azt javítom, hogy semmilyen rendelési próbálkozás ne tűnhessen el nyomtalanul. Utána jönnek a kényelmi/admin átláthatósági elemek.