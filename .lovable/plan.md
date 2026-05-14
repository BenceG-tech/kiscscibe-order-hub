## Cél
Az `info@kiscsibeetterem.hu` legyen az új kapcsolati email cím a teljes alkalmazásban a régi `kiscsibeetterem@gmail.com` helyett.

## Érintett fájlok (frontend)
- `src/components/Footer.tsx`
- `src/components/contact/ContactInfo.tsx`
- `src/pages/legal/Impresszum.tsx` (fallback szöveg)
- `src/components/admin/LegalPageEditor.tsx` (alapértelmezett szöveg)

## Érintett fájlok (edge functions – értesítő emailek `to:` mezője és lábléc)
- `supabase/functions/send-contact-email/index.ts`
- `supabase/functions/send-daily-report/index.ts`
- `supabase/functions/send-monthly-report/index.ts`
- `supabase/functions/send-weekly-menu/index.ts`
- `supabase/functions/send-welcome-newsletter/index.ts`
- `supabase/functions/submit-order/index.ts`

## Változás
Egyszerű keresés‑csere: `kiscsibeetterem@gmail.com` → `info@kiscsibeetterem.hu` (mailto linkek, megjelenített szövegek és edge function `to:` címek).

## Megjegyzések
- A DB `settings` tábla nem tartalmaz régi gmail címet, ott nincs teendő.
- A dokumentációs `.md` fájlt nem módosítjuk (nem felhasználói felület).
- Funkcionális logika nem változik.
