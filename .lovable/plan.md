## Cél
A főoldali `HeroSection` átépítése a kiválasztott **Aszimmetrikus split** dizájnra — letisztultabb, jobban olvasható, étvágygerjesztőbb. Sofia font és márkaszínek (#F6C22D, #1F2A41, #FFF8E6) megmaradnak.

## Hatókör
Csak a `src/components/sections/HeroSection.tsx`. Minden más szekció, nav, top-bar, footer, route érintetlen.

## Új struktúra (desktop)
Kerekített (rounded-3xl) navy kártya `bg-[#1F2A41]`, két oszlop:

```text
┌─────────────────────────────┬─────────────────────────────┐
│  • Zuglói Kedvenc           │                             │
│                             │     [étel fotó, hero]       │
│  Kiscsibe                   │                             │
│  Reggeliző & Étterem (gold) │     ╔═════════════╗         │
│                             │     ║ Frissen     ║ (badge) │
│  házias ízek minden hétköznap│    ║ készül…     ║         │
│  ───────                    │     ╚═════════════╝         │
│  Friss alapanyagok… (lead)  │                             │
│                             │                             │
│  [Mai ajánlat] [Teljes étlap]│                            │
│  ───────────────            │                             │
│  ● Nyitva ma: 07:00–16:00   │                             │
└─────────────────────────────┴─────────────────────────────┘
```

## Mobil
Egymás alá tördelve: kép felül (min-h ~320px, alulról navy gradiens fade), tartalom alul középre igazítva. Floating "Frissen" badge csak `lg:` felett látszik.

## Részletek
- A meglévő `heroDesktop` / `heroMobile` PNG és WebP source-okat újrahasználjuk a kép oldalon (`<picture>` változatlanul marad, csak a wrapper aspect/pozíció változik).
- Nyitvatartási státusz dinamikusan: a már létező `TopOrderBar` szövegét **nem** duplikáljuk — a hero statikusan "Nyitva ma: H–P 07:00–16:00"-ot mutat (a részletes ma-nyitva logikát a TopOrderBar adja).
- CTA-k működése változatlan: "Mai ajánlat" → scroll `#napi-ajanlat`, "Teljes étlap" → `<Link to="/etlap">`.
- Sofia heading-ekre, body sans-serif. Színek HSL tokenekre cserélve ahol már létezik (`text-primary`, `bg-primary`, `text-primary-foreground`); az egyedi navy/cream értékek `hsl(var(--background))` ill. `hsl(var(--card))` token-ek lesznek, hogy ne legyen hardcoded hex.
- Animációk megmaradnak: `animate-fade-in-up` a szövegblokkokra staggered delay-jel, `motion-safe:animate-subtle-zoom` a képen, pulse az "él" pötty-ön.
- Section padding: `py-8 md:py-12 px-4 md:px-8`, kártya `max-w-7xl mx-auto rounded-3xl shadow-2xl overflow-hidden`.

## Érintett fájl
- `src/components/sections/HeroSection.tsx` — teljes újraírás a fenti struktúrára.

## Nem érintett
- `Index.tsx`, `ModernNavigation`, `TopOrderBar`, `MobileBottomNav`, minden lent lévő szekció.
- Backend / adat / routing / settings — nincs változás.
