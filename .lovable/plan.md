
# Ket modositas: 5 csillagos ertekelesek + Hirlevel feliratkozo lista

## 1. Minden ertekeles 5 csillagos

**Fajl:** `src/components/sections/ReviewsSection.tsx`

- A `reviews` tombben a ket 4 csillagos ertekeles (Szabo Peter es Toth Mark) `rating` ertekeit 4-rol 5-re allitjuk
- Az `averageRating` erteket 4.7-rol 5.0-ra modositjuk

## 2. Feliratkozo lista az admin hirlevel panelen

**Fajl:** `src/components/admin/WeeklyNewsletterPanel.tsx`

A jelenlegi panel csak a feliratkozok szamat mutatja. Bovites:

- A meglevo `subscribers-count` query helyett/mellett lekerdezzuk az osszes feliratkozo email cimet is (`supabase.from("subscribers").select("id, email, created_at")`)
- Uj szekci o a "Heti menu elonezet" kartya felett: **"Feliratkozok"** kartya
  - Tablazat: email cim, feliratkozas datuma, checkbox
  - "Osszes kivalasztasa / Kivalasztas torlese" gomb
  - Alapertelmezetten minden feliratkozo ki van valasztva
  - A felhasznalo egyes feliratkozokat kijelolhet/kitorolhet a checkboxszal
- A "Heti menu kikuldese" gomb logikaja modosul:
  - A kivalasztott email cimeket a `send-weekly-menu` edge function-nek kuldi (`selected_emails` parameterben)
  - A megerosito dialogusban a kivalasztott szam jelenik meg (pl. "12/15 feliratkozonak")

**Fajl:** `supabase/functions/send-weekly-menu/index.ts`

- Ha a request body tartalmaz `selected_emails` tombot, akkor csak azoknak kuld (a `subscribers` tablabol szurve)
- Ha nincs `selected_emails`, az osszes feliratkozonak kuld (visszafele kompatibilis)

## Technikai reszletek

### ReviewsSection.tsx valtozasok
- 31. sor: `rating: 4` → `rating: 5` (Szabo Peter)
- 46. sor: `rating: 4` → `rating: 5` (Toth Mark)
- 60. sor: `averageRating` 4.7 → 5.0

### WeeklyNewsletterPanel.tsx valtozasok
- Uj import: `Checkbox` komponens (`@/components/ui/checkbox`), `Table` komponensek
- Uj state: `selectedEmails: Set<string>` (alapbol az osszes ki van valasztva)
- Uj query: feliratkozo lista (email + created_at + id)
- Uj UI szekci o: feliratkozo tablazat checkbox-okkal
- A `handleSend` fuggveny modositasa: `selected_emails` parameter kuldese

### send-weekly-menu/index.ts valtozasok
- A `body` parseolasa utan: ha van `selected_emails`, szures a feliratkozok kozott
- `subscribers` lekerdezeshez `.in("email", body.selected_emails)` filter hozzaadasa
