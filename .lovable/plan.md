

# Admin Tooltip Rendszer -- Hasznalati utasitasok mindenhova

Minden admin oldal fejleceihez, gombjaihoz, kartyaihoz es fontos UI elemeihez kis info-tooltip kerul, ami roviden elmagyarazza a tulaj szamara az adott funkciok celját es hasznalatat.

---

## Megvalositasi modszer

Egy `InfoTip` segéd-komponens keszul, ami egy kis `(i)` ikont jelenít meg, és hover/kattintasra mutatja a szoveget. Ez a `TooltipProvider` + `Tooltip` + `TooltipTrigger` + `TooltipContent` Radix komponensekre epul, amik mar leteznek a projektben.

### Uj fajl

| Fajl | Leiras |
|------|--------|
| `src/components/admin/InfoTip.tsx` | Ujrahasznalhato info-tooltip komponens (ikon + szoveg) |

---

## Tooltip elhelyezesek oldalonkent

### 1. Dashboard (`Dashboard.tsx`)
- "Iranytiopult" cim melle: "Itt latod a mai forgalom osszesiteset es a legfontosabb szamokat."
- "Havi penzugyi attekintes" cim melle: "Az aktualis honap szamlai alapjan szamolt bevetel, koltseg es eredmeny."
- "Holnapi menu beallitasa" gomb: "Ugras a napi ajanlat oldalra, ahol beallithatod a holnapi menut."
- "Teszt napi riport" gomb: "Elkueld magadnak emailben a mai nap osszesiteset."

### 2. Rendelesek (`OrdersManagement.tsx`)
- "Rendelesek kezelese" cim melle: "Kezeld a bejovo rendeleseket: fogadd el, allitsd keszre, vagy monddd le."
- Tab-ok ("Uj", "Keszites alatt", "Kesz", "Multbeli", "Aktiv"): mindegyikhez rovid magyarazat

### 3. Etlap kezeles (`MenuManagement.tsx`)
- "Etlap kezeles" cim melle: "Itt adhatod hozza, szerkesztheted vagy torold az etlapon lathato etelek listajat."
- "Uj etel" gomb: "Uj etel hozzaadasa az etlaphoz."
- "Aktiv" checkbox: "Csak az aktiv etelek jelennek meg az etlapon."
- "Kiemelt" checkbox: "A kiemelt etelek elol jelennek meg a fooldal ajanlottjai kozott."

### 4. Napi ajanlatszk (`DailyMenuManagement.tsx`)
- "Napi ajanlatok" cim melle: "Allitsd be a heti napi menusort, kapacitast, es kueld ki hirlevelet."
- Tab-ok ("Ajanlatok", "Kapacitas", "Import", "Hirlevel", "FB kep"): mindegyikhez rovid leiras

### 5. Szamlak (`Invoices.tsx`)
- "Szamlak kezelese" cim melle: "Rogzitsd a bejovo koltsegszamlakat es kovetsd a penzugyi helyzetet."
- "Export" gomb: "Letoltes Excel fajlkent a konyvelonek."
- "Uj bizonylat" gomb: "Uj szamla vagy bizonylat rogzitese (koltseg vagy bevetel)."
- Osszesito kartyak ("Koltsegek", "Bevetelek", "Eredmeny"): rovid magyarazat mindegyiknel

### 6. Galeria (`Gallery.tsx`)
- "Galeria" cim melle: "Toltsd fel es kezeld a fooldali galeriaban megjelen kepeket."

### 7. Statisztika (`Analytics.tsx`)
- "Statisztika" cim melle: "Reszletes elemzesek a beveteledrol, rendelesekrol es az etlap teljesitmenyerol."
- Tab-ok ("Bevetel", "Rendelesek", "Menu teljesitmeny", "Vasarlok", "Pazarlas"): rovid leiras

### 8. Kuponok (`Coupons.tsx`)
- "Kuponok" cim melle: "Hozz letre kedvezmeny kuponokat amiket a vasarlok a rendelesnel hasznalhatnak."
- "Uj kupon" gomb: "Uj kedvezmeny kupon letrehozasa."

### 9. Jogi oldalak (`LegalPageEditor.tsx`)
- Cim melle: "Szerkeszd az adatvedelmi tajekoztato, ASZF es impresszum szovegeket."

### 10. Rolunk (`AboutPageEditor.tsx`)
- Cim melle: "Szerkeszd a Rolunk oldal tartalmat: torteneted, ertekeid, kepeid."

### 11. Ertesito szerkeszto (`AnnouncementEditor.tsx`)
- "Ertesito / Pop-up" cim melle: "Allits be egy felugro ertesitest ami a latogatoknak megjelenik a fooldalon."

### 12. Szamla form dialog (`InvoiceFormDialog.tsx`)
- Kulonbozo mezok: "Brutto osszeg" melle "A teljes osszeg AFA-val egyutt", "AFA kulcs" melle "A legtobb szamlara 27% vonatkozik"

---

## Technikai reszletek

### InfoTip komponens
- Props: `text: string`, opcionalisan `side?: "top" | "bottom" | "left" | "right"`
- Megjelenes: kis `HelpCircle` (lucide) ikon, halva szurke, hover-re kek
- Mobil: kattintasra is megjelenik (a Radix Tooltip tamogatja)
- Max szelesseg: 250px, sotetebb hatter a jobb lathatosagert

### Modositando fajlok

| Fajl | Valtozas |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Cimek es gombok melle InfoTip |
| `src/pages/admin/OrdersManagement.tsx` | Cim melle InfoTip |
| `src/pages/admin/MenuManagement.tsx` | Cim, gombok, checkbox-ok melle |
| `src/pages/admin/DailyMenuManagement.tsx` | Cim es tab-ok melle |
| `src/pages/admin/Invoices.tsx` | Cim, gombok melle |
| `src/pages/admin/Analytics.tsx` | Cim melle |
| `src/pages/admin/Coupons.tsx` | Cim, gomb melle |
| `src/pages/admin/Gallery.tsx` | Cim melle |
| `src/components/admin/AnnouncementEditor.tsx` | Cim melle |
| `src/components/admin/InvoiceSummaryCards.tsx` | Kartya cimek melle |
| `src/components/admin/InvoiceFormDialog.tsx` | Mezo cimkek melle |
| `src/components/admin/InvoiceFilters.tsx` | Gyorsgombok melle |

---

## Pelda tooltip szovegek

Minden szoveg rovid, 1-2 mondatos, kozertheto (nem technikai). Pelda:
- **Mai rendelesek kartya**: "A mai nap osszes bejott rendelese es azok osszerteke."
- **Export gomb**: "Letolti az aktualis szurt listat Excel fajlkent, amit atkuldhetsz a konyvelodnek."
- **Kapacitas tab**: "Allitsd be hany adag etelt tudsz kesziteni egy adott napon."

