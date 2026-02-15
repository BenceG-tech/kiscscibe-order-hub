

# Admin rendelés keresés és CSV export

## Osszefoglalas

Keresomezo es CSV export gomb hozzaadasa az admin rendeleskezelo oldalhoz. A kereses valos idoben szur rendelesszam, nev vagy telefon alapjan az aktiv tab-on belul. Az export az aktualisan latható (szurt) rendeleseket menti CSV fajlba.

## Valtoztatások

### 1. Uj fajl: `src/lib/orderExport.ts`

CSV export segédfuggveny:
- Bemenet: szurt rendelesek tombje (Order interfesz az items tombbol)
- CSV oszlopok: Rendelésszám, Dátum, Név, Telefon, Email, Tételek, Összeg (Ft), Fizetés, Státusz
- Tetelek oszlop: `nev x db` formatumban, pontosvesszoval elvalasztva
- Fizetes: "Készpénz" / "Kártya"
- Statusz: magyar forditas (Uj, Keszites alatt, Kesz, Atveve, Lemondva)
- UTF-8 BOM (`\uFEFF`) a fajl elejere Excel kompatibilitashoz
- Fajlnev: `kiscsibe-rendelesek-YYYY-MM-DD.csv`
- Letoltes: `Blob` + `URL.createObjectURL` + rejtett `<a>` elem

### 2. Modositas: `src/pages/admin/OrdersManagement.tsx`

**Uj importok:**
- `Search`, `Download`, `X` a `lucide-react`-bol
- `Input` a `@/components/ui/input`-bol
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` a `@/components/ui/tooltip`-bol
- `exportOrdersToCSV` az `src/lib/orderExport.ts`-bol

**Uj state-ek:**
- `searchQuery: string` (alapertelmezett: `""`)
- `debouncedSearch: string` (alapertelmezett: `""`)

**Debounce logika:**
- `useEffect` a `searchQuery`-re: 300ms `setTimeout`-tal frissiti a `debouncedSearch`-ot, cleanup-pal

**Uj UI sor a fejlec es a Tabs kozott** (368-374. sor kozott, a `<Tabs>` ele):

```text
┌─────────────────────────────────────────────┐ ┌──────────┐
│ 🔍 Keresés rendelésszám, név vagy telefon...│ │ 📥 Export │
└─────────────────────────────────────────────┘ └──────────┘
  3 találat
```

- Bal oldal: `Input` mezo `Search` ikonnal elotte, `X` gomb ha van szoveg
- Jobb oldal: `Button` variant="outline" `Download` ikonnal, tooltip-pel
- Input alatt kis szurke szoveg: `"{N} találat"`

**Szuresi logika modositas:**
- A meglevo `filterOrders()` eredmenyet tovabb szurjuk a `debouncedSearch` alapjan
- Case-insensitive `includes` a `code`, `name`, `phone` mezokon
- Uj `getFilteredOrders(tabValue)` fuggveny ami a ket szurest kombinalja
- A TabsContent rendereles es az export gomb is ezt a szurt tombot hasznalja

**Export gomb:**
- Kattintaskor `exportOrdersToCSV(getFilteredOrders(activeTab))` hivas
- `disabled` ha a szurt tomb ures

## Technikai reszletek

| Elem | Megoldas |
|------|---------|
| Debounce | `useState` + `useEffect` + `setTimeout`/`clearTimeout` (300ms) |
| CSV escape | Idezojelek koze zaras, belso idezojelek duplazasa |
| Fajl letoltes | `Blob("text/csv;charset=utf-8")` + `URL.createObjectURL` + `<a>` click + `URL.revokeObjectURL` |
| Magyar karakterek | UTF-8 BOM prefix (`\uFEFF`) |
| Szures hatokore | Mindig az aktiv tab rendelesein belul szur |

