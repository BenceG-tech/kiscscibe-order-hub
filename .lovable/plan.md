## Cél

A heti napi ajánlat összeállítása ma kategória-soronkénti keresgélést igényel a `WeeklyMenuGrid`-ben. Két új belépési pontot adunk hozzá, hogy:

1. **Egy mezőből** bárhova bevihess ételt (a rendszer kitalálja a kategóriát)
2. **Excel-ből** egy lépésben fel lehessen tölteni a teljes heti tervet

A meglévő grid és minden backend logika (`daily_offers`, `daily_offer_items`, menü auto-sync) érintetlen marad.

---

## 1. Smart Quick Entry — "Beírom, ő tudja hova"

Egy új **"Gyors bevitel"** sáv kerül a `WeeklyMenuGrid` tetejére (a hetes navigátor alá).

**Folyamat egy ételhez:**

1. Választasz egy napot (Hétfő–Péntek pirulák — alapból a mai)
2. Egy keresőmezőbe gépelsz: pl. `gulyásleves`
3. Lenyíló javaslatlista (autocomplete) a teljes `menu_items` táblából, ékezet-érzéketlen kereséssel (`accent-insensitive-search` util)
4. Minden javaslat mellett ott a kategória színes badge-e (Levesek, Főételek, stb.) — látszik, hova fog kerülni
5. Enter / kattintás → bekerül a megfelelő nap megfelelő kategória cellájába (ugyanaz az `addItemMutation`, mint most)
6. Toast: "Gulyásleves → Hétfő / Levesek"

**Extra: új étel létrehozása helyben**

Ha a beírt név nem található:
- A lista alján: **"+ Új étel létrehozása: 'xxx'"**
- Egy mini popoverben csak a **kategóriát** kell kiválasztani (a többi mező — ár, kép — később az étlapnál pótolható, vagy üresen marad)
- Mentés → `menu_items` insert + azonnali hozzáadás a kiválasztott naphoz

**Tömeges mód (több sor egyszerre):**

A mező mellett **"Több sor"** toggle. Bekapcsolva textarea jelenik meg:
```
gulyásleves
rántott szelet
házi limonádé
```
Minden sor egy étel → bekerül a kiválasztott napra, kategória auto-felismerés. A végén egy összesítő dialógus: hány étel ment át, hány nem volt felismerhető (ezeket egy listából lehet kategóriához rendelni).

---

## 2. Heti Excel Import

Új gomb a `WeeklyMenuGrid` toolbar-jában: **"Heti import (Excel)"** (a `Copy` / `Download` gombok mellé).

**Sablon formátum** (letölthető `.xlsx`):

| Nap | Levesek | Főételek | Köret | Desszert | Ár (Ft) |
|---|---|---|---|---|---|
| Hétfő | Gulyásleves | Rántott szelet | Sült krumpli | Somlói galuska | 2200 |
| Kedd | Húsleves | Pörkölt | Nokedli | | 2200 |
| ... | | | | | |

A sablon **az aktuálisan kiválasztott hét dátumaival** generálódik a fejlécbe (Hétfő (jan 15) stb.), így a felhasználó látja, melyik hetet tölti fel.

**Import folyamat (ugyanabban a dialógusban):**

1. **Feltöltés** — drag & drop / file picker (.xlsx, .xls), újrahasználjuk a `MasterMenuImport` parser mintáját
2. **Előnézet** — táblázatos nézet napokra bontva, minden cellában:
   - ✅ zöld pipa: étel megtalálva a `menu_items`-ben
   - 🟡 sárga: hasonló név talált (pl. `Gulyás leves` → `Gulyásleves`) — egy kattintással elfogadható
   - 🔴 piros: nem található → "Új étel létrehozása" gomb (kategória választóval)
3. **Konfliktus-kezelés** — ha az adott napon már van ajánlat:
   - Választható: **Hozzáadás** / **Felülírás** (az addigi tételek törlése először)
4. **Importálás** — egy progress bar-ral végigfut a heten, dátumonként:
   - upsert `daily_offers` (`date`, `price_huf`)
   - insert `daily_offer_items` minden cellához
   - menü auto-sync ugyanúgy fut, mint kézi bevitelnél (a meglévő trigger logikával)
5. **Eredmény toast**: "5 nap, 23 étel importálva. 2 új étel létrehozva."

**Export gomb** — a már meglévő grid állapotot is le lehet tölteni ugyanebben a formátumban → ezt aztán szerkesztve vissza-importálni a következő hétre (heti sablonozás Excelből).

---

## 3. UI elhelyezés

`WeeklyMenuGrid` jelenlegi toolbar bővítése:

```text
[<] Hét: jan 15–19 [>]   [📋 Gyors bevitel]  [📥 Excel import]  [📤 Export]  [📋 Másolás]
─────────────────────────────────────────────────
[Gyors bevitel sáv — kollapszálható, alapból nyitva mobilon zárva]
  Nap: (H)(K)(Sze)(Cs)(P)   [🔍 keresőmező…………]  [Több sor]
─────────────────────────────────────────────────
[meglévő grid / mobilnézet változatlan]
```

A meglévő kategóriás cellás bevitel **megmarad** — ez kiegészítés, nem csere. Aki úgy szokta, használja továbbra is.

---

## 4. Technikai részletek

**Új fájlok:**
- `src/components/admin/QuickEntryBar.tsx` — keresőmező + napválasztó + "új étel" popover + tömeges textarea
- `src/components/admin/WeeklyExcelImport.tsx` — dialógus a heti import/export flow-hoz
- `src/lib/weeklyExcelTemplate.ts` — sablon generálás (`xlsx.utils.aoa_to_sheet`), parser, fuzzy matcher
- `src/lib/categoryMatcher.ts` — közös ékezet-érzéketlen név→`menu_item` és név→`category` fuzzy lookup (a `MasterMenuImport.findCategoryId` általánosított verziója)

**Módosított fájlok:**
- `src/components/admin/WeeklyMenuGrid.tsx` — toolbar gombok + Quick Entry sáv beszúrása, `handleAddItem` újrahasználata
- `src/components/admin/MasterMenuImport.tsx` — `findCategoryId` kiemelése a közös `categoryMatcher`-be (refaktor, nem viselkedés-változás)

**Adatbázis:** nincs séma-változás. A meglévő `daily_offers`, `daily_offer_items`, `menu_items` táblákat használjuk a meglévő RLS-szel és a meglévő mutációkkal (`addItemMutation`, `updatePriceMutation`, menu auto-sync).

**Fuzzy matching:** Levenshtein distance < 3 + ékezet-strip → "hasonló név" jelzés. A felhasználó dönti el, elfogadja-e.

**Edge case-ek:**
- Hétvégi dátum az Excelben → kihagyás + warning
- Múltbéli hét → admin bypass már működik (`is_admin` trigger), import továbbra is megy
- Duplikátum (ugyanaz az étel ugyanazon a napon kétszer az Excelben) → 1× kerül be, warning
- Üres ár cella → meglévő ár megmarad

---

## 5. Mit NEM csinálunk most

- Drag & drop ételeket napok közt a gridben (későbbi iteráció)
- AI alapú heti terv generálás (későbbi)
- Étel kép automatikus generálás importnál (megvan külön a `AIBatchImageGenerator`)
- Heti sablon mentése DB-be (`daily_offer_templates` már van, de azt a meglévő flow használja)

Ez a két új belépő (Quick Entry + Excel) önmagában 5–10×-ére gyorsítja a heti összeállítást anélkül, hogy bármit elromlana a jelenleg jól működő részeken.
