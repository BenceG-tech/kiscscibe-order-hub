## Cél

A `BreakfastSection` (főoldal + Étlap) másodlagos súlyú legyen a napi ajánlathoz képest — kompakt vízszintes lista kis képpel balra, név + ár + kosár gomb jobbra. Funkció (kosárba tétel, lekérdezés) változatlan.

## Változtatás

Csak `src/components/sections/BreakfastSection.tsx` (frontend, prezentáció).

**Wrapper / fejléc:**
- Marad a halvány keret, de visszafogottabb: vékonyabb border, kisebb padding (`p-4 md:p-5`).
- Cím kisebb: `text-xl md:text-2xl` (nagy `text-2xl md:text-3xl` helyett).
- Ikon konténer kisebb: `h-9 w-9` (jelenleg `h-11 w-11`).
- Alcím opcionálisan elrejtve mobilon.

**Tételek — új layout:**
- Grid: mobilon 1 oszlop, `sm:grid-cols-2`, `lg:grid-cols-3` (jelenleg 2/3 nagy kártya).
- Minden tétel egy vízszintes sor: kis kép (64×64 vagy 72×72 px, `rounded-xl`) balra, középen név + opcionális leírás 1 sorban (`line-clamp-1`), ár chip és kis kosár gomb (icon-only, `h-8 w-8`) jobbra.
- Card padding: `p-2`, gap: `gap-3`.
- Nincs aspect-ratio kép-blokk, nincs hover-scale.

**Méretarány — vizuális hierarchia:**
- A reggeli sávok kb. 72px magasak lesznek (jelenleg ~220px kártyák).
- A napi ajánlat (DailyMenuPanel + extra item kártyák a 16:9 képekkel) így vizuálisan dominánsabbá válik.

## Mit NEM változtatunk

- `useQuery` lekérdezés, kategória szűrés, `addItem` hívás, toast — érintetlen.
- Brand színek, dark theme tokenek, Sofia font — változatlan.
- A jelenlegi ár/kosár logika, a homepage/page variant kapcsoló is marad.

## Érintett fájl

- `src/components/sections/BreakfastSection.tsx` — átírt JSX/Tailwind a fent leírt elrendezésre.

## Verifikáció

Vizuális ellenőrzés mobilon (402×700) és desktopon (1080×848) az `/etlap` és `/` oldalakon.
