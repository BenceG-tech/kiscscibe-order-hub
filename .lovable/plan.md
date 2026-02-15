

# Kiscsibe Ettermi Rendszer -- Teljes Audit es Javitasi Javaslatok

---

## KRITIKUS (azonnali javitas szukseges)

### K1. Hero kepek merete -- 2.9MB + 2.5MB
- **Jelenlegi allapot**: `hero-desktop.png` (~2.9MB) es `hero-mobile.png` (~2.5MB) kozvetlenul PNG formatumban toltodik. Osszesen ~5.4MB csak a hero szekciohoz.
- **Idealis allapot**: WebP formatumba konvertalva, mindket kep 100-300KB lehetne. A `<picture>` elem mar megvan, csak a forras kepeket kell optimalizalni.
- **Fajlok**: `src/assets/hero-desktop.png`, `src/assets/hero-mobile.png`, `src/components/sections/HeroSection.tsx`
- **Bonyolultsag**: Egyszeru

### K2. CORS -- `Access-Control-Allow-Origin: *` az edge function-okben
- **Jelenlegi allapot**: A `submit-order` edge function (es valoszinuleg az osszes tobbi) `Access-Control-Allow-Origin: '*'` headert hasznal. Ez lehetove teszi, hogy barmely domain-rol kuldjenek rendelest.
- **Idealis allapot**: Csak a sajat domain-okrol engedjenek kereseket: `kiscscibe-order-hub.lovable.app` es ha van sajat domain, az is.
- **Fajlok**: `supabase/functions/submit-order/index.ts`, `supabase/functions/send-contact-email/index.ts`, stb.
- **Bonyolultsag**: Egyszeru

### K3. Nincs rate limiting a publikus edge function-okon
- **Jelenlegi allapot**: A `submit-order`, `send-contact-email`, `send-welcome-newsletter` function-ok korlatlanul hivhatok. Egy tamado percenkent szazszor is leadhat rendelest vagy kuldheti a contact form-ot.
- **Idealis allapot**: IP alapu sebessegkorlatozas (pl. max 5 rendeles/IP/10 perc, max 3 contact uzenet/IP/ora). Implementalhato az edge function-on belul egy Supabase tabla segitsegevel.
- **Fajlok**: Az osszes `supabase/functions/` konyvtar
- **Bonyolultsag**: Kozepes

### K4. Nyitvatartasi adatok inkonzisztensek a rendszerben
- **Jelenlegi allapot**: Tobbfele nyitvatartas jelenik meg:
  - Nav bar: "H-P 7:00-16:00, Szo-V Zarva"
  - Footer: "H-P 7:00-16:00, Szo-V Zarva"
  - Hero.tsx (nem hasznalt): "H-P 7:00-15:00, Szo 8:00-14:00"
  - OrderConfirmation: "H-P: 7:00-15:00, Szo: 8:00-14:00"
  - Checkout/submit-order validacio: H-P 7-15, Szo 8-14
  - A DB `validate_pickup_time()` function: H-P 7-15, Szo 8-14
  - A nav bar es footer "Zarva"-t mutat szombatra, de az uzleti logika szombaton nyitva van 8-14-ig!
- **Idealis allapot**: Egyetlen helyen tarolni (pl. `settings` tabla) es mindenhol onnan lekerdezni. A szombati nyitvatartas (8:00-14:00) legyen konzisztens.
- **Fajlok**: `ModernNavigation.tsx` (75. sor), `Footer.tsx` (166-168. sor), `OrderConfirmation.tsx` (291. sor), `Checkout.tsx`, `supabase/functions/submit-order/index.ts`
- **Bonyolultsag**: Kozepes

### K5. N+1 query problema a rendelesek betoltesnel
- **Jelenlegi allapot**: Mind az `OrdersManagement.tsx` mind a `StaffOrders.tsx` eloszor lekerdezi az osszes rendelest, majd `Promise.all`-lal minden egyes rendeleshez kulon lekerdezi az `order_items`-t es `order_item_options`-t. 100 rendeles = 300 DB query.
- **Idealis allapot**: Egyetlen lekerdezesben joinolva: `orders` -> `order_items` -> `order_item_options`. A Supabase kliens tamogatja a nested select-et: `.select('*, order_items(*, order_item_options(*)))'`.
- **Fajlok**: `src/pages/admin/OrdersManagement.tsx` (130-188. sor), `src/pages/staff/StaffOrders.tsx` (116-169. sor)
- **Bonyolultsag**: Kozepes

