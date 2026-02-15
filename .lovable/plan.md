

# Bizonylat-kezelő Rendszer -- 1. Fazis

Ez egy nagy projekt, ezert fazisokra bontjuk. Az 1. fazis a legfontosabb alapokat rakja le: adatbazis, fajl feltoltes, lista nezet, uj szamla dialog.

---

## Adatbazis

### Uj tablak

**invoices** -- fo bizonylat tabla:
- `id` uuid PK
- `type` text ('incoming' | 'outgoing' | 'order_receipt')
- `status` text ('draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'), default 'draft'
- `invoice_number` text (nullable, kezzel megadott szamla sorszam)
- `partner_name` text
- `partner_tax_id` text (nullable)
- `order_id` uuid FK orders (nullable)
- `issue_date` date, default CURRENT_DATE
- `due_date` date (nullable)
- `payment_date` date (nullable)
- `net_amount` integer, default 0
- `vat_amount` integer, default 0
- `gross_amount` integer, default 0
- `vat_rate` integer, default 27
- `category` text ('ingredient' | 'utility' | 'rent' | 'equipment' | 'salary' | 'tax' | 'food_sale' | 'other')
- `notes` text (nullable)
- `file_urls` text[] default '{}'
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
- `created_by` uuid (nullable)

**invoice_items** -- szamla tetelsorok (opcionalis reszletezeshez):
- `id` uuid PK
- `invoice_id` uuid FK invoices ON DELETE CASCADE
- `description` text
- `quantity` numeric default 1
- `unit` text default 'db'
- `unit_price` integer default 0
- `line_total` integer default 0

### RLS policyk
- Csak admin lathassa, szerkeszthesse, torolhesse (is_admin)
- Staff nem lat semmit

### Storage bucket
- Uj privat bucket: `invoices` (public: false)
- RLS: csak admin tolthet fel / olvashat / torolhet
- Elfogadott tipusok: PDF, JPG, PNG, HEIC
- Max 10MB

---

## Uj fajlok

| Fajl | Leiras |
|------|--------|
| `src/pages/admin/Invoices.tsx` | Fo oldal: lista nezet + szurok + osszesito kartyak |
| `src/components/admin/InvoiceListItem.tsx` | Egy szamla sor a listaban |
| `src/components/admin/InvoiceFormDialog.tsx` | Uj/szerkeszto dialog a bizonylat rogzitesehez |
| `src/components/admin/InvoiceFilters.tsx` | Szuro sor: tipus, statusz, kategoria, datum |
| `src/components/admin/InvoiceSummaryCards.tsx` | Osszesito kartyak (beJovo/kimeno/eredmeny) |
| `src/components/admin/InvoiceFileUpload.tsx` | Fajl feltoltes komponens (PDF + kep, tobbszoros, kamera gomb mobilon) |
| `src/hooks/useInvoices.ts` | React Query hook a szamlak CRUD muveleteire |

## Modositando fajlok

| Fajl | Valtozas |
|------|--------|
| `src/App.tsx` | Uj route: `/admin/invoices` |
| `src/pages/admin/AdminLayout.tsx` | Uj menupont: "Szamlak" (Receipt ikon) |

---

## UI terv

### Lista nezet (/admin/invoices)

- Felso sav: "Szamlak kezelese" cim + "[+ Uj bizonylat]" gomb
- Szuro sor: Tipus dropdown (Mind/Bejovo/Kimeno), Statusz dropdown, Kategoria dropdown, datumtartomany
- 3 osszesito kartya: Bejovo osszeg, Kimeno osszeg, Eredmeny (+/-)
- Lista: kartyak mobilon, tabla desktopon
  - Partner neve, kategoria badge, osszeg (piros/zold), datum, statusz badge, csatolt fajlok szama
  - Kattintasra megnyilik a szerkeszto dialog

### Uj bizonylat dialog

- Tipus valaszto: Bejovo (koltseg) / Kimeno (bevetel)
- Partner neve (autocomplete korabbi partnerekbol)
- Adoszam (opcionalis)
- Szamla szam (opcionalis)
- Kiallitas datuma + fizetesi hatarido
- Kategoria dropdown (Alapanyagok, Rezsi, Berleti dij, Felszereles, Ber, Ado, Etel ertekesites, Egyeb)
- Brutto osszeg + AFA kulcs (27%, 5%, 0%) → netto es AFA automatikus szamitas
- Fajl feltoltes: tobbszoros, kamera gomb mobilon, drag-and-drop
- Megjegyzes
- Mentes gomb (piszkozat / fizetve)

### Mobil optimalizacio

- A fajl feltoltes komponensnel nagy "Foto keszitese" gomb ami `capture="environment"` attributummal nyitja a kamerat
- Vertikalis kartya elrendezes a listaban
- Dialog a standard dialog-accessibility-standard szerint (max-h calc, fix header/footer)

---

## Nem tartalmazza az 1. fazis

Ezek kesobb jonnek (2-3. fazis):
- Rendeles-bizonylat PDF generalas
- Havi export ZIP + Excel a konyvelonek
- Automatikus bevetel rogzites completed rendelesekbol
- Ismetlodo koltsegek
- Dashboard penzugyi osszesito kartyak
- Partner-nyilvantartas kulon oldal
- OCR (fotobol adat kinyeres)
- NAV integracioval nem foglalkozunk

---

## Technikai megjegyzesek

- A `useInvoices` hook React Query-t hasznal (`useQuery` + `useMutation`) a mar letezo mintaknak megfeleloen
- Az AFA szamitas kliens oldalon tortenik: netto = brutto / (1 + vat_rate/100), vat = brutto - netto
- A partner autocomplete a korabbi invoices-bol szedi az egyedi partner neveket (distinct query)
- Toast ertesitesek sonner-rel (a projekt szabvanya szerint)
- A dialog a `Dialog` komponenst hasznalja a standard accessibility minta szerint

