

# Szemelyzeti Rendeleskezelő Ujratervezese - KDS (Kitchen Display System) Stilus

## Attekintes

A jelenlegi szemelyzeti rendelesi felulet alapveto, csak megtekintest engedve, szines megkulonboztetes nelkul. A cel egy professzionalis, konyhakepernyő-rendszer (KDS) stilusu felulet letrehozasa, amely vizualisan segiti a szemelyzetet a rendelesek gyors es hatekony kezeleseben.

## Fo Valtozasok

### 1. Szemelyzet is modosithatja a rendelesi statuszokat (Adatbazis)

Jelenleg csak admin tud statuszt frissiteni (RLS policy). A szemelyzet szamara is engedelyezni kell ezt.

Uj RLS policy az `orders` tablahoz:
- Staff felhasznalok UPDATE jogot kapnak a `status` mezohoz
- Ezt egy uj migracios SQL-lel oldjuk meg

### 2. Kanban-szeru oszlopos nezet (fo ujitas)

A jelenlegi tab-alapu megjelenitest atalakitjuk egy 3 oszlopos Kanban-stilusu nezetre, ami egyben lathatova teszi az osszes aktiv rendelest:

```text
DESKTOP NEZET:
+------------------+------------------+------------------+
|   UJ (piros)     | KESZITES ALATT   |   KESZ (zold)    |
|                  |   (narancssarga) |                  |
|  [Rendelés #A1]  |  [Rendelés #B2]  |  [Rendelés #C3]  |
|  [Rendelés #A4]  |  [Rendelés #B5]  |                  |
|                  |                  |                  |
|  "Elfogadom" ->  |  "Kész!" ->      |  "Átvéve" ->     |
+------------------+------------------+------------------+

MOBIL NEZET:
+------------------------+
| [3 UJ] [2 KESZUL] [1 KESZ] |  <- szines szamlalok
+------------------------+
| UJ RENDELESEK          |
| [Rendelés #A1]         |
|   -> "Elfogadom" gomb  |
| [Rendelés #A4]         |
|   -> "Elfogadom" gomb  |
+------------------------+
| KESZITES ALATT         |
| [Rendelés #B2]         |
|   -> "Kész!" gomb      |
+------------------------+
| KESZ - ATVETELRE VAR   |
| [Rendelés #C3]         |
|   -> "Átvéve" gomb     |
+------------------------+
```

### 3. Szines vizualis rendszer

Minden statusz sajat szinnel rendelkezik, nemcsak a badge-en, hanem a teljes kartya szegeleyen es az oszlop fejlecen is:

| Statusz | Szin | Kartya szegely | Fejlec hatter |
|---------|------|----------------|---------------|
| Uj | Piros | bal oldali 4px piros csik | Piros hatter |
| Keszites alatt | Narancssarga/sarga | bal oldali 4px narancs csik | Narancs hatter |
| Kesz (atvetelre var) | Zold | bal oldali 4px zold csik | Zold hatter |
| Atveve | Szurke | - | - |
| Lemondva | Sotet piros | - | - |

### 4. Atveteli ido visszaszamlalas es surgosseg

Minden rendeles kartyan megjelenik:
- Relativ ido ("5 perce erkezett", "23 perce keszul")
- Ha van atveteli ido: visszaszamlalas ("12 perc mulva atvetel")
- Surgossegi jelzes: ha a rendeles > 10 perce valtozott, a kartya pulzal/kiemelt lesz
- Pirossal villogo kartya ha az atveteli ido < 5 perc vagy mar lejart

### 5. Osszefoglalo sav a tetejere

A fejlec ala egy szines osszefoglalo sav kerul:

```text
+-----------------------------------------------+
| [3 UJ]      [2 KESZUL]     [1 KESZ]          |
|  piros bg    narancs bg      zold bg           |
+-----------------------------------------------+
```

Ez mindig lathato, es gyors attekintest ad a jelenlegi allapotrol.

### 6. Egy gombos gyors akcio

Minden kartyan egyetlen fo akciogomb van, ami a kovetkezo logikus lepest jelzi:
- Uj rendeles -> **"Elfogadom"** (sarga gomb)
- Keszites alatt -> **"Kesz!"** (zold gomb) 
- Kesz -> **"Atveve"** (szurke gomb)
- Lemondas lehetoseg: kis ikon gomb a sarokban

### 7. Rendelesi kartyak egyszerusitese

A kartya kompaktabb, a legfontosabb informaciokra fokuszalva:
- Nagy meretu rendelesi kod (#A1234)
- Atveteli ido kiemelt helyen
- Tetelek listaja
- Fizetesi mod ikon
- Egy fo akciogomb
- Telefon hivas ikon gomb

### 8. Ertesitesi modal javitasa

Az `OrderNotificationModal` navigacios celpontjat dinamikussa tesszuk: staff felhasznaloknal `/staff/orders`-ra iranyit, admin felhasznaloknal marad `/admin/orders`.

### 9. Multbeli rendelesek kulon tab

Az aktiv Kanban nezet alatt egy osszecsukhato "Multbeli rendelesek" szekci, ami az atvett es lemondott rendeleseket mutatja (ma, tegnap, regyebbiek szurokkel).

---

## Technikai Reszletek

### Adatbazis migracio

Uj RLS policy az `orders` tablara, ami engedelyezi a staff felhasznaloknak a statusz frissiteset:

```sql
CREATE POLICY "Staff can update order status"
ON public.orders
FOR UPDATE
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));
```

### Erintett fajlok

| Fajl | Valtoztatas |
|------|-------------|
| `src/pages/staff/StaffOrders.tsx` | Teljes ujratervezes: Kanban nezet, szines oszlopok, gyors akciogombok, osszefoglalo sav, idoszamlalo, surgossegi jelzesek |
| `src/components/admin/OrderNotificationModal.tsx` | Dinamikus navigacio (staff vs admin) - prop-alapu |
| `src/pages/staff/StaffLayout.tsx` | Osszefoglalo szamlalo sav hozzaadasa a fejlechez |

### Kanban kartya komponens

Minden kartya tartalmazza:
- Bal oldali szines csik (statusz szin)
- Rendelesi kod (nagy, felkover)
- Atveteli ido visszaszamlalas
- "X perce erkezett" relativ ido
- Tetelek listaja (nev x mennyiseg)
- Fizetesi mod ikon (penz/kartya)
- Fo akciogomb (a kovetkezo statusz fele)
- Telefon hivas gomb
- Lemondas gomb (kis, szurke)

### Ido frissites

`useEffect` + `setInterval` 30 masodpercenkent frissiti a relativ idoket ("5 perce", "12 perc mulva") anelkul, hogy ujra lekerne az adatbazist.

### Surgossegi logika

- Uj rendeles > 5 perc: narancssarga keret pulzal
- Uj rendeles > 10 perc: piros keret pulzal
- Atveteli ido < 10 perc: sarga hatter
- Atveteli ido < 5 perc: piros hatter villog
- Atveteli ido lejart: sotet piros keret, "KESES!" felirat

### Responsive design

**Desktop (lg+):** 3 oszlopos Kanban grid egymas mellett
**Tablet (md):** 3 oszlopos, kompaktabb kartyak
**Mobil (sm):** Egyoszlopos, szekciokra bontva szines fejlecekkel, osszefoglalo szamlalo sav ragad a tetejere

### Hangertesites

A meglevo Web Audio API megoldas marad, az `useGlobalOrderNotifications` hook mar mukodik a `StaffLayout`-ban.

