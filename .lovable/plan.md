
# Partner Kezelő Modul — Fejlesztési Terv

## Összefoglalás

Egy teljes partner-adatbázis modul kerül bevezetésre, amely:
- Egy új `partners` Supabase táblát hoz létre a szükséges migrációval
- Egy új admin oldalt (`/admin/partners`) és menüpontot épít
- Az `InvoiceFormDialog`-ot partner-választóval bővíti
- Az `invoices` táblát `partner_id` opcionális FK-val bővíti

---

## 1. Adatbázis migráció

### 1.1 `partners` tábla létrehozása

```sql
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  tax_number text,
  eu_vat_number text,
  address text,
  postal_code text,
  city text,
  contact_name text,
  contact_email text,
  contact_phone text,
  payment_terms text DEFAULT 'net_15',
  bank_name text,
  bank_iban text,
  category text DEFAULT 'other',
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
```

### 1.2 RLS policy-k (admin-only CRUD)

```sql
CREATE POLICY "Admin can view partners"
  ON public.partners FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admin can insert partners"
  ON public.partners FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can update partners"
  ON public.partners FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete partners"
  ON public.partners FOR DELETE USING (is_admin(auth.uid()));
```

### 1.3 `invoices` tábla bővítése

```sql
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
```

### 1.4 `updated_at` trigger

