## Cél

Felvenni a táblán szereplő reggeli tételeket fix tételekként (minden hétköznap elérhetők), külön „Reggeli" kategóriába, jó megjelenéssel a kezdőlapon és a Fix tételek admin felületen — szerkeszthető, AI képgenerálóval, mint a többi fix tétel.

## 1. Új „Reggeli" kategória

Migráció létrehoz egy új `menu_categories` rekordot:
- név: `Reggeli`
- `sort: 0` (legelső kategória legyen az étlapon és a fix tétel admin felületen)

## 2. Reggeli tételek felvitele (fix tételek)

Adatbázis insert a `menu_items` táblába, mind `is_always_available = true`, `is_active = true`, `category_id = Reggeli`:

| Név | Ár (Ft) | Leírás |
|---|---|---|
| Bundáskenyér | 1 270 | Választható kenegetőssel (+490 Ft): pestós-sajtos, csokiöntetes, sajtos-tejfölös, magyaros (tejföl, kolbász, lilahagyma) |
| Töltött bundáskenyér (1 db) | 1 250 | Sajttal-sonkával töltve |
| Töltött bundáskenyér (2 db) | 2 350 | Sajttal-sonkával töltve |
| Óriás melegszendvics | 1 750 | Pl. házi gombakrémes, sajtos-sonkás, szalámis |
| Ham & Eggs | 1 770 | 3 tojásból |
| Omlett | 1 770 | 3 tojásból, két feltéttel: pl. kolbászos-hagymás, baconos-hagymás, sonkás-sajtos |
| Szendvicsek (többféle) | 1 290 | Választékunktól függően 1 290 – 1 750 Ft |

A „1 db / 2 db" és az „1290–1750" eseteket külön tételként / tartomány-leírással oldjuk meg, hogy minden tétel önálló kosárba-tehető legyen.

## 3. Megjelenés a vendégoldalon

- A meglévő `AlwaysAvailableSection` automatikusan megjeleníti a Reggeli kategóriát (kategória név fejléccel, képes kártyákkal), így a logika változatlan.
- Új elem: egy kis info-csík a Reggeli kategória fejléce alá: **„Reggeli kínálatunk hétköznap 7 – 10 óra között elérhető"** (`AlwaysAvailableSection.tsx`, csak a Reggeli csoportnál).
- Opcionális finomítás: a Reggeli kategória mindig kapja a képes nézetet (`displaySettings` default).

## 4. Admin (Fix tételek)

Nincs külön munka — a `/admin/fix-items` oldal a kategóriát automatikusan listázza:
- minden tétel szerkeszthető (név, ár, leírás, allergének, kép, aktív/inaktív)
- AI képgenerátor gomb minden tételnél működik (`AIGenerateImageButton`)
- drag-and-drop sorrend, tömeges AI generálás működik

## 5. Technikai részletek

- 1 migráció: kategória + 7 menu_item insert (display_order 1..7).
- 1 frontend edit: `src/components/sections/AlwaysAvailableSection.tsx` — feltételes „7–10 óra" alcímke a Reggeli csoportnál (kategória neve alapján).
- Nincs séma-változás, nincs új komponens.
