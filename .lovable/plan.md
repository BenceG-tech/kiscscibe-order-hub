# Csomagolási (doboz) díj bevezetése

## Cél
Elviteles rendeléseknél automatikusan felszámított dobozdíj, külön sorként megjelenítve a kosárban és a pénztárban.

## Szabályok (jóváhagyva)
- **Főétel: 150 Ft / adag** — napi ajánlat főételei, fix étlap főétel kategóriái és reggelik is.
- **Elviteles menü: 200 Ft / menü** (leves + főétel két doboza).
- **Saláta és savanyúság: 0 Ft** — a doboz ára benne van az árukban.
- Leves külön rendelve: 0 Ft (a user csak főételt és menüt nevezett meg).

## Megvalósítás

### 1. Dobozdíj-számító segédfüggvény (`src/lib/packagingFee.ts`)
- Bemenet: kosár tételei (CartItem[]).
- Szabályok:
  - `daily_type === 'complete_menu'` → 200 Ft × mennyiség.
  - Főétel kategóriájú tétel (napi ajánlat „Főételek" szerep, fix étlap főétel kategória, reggeli) → 150 Ft × mennyiség.
  - Saláta / savanyúság / leves / egyéb → 0 Ft.
- A kategória-felismerés a meglévő `categoryMatcher.ts` mintájára, ékezetfüggetlen név/kategória-egyeztetéssel; a kosártételbe mentett kategória/role mezővel (ha hiányzik, defenzíven 0 Ft, sosem számítunk rá tévesen).

### 2. Kosár és pénztár megjelenítés
- `CartContext`: a dobozdíj NEM kerül bele a `total`-ba tételárként, hanem származtatott értékként (`packagingFee`) számítódik, hogy a tételek ára érintetlen maradjon.
- `CartDialog` és `Checkout` végösszeg-blokk: új sor a kupon sor alatt: „Csomagolás (doboz) – X Ft".
- Fizetendő végösszeg = tételek + dobozdíj − kupon. A gombfelirat („Rendelés véglegesítése – X Ft") és a `totalHuf` küldés is az új végösszeget használja.
- A rendelés `total_huf` mezője a dobozdíjjal növelt összeget tárolja (külső rendszer, számla, e-mail így automatikusan helyes).

### 3. Rendelés-visszaigazolás és személyzet
- Rendelés megerősítő nézet és KDS/nyomtatás: a dobozdíj külön sorban megjelenik („Csomagolás"), hogy a konyha és a vendég is lássa.
- `order_items`-be NEM kerül külön tételként (az árképzés sérülne); a végösszegben benne van.

### 4. Admin beállíthatóság (opcionális, egyszerű)
- A 150/200 Ft értékek a `settings` táblába (`packaging_fees` kulcs), `useRestaurantSettings` mintára; admin felületen szerkeszthető mezők. Alapérték: 150/200, ha a beállítás hiányzik.

### 5. Tesztek
- `tests/reliability.test.ts` mellé új esetek:
  - 2 főétel → 300 Ft; 1 menü → 200 Ft; menü + főétel → 350 Ft.
  - Saláta/savanyúság/leves → 0 Ft.
  - Kupon a dobozdíj NÉLKÜLI részösszegre vonatkozik (kupon-logika változatlan), végösszeg helyes.
  - Üres kosár → 0 Ft, nincs dobozsor.
- `tsgo`, célzott eslint, Playwright: kosár és pénztár képernyő mobilon + asztali nézetben, dobozsor látható, layout nem csúszik.

## Kimarad
- Adatbázis-séma változás: csak egy `settings` sor (nem új tábla, GRANT nem kell).
- Régi rendelések visszamenőleges módosítása: nem történik.
- Publish: nem, csak preview.
