## Terv: Hero szekció prémium átdolgozása (desktop fókuszú)

A jelenlegi `HeroSection.tsx` teljes szélességű háttérképét lecseréljük egy strukturált, kétoszlopos elrendezésre, amely pontosan a csatolt referencia képet követi. A márka karaktere (sötét navy + arany sárga, Sofia kézírásos főcím) változatlan marad. A felső infosáv és a navigáció (`ModernNavigation`) érintetlen — már most pontosan úgy néz ki, mint a referencián.

### Érintett fájlok

1. **`src/components/sections/HeroSection.tsx`** — teljes átírás kétoszlopos struktúrára
2. **`src/pages/Index.tsx`** — apró elrendezési korrekció, hogy a hero alatti `BreakfastSection` folytonosan csatlakozzon (a meglévő `bg-primary/5` wrapper esetleges eltávolítása a hero alatti első blokkról, hogy az "Reggeli" szekció szöveg+gomb fejléce a hero-folyamat része legyen)
3. **Nincs** új komponens, nincs backend változás, nincs új függőség.

### Új Hero felépítés (desktop)

```text
┌──────────────────────────────────────────────────────────────┐
│  [TopBar: Ma nyitva ...]  (változatlan, ModernNavigation)    │
│  [Nav: logo | menü | Rendelj most | Facebook] (változatlan)  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌────────────────────────┐   ┌──────────────────────────┐  │
│   │  GLASS PANEL (45-50%)  │   │  FOOD COLLAGE (50-55%)   │  │
│   │                        │   │                          │  │
│   │  Kiscsibe Reggeliző    │   │  meleg tónusú prémium    │  │
│   │  & Étterem  (Sofia)    │   │  ételfotó kompozíció     │  │
│   │  házias ízek ...       │   │  (leves + reggeli +      │  │
│   │  Friss levesek...      │   │   latte + burger)        │  │
│   │                        │   │  bal felé sötét gradient │  │
│   │  [Mai ajánlat] [Étlap] │   │  overlay → belesimul     │  │
│   │                        │   │  a glass panelbe         │  │
│   │  ◻ Friss reggeli       │   │                          │  │
│   │  ◻ Helyben & elvitel   │   │                          │  │
│   │  ◻ Zugló               │   │                          │  │
│   └────────────────────────┘   └──────────────────────────┘  │
│                                                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│   │ Reggeli  │ │ Napi menü│ │Desszertek│  ← részben a hero  │
│   └──────────┘ └──────────┘ └──────────┘     aljára ültetve │
└──────────────────────────────────────────────────────────────┘
```

### Tartalom (változatlan szövegek)

- Főcím: „Kiscsibe Reggeliző & Étterem" (fehér, Sofia)
- Alcím: „házias ízek minden hétköznap" + kis kézzel rajzolt arany szív SVG
- Leírás: „Friss levesek, kiadós főételek, gyors átvétel Zuglóban."
- Elsődleges CTA: „Mai ajánlat" (sárga, sötét szöveg, `UtensilsCrossed` ikon) → scroll `#napi-ajanlat`
- Másodlagos CTA: „Teljes étlap" (sötét, arany kontúr, `BookOpen` ikon) → `/etlap`
- 3 info chip: Friss reggeli / Helyben & elvitel / Zugló (`Sun`, `ShoppingBag`, `MapPin`)
- 3 kategória kártya: Reggeli (`#reggeli`), Napi menü (`#napi-ajanlat`), Desszertek (`/etlap#desszertek`)

### Vizuális részletek

- **Glass panel**: `bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl shadow-2xl p-8 lg:p-12`
- **Háttér**: meglévő `hero-desktop` kép a JOBB oldali oszlopban (`<picture>` megmarad), a bal oldal mögé sötét navy alap (`bg-background`) + balról jobbra haladó `bg-gradient-to-r from-background via-background/80 to-transparent` overlay a fotó tetején
- **Info chipek**: `rounded-xl border border-primary/30 bg-background/50 px-3 py-2`, ikon arany körben, kétsoros mini szöveg
- **Kategória kártyák**: `-mt-12` negatív margin a hero alja alá ültetéshez; `rounded-2xl border border-primary/30 bg-background/80 backdrop-blur`; bal oldalt arany ikon kör + kis 56×56 ételkép thumbnail (placeholder vagy meglévő reggeli/leves/desszert kép), jobbra `ChevronRight`; hover: `hover:border-primary hover:shadow-warm transition`
- **Spacing**: hero magasság `min-h-[640px] lg:min-h-[720px]`, max-width `7xl`, gap-8 a két oszlop között
- **Animációk**: meglévő `animate-fade-in-up` staggered megtartva a bal oszlop tartalmán

### Reszponzív viselkedés

- **Desktop (lg+)**: 2 oszlop `grid-cols-12`, panel `col-span-6`, fotó `col-span-6`; kártyák 3 oszlopban
- **Tablet (md)**: 2 oszlop, panel `col-span-7`, fotó `col-span-5`, kisebb padding; kártyák 3 oszlopban
- **Mobil**: 1 oszlop — felül fotó (aspect-[4/3]), alatta glass panel teljes szélességben, CTA-k `w-full`, chipek 2 oszlopos grid, kategória kártyák egymás alatt (a meglévő `MobileBottomNav` érintetlen)

### Megmaradó és NEM módosított elemek

- `ModernNavigation` (top bar + nav) — már a referencia szerint néz ki
- `BreakfastSection`, `DailyMenuSection` és minden további szekció — érintetlen
- Backend, route-ok, adatlekérés, CartContext — érintetlen
- Brand színek/fontok (`#F6C22D`, Sofia) — érintetlen
- Logikai funkciók (scroll CTA, hidden admin click, stb.) — érintetlen

### Várt eredmény

Tisztább, prémiumabb, jobban olvasható hero, ahol a fő üzenet (név + szlogen + CTA) elkülönül az étvágygerjesztő fotótól, az info chipek azonnal kommunikálják a kulcsinformációkat, a kategória kártyák pedig vizuális hídként vezetnek tovább az oldal többi szekciójához — pontosan a csatolt referencia kép szerint.
