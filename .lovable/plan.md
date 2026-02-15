

# Bizonylat-kezelő Rendszer -- 2. Fazis

Az 1. fazis (adatbazis, CRUD, feltoltes, lista) kesz. A 2. fazis a napi hasznalhatosagot javitja: torles, napi riportbol automatikus bevetel rogzites, es havi export a konyvelonek.

---

## 1. Bizonylat torles funkció

Jelenleg a szerkeszto dialogban nincs torles gomb — ezt potolni kell.

### Valtozas
| Fajl | Leiras |
|------|--------|
| `src/components/admin/InvoiceFormDialog.tsx` | Torles gomb (piros, AlertDialog megerositessel) a dialog footer-ben, csak szerkesztes modban latszik |

- `useDeleteInvoice` hook mar letezik a `useInvoices.ts`-ben
- A torles utan a dialog bezarul es a lista frissul
- AlertDialog megerosites: "Biztosan torlod ezt a bizonylatot?"
- A csatolt fajlokat is torolni kell a storage-bol (a `file_urls`-bol kinyerjuk a path-okat)

---

## 2. Automatikus bevetel rogzites completed rendelesekbol

Minden `completed` statuszra valtozott rendeles automatikusan letrehoz egy `outgoing` / `food_sale` bizonylat rekordot az invoices tablaban. Igy a tulajdonosnak CSAK a koltseg szamlakat kell kezzel feltoltenie.

### Megoldas: Database trigger

Uj SQL trigger az `orders` tablan:
- Amikor egy rendeles `status` mezoje `completed`-re valt
- Letrehoz egy `invoices` rekordot:
  - `type = 'order_receipt'`
  - `status = 'paid'`
  - `partner_name = orders.name`
  - `gross_amount = orders.total_huf`
  - `vat_rate = 27`
  - `category = 'food_sale'`
  - `issue_date = CURRENT_DATE`
  - `order_id = orders.id`
  - `invoice_number = orders.code`
- Ne hozzon letre duplikatumot (ellenorzes: ha mar letezik invoice ezzel az `order_id`-val, kihagyja)

### Valtozasok
| Fajl | Leiras |
|------|--------|
| SQL Migration | Uj trigger: `create_invoice_on_order_complete` |

---

## 3. Havi export a konyvelonek (Excel)

Az admin feluletrol egy gombbal letoltheto Excel fajl az adott honap osszes bizonylatarrol.

### UI
- Uj gomb az Invoices oldal fejleceben: "Exportalás" ikon
- Kattintasra letolti az aktualis szurt listat Excel-kent
- Az `xlsx` csomag mar telepitve van a projektben

### Excel tartalma
- Sheet 1 "Bizonylatok": Datum, Partner, Szamla szam, Tipus, Kategoria, Netto, AFA, Brutto, Statusz
- Sheet 2 "Osszesito": Bejovo osszesen, Kimeno osszesen, Eredmeny, Kategoriankenti bontás

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/pages/admin/Invoices.tsx` | Export gomb a fejlecbe |
| `src/lib/invoiceExport.ts` | Uj fajl: Excel generalas az xlsx csomaggal |

---

## 4. Datumszuro javitas

Jelenleg a datumszuro nincs az `InvoiceFilters` komponensben implementalva. Hozzaadunk ket date input-ot (tol-ig).

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/components/admin/InvoiceFilters.tsx` | Ket date input: dateFrom, dateTo |

---

## Nem tartalmazza a 2. fazis

- Rendeles-bizonylat PDF generalas (nyomtathato osszesito) → 3. fazis
- Havi export ZIP a csatolt fajlokkal → 3. fazis
- Ismetlodo koltsegek → 3. fazis
- Dashboard penzugyi osszesito → 3. fazis
- OCR → kesobb

---

## Technikai megjegyzesek

- Az Excel export a kliens oldalon tortenik az `xlsx` konyvtarral (mar telepitve), nem kell edge function
- A database trigger `SECURITY DEFINER`-kent fut, igy az RLS-t megkerueli — szukseges, mert a rendeles statuszat staff is valtoztathatja, de az invoice tabla admin-only
- A trigger ellenorzi hogy ne legyen duplikat invoice ugyanahhoz a rendeleshez
