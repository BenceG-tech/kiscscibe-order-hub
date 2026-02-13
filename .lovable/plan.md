

# Phase 3: Kapacitas- es Idosavkezeles Fejlesztes

## Osszefoglalas

A jelenlegi rendszer alapvetoen mukodik, de tul egyszeru: minden slot max_orders=8 alapertelmezettel jon letre, a beallitasok csak localStorageben elnek, es nincs sablon-rendszer, zarolt datumok, vagy ugyfeloldali kapacitas-jelzes. A fejlesztes ezt egy teljes erteku kapacitaskezelo rendszerre boviti.

---

## 1. Adatbazis modositasok (migracio)

### a) Uj tabla: `capacity_templates`
Tarolt sablonok az idoslotokhoz (pl. "Standard het", "Nyari idoszak", "Unnep").

| Oszlop | Tipus | Leiras |
|--------|-------|--------|
| id | uuid PK | |
| name | text NOT NULL | Sablon neve (pl. "Alap het") |
| description | text | Rovid leiras |
| slots | jsonb NOT NULL | `[{"time":"07:00","capacity":20},...]` |
| is_default | boolean DEFAULT false | Alapertelmezett sablon |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

RLS: Admin CRUD, nincs publikus hozzaferes.

### b) Uj tabla: `blackout_dates`
Elore jelzett zarasi napok (unnep, felujitas stb.).

| Oszlop | Tipus | Leiras |
|--------|-------|--------|
| id | uuid PK | |
| date | date NOT NULL UNIQUE | A zarolt datum |
| reason | text | Ok (pl. "Karacsonyi szunet") |
| created_at | timestamptz DEFAULT now() | |

RLS: Admin INSERT/UPDATE/DELETE, publikus SELECT (ugyfeloldal is latja).

### c) `capacity_slots` tabla bovitese
- Uj oszlop: `buffer_minutes` (integer DEFAULT 0) -- konyhai szunet az idoslot utan

### d) Kapacitas beallitasok mentes: `settings` tabla
A jelenlegi localStorage-alapu beallitasokat (warning_threshold, default_daily_capacity) a meglevo `settings` tablaba mentjuk `key = 'capacity_settings'` bejegyzessel. Ehhez kell egy uj RLS policy a `settings` tablara, hogy az admin irni is tudja a `capacity_settings` kulcsot.

### e) INSERT policy a `capacity_slots` tablara
Jelenleg a tablara NEM lehet INSERT-et futtatni RLS-en keresztul. Hozzaadjuk:
- Admin can insert capacity slots (is_admin(auth.uid()))
- Admin can delete capacity slots (is_admin(auth.uid()))

---

## 2. Sablon-rendszer (Template System)

### Admin felulet
- A Kapacitas tabon uj szekci: "Sablonok"
- Sablonok listaja kartyakban: nev, idoslotok szama, utolso hasznalat
- "Uj sablon" gomb: nev + idoslotok megadasa (ugyanaz az UI, mint a jelenlegi beallitasok dialog)
- "Sablon alkalmazasa erre a napra" gomb: a kivalasztott napra bemasolja a sablon slotjait
- "Sablon alkalmazasa az egesz hetre" gomb: hetfo-pentekre (vagy hetfo-szombat) egyszerre alkalmazza
- "Jelenlegi nap mentese sablonkent" gomb: a kivalasztott nap meglevo slotjait uj sablonkent menti
- Egy sablon megjelolheto "alapertelmezettkent" -- ez lesz a gyors "Alapertelmezett" gomb mogotti sablon

### Mukodes
- A sablonok a `capacity_templates` tablabol jonnek
- Alkalmazaskor: torolji a nap meglevo slotjait, beszurja a sablon slotjait

---

## 3. Zarolt datumok (Blackout Dates)

### Admin felulet
- A Kapacitas tabon uj szekci: "Zarolt napok"
- Naptar nezet, ahol a zarolt napok pirossal jeloltek
- "Nap zarolasa" gomb: datum + ok megadasa
- "Zarolas torlese" gomb a mar zarolt napokon
- Lista nezet: kozelgo zarolt napok tablazata (datum, ok, torles gomb)

