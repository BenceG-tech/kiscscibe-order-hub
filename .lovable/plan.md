

# PromoSection Modern Redesign

## Összefoglaló

A jelenlegi "Napi menü helyben" szekció túl nagy és régi stílusú. A redesign céljai:
- Kompaktabb megjelenés (kevesebb vertical padding)
- Modern, inline horizontal layout desktopon
- Stílusos mobile megjelenés
- Egységes design a többi szekcióval

---

## Jelenlegi vs. Új Design

### Jelenlegi (nagy, vertikális):
```text
┌────────────────────────────────────────────┐
│                    🧾                       │
│                                            │
│       Napi menü helyben: 2 200 Ft          │
│                                            │
│  ● Elvitel doboz: +200 Ft/doboz            │
│  ● Diák/nyugdíjas: –10% 11:30–13:00        │
│                                            │
│              [Részletek]                    │
│                                            │
└────────────────────────────────────────────┘
```

### Új Design - Desktop (inline, horizontal):
```text
┌───────────────────────────────────────────────────────────────────────┐
│  ╭────╮                                                               │
│  │ 🍽 │  Napi menü helyben         📦 +200 Ft    👨‍🎓 -10%   [Részletek]│
│  ╰────╯      2 200 Ft              elvitel    11:30-13:00            │
└───────────────────────────────────────────────────────────────────────┘
```

### Új Design - Mobile (compact vertical):
```text
┌────────────────────────────────────────┐
│  ╭────╮  Napi menü helyben            │
│  │ 🍽 │       2 200 Ft                │
│  ╰────╯                               │
│  ┌──────────────┐ ┌──────────────┐    │
│  │ 📦 +200 Ft   │ │ 👨‍🎓 -10%     │    │
│  │   elvitel    │ │  11:30-13:00 │    │
│  └──────────────┘ └──────────────┘    │
│           [Részletek →]               │
└────────────────────────────────────────┘
```

---

## Részletes Design

### Desktop Layout
- **Egy sorban** minden elem
- Bal oldalon: ikon + ár cím
- Középen: 2 info badge (inline pill-ek)
- Jobb oldalon: CTA gomb
- Minimális padding: `py-8` (jelenleg `py-12 md:py-16`)

### Mobile Layout  
- Ikon + cím felül
- 2 info badge egymás mellett (grid-2)
- CTA gomb alul, teljes szélesség

### Stílus Elemek
- Card: `rounded-2xl`, backdrop blur, subtle border
- Info Badge-ek: `bg-primary/10 rounded-xl` pill stílus
- CTA: Outline stílus arrow ikonnal (modernebb)
- Kisebb spacing: `py-8 md:py-10`

---

## Fájl Változtatások

**Fájl:** `src/components/sections/PromoSection.tsx`

### Új Struktúra (Desktop):

```tsx
<section className="py-8 md:py-10">
  <div className="max-w-5xl mx-auto px-4">
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-4 md:p-6">
      
      {/* Desktop: flex row */}
      <div className="hidden md:flex items-center justify-between gap-6">
        
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-warmth rounded-2xl flex items-center justify-center shadow-lg">
            <UtensilsCrossed className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Napi menü helyben</p>
            <p className="text-2xl font-bold text-primary">2 200 Ft</p>
          </div>
        </div>
        
        {/* Middle: Info Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">+200 Ft elvitel</span>
          </div>
          <div className="bg-primary/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">-10% diák 11:30-13:00</span>
          </div>
        </div>
        
        {/* Right: CTA */}
        <Button variant="outline" className="group">
          Részletek
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
        
      </div>
      
      {/* Mobile: vertical compact layout */}
      <div className="md:hidden space-y-4">
        {/* Icon + Title row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-warmth rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Napi menü helyben</p>
            <p className="text-xl font-bold text-primary">2 200 Ft</p>
          </div>
        </div>
        
        {/* Info badges grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary/10 rounded-xl px-3 py-2.5 text-center">
            <Package className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">+200 Ft elvitel</p>
          </div>
          <div className="bg-primary/10 rounded-xl px-3 py-2.5 text-center">
            <GraduationCap className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">-10% 11:30-13:00</p>
          </div>
        </div>
        
        {/* CTA Button */}
        <Button variant="outline" className="w-full group">
          Részletek
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
      
    </div>
  </div>
</section>
```

---

## Vizuális Eredmény

### Desktop - Modern Inline:
- Minden egy sorban, áttekinthető
- Ikon balra, ár kiemelve, info pill-ek középen, CTA jobbra
- Kisebb padding → kompaktabb

### Mobile - Grid Badges:
- 2x2 info badge rács, könnyebb áttekinthetőség
- Teljes szélességű CTA gomb
- Vertical stack, de kompakt spacing

---

## Összegzés

| Elem | Régi | Új |
|------|------|-----|
| Vertical padding | `py-12 md:py-16` | `py-8 md:py-10` |
| Layout | Vertikális mindig | Desktop: horizontal, Mobile: compact vertical |
| Info megjelenítés | Bullet lista | Modern badge pill-ek |
| CTA stílus | Filled button | Outline + arrow ikon |
| Card stílus | Gradient bg | Backdrop blur + subtle border |

