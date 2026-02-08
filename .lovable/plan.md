

# Staff KDS es Admin Rendelesek - Atfogo Javitas

Ez a terv 5 fo problemat old meg:

1. A villogas rendszer ujragondolasa (pickup ido alapjan, nem rendelesi kor alapjan)
2. A "daily_complete_menu_UUID" szoveg eltavolitasa a rendelesi kartyakrol
3. Multbeli rendelesek reszletesebb, datumokra rendezett megjelenitese mindket feluleten
4. Archivalasi lehetoseg az admin oldalon
5. Staff KDS mobilra es desktopra optimalizalas

---

## 1. Villogas rendszer ujratervezese

**Jelenlegi problema**: A `getOrderUrgency` fuggveny (`useTickTimer.ts`) a rendeles *letrehozasanak ideje* alapjan hataroz meg surgetesseget (5 perc = "aging", 10 perc = "urgent"). Ez ertelmetlenul vilogtata a kartyakat.

**Uj logika**: A villogas a **kert atveteli idopont** alapjan mukodik:
- **60-30 perccel atvtel elott**: Lagyabb vilogatas (lass, pulsing border)
- **30 percen belul**: Erosebb vilogatas (gyorsabb pulse, pirosabb keret)
- **Ha nincs pickup ido megadva**: Nem vilog (csak a pickup countdown jelzi a sulyosságot)

### Modositando fajlok:
- `src/hooks/useTickTimer.ts` - `getOrderUrgency` fuggveny atirasa: a `pickupTime` parametert is megkapja, es az alapjan szamol
- `src/components/staff/KanbanOrderCard.tsx` - `getOrderUrgency`-nek atadja a `pickup_time`-ot is
- `src/components/staff/StatusSummaryBar.tsx` - Az "Uj" gomb allandoan pulsal ha van uj rendeles (de ez nem vilogas, csak vizualis jelzes)

---

## 2. UUID szoveg eltavolitasa a rendelesi kartyakrol

**Jelenlegi problema**: A `submit-order` edge function a napi menuk metaadatait `order_item_options` tablaba menti `label_snapshot: "daily_complete_menu_UUID"` formatumban. Ezt a KanbanOrderCard kiolvas mint opciont es megjeleníti.

**Megoldas ket lepcsoben**:
- **Backend (submit-order)**: A metadata sor `option_type` mezojet allitsuk `'daily_meta'`-ra a jelenlegi `NULL` / `'modifier'` helyett
- **Frontend (KanbanOrderCard)**: Szurjuk ki az `option_type === 'daily_meta'` tipusu opciokat a megjelenites elol (ezek technikai metaadatok, nem a vasarlo altal valasztott opciok)

### Modositando fajlok:
- `supabase/functions/submit-order/index.ts` - 456. sor kornyeke: `option_type: 'daily_meta'` hozzaadasa
- `src/components/staff/KanbanOrderCard.tsx` - Opciok szuresenel kihagyja a `daily_meta` tipusuakat

---

## 3. Multbeli rendelesek reszletesebb megjelenitese

### 3a. Staff oldal - PastOrdersSection javitasa

**Jelenlegi problema**: A multbeli rendelesek csak rendelesi kodot, nevet, osszegett es allapotot mutatjak. Nincs email, telefon, es a datum csoportositas csak "Ma / Tegnap / Regebbi".

**Javitasok**:
- Reszletes informaciok: email cim es telefonszam megjelenitese
- Kibonthatosag: minden rendeles egy `Collapsible` elembe kerul, ami kinyitasakor mutatja a rendelt teteleket
- Jobb datum csoportositas: konkret datumokat ir ki (pl. "Februar 7, szerda"), nem csak "Regebbi"
- Idopont: az atveteli idopontot is mutatja

### 3b. Admin oldal - OrdersManagement "Multbeli rendelesek" tab javitasa

**Jelenlegi problema**: A multbeli rendelesek ugyanugy neznek ki mint az aktivak, nincs datum szerinti csoportositas.

**Javitasok**:
- Email cim megjelenitese (az `orders` tablabol, ami most mar tartalmazza az `email` mezot)
- Datum csoportositas (mai, tegnapi, regebbi napokra bontva, konkret datumokkal)
- Rendelt tetelek reszletei (opciokkal es koretekkel egyutt)
- Archivalas gomb (lasd 4. pont)

### Modositando fajlok:
- `src/components/staff/PastOrdersSection.tsx` - Teljes ujratervezes
- `src/pages/admin/OrdersManagement.tsx` - Multbeli rendelesek tab javitasa

---

## 4. Archivalas az admin oldalon

**Megoldas**: Adatbazis szintu `archived` boolean mezo az `orders` tablara. Az archivalt rendelesek alapertelmezetten nem jelennek meg a multbeli rendelesek kozott, de egy "Archivalt rendelesek mutatasa" kapcsoloval elohovhatoak.

### Adatbazis:
```sql
ALTER TABLE public.orders ADD COLUMN archived boolean NOT NULL DEFAULT false;
```

### Frontend:
- Az admin "Multbeli rendelesek" tab-on egy "Archivalas" gomb minden lezart rendeles mellett
- "Osszes archivalasa" gomb a regi rendelesek tomeges archivalasahoz
- Kapcsolo: "Archivalt rendelesek mutatasa" - ki/be kapcsolhato

### Modositando fajlok:
- SQL migracio (uj `archived` oszlop)
- `src/integrations/supabase/types.ts` - Tipus frissites
- `src/pages/admin/OrdersManagement.tsx` - Archivalas gombok es szuro

---

## 5. Staff KDS mobilra es desktopra optimalizalas

**Jelenlegi problemak a kepernykep alapjan**:
- A rendelesi kod nagyon nagy helyet foglal
- Az "Elfogadom" gomb nem eleg kiemelkedo
- A tetelek hosszu nevei csonkitva jelennek meg ("Bableves + Csirkecomb p...")
- A napi menu tetelei teljesen unreadable-k az UUID-val

**Javitasok**:
- A tetelek neveit **ne csonkitsuk** - tobbi sorba torjenek ha kell
- Kompaktabb header: a rendelesi kod es osszeg egy sorban, kisebb meretben mobilon
- A vevo neve melle a telefon es email cim is legyen lathato (kis ikonokkal)
- Jobb kontrasztot a gombok kozott

### Modositando fajlok:
- `src/components/staff/KanbanOrderCard.tsx` - Kompaktabb, informativabb kartya design

---

## Technikai reszletek - Fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `src/hooks/useTickTimer.ts` | `getOrderUrgency` fuggveny: pickup ido alapu villogas |
| `src/components/staff/KanbanOrderCard.tsx` | UUID szures, teljes nevmegjelenites, email/telefon, pickup ido alapu urgency |
| `src/components/staff/PastOrdersSection.tsx` | Reszletesebb multbeli rendelesek, datum csoportositas, kibonthato tetelek |
| `src/pages/admin/OrdersManagement.tsx` | Multbeli tab javitas, email, datum csoportositas, archivalas |
| `supabase/functions/submit-order/index.ts` | `option_type: 'daily_meta'` metadata jeloles |
| SQL migracio | `archived` boolean oszlop az `orders` tablara |
| `src/integrations/supabase/types.ts` | `archived` mezo tipus |

