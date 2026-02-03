
# Galéria Stílus Frissítése - ACAIA Dizájn

## Referencia Elemzés

A csatolt képek alapján az ACAIA weboldal galériájának főbb jellemzői:

### Desktop Grid (3 oszlop)
- Nagyobb, kerekítettebb sarkok (`rounded-2xl` vagy `rounded-3xl`)
- Meleg bézs/krém háttérszín
- Dekoratív levél minták a háttérben (SVG pattern)
- Hover overlay: sötét gradiens, cím, leírás, "Kattints a nagyításhoz" link
- Elegáns serif/display font a címekhez

### Mobile Grid (2 oszlop)
- Még kerekebb sarkok (`rounded-2xl`)
- Tab gombok: kitöltött pill az aktívnál, outline a másiknál
- Nincs overlay alapból - tap-to-reveal viselkedés

### Lightbox Modal
- Fehér/világos háttér (nem fekete!)
- Képszámláló badge középen fent (sötét pill: "1 / 9")
- Bezárás gomb jobb fent (X)
- Kerek navigációs nyilak a kép mellett
- Cím és leírás a kép alatt
- Kerekített sarkok a modalon

---

## Változtatások

### 1. GalleryGrid.tsx

| Jelenlegi | Új (ACAIA stílus) |
|-----------|-------------------|
| `rounded-lg md:rounded-xl` | `rounded-2xl md:rounded-3xl` |
| `gap-3 md:gap-4` | `gap-4 md:gap-6` |
| Fekete overlay | Bézs-barna gradiens overlay |
| Egyszerű szöveg | "Kattints a nagyításhoz" link stílus |

```tsx
// Overlay stílus
className="bg-gradient-to-t from-black/70 via-black/30 to-transparent"

// Kép konténer
className="rounded-2xl md:rounded-3xl shadow-lg hover:shadow-xl transition-shadow"

// "Kattints a nagyításhoz" link
<span className="text-white/80 text-sm underline underline-offset-2 hover:text-white">
  Kattints a nagyításhoz
</span>
```

### 2. ImageLightbox.tsx - Fehér Modal Dizájn

| Jelenlegi | Új (ACAIA stílus) |
|-----------|-------------------|
| `bg-black/95` teljes képernyő | Fehér modal középen, blur háttér |
| Sötét téma | Világos téma |
| Nyilak a képen | Kerek nyilgombok a kép mellett |
| Cím alul fehér | Cím alul sötét szöveg |

```tsx
// Modal háttér
className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"

// Modal konténer
className="relative bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl"

// Képszámláló badge
className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium"

// Bezárás gomb
className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2"

// Navigációs nyilak
className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg"
```

### 3. Gallery.tsx Oldal - Section Headers

Új section header stílus az ACAIA mintára:

```tsx
{/* Section header */}
<div className="text-center mb-12">
  <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">
    Fedezd fel
  </span>
  <h2 className="text-3xl md:text-5xl font-serif mt-2 text-foreground">
    Ételek & Italok
  </h2>
  <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
  <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
    Friss, házi készítésű ételek meleg vendégszeretettel
  </p>
</div>
```

### 4. Mobile Tabs Stílus

Az ACAIA mobilos tab-jaihoz hasonló pill gombok:

```tsx
// TabsList - átlátszó háttér
className="inline-flex bg-transparent p-0 gap-2"

// TabsTrigger - pill stílus
className="rounded-full px-6 py-3 border-2 border-primary/30 
           data-[state=active]:bg-primary data-[state=active]:border-primary 
           data-[state=active]:text-primary-foreground"
```

### 5. Háttér Dekoráció

Dekoratív háttér elemek (opcionális):

```tsx
{/* Dekoratív háttér */}
<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
  {/* Levél minták SVG-ként vagy háttérképként */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-[url('/decorations/leaf.svg')] bg-no-repeat" />
  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[url('/decorations/leaf.svg')] bg-no-repeat transform rotate-180" />
</div>
```

---

## Fájl Lista

| Fájl | Művelet | Változtatások |
|------|---------|---------------|
| `src/components/gallery/GalleryGrid.tsx` | MODIFY | Kerekebb sarkok, nagyobb gap, frissített overlay |
| `src/components/gallery/ImageLightbox.tsx` | MODIFY | Fehér modal dizájn, kerek nyilak |
| `src/components/gallery/FoodGallery.tsx` | MODIFY | Új section header stílus |
| `src/components/gallery/InteriorGallery.tsx` | MODIFY | Új section header stílus |
| `src/pages/Gallery.tsx` | MODIFY | Pill tabok, elegáns háttér |
| `src/components/sections/GallerySection.tsx` | MODIFY | Háttér dekoráció |

---

## Vizuális Összehasonlítás

### Grid Card - Előtte vs Utána

```text
ELŐTTE:                          UTÁNA:
┌───────────────┐               ╭───────────────╮
│               │               │               │
│     KÉP       │               │     KÉP       │
│               │               │               │
│ ░░░░░░░░░░░░░ │               │               │
│ ░ Cím        ░│               │ ▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│ ░ kattints   ░│               │ ▒ Cím        ▒│
└───────────────┘               │ ▒ Kattints → ▒│
 ↑ rounded-xl                   ╰───────────────╯
                                 ↑ rounded-3xl + shadow
```

### Lightbox - Előtte vs Utána

```text
ELŐTTE (sötét):                  UTÁNA (világos):
┌─────────────────────┐         ┌─────────────────────┐
│ 1/9           [X]   │         │      ┌─────┐        │
│                     │         │      │ 1/9 │  [X]   │
│  ┌───────────────┐  │         │      └─────┘        │
│  │               │  │         │  ╭───────────────╮  │
│<─│     KÉP       │─>│         │(◀)│     KÉP      │(▶)│
│  │               │  │         │  │               │  │
│  └───────────────┘  │         │  ╰───────────────╯  │
│      Cím            │         │  Cím                │
│      ○ ○ ○          │         │  Leírás szöveg...   │
└─────────────────────┘         └─────────────────────┘
 ↑ fekete háttér                 ↑ fehér modal + blur
```

---

## Technikai Részletek

### Lightbox Scroll Lock
A jelenlegi implementáció már kezeli a body scroll lock-ot.

### Embla Carousel
A meglévő Embla Carousel megmarad, csak a stílus változik.

### Responsive Breakpoints
- Mobil: 2 oszlop, `rounded-2xl`
- Desktop: 3 oszlop, `rounded-3xl`

### Háttér Gradiens
A meleg bézs háttérhez az existing `primary/5` használata megfelelő.
