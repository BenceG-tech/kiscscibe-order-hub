

# Fix tetelek kezelese es megjelenites

A cel: bizonyos etelek/italok (viz, cola, savanyusag stb.) mindig elerheto legyen a honlapon, fuggetlenul a napi ajanlatoktol. Az admin tudja kezelni melyik tetel "fix", es a latogatol ezeket barmelyik napon megrendelhetik.

---

## 1. Adatbazis: uj mezo a menu_items tablan

Uj `is_always_available` boolean mezo a `menu_items` tablara. Ez jeloli, hogy az adott tetel napitol fuggetlenul mindig rendelheto.

| Valtozas | Leiras |
|----------|--------|
| SQL Migration | `ALTER TABLE menu_items ADD COLUMN is_always_available boolean NOT NULL DEFAULT false;` |

---

## 2. Admin feluleti: fix tetel jeloles

A `MenuManagement.tsx` oldalon:
- Uj checkbox az etel szerkeszto dialogban: "Mindig elerheto (fix tetel)" + InfoTip: "A fix tetelek (pl. italok, savanyusag) mindig megjelennek a honlapon, fuggetlenul a napi ajanlattol."
- Uj szurogomb a kategoria szurok soraban: "Fix tetelek" badge, amivel csak a fix teteleket szuri
- A listaban a fix teteleknel egy kis "Fix" badge jelenik meg (ahogy az "Inaktiv" es "Kiemelt" badge-ek mar megjelennek)

| Fajl | Valtozas |
|------|--------|
| `src/pages/admin/MenuManagement.tsx` | Checkbox a dialogban, szurogomb, badge a listaban |

---

## 3. Latogatoi oldal: fix tetelek szekcio az Etlapon

Az `Etlap.tsx` oldalon a napi ajanlat/menu kártya ALATT megjelenik egy "Mindig elerheto" szekcio a fix tetelekkel. Ezeket a latogato barmikor kosarba teheti.

### Megjelenes
- "Mindig elerheto" cimke egy kis ikon mellett
- Grid elrendezes (2 oszlop mobil, 3 desktop), kompakt kartya: kep + nev + ar + "Kosarba" gomb
- A fix tetelek nem fuggnek a kivalasztott datumtol, mindig megjelennek
- Kategoria szerint csoportositva (pl. "Italok", "Egyeb")

### Adatlekerdezes
- Egyetlen egyszeru query: `menu_items` tabla, `is_always_available = true` es `is_active = true`
- Kategoria nevek lekerdezese a csoportositashoz

| Fajl | Valtozas |
|------|--------|
| `src/pages/Etlap.tsx` | Uj szekcio a napi etelek alatt: fix tetelek grid + kosarba gomb |

---

## 4. Fooldal: fix tetelek opcionalis megjelenites

A fooldal `Index.tsx` napi menu szekcioja alatt is megjelenhetnek a fix tetelek, de csak egy rovid valogatas (max 4-6 tetel, a `is_featured` + `is_always_available` kombinalasaval), hogy ne legyen tulzsufolt.

Ez opcionalis -- csak ha van `is_featured` es `is_always_available` egyszerre megjelolt tetel.

| Fajl | Valtozas |
|------|--------|
| `src/pages/Index.tsx` | Kis szekcio a napi menu alatt, ha vannak kiemelt fix tetelek |

---

## Technikai reszletek

- A `menu_items` tabla `is_always_available` mezoje `DEFAULT false`, tehat a letezo 500+ tetel nem valtozik
- Az RLS mar megfelelo: `Anyone can view active menu items` (is_active = true) biztositja a publikus hozzaferest
- A kosar rendszer mar tamogatja az egyedi teteleket (id, name, price_huf, modifiers, sides) -- nincs kulonleges logika szukseges
- A types.ts automatikusan frissul a migracio utan

### Erinto fajlok osszesitese

| Fajl | Tipus |
|------|-------|
| SQL Migration | Uj mezo: `is_always_available` |
| `src/pages/admin/MenuManagement.tsx` | Checkbox + szuro + badge |
| `src/pages/Etlap.tsx` | Fix tetelek szekcio |
| `src/pages/Index.tsx` | Kiemelt fix tetelek (opcionalis) |

