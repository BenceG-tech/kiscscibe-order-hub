
# Táblázat és Tab Layout Javítások

## Azonosított Problémák

### 1. Kategória oszlop átlátszó
**Ok**: A `bg-inherit` CSS osztály nem működik `position: sticky` elemekkel, mert a sticky elem kikerül a normál document flow-ból és nem örökli a szülő háttérszínét.

**A képen látható**: A kategória nevek (pl. "Rantott étel", "Desszertek") átfedésben vannak a "Válassz..." gombokkal, mert nincs háttérszín a sticky cellán.

### 2. Felső tab layout probléma  
**Ok**: A `DailyMenuManagement.tsx` TabsList komponense felülírja az alap stílusokat, de nem teljesen. A `tabs.tsx` alap stílusai (`h-12 md:h-14`) ütköznek a helyi beállításokkal.

---

## Megoldási Terv

### 1. Kategória oszlop háttérszín javítása

A `bg-inherit` helyett explicit háttérszíneket kell használni minden sticky cellánál. A kategória soroknál a `CATEGORY_COLORS` értékeket kell alkalmazni, de a fallback esetén (amikor nincs szín definiálva) egy alapértelmezett háttérszínt kell beállítani.

**Változtatás a `WeeklyMenuGrid.tsx`-ben:**

| Elem | Jelenlegi | Javított |
|------|-----------|----------|
| Kategória fejléc | `bg-muted/50` | OK, marad |
| Ár sor cella | `bg-primary/5` | OK, marad |
| Kategória cella | `bg-inherit` | Explicit szín a CATEGORY_COLORS-ból vagy `bg-background` |

**Kód:**
```tsx
// Kategória sorok - explicit háttérszín
{foodCategories.map(category => {
  // Explicit background color for sticky cell
  const cellBgColor = CATEGORY_COLORS[category.name] 
    ? CATEGORY_COLORS[category.name].replace('dark:', '').split(' ')[0] 
    : 'bg-background';
    
  return (
    <tr key={category.id} className={rowColor}>
      <td className={`sticky left-0 z-10 border-b p-3 font-medium text-sm ${cellBgColor}`}>
        {category.name}
      </td>
      ...
    </tr>
  );
})}
```

### 2. TabsList stílusok egyszerűsítése

A `DailyMenuManagement.tsx`-ben a TabsList felülíró className-nek teljesen el kell takarnia az alap stílusokat.

**Változtatás:**
```tsx
<TabsList className="inline-flex h-10 items-center justify-start bg-muted p-1 rounded-lg w-auto">
```

### 3. CATEGORY_COLORS bővítése

A képen látható kategóriáknak (pl. "Desszertek", "Csirke-zöldséges ételek", "Extra köretek", stb.) nincs definiálva színük, ezért `bg-inherit` próbál öröklődni (ami sticky-nél nem működik).

**Új színek hozzáadása:**
```tsx
const CATEGORY_COLORS: Record<string, string> = {
  "Levesek": "bg-yellow-50 dark:bg-yellow-950/30",
  "Tészta ételek": "bg-orange-50 dark:bg-orange-950/30",
  "Főzelékek": "bg-green-50 dark:bg-green-950/30",
  "Prémium ételek": "bg-amber-100 dark:bg-amber-950/40",
  "Halételek": "bg-blue-50 dark:bg-blue-950/30",
  "Marhahúsos ételek": "bg-red-50 dark:bg-red-950/30",
  // Új kategóriák
  "Rantott ételek": "bg-orange-100 dark:bg-orange-950/40",
  "Desszertek": "bg-pink-50 dark:bg-pink-950/30",
  "Csirke-zöldséges ételek": "bg-lime-50 dark:bg-lime-950/30",
  "Csirkemájas ételek": "bg-amber-50 dark:bg-amber-950/30",
  "Extra köretek": "bg-teal-50 dark:bg-teal-950/30",
  "Hagyományos köretek": "bg-cyan-50 dark:bg-cyan-950/30",
  "Egytálételek": "bg-indigo-50 dark:bg-indigo-950/30",
  "Saláták": "bg-emerald-50 dark:bg-emerald-950/30",
  "Főételek": "bg-violet-50 dark:bg-violet-950/30",
};
```

### 4. Fallback háttérszín biztosítása

Ha egy kategóriának nincs definiálva színe, akkor `bg-background` legyen az alapértelmezett (ami mindig látható, nem átlátszó).

---

## Fájl Módosítások

| Fájl | Változtatás |
|------|-------------|
| `src/components/admin/WeeklyMenuGrid.tsx` | Sticky cella háttérszín javítása + új kategória színek |
| `src/pages/admin/DailyMenuManagement.tsx` | TabsList stílusok egyszerűsítése |

---

## Technikai Részletek

### Miért nem működik a `bg-inherit`?

A CSS `inherit` érték a szülő elem computed style-ját örökli. Azonban a `position: sticky` elemek speciálisak:

1. Sticky elem "kilép" a normál flow-ból görgetéskor
2. A vizuális háttér nem örökli a szülő háttérszínét
3. Explicit háttérszínt kell beállítani

### Sticky + Z-index

A sticky elemeknek magasabb z-index kell, hogy a többi cella fölött legyenek görgetéskor. A jelenlegi `z-10` megfelelő.

---

## Összefoglaló

| Probléma | Ok | Megoldás |
|----------|-----|----------|
| Átlátszó sticky oszlop | `bg-inherit` nem működik sticky-vel | Explicit háttérszín minden sticky cellának |
| Hiányzó kategória színek | Sok kategória nincs a CATEGORY_COLORS-ban | Bővíteni a szín mappinget + fallback |
| Tab elcsúszás | TabsList stílus konfliktus | Egyszerűsíteni a felülíró stílusokat |
