

# Fooldal Premium Atalakitas + AI Etelkep Generalo

## Osszefoglalas

A terv harom fo pillerre epul: (A) vizualisan gazdagabb, interaktivabb fooldal, (B) jobb naptar/datum-valaszto, es (C) AI-alapu etelkep-generalo rendszer a 600+ etelhez.

---

## 1. Uj Hero Hatterkepek

A feltoltott kepek (Hero Set 7 - Traditional Modern) lecserlik a jelenlegi hero hattereket:
- **Desktop**: `Hero_Set_7_-_Traditional_Modern_-_Horizontal.png` -> `src/assets/hero-desktop.png`
- **Mobile**: `Hero_Set_7_-_Traditional_Modern_-_Vertical.jpg` -> `src/assets/hero-mobile.png`

A `HeroSection.tsx` komponens nem valtozik strukturalisan, csak a kepek cserelodnek. A sotet hatter a sotet etelek folott biztositja a szoveg olvashatosagat.

---

## 2. Interaktiv Fooldal Elemek

### a) USPSection -- Hover animaciok es mozgas
- Kartyak kajannak scroll-ra lathatova (Intersection Observer `useScrollFadeIn` hook -- mar letezik)
- Hover: kartya felemelkedik, arany glow szegely jelenik meg, ikon meretnovekedes
- Ikon hatter: animalt gradient korbe-korbe forog (CSS `@keyframes spin-slow`)

### b) ReviewsSection -- Karuszeles mozgas
- Mobilon: horizontalis swipe karuszeles a velemenyekhez (az `embla-carousel-react` mar telepitve van)
- Desktoptop: kartya hover-re 3D tilt effekt CSS `perspective` + `rotateY` -vel
- Csillagok: arany szikra animacio a toltott csillagokon

### c) GallerySection -- Parallax effekt
- Hatterelemek (blur koroi) lassan mozognak scroll-ra (CSS `background-attachment: fixed` vagy transform-alapu parallax)

### d) PromoSection -- Mar megvan a glow-pulse, kiegeszites
- Hatter kep finom parallax mozgas scroll-ra
- Visszaszamlalo szamjegyek flip-animacioval (CSS only)

### e) NewsletterSection -- Interaktiv CTA
- Email input mezore fokusz: arany glow keret animacioval
- Gomb hover: gradient shift balrol jobbra

### f) FAQSection -- Accordion animacio javitas
- Accordion nyitaskor tartalom fade-in + slide-down egyutt (mar reszben mukodik)
- Kerdes hover: arany alahuzas animacio (story-link stilus)

### g) Uj CSS keyframe-ek a `tailwind.config.ts`-ben
```
"spin-slow": csokkentett sebessegu forgatas ikonokhoz
"shimmer": fenyes csik vegigfut egy feluleten (CTA gombokra)
"float": lassu fol-le lebeges dekorativ elemekre
"tilt-in": 3D beerkezes kartyakra
```

### h) Uj CSS utility-k az `index.css`-ben
```
.shimmer-btn: arany fenycsik animacio gombokon
.tilt-card: 3D hover effekt CSS perspective-vel
.glow-border: arany glow szegely hover-re
```

---

## 3. Naptar/Datum-valaszto Javitas

A jelenlegi `WeeklyDateStrip` tul kicsi es nem elég feltuno. Javitasok:

### a) Vizualis meretnoveles
- Napok magasabb cellakban: `min-w-[56px] md:min-w-[72px]` (jelenleg 46/56)
- Nagyobb betumeret a szamokhoz: `text-xl md:text-2xl` (jelenleg lg/xl)
- Nap betuje vastagabb: `font-bold` az `uppercase` mellé

### b) Kivalasztott nap kiemelese
- Nagyobb meretkulonbseg: `scale-110` (jelenleg 105)
- Pulsalo glow effekt a kivalasztott napon: `animate-glow-pulse`
- Arany gradient hatter a kivalasztott napon (nem csak sima primary)

### c) Mai nap kiemelese
- "MA" felirat badge a mai nap folott (nem csak egy pici pont)
- Felvastagitott ring: `ring-2 ring-primary` (jelenleg ring-1)

### d) Tartalommal rendelkezo napok
- Zold pont helyett kicsi etel ikon vagy pipa ikon
- Halvany hatteret kap a cella: `bg-primary/15`

### e) Honapnev es navigacio
- Honapnev nagyobb es felvastagitott: `text-sm md:text-base font-semibold`
- Navigacios nyilak nagyobbak: `h-10 w-10`
- Animacio a het valtasanal: slide-left / slide-right

### f) Szekcio cim kiegeszites
- "Mai ajanllatunk" cim ala kerul egy finom "Valassz napot a het menu megtekintéséhez" alcim

---

## 4. AI Etelkep Generalo Rendszer

Ez a legnagyobb feature. 635 etelbol csak 8-nak van kepe. Az AI kepgeneralas megoldja ezt.

