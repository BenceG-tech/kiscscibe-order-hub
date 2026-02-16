
# Hirlevel GDPR + PromoSection javitas

## Osszefoglalas

Ket javitas: (1) GDPR-kompatibilis leiratkozasi rendszer kiepitese HMAC-SHA256 token vedelemmel, (2) hamis "eredeti ar" eltavolitasa a PromoSection-bol.

## 1. PromoSection hamis ar eltavolitasa

**Fajl:** `src/components/sections/PromoSection.tsx`

- Toroljuk az `originalPrice` es `displayOriginal` valtozokat (51. es 53. sor)
- Toroljuk az athuzott ar megjelenites sort mind a desktop (89. sor), mind a mobil (136. sor) layout-bol
- Csak a valos menuarat mutatjuk: "Napi menu helyben — 2.200 Ft"

## 2. Leiratkozasi rendszer

### 2.1 Uj Supabase secret szukseges

- `NEWSLETTER_HMAC_SECRET` — egy veletlenszeru string, amelybol az HMAC-SHA256 token keszul. Ezt a `secrets` tool-lal kerjuk be.

### 2.2 Edge function modositasok

**`supabase/functions/send-welcome-newsletter/index.ts`:**
- HMAC-SHA256 token generalas az email cimbol a `NEWSLETTER_HMAC_SECRET` kulccsal
- Leiratkozasi link beszurasa az email HTML aljara: `https://kiscscibe-order-hub.lovable.app/leiratkozas?email={email}&token={token}`
- A jelenlegi "irj nekunk" szoveget lecsereljuk kattinthato linkre

**`supabase/functions/send-weekly-menu/index.ts`:**
- Ugyanaz az HMAC token generalas
- A `generateEmailHtml` fuggveny kap egy opcionalisan uj parametert (email + token), es a lablechoz leiratkozasi linket general
- Minden feliratkozonak sajat token-nel kuldi a linket (a batch loop-ban generalva)

**HMAC generalas (Deno):**
```typescript
async function generateUnsubscribeToken(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}
```

### 2.3 Leiratkozas oldal

**Uj fajl:** `src/pages/Unsubscribe.tsx`

- URL query parameterek: `email` es `token`
- Oldalon: Kiscsibe branding, "Biztosan le szeretnel iratkozni?" uzenet, "Leiratkozas" gomb
- Gombra kattintva: meghivja a leiratkozas edge function-t
- Sikeres leiratkozas: "Sikeresen leiratkoztal a hirleverlrol" uzenet
- Hibas token: "Ervenytelen leiratkozasi link" uzenet

### 2.4 Leiratkozas edge function

**Uj fajl:** `supabase/functions/unsubscribe-newsletter/index.ts`

- Fogadja: `{ email, token }`
- HMAC-SHA256 token validacio a `NEWSLETTER_HMAC_SECRET` kulccsal
- Ha ervenyes: `supabase.from("subscribers").delete().eq("email", email)` (service role client-tel)
- Ha ervenytelen: 403 hiba

### 2.5 RLS modositas

A `subscribers` tablanak jelenleg nincs DELETE policy-je. Mivel az edge function service role-t hasznal, nincs szukseg uj RLS policy-ra — a service role megkerueli az RLS-t.

### 2.6 Route hozzaadasa

**Fajl:** `src/App.tsx`

- Import: `Unsubscribe` a `src/pages/Unsubscribe.tsx`-bol
- Uj route a legal pages blokkba: `<Route path="/leiratkozas" element={<Unsubscribe />} />`

### 2.7 Config

**Fajl:** `supabase/config.toml`

- Uj bejegyzes: `[functions.unsubscribe-newsletter]` `verify_jwt = false`

## Erintett fajlok osszefoglalva

| Fajl | Muvelet |
|------|---------|
| `src/components/sections/PromoSection.tsx` | Modositas — hamis ar torles |
| `supabase/functions/send-welcome-newsletter/index.ts` | Modositas — HMAC token + leiratkozasi link |
| `supabase/functions/send-weekly-menu/index.ts` | Modositas — HMAC token + leiratkozasi link |
| `supabase/functions/unsubscribe-newsletter/index.ts` | **UJ** — leiratkozas endpoint |
| `src/pages/Unsubscribe.tsx` | **UJ** — leiratkozas UI oldal |
| `src/App.tsx` | Modositas — uj route |
| `supabase/config.toml` | Modositas — uj function config |

## Elofeltetelek

- `NEWSLETTER_HMAC_SECRET` secret hozzaadasa a Supabase-hez (a megvalositasnal kerjuk be)
