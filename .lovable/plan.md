

# Gyors Galéria Áthelyezés Funkció

## Jelenlegi Helyzet

A "Galéria típus" váltás már **létezik** a szerkesztés dialógusban (ceruza ikon → "Galéria típus" dropdown). De ez nem nyilvánvaló és több kattintást igényel.

## Javasolt Fejlesztés

Egy új, egyértelmű **"Áthelyezés" gomb** hozzáadása a kép hover overlay-éhez, amely egyetlen kattintással átmozgatja a képet a másik galériába.

---

## Változtatások

### Fájl: `src/components/admin/GalleryManagement.tsx`

#### 1. Új "Áthelyezés" Mutation Hozzáadása

```tsx
const moveToOtherGalleryMutation = useMutation({
  mutationFn: async ({ id, currentType }: { id: string; currentType: GalleryType }) => {
    const newType: GalleryType = currentType === 'food' ? 'interior' : 'food';
    const targetImages = newType === 'food' ? foodImages : interiorImages;
    const maxSortOrder = targetImages.length > 0 ? Math.max(...targetImages.map(i => i.sort_order)) : -1;
    
    const { error } = await supabase
      .from('gallery_images')
      .update({ gallery_type: newType, sort_order: maxSortOrder + 1 })
      .eq('id', id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    toast.success("Kép áthelyezve!");
  },
  onError: () => toast.error("Hiba az áthelyezéskor")
});
```

#### 2. Új Ikon Importálása

```tsx
import { ArrowRightLeft } from "lucide-react";
```

#### 3. Áthelyezés Gomb a Hover Overlay-ben

A meglévő gombok mellé (fel, le, szerkesztés, törlés) egy új gomb:

```tsx
<Button 
  size="icon" 
  variant="secondary"
  title={image.gallery_type === 'food' ? 'Áthelyezés az Étterem galériába' : 'Áthelyezés az Ételek galériába'}
  onClick={() => moveToOtherGalleryMutation.mutate({ 
    id: image.id, 
    currentType: image.gallery_type 
  })}
>
  <ArrowRightLeft className="h-4 w-4" />
</Button>
```

---

## Vizuális Terv

```text
Kép Hover Overlay - Jelenlegi:
┌────────────────────────────┐
│  [↑] [↓] [✏️] [🗑️]         │
└────────────────────────────┘

Kép Hover Overlay - Új:
┌────────────────────────────┐
│  [↑] [↓] [⇄] [✏️] [🗑️]     │
└────────────────────────────┘
          ↑
    Áthelyezés gomb
```

---

## Működés

| Aktuális Galéria | Kattintás Eredménye |
|------------------|---------------------|
| Ételek (food) | → Átkerül az Étterem galériába |
| Étterem (interior) | → Átkerül az Ételek galériába |

A kép automatikusan az új galéria **végére** kerül (sort_order).

---

## Tooltip Szövegek

- Food galériában: "Áthelyezés az Étterem galériába"
- Interior galériában: "Áthelyezés az Ételek galériába"

---

## Fájl Lista

| Művelet | Fájl |
|---------|------|
| MODIFY | `src/components/admin/GalleryManagement.tsx` |

---

## Összefoglalás

- **1 kattintás** = kép átkerül a másik galériába
- Vizuálisan egyértelmű `⇄` ikon
- Tooltip jelzi a célgalériát
- A meglévő szerkesztés dialógusban is megmarad a váltás lehetősége

