
# Napi ajanlat kep generalor + datum logika + tetelenkenti elfogyott jeloles

Tobb osszefuggo valtozas egy csomagban.

---

## 1. Menu alapar 2200 Ft (1800 helyett)

A `WeeklyMenuGrid.tsx` ket helyen hivatkozik az 1800-as alaparra:
- Sor 441: `const menuPrice = offerData?.price_huf || 1800;` -- uj ertek: 2200
- Sor 468: `toast.success(... ${result.price || 1800} Ft)` -- uj ertek: 2200

A `DailyOfferImageGenerator.tsx` canvas rajzolasaban a `data.menu_price_huf` erteket hasznalja kozvetlenul az adatbazisbol, tehat ha az adatbazisban 2200 van, a kepen is 2200 jelenik meg. A fo problema: ha nincs `price_huf` beallitva az offerhez, az alap 1800-at kapja. Ezt javitjuk.

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/WeeklyMenuGrid.tsx` | `1800` -> `2200` ket helyen (441, 468 sor) |

---

## 2. Generalt kep: fektetett (landscape) elrendezes

Jelenlegi canvas: 1080x1350 (allo). Uj meretarany: 1200x675 (fektetett, 16:9-hez kozeli), a masodik csatolt kep stilusahoz hasonloan.

Az elrendezes atalakitasa a referenciahoz igazodva:
- Fejlec: "Napi ajanlat" cim + datum egy sorban a tetejere
- Etelek listaja bal oldalra igazitva, arak jobb oldalra
- Menu szekio alul, "Helyben: 2.200,- Ft" kiemelesevel
- Sotetkek/sotetzold hatter, arany szoveg a cimeknek, feher az etelneveknek

A fontot `Georgia, serif` es `italic`-rol lecsereljuk a "Sofia" betutipusra (ez a marka betutipusa, ami a hero szekcioban es a headerben is fut). Canvas-on a fontot be kell tolteni: `FontFace` API-val betoltjuk a `/fonts/Sofia-Regular.ttf`-et, es a `drawCanvas` fuggveny csak a font betoltodese utan rajzol.

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | Canvas meret: 1200x675, Sofia font betoltes, uj landscape elrendezes, aspectRatio frissites |

---

## 3. Tab neve: "Facebook kep" -> "Kep generalor"

| Fajl | Valtozas |
|------|---------|
| `src/pages/admin/DailyMenuManagement.tsx` | Tab felirat: `"Facebook kep"` -> `"Kep generalor"`, mobil: `"FB kep"` -> `"Kep"` |
| `src/components/admin/DailyOfferImageGenerator.tsx` | Card cim: `"Generalt kep"` -> `"Napi ajanlat kep"` |

---

## 4. Pentek zarasi ido utan kovetkezo het -- MINDENHOL

### 4a. Kozponti dateUtils.ts logika (mar megvan)
A `getSmartInitialDate()` mar kezeli a pentek utani atiranyitast (15:00 utan -> hetfo). Ez a frontend-oldalak (Etlap, Index) szamara mar mukodik.

### 4b. Admin WeeklyMenuGrid (HIANYZIK)
Jelenleg: `startOfWeek(new Date(), { weekStartsOn: 1 })` -- mindig az aktualis hetet mutatja.
Uj: pentek 16:00 utan (admin zarasi ido) automatikusan a kovetkezo het hetfojevel induljon.

### 4c. DailyOfferImageGenerator (RESZBEN MEGVAN)
Mar van `getInitialWeekOffset()` ami pentek 16:00-kor leptet. Ez rendben van, de lecsereljuk a kozponti `dateUtils.ts` fuggvenyekre az egysegesites erdekeben.

### 4d. Kapacitas, Hirlevel, stb.
Minden admin heti nezetet frissiteni kell. A `CapacityManagement.tsx`-ben is keresni kell hasonlo logikai frissiteni.

| Fajl | Valtozas |
|------|---------|
| `src/lib/dateUtils.ts` | Uj export: `getSmartWeekStart()` -- pentek 16:00 utan kovetkezo het hetfojevel ter vissza |
| `src/components/admin/WeeklyMenuGrid.tsx` | `startOfWeek(new Date(), ...)` -> `getSmartWeekStart()` |
| `src/components/admin/DailyOfferImageGenerator.tsx` | `getInitialWeekOffset`/`getInitialSelectedDate` -> `getSmartWeekStart()` + `getSmartInitialDate()` hasznalata |
| `src/components/admin/CapacityManagement.tsx` | Hasonlo frissites ha heti nezetet hasznal |

---

## 5. Tetelenkenti "Elfogyott" jeloles (admin)

Jelenleg a `daily_offers.remaining_portions = 0` az EGESZ napot elfogyottra allitja. A tulaj tetelenkent szeretne jelolni.

### Megvalositas
Uj `is_sold_out` boolean mezo a `daily_offer_items` tablara (DEFAULT false). Ez lehetove teszi, hogy minden egyes etel kulon-kulon elfogyottra legyen jelolheto.

A meglevo `daily_offers.remaining_portions` rendszer megmarad a teljes napi szintu elfogyottsaghoz, de a tetelszintu jeloles finomabb kontrollat ad.

### Admin UI
A `WeeklyMenuGrid.tsx` es `WeeklyGridCell.tsx` komponensekben az egyes etelek mellett (ahol a "X" torles gomb van) megjelenik egy kis "Elfogyott" toggle ikon (pl. Ban ikon). Ha rakattintanak, az `is_sold_out = true` lesz, es az etel szurkere valt a racsban.

### Frontend hatas
Az `Etlap.tsx` es `DailyItemSelector.tsx` lekerdezesekbe be kell vonni az `is_sold_out` mezot. Ha egy tetel `is_sold_out = true`, annak a checkboxja letiltva, szurkitve jelenik meg, "Elfogyott" badge-dzsel.

| Fajl | Valtozas |
|------|---------|
| SQL Migration | `ALTER TABLE daily_offer_items ADD COLUMN is_sold_out boolean NOT NULL DEFAULT false;` |
| `src/components/admin/WeeklyMenuGrid.tsx` | Per-item sold-out toggle a cellakban |
| `src/components/admin/WeeklyGridCell.tsx` | Elfogyott ikon + vizualis jelzes |
| `src/components/DailyItemSelector.tsx` | Tetelenkenti elfogyott jelzes + letiltott checkbox |
| `src/pages/Etlap.tsx` | is_sold_out mezo lekerdezese + megjelenites |

---

## Osszesites

| # | Feladat | Fajlok |
|---|---------|--------|
| 1 | Menu alapar 1800 -> 2200 | WeeklyMenuGrid.tsx |
| 2 | Landscape kep + Sofia font | DailyOfferImageGenerator.tsx |
| 3 | Tab atnevezes | DailyMenuManagement.tsx, DailyOfferImageGenerator.tsx |
| 4 | Pentek utan kovetkezo het mindenhol | dateUtils.ts, WeeklyMenuGrid.tsx, DailyOfferImageGenerator.tsx, CapacityManagement.tsx |
| 5 | Tetelenkenti elfogyott | SQL migration, WeeklyMenuGrid.tsx, WeeklyGridCell.tsx, DailyItemSelector.tsx, Etlap.tsx |
