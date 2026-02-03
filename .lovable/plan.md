

# Plan: Termékenkénti Ár Szerkesztés a Heti Rácsban

## Jelenlegi helyzet

- A "Napi menü ár" sor beállítja az egész nap kombinált árát
- Az egyes ételek árai a `menu_items.price_huf` oszlopból jönnek (törzsadat)
- Az árak jelenleg csak az "Étlap kezelés" oldalon szerkeszthetők

## Új funkció

Minden ételnél közvetlenül a heti rácsban szerkeszthető lesz az ár, ugyanúgy mint a kép.

### Új UI terv

```text
+------------------------------------------+
| [📷] [Paradicsom leves] [2490 Ft] [X]    |
|       ^kép  ^név         ^ár szerk ^töröl|
+------------------------------------------+
```

Minden kiválasztott ételnél:
1. Kép gomb (már megvan)
2. Étel neve
3. **Ár szerkesztő** - kattintásra szerkeszthető
4. Törlés gomb (már megvan)

## Technikai megvalósítás

### 1. Új komponens: QuickPriceEdit

Létrehozok egy `QuickPriceEdit.tsx` komponenst, ami:
- Megjelenít egy kis "Ft" szöveget az aktuális árral
- Kattintásra megnyit egy kis input mezőt
- Blur-ra vagy Enter-re elmenti az új árat a `menu_items.price_huf` mezőbe

### 2. WeeklyGridCell módosítás

A `WeeklyGridCell.tsx`-ben hozzáadom a `QuickPriceEdit` komponenst minden kiválasztott étel mellé:
- A kép és a név mellé kerül
- Közvetlenül a cellában szerkeszthető

### 3. WeeklyMenuGrid mutation

Új mutation az ár frissítésére:
```typescript
const updateItemPriceMutation = useMutation({
  mutationFn: async ({ itemId, price }: { itemId: string; price: number }) => {
    await supabase
      .from("menu_items")
      .update({ price_huf: price })
      .eq("id", itemId);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["menu-items-all"] });
    queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
    toast.success("Ár mentve");
  },
});
```

## Fájl változások

| Fájl | Művelet | Leírás |
|------|---------|--------|
| `src/components/admin/QuickPriceEdit.tsx` | CREATE | Új inline ár szerkesztő komponens |
| `src/components/admin/WeeklyGridCell.tsx` | MODIFY | Ár szerkesztő hozzáadása minden étel mellé |
| `src/components/admin/WeeklyMenuGrid.tsx` | MODIFY | Ár frissítő mutation és callback hozzáadása |
| `src/components/admin/WeeklyGridMobile.tsx` | MODIFY | Mobil nézetben is működjön az ár szerkesztés |

## UI Elrendezés (módosított cella)

```text
Kiválasztott étel kártya:
┌────────────────────────────────────────┐
│ [🖼️] Étel neve         [💰 2490] [✕]  │
│  ^    ^                  ^        ^    │
│  kép  név                ár      törlés│
│       gomb               gomb     gomb │
└────────────────────────────────────────┘
```

## Automatikus mentés megerősítve

A rendszer már **automatikusan ment** minden változtatást - nincs szükség külön "Mentés" gombra. A jobb felső sarokban látható:
- **"Mentés..."** + spinner amikor folyamatban van
- **"Mentve" ✓** zöld pipa amikor minden el van mentve

## Adatbázis hatás

Nincs séma változtatás szükséges. A `menu_items.price_huf` oszlop már létezik és használjuk.