### a) Uj Edge Function: `generate-food-image`
- Fogadja: `{ item_id, item_name, prompt_override? }`
- Hasznalja a Nano Banana API-t (`google/gemini-2.5-flash-image`) a `LOVABLE_API_KEY`-vel
- Prompt sablon: "Professional food photography of [item_name], Hungarian cuisine, white ceramic plate, dark slate background, overhead angle, natural lighting, garnished with fresh herbs, restaurant quality, 45-degree angle shot" -- ez illeszkedik a feltoltott kepek stilusahoz (sotet hatter, feher tanyer, felulrol)
- A generalt kepet base64-bol Supabase Storage-ba menti (`menu-images/ai-generated/[item_id].png`)
- Frissiti a `menu_items.image_url` mezot
- Visszaadja a publikus URL-t

### b) Admin feluleten: Egyszeri kepgeneralas gomb
- A `QuickImageUpload` komponens bovitese egy "Generald AI-val" gombbal
- Gombra kattintas: edge function hivasa, loading spinner, eredmeny megjelenes
- Ha az admin nem elegedett: "Ujrageneralas" gomb
- Ha van sajat foto: a feltoltes felulirja az AI kepet

### c) Admin feluleten: Tomeges kepgeneralas
- Uj szekció a Menu admin oldalon: "AI Kepgeneralas"
- "Generalj kepet minden kep nelkuli etelhez" gomb
- Szamlalo: "627 etelbol 8-nak van kepe"
- Progress bar a tomeges generalas soran
- Batch feldolgozas: 5 kep egyidejuleg, 2 masodperc szunet kozottuk (rate limiting)
- Az edge function egyenkent hivodik, a frontend kezeli a queue-t

### d) Konzisztens stil-prompt
- A prompt ugy van megirva, hogy a kepek illeszkedjenek a feltoltott minta-kepekhez:
  - Sotet palahatter
  - Feher/kremszinu keramia tanyer
  - Felso vagy 45 fokos szog
  - Termeszetes megvilagitas
  - Friss fuszerek/zoldsegek dekoraciokent
  - Ettermi minoseg

### e) Modositando/Uj fajlok

| Fajl | Valtozas |
|------|----------|
| `supabase/functions/generate-food-image/index.ts` | UJ -- edge function az AI kepgeneralashoz |
| `src/components/admin/QuickImageUpload.tsx` | "Generalj AI-val" gomb hozzaadasa |
| `src/components/admin/AIBatchImageGenerator.tsx` | UJ -- tomeges kepgeneralas komponens |
| `src/pages/admin/MenuItemManagement.tsx` | AI batch generator integracio |

---

## 5. Osszes modositando fajl

| Fajl | Valtozas |
|------|----------|
| `src/assets/hero-desktop.png` | Csere: uj etelfoto (feltoltott horizontal kep) |
| `src/assets/hero-mobile.png` | Csere: uj etelfoto (feltoltott vertical kep) |
| `tailwind.config.ts` | Uj keyframe-ek: spin-slow, shimmer, float, tilt-in |
| `src/index.css` | Uj utility classok: shimmer-btn, tilt-card, glow-border |
| `src/components/sections/USPSection.tsx` | Scroll fade-in, hover glow, ikon animacio |
| `src/components/sections/ReviewsSection.tsx` | Mobil karuszeles (embla), hover effektek |
| `src/components/sections/GallerySection.tsx` | Parallax dekorativ elemek |
| `src/components/sections/NewsletterSection.tsx` | Input glow fokusz, gomb shimmer |
| `src/components/sections/FAQSection.tsx` | Kerdes hover alahuzas |
| `src/components/sections/DailyMenuSection.tsx` | Alcim hozzaadasa a cim ala |
| `src/components/WeeklyDateStrip.tsx` | Nagyobb cellak, jobb kiemelések, "MA" badge, animaciok |
| `supabase/functions/generate-food-image/index.ts` | UJ edge function |
| `src/components/admin/QuickImageUpload.tsx` | AI generalas gomb |
| `src/components/admin/AIBatchImageGenerator.tsx` | UJ tomeges generator |
| `src/pages/admin/MenuItemManagement.tsx` | Batch generator integracio |

### Nem modosul (megorzes)
- Kosar/checkout/rendeles logika
- Admin menuszerkeszto alapfunkciok
- Routing es navigacio
- Backend RPC hivasok
- Meglevo kep feltoltesi rendszer

---

## 6. Technikai megjegyzesek

- **Teljesitmeny**: Minden animacio CSS-alapu (`transform`, `opacity`) -- GPU gyorsitott. Nincs uj JS animacios konyvtar.
- **Dark mode**: Minden uj effekt CSS valtozokat hasznal, igy automatikusan mukodik sotet modban.
- **Mobil**: Minden uj elem responsive, a karuszeles touch-optimalizalt.
- **AI kepgeneralas koltsege**: A Nano Banana (gemini-2.5-flash-image) olcso. 627 kep generalasa megvalosithato, de erdemes batch-ekben vegezni.
- **Kepek merete**: Az AI generalt kepeket 512x512 vagy 1024x1024 meretre kerunk, es a Supabase Storage-ban taroljuk.

