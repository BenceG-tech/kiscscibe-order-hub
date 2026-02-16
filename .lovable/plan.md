
# Penugyi / Szamla Kiegeszitesek — 5 uj funkcio

## Osszefoglalas

Ot uj penugyi funkcio hozzaadasa a Kiscsibe admin rendszerhez: (1) havi penugyi osszefoglalo email, (2) AFA osszesito export, (3) ismetlodo szamlak, (4) fizetesi emlekezteto, (5) eves osszehasonlitas. Az implementacio a meglevo `invoices` tabla, `send-daily-report` edge function minta es `invoiceExport.ts` export logika mintajat koveti.

---

## 1. Havi penugyi osszefoglalo email

**Cel:** Honap vegen automatikus email a tulajdonosnak: bevetel, kiadas, eredmeny, AFA osszesito.

**Uj fajlok:**
- `supabase/functions/send-monthly-report/index.ts` — Edge function a `send-daily-report` mintajara
  - Lekerdezi az adott honap osszes szamlajat az `invoices` tablabol (service role kliens)
  - Szamolja: ossz bevetel (outgoing + order_receipt), ossz koltseg (incoming), eredmeny, AFA osszesito (27%, 5%, 0% bontasban)
  - Kategoria-bontasos tablazat az emailben
  - HTML email sablon a napi riport stilusat kovetva
  - Resend API-val kuldi a `kiscsibeetterem@gmail.com` cimre
  - Query param: `?month=YYYY-MM` (alapertelmezett: elozo honap)

**Modositott fajlok:**
- `supabase/config.toml` — uj `[functions.send-monthly-report]` szekci o, `verify_jwt = false`
- `src/pages/admin/Dashboard.tsx` — uj "Havi riport kuldese" gomb a meglevo "Teszt napi riport" melle

**Automatizalas:** pg_cron job minden honap 1-jen 6:00-kor meghivja az edge function-t az elozo honappal. Ezt SQL insert-kent rogzitjuk (nem migracio, mert user-specifikus adatokat tartalmaz).

---

## 2. AFA osszesito export

**Cel:** Negyedeves/havi AFA kimutas letoltheto Excel fajlkent a konyvelonek.

**Modositott fajlok:**
- `src/lib/invoiceExport.ts` — uj `exportVatSummaryToExcel(invoices, period)` fuggveny
  - 1. munkalap: "AFA osszesito" — AFA-kulcsonkenti bontas (27%, 5%, 0%): netto, AFA, brutto oszlopok, bejovo/kimeno kulon
  - 2. munkalap: "Reszletes" — minden szamla, rendezve datum szerint
  - 3. munkalap: "Kategoria bontas" — kategoriak szerinti osszesites AFA-val
  - Fajlnev: `afa_osszesito_2025_Q1.xlsx` vagy `afa_osszesito_2025_01.xlsx`

- `src/pages/admin/Invoices.tsx` — uj "AFA export" gomb a meglevo Export melle
  - Dropdown menu: "Havi AFA export" / "Negyedeves AFA export"
  - Idoszak-valaszto: ev + honap/negyedev
  - A szurt szamlakat hasznalja

---

## 3. Ismetlodo szamlak

**Cel:** Berleti dij, rezsi stb. automatikus letrehozasa havonta.

**Adatbazis muvelet (migracio):**
- Uj tabla: `recurring_invoices`
  - `id` uuid PK
  - `partner_name` text NOT NULL
  - `partner_tax_id` text
  - `category` text NOT NULL DEFAULT 'rent'
  - `gross_amount` integer NOT NULL
  - `vat_rate` integer NOT NULL DEFAULT 27
  - `net_amount` integer NOT NULL
  - `vat_amount` integer NOT NULL
  - `frequency` text NOT NULL DEFAULT 'monthly' (monthly, quarterly, yearly)
  - `day_of_month` integer NOT NULL DEFAULT 1
  - `next_due_date` date NOT NULL
  - `notes` text
  - `is_active` boolean NOT NULL DEFAULT true
  - `created_at` timestamptz DEFAULT now()
  - `created_by` uuid
  - RLS: admin-only CRUD

**Uj fajlok:**
- `supabase/functions/process-recurring-invoices/index.ts` — Edge function
  - Lekerdezi az aktiv ismetlodo szamlakat ahol `next_due_date <= today`
  - Mindegyikhez letrehoz egy uj `invoices` rekordot (status: 'pending', type: 'incoming')
  - Frissiti a `next_due_date`-et a kovetkezo idopontra
  - pg_cron: minden nap 5:00-kor fut

- `src/components/admin/RecurringInvoices.tsx` — UI komponens
  - Lista az ismetlodo szamlakrol: partner, osszeg, gyakorisag, kovetkezo esedekesseg
  - Uj ismetlodo szamla hozzaadasa dialog
  - Aktivalas/deaktivalas toggle
  - Szerkesztes es torles

