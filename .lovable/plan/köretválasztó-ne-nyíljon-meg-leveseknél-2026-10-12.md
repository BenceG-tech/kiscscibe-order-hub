# Köretválasztó ne nyíljon meg leveseknél

## Ok
A főoldali „Mai ajánlatunk" szekció (`UnifiedDailySection.tsx`) minden étel kosárba tételénél feldobja a „Válassz köretet" ablakot — leveseknél is. Az `/etlap` oldal (`Etlap.tsx`) már helyesen kezeli: levesnél közvetlenül kosárba teszi, köretválasztó nélkül.

## Javítás
1. `UnifiedDailySection.tsx` `handleAddItemToCart`: ha az étel `menu_role === 'leves'` (vagy nem főétel), közvetlenül kerüljön a kosárba köretválasztó nélkül — ugyanazzal a toast üzenettel, mint az étlapon.
2. Ellenőrzöm a `DailyItemSelector.tsx`-et is, hogy ott sem nyílik-e feleslegesen levesnél; ha igen, ugyanaz a javítás.

## Ellenőrzés
- Típusellenőrzés, tesztek.
- Playwright: főoldalon leves kosárba tétele → nincs köretválasztó, azonnal kosárban; főételnél továbbra is megnyílik a választó.
- Csak preview, nem publikálok.
