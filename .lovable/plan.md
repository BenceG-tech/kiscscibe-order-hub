## 1. Reggeli kártyák gomb-elcsúszás javítása (mobil)

A főoldali Reggeli szekcióban a "Kosárba" gomb és az ár-badge kilóg a kártyából (lásd csatolt kép), mert egy sorban van a 2 elem és nincs elég hely 402px viewport-on.

**Megoldás (csak `BreakfastSection.tsx` UI):**
- Az ár-badge-et nagyobbra, a kártya tetején a kép sarkára helyezem (úgy, ahogy a napi ajánlatnál is van) — így nem foglal helyet az alsó sávban.
- A "Kosárba" gomb teljes szélességű lesz (`w-full`), alatta saját sorban — soha nem csúszik ki.
- Kép arányt 4:3 helyett 1:1 négyzetre veszem mobilon a kompaktabb megjelenésért, és a leírást rövidebb `line-clamp-1`-re csökkentem hogy a kártyák egységes magasságúak maradjanak.
- Asztali nézet (md+) változatlanul olvasható marad.

## 2. Jövő heti ajánlat mentésének hibája

A pontos hibaüzenet nélkül megnéztem a kódot — a `WeeklyMenuGrid` ("Heti menü kezelő") mentési logika rendben van, az adatbázis triggerek és RLS szabályok engedik a jövőbeli dátumokat (csak múltbelit blokkol a `validate_daily_item_date`).

**Diagnosztika lépései:**
- A `WeeklyMenuGrid.tsx` `addItemMutation`, `updatePriceMutation` és `toggleMenuPartMutation` `onError` toast üzeneteit kibővítem a tényleges hibaüzenettel (`error.message`) — így legközelebb látszani fog, mi a pontos hiba (RLS, validáció, hálózat stb.).
- Ugyanezt a `UnifiedDailyManagement.tsx` `saveOffer` catch ágában is — a jelenlegi "Nem sikerült menteni" toast helyett a Supabase hibaüzenetét is megjeleníti.
- Ellenőrzöm (és szükség esetén javítom), hogy a `daily_offers` insert nem ütközik-e az "Admin can manage daily offers" `USING false` policy-vel — ez bár permissive és OR semantikájú, de a `false`-os duplikátum policy felesleges és zavaró; eltávolítom migrációval.

## Fájlok

- `src/components/sections/BreakfastSection.tsx` — kártya layout átdolgozás
- `src/components/admin/WeeklyMenuGrid.tsx` — kibővített hibaüzenetek
- `src/components/admin/UnifiedDailyManagement.tsx` — kibővített hibaüzenet
- Migráció: redundáns `Admin can manage daily offers` (USING false) és `Admin can manage daily offer items` policy-k törlése

## Megjegyzés

Ha a részletesebb hibaüzenet után kiderül, hogy konkrét adatbázis-hiba van (pl. RLS, validáció), azt egy következő lépésben javítjuk. A backend logikát egyébként nem módosítom, csak a hibakezelést teszem informatívvá.