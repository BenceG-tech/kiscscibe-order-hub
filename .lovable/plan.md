
# Étlap Kezelés (Menu Management) - Teljes Újratervezés

## Jelenlegi Állapot Elemzése

Az admin felület jelenleg 2 fő menükezelő oldalt tartalmaz:

### 1. Étlap kezelés (`/admin/menu` - MenuManagement.tsx)
- 500+ étel kezelése
- Kategóriánként csoportosított lista
- Keresés és szűrés
- Étel hozzáadás/szerkesztés dialog

### 2. Napi ajánlat (`/admin/daily-menu` - DailyMenuManagement.tsx)
- Heti nézet grid (WeeklyMenuGrid)
- 5 tab: Napi ajánlatok, Ütemezés, Sablonok, Kapacitás, Excel Import
- Kategóriánként sorok, naponta oszlopok

---

## Fő Problémák

| Probléma | Részletek |
|----------|-----------|
| **Túl sok tab** | A "Napi ajánlat" oldalon 5 tab van, ami zavaró |
| **Széttöredezett funkciók** | Étlap kezelés és Napi ajánlat külön oldalon |
| **Bonyolult WeeklyGrid** | Sok kis gomb egy cellában (M/L/F, ár, kép, törlés) |
| **Nincs gyors áttekintés** | Nem látszik egy pillantásra a hét összefoglalója |
| **Nehéz navigáció** | Sablonok és ütemezés külön tab-okon |
| **Komplex mobil nézet** | Accordion-ok nehezen kezelhetők |

---

## Javasolt Újratervezés

### A) Egyszerűsített Információ Architektúra

**Régi struktúra:**
```text
Admin
├── Rendelések
├── Étlap kezelés (500+ étel lista)
├── Napi ajánlat
│   ├── Napi ajánlatok (WeeklyGrid)
│   ├── Ütemezés
│   ├── Sablonok
│   ├── Kapacitás
│   └── Excel Import
└── Galéria
```

**Új struktúra:**
```text
Admin
├── Rendelések
├── Étel könyvtár (Master Library - 500+ étel)
├── Heti terv (Egyszerűsített napi ajánlat)
│   ├── Naptár nézet
│   └── Sablon alkalmazás
├── Beállítások (Kapacitás + Import egy helyen)
└── Galéria
```

---

### B) Heti Terv Oldal - Teljesen Új Design

