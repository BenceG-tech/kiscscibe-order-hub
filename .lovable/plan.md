## Probléma

A 7 reggeli tétel létezik az adatbázisban (`is_always_available = true`), de:

- A **főoldalon** az `AlwaysAvailableSection` `featuredOnly` módban fut, és a reggeli tételek `is_featured = false` — ezért nem látszanak.
- Az **Étlap / Napi ajánlat** oldalon megjelennek az "Mindig elérhető" alatt, de elvesznek a többi kategória között, nem hangsúlyosak.
- Sehol nincs dedikált, jól látható "Reggeli" blokk az időszak (7–10) feltüntetésével.

## Megoldás

Egy új, dedikált **`BreakfastSection`** komponens, amely a Reggeli kategória tételeit emeli ki saját design-nal (idő-badge, meleg színek, 2 oszlop mobilon).

### Hol jelenjen meg

1. **Főoldal (`Index.tsx`)** — a Hero alatt, a napi ajánlat fölött, hogy reggel azonnal látható legyen.
2. **Étlap oldal (`Etlap.tsx`)** — a napi menü panel fölött, kiemelt blokként (a meglévő `AlwaysAvailableSection` megmarad, de a Reggeli kategória onnan kiszűrve, mert már fent szerepel).

### Komponens viselkedés

- Lekéri a `Reggeli` kategória aktív tételeit `menu_items`-ből.
- Cím: "Reggeli" + alcím "Hétköznap 7 – 10 óra között" + óra ikon.
- 2 oszlop mobilon, 3 oszlop desktopon, 4:3 képek, ár-badge, "Kosárba" gomb.
- Kosárhoz adás a meglévő `useCart().addItem` logikával.
- Ha nincs aktív reggeli tétel → komponens nem renderel semmit.

### Technikai részletek

- Új fájl: `src/components/sections/BreakfastSection.tsx` (az `AlwaysAvailableSection` mintájára, de Reggeli-specifikus, képes layout, idő-badge-dzsel).
- `src/pages/Index.tsx` — `<BreakfastSection />` beszúrása a Hero után.
- `src/pages/Etlap.tsx` — `<BreakfastSection />` a `WeeklyDateStrip` alá, a `<DailyMenuPanel>` fölé.
- `src/components/sections/AlwaysAvailableSection.tsx` — opcionális prop `excludeCategoryNames?: string[]` hozzáadása, és az Étlapon `excludeCategoryNames={["Reggeli"]}` átadása, hogy ne duplikálódjon.
- **Nincs DB-változás**, nincs backend módosítás — tisztán frontend / megjelenítés.
