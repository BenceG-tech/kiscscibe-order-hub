

# Napi Menü Admin Fejlesztések — Terv

## 1. Új kategória: "Főzelék feltét"

- Egy INSERT a `menu_categories` táblába: `name = 'Főzelék feltét'`, `sort = 4` (a Főzelékek után)
- A `CATEGORY_COLORS` map-et bővítjük a `WeeklyMenuGrid.tsx`-ben egy új sorral (pl. lime/emerald árnyalat)

## 2. Duplikáció-megelőzés az étel-könyvtárban

Jelenleg 10 duplikált étel van (pl. "Rizi-bizi" 3×, "Rántott sajt" 2×). Két lépés:

**a) Meglévő duplikációk összeolvasztása** — egy egyszeri SQL script, ami:
- Megkeresi az azonos nevű (LOWER) tételeket
- A legrégebbit megtartja, a többit deaktiválja (`is_active = false`)
- A `daily_offer_items` hivatkozásokat átírja a megtartottra

**b) Jövőbeli megelőzés** — A `MenuItemEditDialog.tsx` és az új étel létrehozási flow-ba beépítünk egy UNIQUE ellenőrzést: mentés előtt `SELECT` LOWER(name)-re, és figyelmeztetést dob ha már létezik azonos nevű étel (opcionálisan felülírható)

## 3. Rugalmas hét/nap másolás (8 hét mélységig)

A jelenlegi "Hét másolása" gombot lecseréljük egy **Másolás dialógusra** ami két módot kínál:

### a) Teljes hét másolása
- Egy **hét-választó** (datepicker vagy dropdown) az elmúlt 8 hét listájával
- Kiválasztod a forrás hetet → az aktuális hétre másolja (a meglévő logika alapján)

### b) Nap másolása
- **Forrás nap**: dropdown az elmúlt 8 hét összes hétköznapjából (pl. "ápr. 3. csütörtök")
- **Cél nap**: dropdown az aktuális/jövő hetek napjaiból
- Egy gombnyomásra átmásolja az adott nap tételeit

### Technikai megoldás
- Új komponens: `CopyMenuDialog.tsx` — `Dialog` + `Tabs` (Hét / Nap mód)
- A `copyPreviousWeek` függvényt általánosítjuk `copyWeek(sourceWeekStart, targetWeekStart)` és `copyDay(sourceDate, targetDate)` formára
- A `WeeklyMenuGrid.tsx` és `WeeklyGridMobile.tsx` kap egy új "Másolás" gombot ami ezt a dialógust nyitja

## 4. További admin egyszerűsítési javaslatok

A fentieken túl az alábbi fejlesztéseket is megvalósítjuk:

### a) Nap gyors törlése
- Minden napnál egy "Nap ürítése" gomb (piros ikon) → törli az adott nap összes tételét egy kattintásra (megerősítéssel)

### b) Drag & drop sorrend a napi tételek között
- A grid cellákban a tételek húzogathatók legyenek felfelé/lefelé a sorrendhez (opcionális, jövőbeli fejlesztés — most csak jelezzük)

### c) "Leggyakrabban használt ételek" gyorsszűrő
- Az étel-hozzáadó dropdown tetején egy "⭐ Gyakori" szekció, ami az elmúlt 30 nap leggyakrabban használt 10 ételét mutatja — így nem kell kategóriánként keresgélni

### d) Sablon alkalmazása napra
- A meglévő Template rendszerből lehessen egy sablont közvetlenül egy konkrét napra alkalmazni (nem csak hétre)

---

## Érintett fájlok

| Fájl | Változás |
|---|---|
| Migration SQL | Új kategória INSERT + duplikáció cleanup |
| `src/components/admin/WeeklyMenuGrid.tsx` | CATEGORY_COLORS bővítés, copyPreviousWeek → általánosított másolás, "Nap ürítése" gomb, gyakori ételek szűrő |
| `src/components/admin/WeeklyGridMobile.tsx` | Másolás dialog prop, nap ürítés gomb |
| `src/components/admin/CopyMenuDialog.tsx` | **ÚJ** — Hét/Nap másoló dialógus |
| `src/components/admin/MenuItemEditDialog.tsx` | Duplikáció-ellenőrzés mentés előtt |
| `src/components/admin/WeeklyGridCell.tsx` | "Nap ürítése" gomb, gyakori ételek szekció |

## Sorrend

1. Migration: kategória + duplikáció cleanup
2. `CopyMenuDialog.tsx` létrehozása
3. `WeeklyMenuGrid.tsx` refaktor (másolás, nap ürítés, gyakori ételek)
4. `MenuItemEditDialog.tsx` duplikáció figyelmeztetés
5. Mobile nézet frissítése