### K6. OG/Twitter kepek a Lovable alapertelmezett kepe
- **Jelenlegi allapot**: `index.html`-ben az `og:image` es `twitter:image` URL-ek `https://lovable.dev/opengraph-image-p98pqg.png`-re mutatnak -- ez a Lovable sajat kepe, nem a Kiscsibe-e.
- **Idealis allapot**: Sajat ettermi OG kep feltoltese a `public/` mappaba es a meta tag-ek frissitese.
- **Fajlok**: `index.html` (14, 18. sor)
- **Bonyolultsag**: Egyszeru

---

## MAGAS PRIORITAS (fontos javitas)

### M1. Checkout -- nincs progress indikator
- **Jelenlegi allapot**: A checkout oldal egy hosszu form, nincs vizualis jelzes, hogy a vevo hol tart (Kosar -> Adatok -> Osszesito -> Visszaigazolas).
- **Idealis allapot**: Stepper/progress bar komponens a form tetejere (pl. 3 lepes).
- **Fajlok**: `src/pages/Checkout.tsx`
- **Bonyolultsag**: Kozepes

### M2. Admin rendelesek -- nincs kereses
- **Jelenlegi allapot**: Nincs lehetoseg rendelesszam, nev vagy telefonszam szerinti keresre. Nagy szamu rendelesnel nehezen talalhato meg egy konkret rendeles.
- **Idealis allapot**: Szuro/kereso mezo a tab lista folott, amely valtos idejuleg szur code, name, phone mezok szerint.
- **Fajlok**: `src/pages/admin/OrdersManagement.tsx`
- **Bonyolultsag**: Kozepes

### M3. Admin rendelesek -- nincs export
- **Jelenlegi allapot**: Nincsen napi/heti rendeles export CSV/Excel formatumban.
- **Idealis allapot**: "Export" gomb, amely a szurt rendeleseket CSV-be menti (datum, kod, nev, telefon, tetelek, osszeg, statusz).
- **Fajlok**: `src/pages/admin/OrdersManagement.tsx`, uj `src/lib/orderExport.ts`
- **Bonyolultsag**: Kozepes

### M4. Hirlevel leiratkozasi link hianyzik
- **Jelenlegi allapot**: A `send-welcome-newsletter` es `send-weekly-menu` edge function-ok emailjeiben nincs leiratkozasi link. Ez GDPR kovetelmeny.
- **Idealis allapot**: Minden kimenno hirlevel email tartalmaz egy "Leiratkozas" linket, amely eltavolitja a feliratkozot a `subscribers` tablabol.
- **Fajlok**: `supabase/functions/send-welcome-newsletter/index.ts`, `supabase/functions/send-weekly-menu/index.ts`
- **Bonyolultsag**: Kozepes

### M5. Checkout form validacio -- csak submit-kor jelenik meg hiba
- **Jelenlegi allapot**: A HTML `required` attributum all a form mezokon, de nincs inline validacio. A felhasznalo csak a submit utan latja a hibakat.
- **Idealis allapot**: Zod semaval validal minden mezot, es inline hibauzeneteket jeleniti meg az egyes mezok alatt. Telefonszam formatum ellenorzes (9 szamjegy a +36 utan).
- **Fajlok**: `src/pages/Checkout.tsx`
- **Bonyolultsag**: Kozepes

### M6. FAQSection -- nincs schema.org FAQ markup
- **Jelenlegi allapot**: A FAQ szekcion nincs strukturalt adat (JSON-LD), igy a Google nem tudja kiemelt FAQ-kent megjelenitn a talalatok kozott.
- **Idealis allapot**: `<script type="application/ld+json">` blokk hozzaadasa a FAQ szekciohoz FAQPage schema-val.
- **Fajlok**: `src/components/sections/FAQSection.tsx`
- **Bonyolultsag**: Egyszeru

### M7. Nincs React.lazy() az admin oldalakon
- **Jelenlegi allapot**: Az `App.tsx`-ben az osszes admin es staff oldal statikusan importalva van. Egy vevo aki csak az etlapot nezi, letolti az admin, analytics, invoices stb. komponenseket is.
- **Idealis allapot**: `React.lazy()` + `Suspense` az admin es staff route-okra, hogy a vevo oldal bundle merete csokkenjen.
- **Fajlok**: `src/App.tsx`
- **Bonyolultsag**: Egyszeru

