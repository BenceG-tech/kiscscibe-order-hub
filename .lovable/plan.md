

# Phase 2: Statisztika es Analitika Oldal

## Cel

Teljes koru uzleti analitika oldal az admin panelben, amely segit az etterem tulajdonosnak megerteni a beveteleit, rendelesi mintazatokat, menu teljesitmenyt es vasarloi szokasokat. Az adatok a meglevo `orders`, `order_items`, `order_item_options`, `menu_items`, `menu_categories` tablakbol szarmaznak -- NEM kell uj tabla vagy migracio.

---

## Oldal felepites: Tabbed layout

Az `/admin/analytics` oldalon 4 tab lesz:

### Tab 1: Bevetel (Revenue)
- **Napi/heti/havi bevetel vonal-grafikon** (recharts `LineChart`) idoszak-osszehasonlitassal (elozo het/honap szurkevel)
- **Atlagos rendelesi ertek trend** -- vonaldiagram az ido fuggvenyeben
- **Fizetesi mod megoszlas** -- kor-diagram (cash vs. card a `payment_method` mezobol)
- **Legjobb nap a heten** -- bar chart Hetfo-Szombat
- **Bevetel idosavonkent** -- bar chart 30 perces ablakokban (7:00-15:00)

### Tab 2: Rendelesek (Orders)  
- **Napi rendelesi trend** -- bar chart az elmult 30 napra
- **Statusz megoszlas** -- kor-diagram (completed vs. cancelled -- lemondasi rata)
- **Atlagos tetelek rendelesenkent** -- szam kartya
- **Csucsorak heatmap** -- Hetfo-Szombat x 7:00-15:00 grid szines cellakkal (sotetebb = tobb rendeles), a `pickup_time`-bol szamolva

### Tab 3: Menu Teljesitmeny (Menu Performance)
- **Top 10 legrendeltebb etel** -- horizontalis bar chart (a `order_items.name_snapshot` alapjan)
- **Also 10 legkevesbe rendelt** -- lista (eltavolitasi jeloltek)
- **Kategoria teljesitmeny** -- bar chart (a `menu_items.category_id` + `menu_categories.name` alapjan)
- **Koretek nepszerusege** -- bar chart (az `order_item_options` tablabol szurve `option_type = 'side'`)
- **Modifier hasznalat** -- bar chart (az `order_item_options` tablabol szurve `option_type = 'modifier'`)

### Tab 4: Vasarlok (Customers)
- **Egyedi vasarlok szama** -- szam kartya (egyedi `email` vagy `phone` az `orders` tablabol)
- **Uj vs. visszatero arany** -- kor-diagram
- **Top 10 vasarlo** -- tabla: nev, rendelesek szama, ossz koltes
- **Vasarloi gyakorsag** -- atlagos napok ket rendeles kozott

---

## Idoszak-valaszto

Minden tab tetejere kerul egy kozos idoszak-valaszto:
- Gyors gombok: "Ma", "Het", "Honap", "Negyedev"
- Egyszeru datum-range picker ket input mezovel (tol-ig)
- Az osszes grafikon es metrika a valasztott idoszakra szurodot mutat

---

## Technikai megvalositas

### Uj fajlok

| Fajl | Leiras |
|------|--------|
| `src/pages/admin/Analytics.tsx` | Fo analytics oldal a 4 tabbel |
| `src/components/admin/analytics/RevenueTab.tsx` | Beveteli grafikonok |
| `src/components/admin/analytics/OrdersTab.tsx` | Rendelesi grafikonok + heatmap |
| `src/components/admin/analytics/MenuPerformanceTab.tsx` | Menu teljesitmeny grafikonok |
| `src/components/admin/analytics/CustomersTab.tsx` | Vasarloi analitika |
| `src/components/admin/analytics/PeriodSelector.tsx` | Kozos idoszak-valaszto |
| `src/components/admin/analytics/StatCard.tsx` | Kis metrika kartya (ujrahasznalhato) |
| `src/hooks/useAnalyticsData.ts` | Kozos hook az adat-lekerdesekhez |

### Modositando fajlok

| Fajl | Valtozas |
|------|----------|
| `src/App.tsx` | Uj route: `/admin/analytics` |
| `src/pages/admin/AdminLayout.tsx` | Uj nav item: "Statisztika" (BarChart3 ikon) |

### Adatforrasok (mind meglevo tablak)

- `orders`: bevetel, rendelesi darabszam, statusz, fizetesi mod, idopontok, vasarlonevek
- `order_items`: tetelek rendelesenkent, name_snapshot, qty, unit_price
- `order_item_options`: koretek es modifierek
- `menu_items` + `menu_categories`: kategoria nevek, aktiv etelek

### Lekerdezesi strategia

A hook (`useAnalyticsData`) a valasztott idoszakra szurt Supabase lekerdezeseket futtat. A feldolgozas (csoportositas napokra, idosavokra, aggregalas) a frontenden tortenik JavaScript-tel, mivel a Supabase kliens nem tamogat GROUP BY-t kozvetlenul. A 1000 soros limit figyelembe vetele:
- Napi lekerdezes: max 30 nap rendelesi (tipikusan 50-200 rendeles/nap, nem eri el a limitet)
- Ha szukseges, lapozas `.range()` hasznalataval

### Vizualizacio

A `recharts` konyvtar mar telepitve van. Hasznalt komponensek:
- `LineChart` + `Line`: trendek
- `BarChart` + `Bar`: osszehasonlitasok
- `PieChart` + `Pie`: megoszlasok
- Egyedi CSS grid: heatmap (nem recharts, hanem szines div-ek gridben)

### RLS

Minden hasznalt tabla rendelkezik admin SELECT policy-val. NEM kell uj RLS szabaly.

### Nem modosul
- Rendelesi/kosar/checkout logika
- Meglevo admin funkciok
- Staff oldal
- Backend/edge function-ok
- Adatbazis schema (nincs migracio)

---

## Megjegyzesek

- Az "Order completion time" (rendelesi atfutasi ido) mereshez jelenleg nincs statusz-valtas timestamp a rendszerben -- ez egy kesobbi migracioval megoldhato. Ebben a fazisban kihagyjuk.
- A "Seasonal trends" (szezonalis trendek) es "Price sensitivity" analizis csak akkor ertelmes, ha legalabb tobbhonap adat all rendelkezesre. A grafikonok megepulnek, de ures allapotban "Nincs eleg adat" uzenetet mutatnak.
- A "Customer retention" (vasarloi megtartas) kiszamolasa a `phone` vagy `email` mezo alapjan tortenik a rendelesekbol.

