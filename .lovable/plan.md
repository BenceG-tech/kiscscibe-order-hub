
# Komplett Hero Kép & Napi Ajánlat Layout Redesign

## Összefoglaló

A felhasználó kérése alapján:
1. **Új hero képek** - Desktop és mobile verzió a főoldalra
2. **Kompaktabb napi menü szekció** - A naptár túl sok helyet foglal, a menü azonnal látható kell legyen
3. **Egységes hero képek** - Rólunk és Kapcsolat oldalak is kapják meg a hero képet

---

## 1. Új Hero Képek Másolása

**Műveletek:**

| Forrás | Cél | Használat |
|--------|-----|-----------|
| `user-uploads://Set10_Full_Menu_Showcase_Desktop.png` | `src/assets/hero-desktop.png` | Főoldal desktop |
| `user-uploads://Set10_Full_Menu_Showcase_Mobile.png` | `src/assets/hero-mobile.png` | Főoldal mobile |

---

## 2. Főoldal Hero Redesign - Responsive Képek

**Fájl:** `src/components/sections/HeroSection.tsx`

**Változások:**
- Két különböző kép: desktop és mobile
- CSS-ben `<picture>` elem vagy responsive háttérkép technika
- A sötét háttéren a piros-fehér kockás papíros ételek gyönyörűen fognak kinézni

```tsx
import heroDesktop from "@/assets/hero-desktop.png";
import heroMobile from "@/assets/hero-mobile.png";

// Responsive image loading
<picture>
  <source media="(min-width: 768px)" srcSet={heroDesktop} />
  <img src={heroMobile} alt="..." className="w-full h-full object-cover" />
</picture>
```

---

## 3. Napi Ajánlat Szekció - Radikális Egyszerűsítés

### 3.1 Probléma
A jelenlegi layout:
```
┌────────────────────────────────────────┐
│         Napi ajánlataink               │
│    Válassz napot és tekintsd meg...    │
├────────────────────────────────────────┤
│  ┌────── Nagy naptár card ──────┐      │  ← Túl sok hely!
│  │  Februar 2026                │      │
│  │  ← H  K Sze Cs P       →     │      │
│  │    3  4  5  6  7              │      │
│  │  Elérhető / Zárva legenda    │      │
│  └──────────────────────────────┘      │
│                                        │
│  [Leves card]  [Főétel card]           │  ← Csak itt kezdődik a tartalom
└────────────────────────────────────────┘
```

### 3.2 Megoldás - Inline Compact Date Picker

**Új layout:**
```
┌────────────────────────────────────────┐
│         Mai ajánlatunk                 │
│  ┌───┬───┬───┬───┬───┐                │  ← Inline nap gombok
│  │ H │ K │SZE│ Cs│ P │  ← / → hét     │
│  │ 3 │ 4 │ 5 │ 6 │ 7 │                │
│  └───┴───┴───┴───┴───┘                │
├────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐           │  ← Azonnal látható!
│  │ 🍲 Leves │  │ 🍖 Főétel│           │
│  │  [kép]   │  │  [kép]   │           │
│  │  Cím     │  │  Cím     │           │
│  └──────────┘  └──────────┘           │
│                                        │
│       [ Menü kosárba - 1890 Ft ]      │
└────────────────────────────────────────┘
```

**Változások:**

| Fájl | Mit csinálunk |
|------|---------------|
| `src/components/WeeklyDateStrip.tsx` | Kompaktabb: hónap label eltávolítása, legenda eltávolítása, kisebb padding |
| `src/components/sections/DailyMenuSection.tsx` | Cím egyszerűsítés: "Napi ajánlataink" → "Mai ajánlatunk" |
| `src/components/UnifiedDailySection.tsx` | Card wrapper eltávolítása a WeeklyDateStrip-ről - legyen inline |

### 3.3 WeeklyDateStrip Kompakt Verzió

```tsx
// Előtte:
<Card className="border-0 bg-card/80 backdrop-blur-sm shadow-lg rounded-3xl">
  <CardContent className="p-4 md:p-6">
    <WeeklyDateStrip ... />
  </CardContent>
</Card>

// Utána:
<div className="flex items-center justify-center mb-4">
  <WeeklyDateStrip ... />
</div>
```

**WeeklyDateStrip módosítások:**
- Hónap label: eltávolítás vagy kisebbre (`text-sm`)
- Legenda: eltávolítás (felesleges)
- Nap gombok: kisebb (`min-w-[44px]`)
- Padding: `p-2` helyett `p-1`
- Teljes komponens: inline, nem card-ban

---

## 4. Etlap.tsx (Napi Ajánlat oldal) - Hasonló egyszerűsítés

**Fájl:** `src/pages/Etlap.tsx`

