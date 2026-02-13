
# PromoSection Premium Atalakitas + Facebook URL javitas

## 1. Facebook URL javitas

Az osszes fajlban `https://www.facebook.com/kiscsibeetteremXIV/?locale=hu_HU` lecserelese `https://www.facebook.com/kiscsibeetteremXIV`-re:
- `src/components/ModernNavigation.tsx` (2 helyen)
- `src/components/Footer.tsx` (1 helyen)
- `src/components/contact/ContactInfo.tsx` (1 helyen)

## 2. PromoSection premium atalakitas

A jelenlegi egyszeru flex-row banner atalakitasa egy vizualis, figyelemfelkelto promocioos szekcioova:

### Uj design elemek

- **Hatter kep**: A `hungarian-soup.jpg` kep (mar letezik az assets-ben) blur-rel es 50% opacity-vel hatterkent
- **Gradient overlay**: Hero-stilus gradient szovegdoboz a kep folott
- **Visszaszamlalo**: "Mai ajanlat meg X ora Y percig!" -- 16:00-ig (zarasig) szamol vissza, csak hetfotol pentekig jelenik meg
- **Athuzott ar**: A menuar mellett egy magasabb "eredeti ar" athuzva (menu_price + 500 Ft mint "eredeti ar" az erzekelt ertek novelesere)
- **Pulsalo szegely**: CSS `animate-pulse` glow effektus a keret korul
- **Responsive**: Mobilon vertikalis elrendezes, desktopon horizontalis

### Technikai megvalositás

**Uj keyframe a tailwind.config.ts-ben:**
```
"glow-pulse": {
  "0%, 100%": { boxShadow: "0 0 15px hsl(var(--primary) / 0.3)" },
  "50%": { boxShadow: "0 0 30px hsl(var(--primary) / 0.6)" }
}
```

**Visszaszamlalo logika:**
- `useState` + `useEffect` + `setInterval` (1 percenkent frissul)
- 16:00-hoz (zarashoz) kepest szamol vissza
- Hetvegen es zarasi ido utan nem jelenik meg
- Tiszta CSS animacio, nincs kulon konyvtar

**Ar megjelenites:**
- Valos ar: a `get_daily_data` RPC-bol (jelenlegi logika megmarad)
- "Eredeti ar": valos ar + 500 Ft, athuzott stilussal

**Hatter kep:**
- `hungarian-soup.jpg` betoltese a meglevo assets-bol
- CSS `blur(8px)` + `opacity-50` a hatteren
- GPU-gyorsitott: `transform: translateZ(0)` a blur retegre

### Modositando fajlok

| Fajl | Valtozas |
|------|----------|
| `src/components/sections/PromoSection.tsx` | Teljes ujrairas: hatterkep, gradient overlay, countdown, athuzott ar, pulsalo szegely |
| `tailwind.config.ts` | `glow-pulse` keyframe + animation hozzaadasa |
| `src/components/ModernNavigation.tsx` | Facebook URL javitas (2 helyen) |
| `src/components/Footer.tsx` | Facebook URL javitas |
| `src/components/contact/ContactInfo.tsx` | Facebook URL javitas |

### Megorzendo funkcionalitas
- A `get_daily_data` RPC hivas es dinamikus ar megmarad
- Az `/etlap` CTA link megmarad
- Az elviteli es diak kedvezmeny badge-ek megmaradnak (atformazza gradient stilusba)
- Dark mode teljes tamogatas a CSS valtozok hasznalataval
- Semmi rendelesi/kosar/checkout funkcio nem valtozik
