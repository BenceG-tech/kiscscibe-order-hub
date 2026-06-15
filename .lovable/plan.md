## Terv: Étlap ételkártya képek javítása

### Probléma
Az AI-generált ételképek 1:1 (négyzet) arányban készülnek, de az Étlap oldalon (`src/pages/Etlap.tsx`) jelenleg `aspect-[4/3]` + `object-cover` van beállítva, ami még mindig levágja a tányér tetejét és alját. A `hover:scale-105` is fokozza a "ráközelített" érzést.

### Megoldás

**1. `src/pages/Etlap.tsx` – "További napi ételek" kártyák (kb. 399. sor)**
- `aspect-[4/3]` → `aspect-square` (1:1), hogy pontosan illeszkedjen az AI-generált 1:1 képekhez. Így semmit nem vág le.
- `object-cover` marad (élesebb kitöltés), de mivel az arány megegyezik a forrásképpel, gyakorlatilag nem lesz vágás.
- A háttér gradient maradjon a fallback ikonhoz.
- A `hover:scale-105` zoom hatást enyhítjük `hover:scale-[1.02]`-re, hogy ne tűnjön túl agresszívnek.

**2. `src/components/DailyMenuPanel.tsx` – fő napi menü kép**
- Ellenőrzés: ha 16:9 (`aspect-video`) és object-cover van rajta, ott is `aspect-[4/3]`-ra állítjuk (a kártya szélesebb, így ott a 4:3 még elfogadható kompromisszum; a teljes négyzet túl magas lenne desktopon). Ha mobilon még mindig vág, akkor mobilon `aspect-square`, desktopon `aspect-[4/3]` (`aspect-square md:aspect-[4/3]`).

**3. `src/components/UnifiedDailySection.tsx`**
- Már 1:1 (kis 28×28 / 36×36 négyzet) – nem nyúlunk hozzá.

### Technikai részletek
- Csak Tailwind class módosítások a fenti két fájlban.
- Nincs backend / logikai változás.
- Nincs új komponens vagy függőség.

### Várt eredmény
Az Étlap oldali ételkártyákon a kép teljes egészében látszik (tányér, köret, díszítés), nem vágja le a tetejét/alját, és a hover zoom is finomabb.
