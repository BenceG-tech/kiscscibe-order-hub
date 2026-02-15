

# Kiscsibe Ettermi Rendszer -- Teljes Audit es Javitasi Javaslatok

---

## KRITIKUS (azonnali javitas szukseges)

### K1. Hero kepek merete -- 2.9MB + 2.5MB
- **Fajlok**: `src/assets/hero-desktop.png`, `src/assets/hero-mobile.png`, `src/components/sections/HeroSection.tsx`
- **Allapot**: ⬜ TODO

### K2. CORS -- `Access-Control-Allow-Origin: *` az edge function-okben
- **Fajlok**: Osszes `supabase/functions/*/index.ts`
- **Allapot**: ⬜ TODO

### K3. Nincs rate limiting a publikus edge function-okon
- **Fajlok**: Osszes `supabase/functions/` konyvtar
- **Allapot**: ⬜ TODO

### K4. Nyitvatartasi adatok inkonzisztensek
- **Fajlok**: `ModernNavigation.tsx`, `Footer.tsx`, `OrderConfirmation.tsx`, `Checkout.tsx`, `submit-order/index.ts`
- **Allapot**: ⬜ TODO

### K5. N+1 query problema rendeleseknel
- **Fajlok**: `OrdersManagement.tsx`, `StaffOrders.tsx`
- **Allapot**: ⬜ TODO

### K6. OG/Twitter kepek Lovable alapertelmezett
- **Fajlok**: `index.html`
- **Allapot**: ⬜ TODO

---

## MAGAS PRIORITAS

### M1. Checkout progress indikator
### M2. Admin rendelesek kereses
### M3. Admin rendelesek export
### M4. Hirlevel leiratkozasi link (GDPR)
### M5. Checkout inline validacio
### M6. FAQ schema.org markup
### M7. React.lazy() admin oldalakra
### M8. Velemenyek dinamikus kezelese
### M9. Footer cim inkonzisztens
### M10. Cookie consent granularis valasztas

---

## KOZEPES PRIORITAS

### Z1-Z11. Lasd reszletes audit dokumentum: AUDIT_AND_IMPROVEMENT_PLAN.md