### M8. Velemeny szekcion -- statikus adatok
- **Jelenlegi allapot**: A velemenyek hardkodolva vannak a `ReviewsSection.tsx`-ben (6 velemenyes tomb). "127 ertekeles alapjan" szinten fix szam.
- **Idealis allapot**: Legalabb az admin feluleten lehessen szerkeszteni a kiemelt velemenyeket (pl. `settings` tabla `reviews` kulcs), vagy Google Reviews API integracio.
- **Fajlok**: `src/components/sections/ReviewsSection.tsx`
- **Bonyolultsag**: Kozepes

### M9. Footer cim inkonzisztens
- **Jelenlegi allapot**: A Footer ket helyen eltero cimet mutat: "1145 Budapest, Vezer utca 12." vs. az OrderConfirmation es MapSection "1141 Budapest, Vezer u. 110." Nem vilagos melyik a helyes.
- **Idealis allapot**: Egyetlen helyen tarolt cim, mindenhol konzisztensen megjelenitv.
- **Fajlok**: `Footer.tsx` (147, 246. sor), `MapSection.tsx` (39. sor), `OrderConfirmation.tsx` (287. sor)
- **Bonyolultsag**: Egyszeru

### M10. Cookie consent -- nincs granularis valasztas
- **Jelenlegi allapot**: A `CookieConsent.tsx` csak "Elfogadom" gombot mutat. Nincs lehetoseg kulonbonto valasztasra (szukseges/analitika/marketing).
- **Idealis allapot**: Legalabb ket opcio: "Csak szukseges" es "Osszes elfogadasa". EU ePrivacy iranyelv szerint ez elvart.
- **Fajlok**: `src/components/CookieConsent.tsx`
- **Bonyolultsag**: Kozepes

---

## KOZEPES PRIORITAS (hasznos fejlesztes)

### Z1. Staff feluleten nincs "Elfogyott" jeloles lehetoseg
- **Jelenlegi allapot**: A `StaffOrders.tsx` nem ad lehetoseget az etelek manualis "elfogyott" jelolese. Csak az admin feletul tamogatja.
- **Idealis allapot**: A `DailyStaffSummary` vagy `ItemsToPrepareSummary` komponensben legyen egy "Elfogyott" toggle az egyes eteleknel.
- **Fajlok**: `src/components/staff/DailyStaffSummary.tsx` vagy `ItemsToPrepareSummary.tsx`
- **Bonyolultsag**: Kozepes

### Z2. Staff feluleten nincs hang teszt gomb
- **Jelenlegi allapot**: Az ertesitesi hang automatikusan szol uj rendeleskor, de nincs mod tesztelni, hogy a hang megfelelo-e a konyhai kornyezetben.
- **Idealis allapot**: Hang teszt gomb a `StaffLayout` fejleceben.
- **Fajlok**: `src/pages/staff/StaffLayout.tsx`
- **Bonyolultsag**: Egyszeru

### Z3. "Elozo het masolasa" funkcio hianyzik a napi ajanlat kezeloben
- **Jelenlegi allapot**: Minden heten nullarol kell beallitani a napi ajanlatokat. Nincs lehetoseg az elozo het masolasara.
- **Idealis allapot**: "Elozo het masolasa" gomb a `WeeklyMenuGrid`-ben, amely az elozo het osszes napi ajanlatat atmasolja az aktualis hetre.
- **Fajlok**: `src/components/admin/WeeklyMenuGrid.tsx`
- **Bonyolultsag**: Osszetett

### Z4. Etlap oldalon nincs allergen szures/kereses
- **Jelenlegi allapot**: Az `Etlap.tsx` oldalon nincs lehetoseg allergen vagy nev alapjan szurni az eteleket.
- **Idealis allapot**: Szuro chipek az allergenekhez (pl. "Glutenmentes", "Laktozmentes") es/vagy egy kereso mezo.
- **Fajlok**: `src/pages/Etlap.tsx`
- **Bonyolultsag**: Kozepes

