

# Sticky Kategória Oszlop Implementáció

## Probléma

Jelenleg a heti táblázat vízszintes görgetésekor a kategória oszlop is elgördül, így nem látható, melyik sorban vagyunk. A felhasználó kérése: **a kategória oszlop maradjon fix**, a napok oszlopai görgethessenek alatta.

---

## Megoldás

A táblázat első oszlopát (Kategória) `position: sticky` és `left: 0` CSS-sel rögzítjük. Így görgetéskor a kategóriák mindig láthatók maradnak a bal oldalon.

---

## Technikai Részletek

### CSS Sticky Column működése

```text
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  Kategória  │   Hétfő     │    Kedd     │   Szerda    │  Csütörtök  │
│   (STICKY)  │  (görget)   │  (görget)   │  (görget)   │  (görget)   │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│  Levesek    │  Gulyás     │  Húsleves   │  Paradicsom │  Zöldség    │
│   (STICKY)  │             │             │             │             │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│  Főzelékek  │  Tök        │  Lencse     │  Zöldbab    │  Kelkáposzta│
│   (STICKY)  │             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
          ←── görgetés iránya ──→
```

### Szükséges CSS osztályok

Az első oszlop (`<th>` és `<td>`) cellákhoz:

```tsx
className="sticky left-0 z-10 bg-inherit"
```

- `sticky` - Rögzített pozíció
- `left-0` - Bal oldalhoz ragad
- `z-10` - A többi cella fölött legyen
- `bg-inherit` - Örökli a sor háttérszínét (fontos, hogy ne látszódjon át a mögöttes tartalom)

---

## Módosítandó Fájl

**`src/components/admin/WeeklyMenuGrid.tsx`**

### Változtatások:

| Sor | Jelenlegi | Új |
|-----|-----------|-----|
| 526 | `<th className="border-b p-3 text-left font-medium text-sm w-48">` | `<th className="sticky left-0 z-10 bg-muted/50 border-b p-3 text-left font-medium text-sm w-48">` |
| 542 | `<td className="border-b p-3 font-medium text-sm">` | `<td className="sticky left-0 z-10 bg-primary/5 border-b p-3 font-medium text-sm">` |
| 567 | `<td className="border-b p-3 font-medium text-sm">` | `<td className="sticky left-0 z-10 border-b p-3 font-medium text-sm" style={{ backgroundColor: 'inherit' }}>` |

### Megjegyzések:

1. **Fejléc cella (Kategória)**: Háttérszínt explicit megadjuk (`bg-muted/50`)
2. **Ár sor cella**: Háttérszínt explicit megadjuk (`bg-primary/5`)
3. **Kategória sorok**: A `CATEGORY_COLORS` miatt a sor háttérszínét kell örökölnie, ezért `style={{ backgroundColor: 'inherit' }}` vagy a `bg-inherit` osztály

### ScrollArea egyszerűsítése:

A korábbi `touch-pan-x` és `overscrollBehavior` már nem szükséges, mert a sticky column megoldás elegánsabb. A táblázat természetesen görget, és a kategória mindig látható.

---

## Összefoglaló

| Változás | Eredmény |
|----------|----------|
| Kategória fejléc sticky | A "Kategória" cella mindig látható |
| Kategória sorok sticky | Minden kategória neve látható görgetéskor |
| Háttérszín megőrzése | A színkódolt kategóriák megmaradnak |
| Tab váltás probléma | Megoldódik, mert nincs touch-action módosítás |