#### Jelenlegi: Komplex Grid
```text
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Kategória│  Hétfő   │  Kedd    │  Szerda  │ Csütörtök│  Péntek  │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Ár       │  1890    │  1890    │  1890    │  1890    │  1890    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Levesek  │ [Gulyás] │ [Húsl.]  │ [Gomb.]  │ [Zöldb.] │ [Tyúkh.] │
│          │ M L F    │ M L F    │ M L F    │ M L F    │ M L F    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Főételek │ [Pörk.]  │ [...]    │ [...]    │ [...]    │ [...]    │
│          │ M L F    │ M L F    │ M L F    │ M L F    │ M L F    │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

#### Új: Kártya-alapú Napi Nézet
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          Heti Menü Tervező                              │
│  [< Előző hét]  Február 3-7, 2026  [Következő hét >]  [Sablon ▾]        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   HÉTFŐ     │ │   KEDD      │ │   SZERDA    │ │ CSÜTÖRTÖK   │ │   PÉNTEK    │
│   02.03     │ │   02.04     │ │   02.05     │ │   02.06     │ │   02.07     │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │
│  │ 1890  │  │ │  │ 1890  │  │ │  │ 1890  │  │ │  │ 1890  │  │ │  │ 1890  │  │
│  │  Ft   │  │ │  │  Ft   │  │ │  │  Ft   │  │ │  │  Ft   │  │ │  │  Ft   │  │
│  └───────┘  │ │  └───────┘  │ │  └───────┘  │ │  └───────┘  │ │  └───────┘  │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ 🍲 Leves:   │ │ 🍲 Leves:   │ │ 🍲 Leves:   │ │ 🍲 Leves:   │ │ 🍲 Leves:   │
│   Gulyás    │ │   Húsleves  │ │   Gombalev. │ │   Zöldbors. │ │   Tyúkhúsl. │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ 🍽 Főétel:  │ │ 🍽 Főétel:  │ │ 🍽 Főétel:  │ │ 🍽 Főétel:  │ │ 🍽 Főétel:  │
│   Pörkölt   │ │   Töltött   │ │   Rántott   │ │   Paprikás  │ │   Sült hal  │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ +3 extra    │ │ +2 extra    │ │ +4 extra    │ │ +3 extra    │ │ +2 extra    │
│ [Szerkeszt] │ │ [Szerkeszt] │ │ [Szerkeszt] │ │ [Szerkeszt] │ │ [Szerkeszt] │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

### C) Új Komponensek

#### 1. DayCard - Napi Kártya Komponens
Egy nap összes adata egy kártyában:
- Ár (inline szerkeszthető)
- Menü leves (egy kattintással választható)
- Menü főétel (egy kattintással választható)
- Extra ételek száma badge-ben
- "Szerkesztés" gomb a részletes nézethez

#### 2. DayDetailDrawer - Részletes Szerkesztő Panel
Sheet/Drawer ami kinyílik oldalsó panelként:
- Nagy keresőmező az ételekhez
- Kategóriánként csoportosított lista
- Drag-and-drop sorrend
- Könnyű hozzáadás/eltávolítás

#### 3. WeeklyOverview - Heti Összefoglaló
Kompakt fejléc ami mutatja:
- Hány nap van kitöltve
- Hiányzó napok jelzése
- Egy kattintásos sablon alkalmazás

#### 4. QuickTemplateBar - Gyors Sablon Sáv
Horizontális sablon választó:
- Kedvenc sablonok pill-ek formájában
- Egy kattintás = sablon alkalmazása a kijelölt napra

---

### D) Étel Könyvtár - Egyszerűsített Nézet

**Jelenlegi:** Kategóriánként kártyák, minden étel full row
**Új:** Kompakt tábla nézet váltási lehetőséggel

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Étel könyvtár                                      [+ Új étel] [Import] │
├─────────────────────────────────────────────────────────────────────────┤
│ 🔍 [Keresés...]  Kategória: [Összes ▾]  Állapot: [Mind ▾]  [🔲] [≡]    │
├─────────────────────────────────────────────────────────────────────────┤
│  [□] │ 📷 │ Név              │ Kategória  │  Ár   │ Állapot │ Műveletek │
├──────┼────┼──────────────────┼────────────┼───────┼─────────┼───────────┤
│  [□] │ 🖼 │ Gulyásleves      │ Levesek    │ 890Ft │ ● Aktív │ ✏️ 🗑     │
│  [□] │ 🖼 │ Marhapörkölt     │ Főételek   │ 1990Ft│ ● Aktív │ ✏️ 🗑     │
│  [□] │ -- │ Rántott sajt    │ Prémium    │ 2290Ft│ ○ Inakt │ ✏️ 🗑     │
└─────────────────────────────────────────────────────────────────────────┘
│ 3 kijelölve: [Aktiválás] [Deaktiválás] [Törlés]                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### E) Mobil Nézet - Swipe Navigáció

**Mobil: Egy nap egyszerre, swipe-olható**
```text
┌──────────────────────────────┐
│  <  SZERDA 02.05  >          │
│      ● ● ● ● ●               │  <- Nap indikátorok
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │    Menü ár: 1890 Ft    │  │
│  │        [Módosít]       │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  🍲 LEVES                    │
│  ┌────────────────────────┐  │
│  │ Gombaleves        [×]  │  │
│  └────────────────────────┘  │
│  [+ Leves hozzáadása]        │
├──────────────────────────────┤
│  🍽 FŐÉTEL                   │
│  ┌────────────────────────┐  │
│  │ Rántott hús       [×]  │  │
│  │ Sertéssült        [×]  │  │
│  └────────────────────────┘  │
│  [+ Főétel hozzáadása]       │
├──────────────────────────────┤
│  📦 EXTRA ÉTELEK (3)         │
│  [Részletek megnyitása]      │
└──────────────────────────────┘
```

---

## Fájl Változtatások

### Új Komponensek (CREATE)

| Fájl | Leírás |
|------|--------|
| `src/components/admin/WeeklyPlannerV2.tsx` | Új heti tervező fő komponens |
| `src/components/admin/DayCard.tsx` | Napi kártya komponens |
| `src/components/admin/DayDetailSheet.tsx` | Részletes szerkesztő drawer |
| `src/components/admin/QuickTemplateBar.tsx` | Gyors sablon választó |
| `src/components/admin/WeeklyOverviewHeader.tsx` | Heti összefoglaló fejléc |
| `src/components/admin/MobileWeeklySwiper.tsx` | Mobil swipe nézet |
| `src/components/admin/FoodLibraryTable.tsx` | Kompakt étel tábla |

### Módosítandó Fájlok (MODIFY)

| Fájl | Változtatás |
|------|-------------|
| `src/pages/admin/DailyMenuManagement.tsx` | Tab-ok csökkentése 3-ra |
| `src/pages/admin/AdminLayout.tsx` | Navigáció átnevezés |
| `src/pages/admin/MenuManagement.tsx` | Egyszerűsített tábla nézet |

### Törlendő/Deprecated (OPTIONAL)

| Fájl | Ok |
|------|-----|
| `src/components/admin/WeeklyMenuGrid.tsx` | Lecserélve WeeklyPlannerV2-re |
| `src/components/admin/WeeklyGridMobile.tsx` | Lecserélve MobileWeeklySwiper-re |

---

## UX Javítások Összefoglalója

| Jelenlegi | Új |
|-----------|-----|
| 5 tab a "Napi ajánlat"-ban | 3 tab: Terv, Sablonok, Beállítások |
| Komplex grid sok gombbal | Kártya-alapú egyszerű nézet |
| Minden adat egyszerre látszik | Fokozatos felfedés (progressive disclosure) |
| Kis M/L/F gombok | Nagy, egyértelmű toggle-ök |
| Accordion mobilon | Swipe navigáció |
| Inline price edit popover | Inline text input |
| Külön "Mentve" jelző | Auto-save indikátor a fejlécben |

---

## Implementációs Prioritás

1. **Fázis 1 - Alapok:**
   - DayCard komponens
   - WeeklyPlannerV2 desktop nézet
   - DayDetailSheet szerkesztő

2. **Fázis 2 - Mobil:**
   - MobileWeeklySwiper
   - Touch-optimalizált gombok

3. **Fázis 3 - Finomítások:**
   - QuickTemplateBar
   - FoodLibraryTable
   - Animációk és átmenetek

---

## Technikai Megjegyzések

- A meglévő adatbázis struktúra változatlan marad
- Ugyanazokat a mutation-öket használjuk (addItem, removeItem, updatePrice)
- shadcn/ui komponenseket használunk: Sheet, Card, Tabs, Command
- Framer Motion opcionális a swipe gesztusokhoz
- React Query cache-elés optimalizálása a gyors interakciókhoz