**Változások:**
- Header + date picker egy sorban (desktop)
- Card wrapper eltávolítása
- Tartalom azonnal látható a page load-nál

```tsx
// Új layout
<div className="text-center mb-6">
  <h1>Napi Ajánlat</h1>
  <div className="mt-4">
    <WeeklyDateStrip ... />  // Nincs külön card
  </div>
</div>

// Tartalom azonnal
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  ...
</div>
```

---

## 5. Rólunk Oldal - Hero Kép Csere

**Fájl:** `src/pages/About.tsx`

**Változások:**
- Jelenlegi `restaurantInterior` → Új hero kép (desktop verzió)
- Ugyanaz a modern ételfotó mint a főoldalon
- Konzisztens brand megjelenés

```tsx
// Régi:
import restaurantInterior from "@/assets/restaurant-interior.jpg";

// Új:
import heroImage from "@/assets/hero-desktop.png";
```

---

## 6. Kapcsolat Oldal - Hero Szekció Hozzáadása

**Fájl:** `src/pages/Contact.tsx`

**Változások:**
- Jelenlegi gradient háttér → Full-width hero kép
- Hasonló design mint a Rólunk oldalnál
- Szöveg overlay a kép alján

```tsx
// Régi:
<div className="bg-gradient-to-br from-primary/10 to-warmth/10 py-16">
  <div className="text-center">
    <h1>Kapcsolat</h1>
  </div>
</div>

// Új:
<section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
  <img src={heroImage} className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
    <h1>Kapcsolat</h1>
    <p>Vegye fel velünk a kapcsolatot!</p>
  </div>
</section>
```

---

## 7. Fájl Lista

| Prioritás | Művelet | Fájl |
|-----------|---------|------|
| 1 | COPY | `user-uploads://Set10_Full_Menu_Showcase_Desktop.png` → `src/assets/hero-desktop.png` |
| 1 | COPY | `user-uploads://Set10_Full_Menu_Showcase_Mobile.png` → `src/assets/hero-mobile.png` |
| 2 | MODIFY | `src/components/sections/HeroSection.tsx` - Responsive hero képek |
| 3 | MODIFY | `src/components/WeeklyDateStrip.tsx` - Kompaktabb design |
| 4 | MODIFY | `src/components/sections/DailyMenuSection.tsx` - Egyszerűbb cím |
| 5 | MODIFY | `src/components/UnifiedDailySection.tsx` - Card wrapper eltávolítása |
| 6 | MODIFY | `src/pages/Etlap.tsx` - Kompakt date picker |
| 7 | MODIFY | `src/pages/About.tsx` - Új hero kép |
| 8 | MODIFY | `src/pages/Contact.tsx` - Hero szekció hozzáadása |

---

## 8. Vizuális Eredmény

### Főoldal - Above the fold:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [ÚJ HERO KÉP - ÉTELEK]                        │
│                                                             │
│         Kiscsibe Reggeliző & Étterem                       │
│            házias ízek minden nap                          │
│                                                             │
│        [Mai ajánlat]    [Teljes étlap]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Mai ajánlatunk                                │
│         H  K  Sze  Cs  P   ← →                             │  ← Kompakt inline
│         3  4   5   6  7                                    │
│                                                             │
│   ┌─────────────────┐  ┌─────────────────┐                │  ← Azonnal látható!
│   │    LEVES KÉP    │  │   FŐÉTEL KÉP    │                │
│   │   Tyúkhúsleves  │  │  Csirkepörkölt  │                │
│   └─────────────────┘  └─────────────────┘                │
│                                                             │
│           [ Menü kosárba - 1890 Ft ]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Konzisztens Hero minden oldalon:
- **Főoldal**: Desktop/Mobile specifikus ételképek
- **Rólunk**: Ugyanaz a desktop ételfotó
- **Kapcsolat**: Ugyanaz a desktop ételfotó

---

## 9. Technikai Megjegyzések

### Responsive Hero Kép
- `<picture>` element a legjobb megoldás
- `srcSet` media query-vel
- Mobile: portrait orientáció optimalizált
- Desktop: landscape orientáció optimalizált

### WeeklyDateStrip Kompakt
- Nincs külön Card wrapper
- Kisebb touch targetek de minimum 44px
- Legenda eltávolítva (egyértelmű a használat)
- Hónap label inline vagy eltávolítva

### Performance
- Lazy loading megtartása ahol nincs "eager"
- Hero képeknél `loading="eager"` - azonnal kell

---

## Összegzés

A változtatások eredményeként:
1. **Gyönyörű új hero képek** - Professzionális ételfotók a főoldalon
2. **Azonnal látható napi menü** - A naptár nem "lop" helyet
3. **Konzisztens brand** - Minden oldal ugyanazt a prémium érzést adja
4. **Mobile-first** - Külön optimalizált kép mobil eszközökre
