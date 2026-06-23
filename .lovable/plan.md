## Mit találtam

Élő teszttel végigvittem egy valódi rendelést (Napi Menü → kosár → checkout → Rendelés leadása). A backend `submit-order` függvény **400-as hibával dobta vissza** ezzel az üzenettel:

> *"A napi ajánlat/menü csak 2026-06-23 dátumra rendelhető, de 2026-06-24 dátumra próbálta leadni"*

Ez a hiba az **átvételi időpont és a napi menü dátumának eltérése** miatt jön elő. Bizonyos esetekben (időzónázás, automatikus időpont-választás, vagy ha a vendég a felület alján egy holnapi időpontot lát/választ) a kliens egy másnapi időpontot küld a mai napi menühöz, és a szerver szigorúan visszadobja.

Találtam **két további rejtett hibát is**:

1. **`daily_offers.price_huf` mező NULL** minden eddigi napi ajánlatnál. Ha valaki a régi „teljes napi ajánlat csomag" gombon át rendelne (daily_type=`offer`), a szerver `unit_price_huf` NULL-t próbálna beírni → INSERT hiba („Rendelési tétel mentési hiba"). Ma még nem jelenik meg ez a gomb a kosárban, de védeni kell ellene.
2. **Egy „féllábú" rendelés (Z00764)** maradt a DB-ben a tegnapi diagnosztika miatt — fejléc van, tételek nincsenek. Ez kavart okozhat az adminban / KDS-ben.

## Mit javítok

### 1) `supabase/functions/submit-order/index.ts` — a fő hiba javítása

- **Ha a kosárban pontosan egy napi tétel van**, és a vendég átvételi dátuma nem egyezik a napi tétel dátumával, akkor **a szerver automatikusan a napi tétel dátumára igazítja az átvételi dátumot** (a kapacitás-slot keresés/foglalás is ezzel a dátummal történik) — nem dob hibát. Cserébe naplózza, hogy autokorrekció történt.
- **Hozzáadok egy biztonsági fallbacket az `offer` / `menu` daily_type-hoz**: ha `price_huf` NULL, használja a kliens által küldött `unit_price_huf`-ot (validálva: > 0 és ≤ 10000 Ft), különben dobjon érthető magyar hibát („A napi ajánlat ára nincs beállítva — kérjük értesítse az éttermet"). Így a NULL ár sem omlasztja össze a rendelést.
- A többi validáció marad: készlet, üzleti óra, kupon, kapacitás.

### 2) `src/pages/Checkout.tsx` — kliensoldali védelem

- A `fetchTimeSlots` után, ha `dailyDates` pontosan egy dátumot tartalmaz és a kiválasztott `pickup_date` ettől eltér, **felülírom a kosárban lévő napi tétel dátumára**. Így a vendég soha nem küldhet eltérő dátumot.
- Az átvételi időpont-választó kártyák fejlécében már most is megjelenik a figyelmeztetés („Napi ajánlat/menü miatt csak X dátumra lehet átvenni") — ezt megerősítem vizuálisan (sárga keret), hogy a vendég ne kattintson rosszul.

### 3) Adatbázis-takarítás (egy migrációval)

- Törlöm a féllábú **Z00764** rendelést (és az ehhez tartozó esetleges `order_item_options` / `order_items` sorokat).
- Törlöm a mai 3 diagnosztikai tesztrendelést (`Test Diag`, `Test Menu`, `Test Single`) is, hogy ne zavarja az aznapi statisztikát és a tulajdonosi nézetet.

### 4) Ellenőrzés

A módosítások után újra végigfutok egy teljes rendelést élőben (Playwright), megnézem hogy 200-as választ kapunk és a rendelés megjelenik az adminban. A konkrét hibaüzeneteket az edge function logból visszanézem.

## Amit NEM csinálok most

- Nem nyúlok a notification-rendszerhez (előző körben már javítottuk), és nem írom át a kosár-/időpont-logikát szélesebb körben. A cél: a rendelés-leadás MA álljon helyre, a többi finomítás később.
- Nem töltöm fel `daily_offers.price_huf`-ot — az tulajdonosi döntés (a Napi Menü ára most a `daily_offer_menus.menu_price_huf`-ban van helyesen, 2200 Ft).

A javítások után minden vendég le tudja adni a rendelést, függetlenül attól, hogy melyik időpontot választja az aznapi napi menühöz.
