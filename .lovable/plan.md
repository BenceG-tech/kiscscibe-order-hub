## Cél

Két admin-fejlesztés a heti ajánlat felületén:

1. **Mobil heti rács**: ne mindig a Hétfő nyíljon, hanem az "aktuális szerkeszthető nap" (a mai nap, vagy a hét következő nyitott napja).
2. **AI képgenerálás**: ne ugyanazt a képet adja minden próbálkozásra — minden generálás új, eltérő képet adjon, és legyen egy egyértelmű "Új kép" / újragenerálás gomb.

---

## 1. Mobil — automatikus napra ugrás

### Jelenlegi viselkedés
- `WeeklyMenuGrid` mindig az "okos hét" hétfőjével indul.
- `WeeklyGridMobile`-ban az accordion fix `openDays = { 0: true }` — vagyis mindig hétfő van nyitva, akkor is, ha kedd délután van.

### Új logika
Új helper `getSmartInitialDayIndex(weekDates)` ami a `weekDates` (H–P) tömbből kiválasztja a megnyitandó napot:

- Ha a hét = aktuális hét:
  - Hétköznap **16:00 előtt** → **mai nap** indexe (0–4).
  - Hétköznap **16:00 után** → **következő hétköznap** indexe (péntek 16:00 után már a hét vége — ekkor 0, mert a `getSmartWeekStart` úgyis a következő hétre lép).
- Ha a hét ≠ aktuális hét (előre/hátralapozott) → **0 (hétfő)**, mint most.

### Érintett fájlok
- `src/lib/dateUtils.ts` — új export: `getSmartInitialDayIndex(weekDates: Date[]): number`.
- `src/components/admin/WeeklyGridMobile.tsx` — `openDays` kezdőértéke a prop alapján számolva (új prop: `initialOpenDayIndex?: number`, default 0). `useState` initializerben `{ [initialOpenDayIndex]: true }`.
- `src/components/admin/WeeklyMenuGrid.tsx` — átadja a számolt indexet a `<WeeklyGridMobile>` komponensnek.

Hét-váltáskor (előre/hátra navigáció) az accordion állapota nem nullázódik újra — ez szándékos, csak az első megnyitáskor (vagy explicit "Ma" gomb után) ugorjon a megfelelő napra. Megoldás: `useEffect`-ben figyeljük a `currentWeekStart` változását és újraszámoljuk az `openDays`-t.

### Felhasználói élmény
- Kedd délután → kedd nyitva.
- Csütörtök 17:00 → péntek nyitva (még aznap intézhető a holnapi nap).
- Péntek 16:00 után → automatikusan a következő heti hétfő (jelenlegi `getSmartWeekStart` viselkedés marad).

---

## 2. AI képgenerálás — minden generálás új kép

### Probléma
A Gemini Flash Image determinisztikusan ugyanazt a képet adja vissza ugyanarra a promptra (azonos étel név → azonos kép), így törlés/újrapróbálás nem segít.

### Megoldás — backend (`supabase/functions/generate-food-image/index.ts`)
Minden hívásnál apró, **véletlenszerű variációt** szúrunk a promptba, hogy más kép szülessen:

- Random elemek tárából (pl. szögek: 45/55/65/70°, fényirány: balról / jobbról / felülről, asztal: dark slate / dark walnut / weathered oak, garnírung-variánsok, tál pozíció: kicsit balra / középen / kicsit jobbra eltolva), minden híváskor 2–3 elem random kombinációja kerül a prompt végére.
- Random `seed` szám szöveges hozzáfűzése (`"variation #${random}"`) — a modell ettől más kompozíciót generál.
- A két stílus (plate / box) random választása marad.

Így ugyanarra az ételnévre minden generálás más képet ad.

### Megoldás — frontend (`src/components/admin/AIGenerateImageButton.tsx`)
- A gomb felirata és viselkedése akkor változik, ha már van kép:
  - Ha **nincs kép** → `"AI kép generálása"` (jelenlegi).
  - Ha **van kép** (új prop: `hasExistingImage?: boolean`) → `"Új AI kép"` címke + `RefreshCw` ikon, `variant="secondary"`.
- A meglévő `onGenerated` callback hívásakor a kép URL-je felülírja a régit (ahogy most is).

A 4 felhasználási helyen (`MenuItemEditDialog`, `TemporaryItemCreator`, `TemporaryItemsLibrary`, `GalleryManagement`) átadjuk a `hasExistingImage` propot, ahol értelmezhető (van-e már `image_url`).

### Storage megjegyzés
Az edge function jelenleg `${item_id}.${ext}` néven menti a fájlt, így felülírja a régit (`x-upsert: true`). Ez marad — a régi kép cserélődik az újra, nem duzzad fel a bucket. A standalone (item_id nélküli) feltöltések random UUID-vel mennek, azokra ez nem vonatkozik.

---

## Technikai részletek

```text
WeeklyMenuGrid
  ├─ useMemo: initialOpenDayIndex = getSmartInitialDayIndex(weekDates, currentWeekStart)
  └─ <WeeklyGridMobile initialOpenDayIndex={...} />
        └─ useState/useEffect: openDays = { [initialOpenDayIndex]: true }
                                 (újraszámol amikor a prop változik)

generate-food-image (edge function)
  ├─ angles[], lighting[], surfaces[], garnishes[] — random pick
  ├─ prompt += " | composition variation: ${angle}, ${light}, ${surface}, ${garnish}, seed-${randomInt}"
  └─ stílus (plate/box) random — marad
```

## Fájlok

- `src/lib/dateUtils.ts` — új helper.
- `src/components/admin/WeeklyMenuGrid.tsx` — prop átadás.
- `src/components/admin/WeeklyGridMobile.tsx` — initialOpenDayIndex prop.
- `supabase/functions/generate-food-image/index.ts` — random variáció a promptban.
- `src/components/admin/AIGenerateImageButton.tsx` — `hasExistingImage` prop, "Új AI kép" felirat/ikon.
- `src/components/admin/MenuItemEditDialog.tsx`, `TemporaryItemCreator.tsx`, `TemporaryItemsLibrary.tsx`, `GalleryManagement.tsx` — `hasExistingImage` prop átadás.

Edge function deploy a végén.
