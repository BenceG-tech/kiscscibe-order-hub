
# Layout változtatás: Ételek vízszintes lista stílusra

## Mit változtatunk

Az `UnifiedDailySection.tsx`-ben a "További napi ételek" szekció jelenlegi **kártyarács** (kép felül, szöveg alul) elrendezését lecseréljük a referencia képen látható **vízszintes lista** stílusra.

## Referencia kép elemzése

Minden étel-sor így néz ki:
```
[Étel neve (nagy, félkövér)]          [Nagy négyzetes kép]
[Eredeti ár (áthúzva)] [Ár (sárga)]
[🛒 Kosárba gomb]
─────────────────────────────────────── (elválasztó vonal)
```

- Szöveg + gomb: **bal oldal** (flex-col, igazítva)
- Kép: **jobb oldal**, kb. 180×180px négyzetes
- Köztük vízszintes elválasztó vonal (`<hr>` vagy `border-b`)
- Fehér/card háttér, nincs árnyék/keret minden egyes elemen
- Az ár elsődleges (sárga/primary) nagy méretben jelenik meg

## Módosítandó fájl

**`src/components/UnifiedDailySection.tsx`** — csak az "Extra Items Section" blokk (272–327. sorok)

## Új layout terv

```
<div className="divide-y divide-border rounded-3xl bg-card/95 shadow-lg overflow-hidden">
  {extraItems.map((item) => (
    <div className="flex items-center gap-4 p-4 md:p-6">
      
      {/* Bal: szöveg + ár + gomb */}
      <div className="flex-1 space-y-2">
        <h4 className="text-lg md:text-xl font-bold">{item.item_name}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-xl md:text-2xl font-bold text-primary">
            {item.item_price_huf.toLocaleString('hu-HU')} Ft
          </span>
        </div>
        <Button className="rounded-full gap-2" onClick={() => handleAddItemToCart(item)}>
          <ShoppingCart className="h-4 w-4" />
          Kosárba
        </Button>
      </div>
      
      {/* Jobb: kép */}
      <div className="w-36 h-36 md:w-44 md:h-44 shrink-0 rounded-xl overflow-hidden">
        <img src={item.item_image_url} className="w-full h-full object-cover" />
      </div>
      
    </div>
  ))}
</div>
```

## Változtatások összefoglalója

| Jelenlegi | Új |
|---|---|
| `grid grid-cols-1 sm:grid-cols-2 gap-4` rács | `divide-y` osztott lista |
| Kép felül (aspect-video) | Kép jobbra (w-36 h-36 négyzetes) |
| Badge-ben az ár | Nagy elsődleges színű szöveg |
| Külön Card minden elemnek | Egyetlen keret, belül elválasztók |
| `rounded-3xl` shadow per kártya | Egyetlen `rounded-3xl` konténer |

## Érintett fájl

- `src/components/UnifiedDailySection.tsx` — csak a 272–327. sor között lévő "Extra Items Section" módosul
- Semmi más nem változik (DailyMenuPanel, WeeklyDateStrip, StickyMenuCTA érintetlen marad)
