## Probléma

Az "AI kép generálása" gomb most "Edge Function returned a non-2xx status code" hibát ad. A logok alapján minden POST kérés **401 Unauthorized** választ kap, miközben a felhasználó (Bence Gatai) admin szerepkörrel be van jelentkezve.

A hiba a legutóbbi biztonsági frissítésből ered — bevezettük a `requireAdmin` helpert (`supabase/functions/_shared/auth.ts`), amely `Authorization: Bearer <user JWT>` fejlécet vár. A `supabase.functions.invoke()` hívás bizonyos esetekben (különösen ha `verify_jwt = false`) az anon kulcsot küldi Bearer-ként a felhasználói access token helyett, így a `getUser()` érvénytelen tokent jelez.

## Megoldás

### 1. Diagnosztika hozzáadása (ideiglenes)
Kibővítjük a `_shared/auth.ts`-t console.log sorral, hogy lássuk: érkezik-e Bearer, és getUser() mit ad vissza. Ebből megerősítjük a pontos okot a függvény logokban.

### 2. Frontend javítás — explicit token átadás
Az AI képgeneráló komponensekben (`AIGenerateImageButton.tsx` és `AIBatchImageGenerator.tsx`) a `supabase.functions.invoke()` hívást kiegészítjük explicit Authorization fejléccel:

```ts
const { data: { session } } = await supabase.auth.getSession();
if (!session) { toast.error("Be kell jelentkezned"); return; }
const { data, error } = await supabase.functions.invoke("generate-food-image", {
  body: { ... },
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

Ez biztosítja, hogy mindig a felhasználó JWT-je menjen Authorization fejlécként, nem az anon kulcs.

### 3. Ugyanazt a mintát alkalmazzuk a többi admin-only edge function hívóinál
Átnézzük és javítjuk a többi olyan helyet, ahol a security frissítés óta ugyanez a probléma jelentkezhet:
- `ai-pricing-suggestions` hívók (`PricingSuggestions.tsx`)
- `extract-invoice-data` hívók (`InvoiceFileUpload.tsx`, `InvoiceFormDialog.tsx`)
- `generate-facebook-post` hívók (`DailyOfferImageGenerator.tsx`)
- `process-recurring-invoices` hívók (`RecurringInvoices.tsx`)

### 4. Logok ellenőrzése + diagnosztikai log eltávolítása
Miután a UI újra működik, eltávolítjuk az ideiglenes console.log-ot az `_shared/auth.ts`-ből.

## Érintett fájlok
- `supabase/functions/_shared/auth.ts` (átmeneti log + esetleg fallback)
- `src/components/admin/AIGenerateImageButton.tsx`
- `src/components/admin/AIBatchImageGenerator.tsx`
- `src/components/admin/analytics/PricingSuggestions.tsx`
- `src/components/admin/InvoiceFileUpload.tsx`
- `src/components/admin/InvoiceFormDialog.tsx`
- `src/components/admin/DailyOfferImageGenerator.tsx`
- `src/components/admin/RecurringInvoices.tsx`

Backend szerkezeti változás nincs — csak a frontend hívások javítása + 1 helper.
