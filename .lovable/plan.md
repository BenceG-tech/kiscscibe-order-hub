# Reggeli kártyák kompakttá tétele

## Cél
A reggeli ételek kártyái túl nagyok; sokkal tömöttebb, kisebb vertikális kártyákat kapnak. A napi ajánlat és a napi menü kártyái a mostani reggeli méreténél maradnak.

## Változtatások
1. **Új kompakt mód a meglévő FoodCard komponenshez**
   - Opcionális `compact?: boolean` prop bevezetése.
   - Kompakt állapotban:
     - kép aránya kisebb (pl. 16:9 vagy 2:1 a jelenlegi 16:10 helyett),
     - belső padding csökken (pl. `p-3 md:p-4`),
     - ételnév mérete kisebb (pl. 16–17 px mobil, 18 px asztali),
     - leírás max. 1 sor (`line-clamp-1`),
     - ár mérete kisebb (pl. 15–16 px),
     - „Kosárba" gomb alacsonyabb (pl. 40–44 px), de továbbra is kényelmes érintési célpont,
     - a kártya lágy lekerekítése és stílusa megmarad, csak arányai csökkennek.

2. **Reggeli szekció frissítése**
   - `src/components/sections/BreakfastSection.tsx` mindkét változatában (`variant="page"` és `variant="homepage"`) a kompakt `FoodCard`-ot használja.
   - A grid oszlopai nem változnak (`sm:grid-cols-2 lg:grid-cols-3` a főoldalon, `/etlap` oldalon `sm:grid-cols-2`).
   - A kosárbaadás, toast és egyéb működés érintetlen marad.

3. **Napi ajánlat és napi menü érintetlensége**
   - A `UnifiedDailySection` „További napi ételek" kártyái továbbra is normál `FoodCard`-ot használnak (mostani reggeli méret).
   - A `DailyMenuPanel` leves/főétel kártyái és a közös CTA nem változnak.
   - A reggeli új kompakt mérete nem terjed át a napi ajánlatra/menüre.

## Technikai keretek
- Csak a vendégoldali kártyamegjelenés változik; kosár, rendelés, Supabase-lekérdezések, RLS, auth, admin, árak érintetlenek.
- A rejtett adminbelépési gesztus (5 kattintás a logón) megmarad.
- Piros UI-elem nem kerül be; a meglévő színtokeneket használjuk.
- A mozgások tiszteletben tartják a `prefers-reduced-motion` beállítást.

## Ellenőrzés
- `/etlap` 1280 px és 390 px nézet: a reggeli kártyák jelentősen kisebbek, a napi ajánlat/menü nem zsugorodik.
- Főoldal 1280 px és 390 px nézet: ugyanez.
- Hosszú ételnevek, hiányzó kép, kosárgomb, toast működése.
- Típusellenőrzés és célzott lint hibamentesen.
- Preview-only; publikálás nem történik.
