
# SEO es accessibility javitasok

## Osszefoglalas

Ot fejlesztes: FAQ JSON-LD markup, admin/staff lazy loading, Error Boundary, teljes EU allergen lista, es granularis cookie consent.

## 1. FAQ JSON-LD strukturalt adat

**Fajl:** `src/components/sections/FAQSection.tsx`

- A `faqs` tombot felhasznalva generalunk egy `FAQPage` schema.org JSON-LD objektumot
- `useEffect`-tel beszurjuk a `<head>`-be egy `<script type="application/ld+json">` elemkent
- Cleanup: `useEffect` return-ben eltavolitjuk (SPA navigacio miatt)
- A JSON-LD tartalom:
```text
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
    ...
  ]
}
```

## 2. React.lazy() admin es staff route-okra

**Fajl:** `src/App.tsx`

- A kovetkezo importokat lazy-re alakitjuk:
  - `AdminDashboard`, `AdminOrders`, `AdminMenu`, `AdminMenuSchedule`, `AdminDailyMenu`, `AdminCapacity`, `AdminGallery`, `AdminLegalPages`, `AdminAboutPage`, `AdminAnalytics`, `AdminCoupons`, `AdminInvoices`, `StaffOrders`
- Import: `React.lazy`, `Suspense` a React-bol
- Import: `LoadingSpinner` a `@/components/ui/loading`-bol
- Minden admin/staff `<Route>` element-jet `<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner className="h-8 w-8" /></div>}>` -be csomagoljuk
- Publikus oldalak (Index, Etlap, Menu, About, Contact, Auth, Checkout, OrderConfirmation, Gallery, legal pages) statikus import marad

## 3. Error Boundary

**Uj fajl:** `src/components/ErrorBoundary.tsx`

- React class component (`componentDidCatch`, `getDerivedStateFromError`)
- Hiba eseten: kozepre igazitott kártya, figyelmeztetés ikon, "Valami hiba tortent" cim, "Kerjuk, frissitsd az oldalt, vagy probald ujra kesobb." szoveg
- "Ujratöltes" gomb: `window.location.reload()`
- Magyar szovegek
- Stilus: a meglevo shadcn/ui Button + Card komponensekkel

**Fajl:** `src/App.tsx`

- Az `ErrorBoundary` komponenst a `<BrowserRouter>` kore csomagoljuk (a provider-ek utan, de a Routes elott)

## 4. Allergen lista bovites 14 EU allergendre

**Fajl:** `src/components/sections/AllergenSection.tsx`

- A jelenlegi 5 elemes lista helyett a teljes 14 EU kotelezo allergen:
  1. Gluten (Wheat ikon)
  2. Rakfelék (Shell ikon)
  3. Tojas (Egg ikon)
  4. Hal (Fish ikon)
  5. Foldimogyoro (CircleDot ikon)
  6. Szoja (Bean ikon)
  7. Tej/laktoz (Milk ikon)
  8. Diofelek (Nut ikon)
  9. Zeller (Leaf ikon)
  10. Mustar (Droplets ikon)
  11. Szezammag (Grip ikon)
  12. Ken-dioxid/szulfitok (FlaskConical ikon)
  13. Csillagfurt/lupinus (Flower2 ikon)
  14. Puhatestuek (Shell ikon)
- Minden allergenhez EU szamozas: a label elott megjelenik a szam (pl. "1. Gluten")
- A "Vegetarianus" sor torlodik (nem EU allergen)
- Mobil grid: `grid-cols-3` helyett `grid-cols-2` a hosszabb nevek miatt (14 elem 2 oszlopban jol fer)
- Desktop: `flex-wrap justify-center` marad
- Szinek: minden allergenhez egyedi szin, hasonloan a jelenlegi mintahoz

## 5. Cookie consent granularis valasztas

**Fajl:** `src/components/CookieConsent.tsx`

- A jelenlegi egyetlen "Elfogadom" gomb helyett ket gomb:
  - "Csak szukseges" — `localStorage.setItem("cookie-consent-level", "necessary")`
  - "Osszes elfogadasa" — `localStorage.setItem("cookie-consent-level", "all")`
- Mindket gomb beallitja a regi `cookie-consent` kulcsot is "accepted"-re (hogy a banner ne jelenjen meg ujra)
- A `STORAGE_KEY` check-nel a `cookie-consent`-et nezzuk (visszafele kompatibilis)
- UI: mobil — ket gomb egymas alatt (full width), desktop — egymas mellett
- "Csak szukseges" gomb: `variant="outline"`, "Osszes elfogadasa": `variant="default"`

## Erintett fajlok

| Fajl | Muvelet |
|------|---------|
| `src/components/sections/FAQSection.tsx` | Modositas — JSON-LD hozzaadasa |
| `src/App.tsx` | Modositas — lazy imports + Suspense + ErrorBoundary |
| `src/components/ErrorBoundary.tsx` | **UJ** — Error Boundary class component |
| `src/components/sections/AllergenSection.tsx` | Modositas — 14 EU allergen |
| `src/components/CookieConsent.tsx` | Modositas — granularis gombok |