### Z5. Rendelesi visszaigazolas -- OrderConfirmation oldalon a rendeles tetelek nem mutatjak a koreteket/modositokat
- **Jelenlegi allapot**: Az `order_item_options` tablabol nem kerdezi le az opciokat a visszaigazolas oldalon, csak az alap tetelek latszanak.
- **Idealis allapot**: A koreteket es modositokat is megjelenitenni minden tetlnel.
- **Fajlok**: `src/pages/OrderConfirmation.tsx` (75-85. sor)
- **Bonyolultsag**: Egyszeru

### Z6. OrderConfirmation -- nincs nyomtatasi nezetv
- **Jelenlegi allapot**: Nincs nyomtatas gomb, a felhasznalo nem tudja kinyomtatni a visszaigazolast.
- **Idealis allapot**: "Nyomtatas" gomb, amely `window.print()`-et hiv, print CSS-sel optimalizalt nézet.
- **Fajlok**: `src/pages/OrderConfirmation.tsx`
- **Bonyolultsag**: Egyszeru

### Z7. Hero.tsx -- regi placeholder adatokkal
- **Jelenlegi allapot**: A `src/components/Hero.tsx` komponens tartalmaz regi placeholder adatokat ("1051 Budapest, Pelda utca 12.", "+36 1 234 5678", "Kiscscibe" -- dupla 'c'). Ez ugyan nem latszik sehol, mert a HeroSection-t hasznalya a rendszer, de zavarba ejto.
- **Idealis allapot**: Torolni a `Hero.tsx` fajlt ha nem hasznalt, vagy frissiteni az adatokat.
- **Fajlok**: `src/components/Hero.tsx`
- **Bonyolultsag**: Egyszeru

### Z8. PromoSection -- hamis "eredeti ar"
- **Jelenlegi allapot**: A `PromoSection.tsx` a menu arat +500 Ft-tal noveli es athuzza mint "eredeti ar" (pl. "2200 Ft" mellett "2700 Ft" athuzva). Ez megteveszto pricing es jogi kockazatot hordoz.
- **Idealis allapot**: Vagy torolni az "eredeti ar" megjelentest, vagy valodi akcios arat mutatni, amit az admin allithat be.
- **Fajlok**: `src/components/sections/PromoSection.tsx` (52. sor: `originalPrice = actualPrice + 500`)
- **Bonyolultsag**: Egyszeru

### Z9. Admin analytics -- grafikon vizualizacio
- **Jelenlegi allapot**: A `recharts` csomag telepitve van, de az analytics oldalon a grafikon implementacio allapota nem egyertelmu auditalas nelkul. A kliens oldali aggregacio skalazhato kerdese felmerul nagy mennyisegu rendeles eseten (1000+ sor limit).
- **Idealis allapot**: Server-oldali osszesites (Supabase RPC/view-k), es vizualis chartok a beveterl/rendeles trendekhez.
- **Fajlok**: `src/hooks/useAnalyticsData.ts`, `src/pages/admin/Analytics.tsx`
- **Bonyolultsag**: Osszetett

### Z10. AllergenSection -- hianyos EU allergenlista
- **Jelenlegi allapot**: Csak 5 allergen/jeloles van: Gluten, Laktoz, Tojas, Diofelek, Vegetarianus. Az EU 14 kotelezo allergen: gluten, rakfelek, tojas, hal, foldimogyoro, szoja, tej, diofelek, zeller, mustar, szezam, SO2, lupinus, molluszk.
- **Idealis allapot**: A teljes 14 EU allergen megjelenni a jelmagyarazatban.
- **Fajlok**: `src/components/sections/AllergenSection.tsx`
- **Bonyolultsag**: Egyszeru

### Z11. Error boundaries hianyoznak
- **Jelenlegi allapot**: Nincs React Error Boundary az admin vagy staff oldalakon. Ha egy komponens hibat dob, az egesz oldal feher kepernyot mutat.
- **Idealis allapot**: Error boundary a fo layout szinten, amelyik baratsagos hibauzeneteket mutat es lehetoseget ad ujratoltesre.
- **Fajlok**: Uj `src/components/ErrorBoundary.tsx`, `src/App.tsx`
- **Bonyolultsag**: Kozepes

---

## ALACSONY PRIORITAS (nice-to-have)

