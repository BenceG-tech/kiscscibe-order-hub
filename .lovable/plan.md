
# Kiscsibe Számla Rendszer Fejlesztési Terv

## Áttekintés

3 önálló fejlesztés az `InvoiceFormDialog.tsx`-ben és `InvoiceListItem.tsx`-ben, plusz egy új hook az `invoice_items` kezeléséhez.

---

## 1. ÁFA Kulcs Szabadság

### Jelenlegi állapot
A Select dropdown csak 3 fix értéket kínál: 27%, 5%, 0%.

### Új megoldás

Az ÁFA mezőt lecseréljük egy kombinált vezérlőre a form „ÁFA kulcs" sorában:

**Gyorsgombok + szabad bevitel egy sorban:**
```
[27%]  [5%]  [0%]    [____ %]
```
- A 3 gomb `Button variant="outline"` stílusban, kattintásra beírja az értéket
- Az `Input type="number" min="0" max="100"` bármilyen értéket elfogad
- Ha egy gyorsgomb értéke megegyezik a mezővel, aktív stílusú (`variant="default"`)

**Speciális checkbox szekció** (collapsible, alapból csukva):
```
☐ Fordított adózás
☐ ÁFA-mentes  
☐ Tárgyi adómentes
```
- Ha bármelyik be van pipálva → `vat_rate` = 0 és az ÁFA mező `disabled`
- A megjegyzés mezőbe automatikusan beírja a speciális típus szövegét
- Ha kipipeálják → visszaállítja a megjegyzést és feloldja a mezőt
- `specialVatType` state: `null | "fordított" | "mentes" | "tárgyi"`

---

## 2. Fizetési Dátum Szerkesztése

### InvoiceFormDialog – „Fizetve" gomb

A `DialogFooter`-ben a „Fizetve" gomb helyett egy kétlépéses folyamat:

1. Kattintásra egy kis Popover nyílik a gomb mellett
2. A Popover tartalmaz egy `Calendar` komponenst (Shadcn DatePicker)
3. Alapértelmezett dátum: mai nap
4. „Mentés fizetve" gombbal lezárja és hívja a `handleSave("paid", selectedDate)`
5. A `handleSave` szignatúrája kiegészül egy opcionális `paymentDate?: string` paraméterrel

```
[Piszkozat] [Fizetésre vár]  [Fizetve ▾]
                                └─ Popover: Calendar + Mentés gomb
```

### InvoiceListItem – gyors státuszváltás

A `handleStatusChange` függvényben:
- Ha `newStatus === "paid"` → **ne azonnal mutáljon**
- Helyette egy kis inline Popover nyílik egy `Calendar`-ral
- A `paid` Popover megjelenik a lista item-en belül (stop propagation)
- Kiválasztott dátummal hívja az `update.mutate()`-t

**Implementáció:** `pendingPaymentDate` state + `showPaymentPicker` boolean a komponensben.

---

## 3. Számla Tételsorok (invoice_items)

### DB: Meglévő tábla felhasználása

A `invoice_items` tábla már létezik a sémában:
- `id`, `invoice_id`, `description`, `quantity`, `unit`, `unit_price`, `line_total`

Hiányzik: `vat_rate` per tétel. Ezt a meglévő `unit` mezőn kívül nem kell DB migrációval kezelni — az egységár-alapú számítást a globális ÁFA %-al végezzük soronként. Így **nincs szükség DB migrációra**.

### Új hook: `useInvoiceItems`

A `useInvoices.ts`-be kerül:
- `useInvoiceItems(invoiceId?)` — lekéri az `invoice_items` tábla sorait egy adott `invoice_id`-ra
- `useUpsertInvoiceItems()` — delete + insert stratégiával frissít (régi sorok törlése, újak insertje)

### Új lokális state: `lineItems`

```typescript
interface LineItem {
  id?: string;          // undefined = új sor
  description: string;
  quantity: number;
  unit: "db" | "kg" | "l" | "adag" | "óra" | "hónap";
  unit_price: number;
  vat_rate: number;     // globális ÁFA % örökli, de soronként módosítható
  line_total: number;   // auto: unit_price * qty * (1 + vat_rate/100)
}
```

### UI elrendezés a formban

A tételek szekció a „Bruttó összeg / ÁFA kulcs" blokk FELETT jelenik meg:

```
── Tételek ──────────────────────────────────────── [+ Új tétel]

  Leírás            | Menny. | Egys. | Egységár | ÁFA% | Összeg | [X]
  ─────────────────────────────────────────────────────────────────
  Metro szállítás   |   3    |  db   |  5 000   |  27  | 19 050 | [X]
  ─────────────────────────────────────────────────────────────────
                         Nettó összesen:          45 000 Ft
                         ÁFA összesen:            12 150 Ft
                         Bruttó összesen:         57 150 Ft

── Összeg (tételekből) ──────────────────────────────────────────
  Bruttó: [57 150]  ← readonly, ha van tétel
  ÁFA:    [27%   ]
```

**Mobilon** (narrow dialog): a tétel sorok egymás alatt jelennek meg kártyaszerűen.

### Mentési logika

```
handleSave("paid") →
  1. invoice mentése (create/update) → visszakapjuk az invoice.id-t
  2. ha lineItems.length > 0:
     a. DELETE invoice_items WHERE invoice_id = id
     b. INSERT invoice_items (tömb)
```

### Betöltési logika szerkesztésnél

```
useEffect([invoice]) →
  if (invoice?.id) → loadLineItems(invoice.id) → setLineItems(result)
```

---

## Érintett fájlok

| Fájl | Változás |
|---|---|
| `src/components/admin/InvoiceFormDialog.tsx` | Teljes refactor: ÁFA panel, payment datepicker, tételsorok |
| `src/components/admin/InvoiceListItem.tsx` | `handleStatusChange` + inline payment datepicker popover |
| `src/hooks/useInvoices.ts` | `useInvoiceItems` + `useUpsertInvoiceItems` hook hozzáadása |

**Nincs DB migráció** — a `invoice_items` tábla már létezik a megfelelő oszlopokkal.

---

## Kockázatok és megjegyzések

- Az `invoice_items` táblán nincs `vat_rate` oszlop soronként — ezért a sor összegzés a globális ÁFA %-ot használja. Ha soronkénti ÁFA kell a jövőben, egy migrációval bővíthető.
- A `line_total` az adatbázisban bruttó értéket tárol (unit_price × qty × (1 + vat%)).
- A dialog max-height korlátozott → a tételek szekció scrollozható marad a `flex-1 overflow-y-auto` wrapper miatt.
