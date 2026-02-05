

# Egységes Design & Galéria Tab Redesign

## Összefoglaló

A felhasználó kérése alapján 4 fő területen történik módosítás:
1. Hero szekciók egységes magassága minden aloldalon
2. Dátumválasztó (WeeklyDateStrip) modernebb megjelenése
3. Galéria szekció mobilon: Tab-ok az Ételek és Éttermünk között váltáshoz
4. Napi menü doboz (kosárba gomb rész) modernizálása

---

## 1. Hero Szekciók Egységesítése

**Probléma**: Az Etlap oldal `h-[35vh] md:h-[40vh]`, míg az About `h-[50vh] md:h-[60vh]` és a Contact `h-[40vh] md:h-[50vh]` - nem egységesek.

**Megoldás**: Minden aloldalon ugyanazt a hero magasságot használjuk, mint az Etlap-on.

| Oldal | Jelenlegi | Új |
|-------|-----------|-----|
| Etlap | `h-[35vh] md:h-[40vh]` | Marad |
| About | `h-[50vh] md:h-[60vh]` | `h-[35vh] md:h-[40vh]` |
| Contact | `h-[40vh] md:h-[50vh]` | `h-[35vh] md:h-[40vh]` |

**Fájlok**: `src/pages/About.tsx`, `src/pages/Contact.tsx`

---

## 2. Dátumválasztó Modernizálása (WeeklyDateStrip)

**Probléma**: A jelenlegi design egyszerű, nem elég "premium" hatású.

**Megoldás**: Modern, card-alapú megjelenés háttérrel és árnyékkal.

**Új design elemek**:
- Háttér card: `bg-card/80 backdrop-blur-sm shadow-lg rounded-2xl`
- Hónap megjelenítése a strip felett (pl. "Február 2026")
- Kiválasztott nap: erősebb glow effekt és scaling
- Nagyobb touch target mobilon

```text
┌─────────────────────────────────────────────┐
│              Február 2026                   │
│  ┌───┬───┬───┬───┬───┐                     │
│  │ H │ K │SZE│ Cs│ P │  ← / →              │
│  │ 3 │ 4 │[5]│ 6 │ 7 │     [kiválasztott]  │
│  └───┴───┴───┴───┴───┘                     │
└─────────────────────────────────────────────┘
```

**Nap gomb stílus változások**:
- Kiválasztott: `bg-primary text-primary-foreground shadow-lg scale-105`
- Elérhető tartalom: `bg-primary/10 hover:bg-primary/20`

**Fájl**: `src/components/WeeklyDateStrip.tsx`

---

## 3. Galéria Szekció - Mobil Tab-ok

**Probléma**: 
- Mobilon az "Éttermünk" felirat nem látszik a képek felett
- Nem lehet váltani a két galéria között mobilon

**Megoldás**: Mobil nézetben tab-ok az "Ételek" és "Éttermünk" között.

**Új struktúra mobilon**:
```text
┌────────────────────────────────────┐
│  ┌─────────────┬─────────────┐     │
│  │   Ételek    │  Éttermünk  │     │  <- Tab-ok
│  │  [active]   │             │     │
│  └─────────────┴─────────────┘     │
├────────────────────────────────────┤
│      [Galéria képek grid]          │
│                                    │
└────────────────────────────────────┘
```

**Desktop** (marad a jelenlegi):
```text
┌────────────────────────────────────┐
│        Ételek & Italok             │
│      [Galéria képek grid]          │
├────────────────────────────────────┤
│          Éttermünk                 │
│      [Interior képek grid]         │
└────────────────────────────────────┘
```

**Implementáció**:
- `GallerySection.tsx`: Mobil esetén `Tabs` komponens használata
- `FoodGallery.tsx` és `InteriorGallery.tsx`: Új `noHeader?: boolean` prop hozzáadása

**Fájlok**: 
- `src/components/sections/GallerySection.tsx`
- `src/components/gallery/FoodGallery.tsx`
- `src/components/gallery/InteriorGallery.tsx`

---

## 4. Napi Menü Doboz Modernizálása

**Probléma**: A "Helyben doboz" (elérhető adagok + kosárba gomb) kinézete egyszerű.

**Jelenlegi**:
```text
┌─────────────────────────────────────────┐
│ Elérhető: 15 adag    [Menü kosárba]     │
└─────────────────────────────────────────┘
```

**Új design - Prémium CTA Section**:
```text
┌─────────────────────────────────────────────────┐
│  ╭────────╮                                     │
│  │  👨‍🍳   │  Elérhető adagok                   │
│  │ ikon   │  15                                │
│  ╰────────╯                                     │
│                                                 │
│       ╭───────────────────────────────────╮    │
│       │  🛒 Menü kosárba       1890 Ft    │    │
│       ╰───────────────────────────────────╯    │
└─────────────────────────────────────────────────┘
```

**Új stílus elemek**:
- Gradient háttér: `bg-gradient-to-r from-primary/10 via-primary/5 to-transparent`
- Ikon badge az elérhető adagokhoz
- Nagyobb, látványosabb gomb árral együtt

**Fájlok**:
- `src/components/DailyMenuPanel.tsx`
- `src/pages/Etlap.tsx`

---

## 5. Fájl Lista

| Prioritás | Művelet | Fájl |
|-----------|---------|------|
| 1 | MODIFY | `src/pages/About.tsx` - Hero magasság csökkentése |
| 2 | MODIFY | `src/pages/Contact.tsx` - Hero magasság csökkentése |
| 3 | MODIFY | `src/components/WeeklyDateStrip.tsx` - Modern redesign |
| 4 | MODIFY | `src/components/sections/GallerySection.tsx` - Tab-ok mobilon |
| 5 | MODIFY | `src/components/gallery/FoodGallery.tsx` - noHeader prop |
| 6 | MODIFY | `src/components/gallery/InteriorGallery.tsx` - noHeader prop |
| 7 | MODIFY | `src/components/DailyMenuPanel.tsx` - CTA modernizálás |
| 8 | MODIFY | `src/pages/Etlap.tsx` - CTA modernizálás |

---

## 6. Technikai Részletek

### Hero Konzisztencia
- Minden aloldal: `h-[35vh] md:h-[40vh]`
- Gradient overlay: `bg-gradient-to-t from-black/70 via-black/40 to-transparent`

### Galéria Tab-ok Mobilon
- shadcn/ui `Tabs` komponens használata
- `TabsList`: `grid grid-cols-2` elrendezés
- `TabsTrigger`: Ikon + szöveg (`Utensils` és `Building2`)

### CTA Doboz
- Gradient háttér rounded-2xl-lel
- ChefHat ikon az elérhető adagok mellett
- Gomb: `size="lg"` és ár megjelenítése badge-ben

---

## Összegzés

A változtatások eredményeként:
1. **Egységes hero szekciók** - minden aloldal azonos magassággal
2. **Prémium dátumválasztó** - card háttér, glow effekt, hónap megjelenítés
3. **Mobil galéria tab-ok** - könnyű váltás Ételek és Éttermünk között
4. **Modern CTA doboz** - gradiens háttér, badge-ek, nagyobb gomb

