## Cél

Az AI által generált ételképek a jövőben ne stúdió-fotó stílusú "fehér porcelán tányér sötét palán" felállásban készüljenek, hanem a Kiscsibe Étterem valódi tálalási stílusát tükrözzék — ahogy a feltöltött referenciaképeken is látszik.

## Két autentikus stílus (véletlenszerűen váltakozva)

**A) Fehér papír (műanyag) ovális tányér**
- Egyszerű fehér, enyhén fényes ovális elviteles tányér
- Sötét/sötétszürke asztal háttér
- Felülről kicsit ferdén fotózva (kb. 60–75°)
- Természetes nappali fény
- Magyaros tálalás, friss petrezselyem zöld díszítés

**B) Kartondoboz piros-fehér kockás papírral**
- Barna kraft kartondoboz (elviteles)
- Belül piros-fehér kockás (vichy mintás) sütőpapír
- Az étel a kockás papíron fekszik
- Háttér: fa asztal vagy étterem belső, kicsit elmosódva
- Ferde, közeli kompozíció, természetes fény
- Mellette kis friss saláta-uborka-paradicsom dekor (opcionális)

## Implementáció

**Egyetlen fájl módosul:** `supabase/functions/generate-food-image/index.ts`

1. A jelenlegi fix `prompt` (fehér porcelán + sötét pala) helyett egy **prompt-választó** logika:
   - Ha a hívó küld `style` paramétert (`"plate"` vagy `"box"`), azt használjuk
   - Egyébként véletlen 50/50 választás a két stílus között
   - `prompt_override` továbbra is felülír mindent (visszafelé kompatibilis)

2. Két új prompt-sablon (angol nyelven, az AI modell így pontosabb):
   - **plate prompt**: "Authentic Hungarian restaurant takeaway photo of '{item_name}'. Served on a simple white oval disposable paper/plastic plate on a dark slate/wooden table. Shot from a slight overhead angle (~60-70°), soft natural daylight. Garnish with fresh parsley. Homestyle, generous portion, realistic restaurant presentation — NOT studio food photography. Photorealistic."
   - **box prompt**: "Authentic Hungarian restaurant takeaway photo of '{item_name}'. Served in a brown kraft cardboard takeaway box lined with red-and-white checkered (vichy/gingham) parchment paper. Wooden restaurant table background, slightly blurred. Shot from a close angled perspective, natural daylight from a window. Optional small fresh side salad (lettuce, tomato, cucumber) garnish. Homestyle, generous portion. Photorealistic, NOT studio food photography."

3. Az `AIGenerateImageButton` komponens **nem változik** — automatikusan élvezi az új stílust. Opcionálisan később bővíthető egy stílus-választóval, de most nem szükséges.

## Mit NEM változtatunk
- Nincs DB séma változás
- Nincs frontend változás
- Az `AIBatchImageGenerator` és `DailyOfferImageGenerator` (FB poszt) is változatlan marad — utóbbi külön edge function-t használ
- A `generate-food-image` API szerződés visszafelé kompatibilis (csak új opcionális `style` paraméter)

## QA
- Generálok 2-3 tesztképet a Mesterétel-könyvtárból különböző ételekre
- Ellenőrzöm: tényleg váltakozik a két stílus, az ételek felismerhetőek, a tálalás autentikus magyaros (nem michelin-csillagos)