### Ugyfeloldal
- A Checkout idopont-valasztoban a zarolt napok nem jelennek meg (szurodnek)
- A napi ajanlat naptar nezeten a zarolt napok szurkek es "Zarva" felirattal jelennek meg

---

## 4. Slot nepszerusegi indikator (Heat Coloring)

### Mukodes
- A meglevo `capacity_slots` tabla `booked_orders` adatabol szamolhato a torteneti nepszeruseg
- Minden slothoz lekerjuk az elmult 4 het ugyanazon napjanak es idopontjanak atlagos kihasznalattsagat
- 3 szint: hideg (kek/zold, <40%), kozepes (sarga, 40-70%), forro (piros, >70%)

### Admin felulet
- Az idoslot kartyakon egy kis "szikra" ikon es szin jelzi a torteneti nepszeruseget
- Tooltip: "Az elmult 4 hetben atlagosan 65%-ban foglalt volt"

---

## 5. Buffer ido (Kitchen Breathing Room)

### Admin felulet
- Az idoslot szerkeszto dialogban uj mezo: "Szunet utana (perc)" -- 0, 5, 10, 15 perc valasztas
- A sablonokban is tarolhato a buffer

### Ugyfeloldal
- A Checkout-ban a buffer-rel rendelkezo slotok koze nem kerul uj slot
- Peldaul ha 11:30 slotnak 10 perc buffer van, a 11:40 slot nem jelenik meg

---

## 6. Ugyfeloldali kapacitas-jelzes

### Checkout oldalon
- Minden idopont melle szines jelzes:
  - Zold: <50% foglalt (sok hely)
  - Sarga + "Majdnem tele!": 80%+ foglalt
  - Piros + "Tele": 100% foglalt (nem valaszthato, kisurkul)
- A jelzesek a `capacity_slots.booked_orders / max_orders` aranybol szamolodnak
- Ha nincs capacity_slots bejegyzes, az alapertelmezett 8-as kapacitas ervenyesul

---

## 7. Modositando fajlok

| Fajl | Valtozas |
|------|----------|
| `src/components/admin/CapacityManagement.tsx` | ATIRAS: sablon-rendszer, zarolt datumok, heat coloring, buffer, beallitasok DB-be mentes |
| `src/pages/Checkout.tsx` | Kapacitas-jelzes a slot-valasztoban, zarolt datumok szurese |
| `src/App.tsx` | NEM modosul |
| `src/pages/admin/AdminLayout.tsx` | NEM modosul |

### Uj fajlok: NINCS
A teljes funkcionalitas a meglevo `CapacityManagement.tsx` komponensbe es a `Checkout.tsx`-be epul be.

---

## 8. Kihagyott funkciok (indoklassal)

- **Drag-and-drop vizualis naptar (Google Calendar stilus)**: Tul komplex fejlesztes, uj konyvtarat igenyel (pl. react-big-calendar). A jelenlegi slot-lista + sablon-rendszer a gyakorlatban ugyanazt eri el kevesebb komplexitassal.
- **Varolista (Waitlist)**: Kulon tabrat, email/SMS ertesitest es ugyfeloldali feluletet igenyel. Kesobbi fazisra javasolt.
- **Dinamikus kapacitas (automatikus novelés/csokkentes)**: Gepi tanulast vagy komplex heurisztikat igenyel. Helyette a heat coloring adja az informaciot, az admin dontes alapjan modosithat.
- **Overbooking/rejection rate**: Nincs log arrol, mikor probalt valaki tele slotot valasztani. Kesobbi fazisban loggolhato.

---

## 9. Nem modosul (megorzes)

- Rendelesi/kosar logika (a submit-order edge function nem valtozik)
- Staff KDS oldal
- Menu szerkesztes
- Dashboard es Analytics
- Meglevo RLS szabalyok (csak ujak jonnek hozza)
- Az `update_daily_portions` RPC (ez a napi ajanlat adagszamot kezeli, nem a capacity_slots-ot)

