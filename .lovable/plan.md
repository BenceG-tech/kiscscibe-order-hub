

# "Ami Meglepne a Tulajt" — 5 uj funkcio

## Osszefoglalas

Ot kulonleges funkcio a Kiscsibe admin rendszerhez: (1) AI-alapu arazasi javaslat, (2) pazarlas-trend elemzes, (3) Facebook poszt szoveg generalo, (4) QR-kodos asztali rendeles, (5) digitalis nyugta emailben. A megoldasok a meglevo adatokat (orders, order_items, daily_waste_log, daily_offers) es a Lovable AI Gateway-t hasznalja.

---

## 1. AI-alapu arazasi javaslat

**Cel:** Korabbi eladasi adatok alapjan automatikus arazasi javaslatok, pl. "A gulyasleves 1800 Ft-ert 30%-kal tobbet adtal el mint 2200-ert."

**Uj fajlok:**
- `supabase/functions/ai-pricing-suggestions/index.ts` — Edge function
  - Lekerdezi az elmult 90 nap `order_items` adatait (item_id, name_snapshot, qty, unit_price_huf)
  - Csoportositja tetelenkent es aronkent: hanyszor rendeltek es milyen aron
  - Az aggregalt adatokat elkuldi a Lovable AI Gateway-nek (google/gemini-3-flash-preview)
  - System prompt: "Te egy ettermi arazasi tanacsado vagy. Elemezd az eladasi adatokat es adj konkret arazasi javaslatokat magyarul."
  - Visszaadja a strukturalt javaslatokat (tool calling: `suggest_pricing`)

- `src/components/admin/analytics/PricingSuggestions.tsx` — UI komponens az Analytics oldalon
  - "AI javaslatok frissitese" gomb → meghivja az edge function-t
  - Kartya lista: tetel neve, jelenlegi ar, javasolt ar, indoklas
  - Szinkodolas: zold (arnoveles javasolt), sarga (csokkentes), szurke (megfelelo)
  - Loading allapot animacioval
  - Fontos: "Tapasztalati becsles — kizarolag tajekoztato jellegu" felirat

**Modositott fajlok:**
- `src/pages/admin/Analytics.tsx` — uj "AI Arazas" tab
- `supabase/config.toml` — uj function szekci o

---

## 2. Pazarlas-trend elemzes

**Cel:** A meglevo `daily_waste_log` adatokbol automatikus trendek es javaslatok, pl. "Az elmult 4 hetben minden penteken maradt rantott sajt."

**Uj fajlok:**
- `src/components/admin/analytics/WasteTrends.tsx` — UI komponens
  - Lekerdezi az elmult 8 het `daily_waste_log` adatait
  - Kliens oldali aggregacio:
    - Nap szerinti bontas: melyik napokra marad a legtobb
    - Tetel szerinti ismétlodés: hanyszor maradt egy adott etel (min 3x → trend)
    - Heti osszehasonlitas: nott vagy csokkent a pazarlas
  - Vizualizacio:
    - Heti pazarlas vonaldiagram (recharts LineChart)
    - "Ismetlodo pazarlas" lista: etel neve, hanyszor maradt, melyik napokon
    - Szin-kodolas: piros ha egyre tobb marad, zold ha javulo trend
  - Automatikus szoveges javaslatok (sablon-alapu, nem AI):
    - "A [etel neve] az elmult [X] hetbol [Y]-szor maradt — fontold meg a mennyiseg csokkenteset"
    - "[Nap neve] napra atlagosan [X]% tobot foztel mint amennyit eladtal"

**Modositott fajlok:**
- `src/components/admin/WasteTracking.tsx` — uj "Trendek" tab hozzaadasa a meglevo pazarlas UI-hoz
  - Tabs: "Naplozas" (meglevo) | "Trendek" (uj)

---

## 3. Facebook poszt szoveg generalo

**Cel:** A napi menubol automatikus Facebook poszt szoveg generalasa az AI segitsegevel, a meglevo kep-generatorral egyutt hasznalhato.

**Uj fajlok:**
- `supabase/functions/generate-facebook-post/index.ts` — Edge function
  - Bemenet: `{ date: "YYYY-MM-DD" }`
  - Lekerdezi az adott nap `daily_offers` + `daily_offer_items` + `menu_items` adatait (get_daily_data RPC)
  - A menu adatokat elkuldi a Lovable AI Gateway-nek
  - System prompt: "Irj egy rovid, hangulatos Facebook posztot magyarul egy etterem napi ajanlatarol. Hasznalj emoji-kat mertekletesen. Max 280 karakter. A hangnem legyen kedves es invitalo."
  - Visszaadja: poszt szoveg + hashtag javaslatok

- `src/components/admin/FacebookPostGenerator.tsx` — UI komponens
  - A meglevo DailyOfferImageGenerator melle integralva (vagy kulon kartya)
  - "Poszt szoveg generalasa" gomb
  - Szerkesztheto szovegmezo a generalt szoveggel
  - "Masolás vágólapra" gomb
  - A meglevo kep-generatorbol letoltheto keppel egyutt hasznalja

**Modositott fajlok:**
- `src/pages/admin/DailyMenuManagement.tsx` — A "Kep generator" tab-on belul, a kep generalas ala kerul a poszt szoveg szekci o
  - Vagy: a DailyOfferImageGenerator.tsx-be agyazva
- `supabase/config.toml` — uj function

---

## 4. QR-kodos asztali rendeles

**Cel:** Vendeg beolvassa a QR kodot, megnyilik az Etlap oldal — nincs sorbanallas.