### A1. MobileBottomNav -- tap target meret
- **Jelenlegi allapot**: A mobil also navigacio `h-14` (56px), de a tab-ok `h-5` (20px) ikonmerettel rendelkeznek. A tényleges érintési terület elegendo (az egesz `flex-1` teruletre kattinthato), de nincs explicit `min-h-[44px]` es nincs `pb-safe` padding.
- **Idealis allapot**: Explicit `pb-safe` mar benne van (`pb-safe` class). A megoldas megfelelo, de `env(safe-area-inset-bottom)` tamogatas vizsgalata szukseges iOS-en.
- **Fajlok**: `src/components/MobileBottomNav.tsx`
- **Bonyolultsag**: Egyszeru

### A2. Google Maps iframe mindig betoltodik
- **Jelenlegi allapot**: A `MapSection` es `Contact.tsx` oldalon a Google Maps iframe `loading="lazy"`-vel van jelolve, de a fooldal scroll-ja soran akkor is betoltodik ha a felhasznalo nem er oda.
- **Idealis allapot**: Intersection Observer-rel feltetelesn betolteni, vagy meghagyni a `loading="lazy"` megoldast (ami elegseges).
- **Fajlok**: `src/components/sections/MapSection.tsx`
- **Bonyolultsag**: Egyszeru (mar megoldott)

### A3. Galeria kepek tomoritese feltolteskor
- **Jelenlegi allapot**: Nincs kliens oldali keptomorites a galeria vagy menu item kep feltoltesnel.
- **Idealis allapot**: Browser-resize + canvas compress max 1200px szelessegre, ~80% JPEG/WebP minosegre feltoltes elott.
- **Fajlok**: `src/components/admin/ImageUpload.tsx`, `src/components/admin/MultiImageUpload.tsx`
- **Bonyolultsag**: Kozepes

### A4. Admin navigacio -- 10 menupont mobilon
- **Jelenlegi allapot**: Az `AdminLayout.tsx`-ben 10 menupont van, mobilon horizontalisan gorgethetok. Ez nehez attekinteni.
- **Idealis allapot**: Csoportositas (pl. "Tartalom" csoport: Etlap/Napi/Galeria/Jogi/Rolunk; "Uzem" csoport: Rendelesek/Szamlak/Kuponok/Stat.) vagy max 6 kiemelt ikon, a tobbi "Tobb" menubol.
- **Fajlok**: `src/pages/admin/AdminLayout.tsx`
- **Bonyolultsag**: Kozepes

### A5. Dark mode kontrasztarany
- **Jelenlegi allapot**: A dark mode alapertelmezett (`defaultTheme="dark"`). Egyes elemek (pl. PromoSection hattere, Footer szurkei) nem egyertelmu kontraszt.
- **Idealis allapot**: WCAG AA (4.5:1) kontrasztarany ellenorzes minden szoveg-hatter paron.
- **Fajlok**: Tobb komponens, `tailwind.config.ts`
- **Bonyolultsag**: Kozepes

### A6. Konyhajegy nyomtatas hianya
- **Jelenlegi allapot**: Sem az admin, sem a staff feluleten nincs lehetoseg konyhajegy nyomtatasra (kis formatum, POS nyomtato).
- **Idealis allapot**: "Nyomtatas" gomb a rendelesi kartyakon, 80mm szeles termikus nyomtato formatummal.
- **Fajlok**: Uj komponens + CSS print stilus
- **Bonyolultsag**: Kozepes

### A7. Rendelés visszaigazolás oldal -- email status üzenet dark mode
- **Jelenlegi allapot**: Az `OrderConfirmation.tsx` 318. soran `bg-blue-50` es `text-blue-700` fix szinek vannak, amelyek dark mode-ban rosszul nezhetnek ki.
- **Idealis allapot**: `bg-blue-50 dark:bg-blue-950/20` es `text-blue-700 dark:text-blue-300` hasznalata.
- **Fajlok**: `src/pages/OrderConfirmation.tsx` (318. sor)
- **Bonyolultsag**: Egyszeru

### A8. Az `orders` tabla lekerdezese nem használ dátum szűrőt
- **Jelenlegi allapot**: Mind az admin mind a staff felület az összes rendelést lekérdezi (`select("*")`), limit nélkül. Idővel ez több ezer sort jelent.
- **Ideális állapot**: Csak az utolsó 7 nap rendeléseit lekérdezni alapértelmezetten, a múltbeli fülnél paginálással.
- **Fajlok**: `src/pages/admin/OrdersManagement.tsx` (131-134. sor), `src/pages/staff/StaffOrders.tsx` (117-119. sor)
- **Bonyolultsag**: Kozepes