```sql
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Érintett fájlok

| Fájl | Változás |
|---|---|
| **MIGRÁCIÓ** (SQL) | `partners` tábla + RLS + `invoices.partner_id` FK |
| `src/hooks/usePartners.ts` | **ÚJ** — CRUD hook-ok a `partners` táblához |
| `src/pages/admin/Partners.tsx` | **ÚJ** — partner lista oldal, keresés, szűrés, kártya dialog |
| `src/pages/admin/AdminLayout.tsx` | "Partnerek" menüpont hozzáadása (Users ikon, Számlák előtt) |
| `src/App.tsx` | `/admin/partners` route hozzáadása lazy-load-dal |
| `src/components/admin/PartnerFormDialog.tsx` | **ÚJ** — partner létrehozás/szerkesztés dialog |
| `src/components/admin/PartnerDetailDialog.tsx` | **ÚJ** — partner adatok + kapcsolt számlák + forgalom |
| `src/components/admin/PartnerSelector.tsx` | **ÚJ** — combobox a `InvoiceFormDialog`-ban |
| `src/components/admin/InvoiceFormDialog.tsx` | Partner-választó hozzáadása a "Partner neve" mező fölé |
| `src/hooks/useInvoices.ts` | `Invoice` interface: `partner_id?: string` |

---

## 3. Részletes implementáció

### 3.1 `usePartners.ts` hook

```typescript
export interface Partner {
  id: string;
  name: string;
  short_name: string | null;
  tax_number: string | null;
  eu_vat_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  payment_terms: string;
  bank_name: string | null;
  bank_iban: string | null;
  category: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

Hook-ok:
- `usePartners(filters?)` — lista lekérés (szűrés: category, is_active, search)
- `usePartner(id)` — egyedi partner
- `useCreatePartner()` — insert mutáció
- `useUpdatePartner()` — update mutáció
- `useDeletePartner()` — törlés (csak ha nincs hozzátartozó számla)
- `useActivePartners()` — csak aktív partnerek (partner-választóhoz)

### 3.2 `/admin/partners` oldal felépítése

**Fejléc:**
```
Partnerek kezelése          [+ Új partner]
```

**Keresés + szűrők sáv:**
```
[🔍 Keresés név/adószám...]   [Kategória ▾]   [Státusz: Mind / Aktív / Archivált]
```

**Partner lista kártya-sor (desktop):**
```
┌─────────────────────────────────────────────────────────────────────┐
│ ● Metro Kft.          | Élelmiszerbeszerzés | net_30 | Takács Péter │
│   12345678-2-42       |                     |        | 06-20-xxx    │
│                                                     [Aktív toggle]  │
└─────────────────────────────────────────────────────────────────────┘
```
- Kattintásra megnyílik a `PartnerDetailDialog`
- Archivált partner szürke háttérrel és `opacity-50`-vel jelenik meg

**Kategória értékek:**
- `food_supplier` → Élelmiszer szállító
- `beverage` → Ital szállító
- `cleaning` → Takarítószer
- `equipment` → Felszerelés
- `utility` → Rezsi/közüzemi
- `service` → Szolgáltatás
- `other` → Egyéb

**Fizetési feltételek:**
- `immediate` → Azonnal
- `net_8` → 8 nap
- `net_15` → 15 nap
- `net_30` → 30 nap

### 3.3 `PartnerFormDialog` — Létrehozás/Szerkesztés

Tabokba szervezett form dialog (max-h scrollable):

**Tab 1: Alapadatok**
- Név* + Rövid név
- Adószám (12345678-2-42 formátum) + EU adószám
- Kategória (Select)
- Fizetési feltétel (Select)

**Tab 2: Cím & Kapcsolat**
- Irányítószám + Város + Teljes cím
- Kapcsolattartó neve + email + telefon

**Tab 3: Pénzügyi**
- Bank neve + IBAN
- Megjegyzés (Textarea)

Footer: `[Mégse]` `[Törlés]` `[Mentés]`

### 3.4 `PartnerDetailDialog` — Részletek + Számlák

A listából kattintva nyílik meg, 2 szekció:

**Felső rész:** Partner összes adata szerkeszthetően (beágyazott form = ugyanaz mint a `PartnerFormDialog` tartalma, `Dialog` keretben).

**Alsó rész: Kapcsolt számlák**
```
── Kapcsolt számlák ─────────────────────────────────
  Összesített forgalom:  ████████  1 234 500 Ft
  
  [Bizonylat lista — az invoices táblából partner_name ILIKE '%Metro%']
```

Mivel a partner-számla kapcsolat opcionális FK (`partner_id`) és sok régi számla csak `partner_name`-el van rögzítve, a lekérés **dupla feltétellel** dolgozik:
```sql
WHERE partner_id = $id
   OR LOWER(partner_name) = LOWER($name)
```

**Törlés logika:**
- Ha vannak kapcsolt számlák → `[🗑 Archiválás]` gomb jelenik meg, törlés nem lehetséges
- Ha nincsenek → `[🗑 Törlés]` gomb is megjelenik, confirm AlertDialog-gal
- A `useDeletePartner` hook először ellenőrzi a számla-kapcsolatokat

### 3.5 `PartnerSelector` — Combobox az InvoiceFormDialog-ban

Az `InvoiceFormDialog.tsx`-ben a "Partner neve" `Input` mező fölé kerül egy combobox:

```
Partner kiválasztása (opcionális)
┌──────────────────────────────────────────────────┐
│ 🔍 Keresés...                              [▾]  │
└──────────────────────────────────────────────────┘
  ● Metro Kft.              (Élelmiszer szállító)
  ● Coca-Cola HBC           (Ital szállító)
  ─────────────────────────────────────────────────
  [+ Új partner létrehozása]
```

**Működési logika:**
1. A `Command` / Popover-alapú combobox az `useActivePartners()` hook adatait használja
2. Partner kiválasztásakor:
   - `form.partner_name` ← `partner.name`
   - `form.partner_tax_id` ← `partner.tax_number`
   - `selectedPartnerId` state ← `partner.id`
3. Ha a felhasználó a "Név" mezőbe kézzel ír → `selectedPartnerId` törlődik (szabad kitöltés megmarad)
4. "Új partner" opció → megnyit egy beágyazott `PartnerFormDialog`-ot, sikeres mentés után automatikusan kiválasztja
5. Mentéskor a `payload`-ba bekerül: `partner_id: selectedPartnerId || null`

---

## 4. AdminLayout menüpont és route

### AdminLayout bővítés

A `Receipt` (Számlák) előtt új elem:
```typescript
{ href: "/admin/partners", label: "Partnerek", mobileLabel: "Partnerek", icon: Users, badgeCount: 0 }
```
Import: `Users` from `lucide-react`

### App.tsx route

```typescript
const AdminPartners = React.lazy(() => import("./pages/admin/Partners"));

<Route path="/admin/partners" element={
  <ProtectedRoute requireAdmin>
    <Suspense fallback={<LazyFallback />}><AdminPartners /></Suspense>
  </ProtectedRoute>
} />
```

---

## 5. InvoiceFormDialog bővítés

**Csak** a partner-választó blokk kerül be, a meglévő logika érintetlen marad:

```
[Partner kiválasztása]  ← PartnerSelector combobox (ÚJ)
[Partner neve *]        ← meglévő Input (megmarad, kézzel is kitölthető)
[Adószám]  [Számla szám]
...
```

A `handleExtracted` (AI számlafelismerés) továbbra is felülírhatja a partner mezőket.

---

## 6. Adatfolyam összefoglalója

```text
partners tábla
      │
      ├─── PartnerSelector (InvoiceFormDialog)
      │         └── kitölti partner_name, partner_tax_id, partner_id
      │
      ├─── Partners oldal (/admin/partners)
      │         ├── PartnerFormDialog (create/edit)
      │         └── PartnerDetailDialog
      │                   └── kapcsolt invoices lekérés
      │
      └─── invoices.partner_id (FK, NULL = régi számla)
```

---

## Megvalósítási sorrend

1. **Migráció** futtatása (partners tábla + invoices.partner_id)
2. `src/hooks/usePartners.ts` létrehozása
3. `src/components/admin/PartnerFormDialog.tsx` létrehozása
4. `src/components/admin/PartnerDetailDialog.tsx` létrehozása
5. `src/components/admin/PartnerSelector.tsx` létrehozása
6. `src/pages/admin/Partners.tsx` létrehozása
7. `src/pages/admin/AdminLayout.tsx` bővítése
8. `src/App.tsx` route hozzáadása
9. `src/hooks/useInvoices.ts` interface bővítése (`partner_id`)
10. `src/components/admin/InvoiceFormDialog.tsx` PartnerSelector beágyazása