**Uj fajlok:**
- `src/pages/admin/QRGenerator.tsx` — Admin oldal QR kod generalasra
  - Asztal szam mezo (1-20)
  - Automatikusan generalja a QR kodot: `{SITE_URL}/etlap?table={asztal_szam}`
  - A QR kodot SVG-kent generaja (kliens oldali qrcode konyvtar nelkul — Canvas API-val vagy egy egyszeru SVG generatorral)
  - Letoltheto PNG formaban (egyenként vagy osszes asztal egyszerre)
  - Nyomtathato A6-os kartya formatum: QR kod + "Rendelj a telefonodrol!" felirat + Kiscsibe logo + asztal szam

- `src/components/admin/QRCodeCard.tsx` — QR kod kartya komponens
  - QR kod megjelenitese
  - Asztal szam
  - Letoltes gomb

**Megjegyzes:** A QR kod egyszeruen a meglevo Etlap oldalra mutat egy `?table=X` query parameterrel. Az Etlap oldal ezt az informaciot megjeleníti a kosar/rendeles feluleten mint "Asztal: X". Nem igenyel adatbazis valtoztatast.

**Modositott fajlok:**
- `src/pages/Etlap.tsx` — `table` query param kiolvasasa es megjelenitese badge-kent
- `src/pages/Checkout.tsx` — `table` param atvitele a rendelesi megjegyzesbe (notes mezo)
- `src/App.tsx` — uj Route: `/admin/qr` => QRGenerator (ProtectedRoute)
- `src/pages/admin/AdminLayout.tsx` — uj menu pont: "QR Kodok"

**QR kod generacios logika:** Canvas-alapu QR kod generalas (saját implementacio, nincs extra fuggoseg):
- A QR kod generalashoz a meglevo Canvas API-t hasznaljuk (mint a kep-generatornal)
- Alternativa: a `qrcode` npm csomag hasznalata (kicsi, fuggoseg nelkuli)

---

## 5. Digitalis nyugta emailben

**Cel:** A vevo emailben kapja a nyugtat a rendeles utan — "zold es modern".

**Modositott fajlok:**
- `supabase/functions/submit-order/index.ts` — A meglevo visszaigazolo email bovitese nyugta formatummal
  - Az email mar most tartalmazza a rendeles osszes reszletet (tetelek, arak, osszeg)
  - Bovites: 
    - ÁFA bontas (27% ÁFA): netto osszeg, ÁFA osszeg, brutto osszeg
    - Rendeles szam (order code) mint szamlaszam
    - Datum + idopont
    - "Ez a dokumentum nem minösül adóügyi bizonylatnak" felirat
    - Nyomtathato HTML stilus (`@media print` optimalizalt)
  - Uj email sekci o: "Digitalis nyugta" blokk a visszaigazolas emailben

- `src/pages/OrderConfirmation.tsx` — "Nyugta letoltese PDF-ben" gomb
  - `window.print()` alapu — a visszaigazolo oldalt nyomtatobarat formatumban rendereli
  - A `@media print` CSS elrejti a navigaciot es csak a nyugta tartalmat mutatja
  - Alternativa: a jelenlegi oldalon egy "Nyomtatas" gombbal (mar van egy `Printer` ikon importalva)

---

## Erintett fajlok osszesitese

| Fajl | Muvelet |
|------|---------|
| `supabase/functions/ai-pricing-suggestions/index.ts` | UJ |
| `supabase/functions/generate-facebook-post/index.ts` | UJ |
| `src/components/admin/analytics/PricingSuggestions.tsx` | UJ |
| `src/components/admin/analytics/WasteTrends.tsx` | UJ |
| `src/components/admin/FacebookPostGenerator.tsx` | UJ |
| `src/pages/admin/QRGenerator.tsx` | UJ |
| `src/components/admin/QRCodeCard.tsx` | UJ |
| `supabase/config.toml` | Modositas (2 uj function) |
| `src/pages/admin/Analytics.tsx` | Modositas (AI Arazas tab) |
| `src/components/admin/WasteTracking.tsx` | Modositas (Trendek tab) |
| `src/components/admin/DailyOfferImageGenerator.tsx` | Modositas (poszt szoveg szekci o) |
| `src/pages/admin/DailyMenuManagement.tsx` | Modositas (ha kulon tab kell a posztnak) |
| `supabase/functions/submit-order/index.ts` | Modositas (AFA bontas az emailben) |
| `src/pages/OrderConfirmation.tsx` | Modositas (nyomtatas gomb) |
| `src/pages/Etlap.tsx` | Modositas (table param) |
| `src/pages/Checkout.tsx` | Modositas (table param atvitele) |
| `src/App.tsx` | Modositas (uj route) |
| `src/pages/admin/AdminLayout.tsx` | Modositas (uj menu pont) |

---

## Implementacios sorrend

1. **Digitalis nyugta** — a meglevo submit-order email bovitese, legkisebb kockazat
2. **Pazarlas-trend elemzes** — kliens oldali aggregacio a meglevo adatokbol
3. **Facebook poszt generalo** — uj edge function + UI a meglevo kep-generator melle
4. **QR-kodos asztali rendeles** — uj admin oldal + Etlap/Checkout modositas
5. **AI arazasi javaslat** — uj edge function + Analytics tab

## Technikai megjegyzesek

- Az AI funkciok (arazas, poszt) a Lovable AI Gateway-t hasznaljak a `LOVABLE_API_KEY` secret-tel, ami mar konfiguralt
- A QR kod generaciora ket opcio van: (a) sajat Canvas-alapu implementacio, vagy (b) `qrcode` npm csomag. Az utobbit javaslom egyszeruseg vegett
- A digitalis nyugta nem adougyi bizonylat — ezt az emailben es az oldalon is jelezni kell
- A pazarlas-trend elemzes nem hasznal AI-t, hanem sablon-alapu javaslatokat general — gyors es megbizhato