- `src/hooks/useRecurringInvoices.ts` — CRUD hook (useQuery + useMutation)

**Modositott fajlok:**
- `supabase/config.toml` — uj function szekci o
- `src/pages/admin/Invoices.tsx` — uj "Ismetlodo szamlak" tab vagy szekci o a lista felett

---

## 4. Fizetesi emlekezteto

**Cel:** Lejarat elott 3 nappal + lejaratkor ertesites (toast az admin feluleten + opcionalis email).

**Uj fajlok:**
- `src/hooks/usePaymentReminders.ts` — hook ami lekerdezi a kozelgo es lejart szamlakat
  - "Kozelgo" = due_date 3 napon belul, status != paid/cancelled
  - "Lejart" = due_date < today, status != paid/cancelled
  - Csoportositva: "Ma jar le", "3 napon belul", "Lejart"

- `src/components/admin/PaymentReminders.tsx` — UI komponens
  - Kartya a Dashboard-on a penugyi attekintes mellett
  - Lista: szamla partner neve, osszeg, hatarido, napok szama
  - Kattintasra megnyitja a szamlat az InvoiceFormDialog-ban
  - Szin-kodolas: sarga (kozelgo), piros (lejart)

**Modositott fajlok:**
- `src/pages/admin/Dashboard.tsx` — PaymentReminders komponens beillesztese a "Havi penugyi attekintes" szekci o ala
- `src/components/admin/DashboardAlerts.tsx` — uj alert tipus: "X szamla jar le 3 napon belul"

---

## 5. Eves osszehasonlitas

**Cel:** Havi bevetel/kiadas grafikon, elozo evvel osszevetve.

**Uj fajlok:**
- `src/components/admin/analytics/YearlyComparisonTab.tsx` — Uj tab az Analytics oldalon
  - Ket vonaldiagram egymas felett: aktualis ev vs elozo ev
  - X tengely: honapok (Jan-Dec), Y tengely: osszeg
  - Harom vonal: Bevetel (zold), Kiadas (piros), Eredmeny (kek)
  - Ket ev adatait overlay-kent mutatja
  - Tablazat alatta: honapokenkenti szamszeru osszehasonlitas (% valtozas)

- `src/hooks/useYearlyInvoiceData.ts` — hook ami ket ev szamla adatait kerdezi le
  - Aktualis ev + elozo ev osszes szamlaja
  - Honaponkenti aggregacio: bevetel, kiadas, eredmeny
  - % valtozas szamitas

**Modositott fajlok:**
- `src/pages/admin/Analytics.tsx` — uj "Eves" tab a TabsList-ben + TabsContent

---

## Erintett fajlok osszesitese

| Fajl | Muvelet |
|------|---------|
| `supabase/functions/send-monthly-report/index.ts` | UJ |
| `supabase/functions/process-recurring-invoices/index.ts` | UJ |
| `supabase/config.toml` | Modositas (2 uj function) |
| `src/lib/invoiceExport.ts` | Modositas (AFA export) |
| `src/pages/admin/Invoices.tsx` | Modositas (AFA gomb + ismetlodo szekci o) |
| `src/pages/admin/Dashboard.tsx` | Modositas (havi riport gomb + fizetesi emlekezteto) |
| `src/pages/admin/Analytics.tsx` | Modositas (eves tab) |
| `src/components/admin/RecurringInvoices.tsx` | UJ |
| `src/hooks/useRecurringInvoices.ts` | UJ |
| `src/components/admin/PaymentReminders.tsx` | UJ |
| `src/hooks/usePaymentReminders.ts` | UJ |
| `src/components/admin/analytics/YearlyComparisonTab.tsx` | UJ |
| `src/hooks/useYearlyInvoiceData.ts` | UJ |
| `src/components/admin/DashboardAlerts.tsx` | Modositas |
| Adatbazis migracio: `recurring_invoices` tabla | UJ |

## Implementacios sorrend

1. **Adatbazis migracio** — `recurring_invoices` tabla letrehozasa RLS-sel
2. **AFA osszesito export** — tisztan kliens oldali, nincs fuggoseg
3. **Fizetesi emlekezteto** — meglevo adatokon dolgozik, nincs uj tabla
4. **Ismetlodo szamlak** — tabla + edge function + UI
5. **Havi riport email** — edge function + Dashboard gomb
6. **Eves osszehasonlitas** — Analytics tab bovites

## Megjegyzesek

- A pg_cron job-okat (havi riport + ismetlodo szamlak feldolgozasa) SQL insert-kent rogzitjuk, nem migraci okent, mert user-specifikus adatokat (URL, anon key) tartalmaznak
- A `recurring_invoices` tabla a meglevo `invoices` tabla szerkezetet koveti, de nem kapcsolodik hozza foreign key-jel — az edge function hoz letre uj `invoices` rekordokat beloule
- Az eves osszehasonlitas a meglevo recharts konyvtarat hasznalja, ami mar telepitve van
