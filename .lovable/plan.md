
# Galéria Rendszer Kibővítése

## Összefoglaló

A jelenlegi egyszerű galéria rendszert kibővítjük a dokumentációban leírt teljes funkcionalitásra:
- Két külön galéria: **Ételek/Italok** és **Helyszín/Étterem**
- Swipe-olható Embla Carousel lightbox
- Tap-to-reveal mobilon
- Fade-in scroll animáció
- Mobilon tabok, desktopon egymás alatt

---

## Változtatások

### 1. Adatbázis Módosítás

Két új oszlop hozzáadása a `gallery_images` táblához:

```sql
ALTER TABLE gallery_images 
ADD COLUMN gallery_type TEXT NOT NULL DEFAULT 'food' 
  CHECK (gallery_type IN ('food', 'interior'));

ALTER TABLE gallery_images 
ADD COLUMN title TEXT;
```

| Oszlop | Típus | Leírás |
|--------|-------|--------|
| `gallery_type` | TEXT | 'food' (ételek) vagy 'interior' (belső tér) |
| `title` | TEXT | Kép címe (opcionális) |

### 2. Storage Mappastruktúra

A meglévő `menu-images` bucket-et használjuk, két almappával:
- `gallery/food/` - Étel fotók
- `gallery/interior/` - Belső tér fotók

### 3. Új Publikus Komponensek

| Fájl | Leírás |
|------|--------|
| `src/components/gallery/FoodGallery.tsx` | Ételek galéria grid |
| `src/components/gallery/InteriorGallery.tsx` | Étterem galéria grid |
| `src/components/gallery/ImageLightbox.tsx` | Embla Carousel swipe lightbox |
| `src/components/gallery/GalleryGrid.tsx` | Közös grid logika (tap-to-reveal, fade-in) |
| `src/pages/Gallery.tsx` | Galéria oldal (tabok mobilon) |

### 4. Admin Komponensek Módosítása

| Fájl | Változtatás |
|------|-------------|
| `src/components/admin/GalleryManagement.tsx` | Tab-ok hozzáadása (Ételek / Étterem), gallery_type mentése |
| `src/pages/admin/Gallery.tsx` | Marad változatlan (wrapper) |

---

## Publikus Galéria Funkciók

### Grid Layout
- **Mobilon**: 2 oszlop, 1:1 aspect ratio
- **Desktopon**: 3 oszlop, 4:3 aspect ratio

### Tap-to-Reveal (Mobil)
1. Első érintés → overlay megjelenik (cím + "Kattints a nagyításhoz")
2. Második érintés → lightbox megnyílik

### Hover Effekt (Desktop)
- Overlay gradiens: `bg-gradient-to-t from-black/80 via-black/40 to-transparent`
- Kép scale: `group-hover:scale-110`

### Scroll Fade-In Animáció
- Intersection Observer figyeli a képeket
- Belépéskor: `opacity-0 translate-y-4` → `opacity-100 translate-y-0`
- Staggered animáció (egymás után jelennek meg)

### Lightbox (Embla Carousel)
- Swipe navigáció balra/jobbra
- Képszámláló badge (pl. "2 / 6")
- Nyíl gombok desktopon
- Keyboard: ← → navigáció, Escape bezárás
- Cím megjelenítése a kép alatt

---

## Galéria Oldal Layout

### Mobilon: Tabok
```text
┌─────────────────────────┐
│ [Ételek] [Étterem]      │  ← Tab switcher
├─────────────────────────┤
│ ┌───┐ ┌───┐            │
│ │   │ │   │            │
│ └───┘ └───┘            │
│ ┌───┐ ┌───┐            │
│ │   │ │   │            │
│ └───┘ └───┘            │
└─────────────────────────┘
```

### Desktopon: Mindkét galéria egymás alatt
```text
┌─────────────────────────────────────┐
│ Ételek & Italok                     │
├─────────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐                  │
│ │   │ │   │ │   │                  │
│ └───┘ └───┘ └───┘                  │
│ ┌───┐ ┌───┐ ┌───┐                  │
│ │   │ │   │ │   │                  │
│ └───┘ └───┘ └───┘                  │
├─────────────────────────────────────┤
│ Étterem Belső                       │
├─────────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐                  │
│ │   │ │   │ │   │                  │
│ └───┘ └───┘ └───┘                  │
└─────────────────────────────────────┘
```

---

## Admin Felület Módosítások

### Tab Interface
```text
┌────────────────────────────────────────┐
│ [Ételek (12)] [Étterem (8)]  [+ Új]   │
├────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │          │
│ │    │ │    │ │    │ │    │          │
│ └────┘ └────┘ └────┘ └────┘          │
└────────────────────────────────────────┘
```

### Új Kép Form Bővítés
- Galéria típus választó dropdown (Ételek / Étterem)
- Cím mező hozzáadása

---

## Implementáció Sorrendje

| Lépés | Feladat |
|-------|---------|
| 1 | Adatbázis migráció (gallery_type, title oszlopok) |
| 2 | `ImageLightbox.tsx` komponens (Embla Carousel) |
| 3 | `GalleryGrid.tsx` közös logika (tap-to-reveal, fade-in) |
| 4 | `FoodGallery.tsx` és `InteriorGallery.tsx` |
| 5 | `Gallery.tsx` oldal (tabok + routing) |
| 6 | `GalleryManagement.tsx` admin tab-ok |
| 7 | Meglévő `GallerySection.tsx` cseréje főoldalon |

---

## Technikai Részletek

### ImageLightbox Props
```typescript
interface ImageLightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
```

### GalleryGrid Props
```typescript
interface GalleryGridProps {
  images: GalleryImage[];
  galleryType: 'food' | 'interior';
  compact?: boolean;
  onImageClick: (index: number) => void;
}
```

### Intersection Observer Hook
```typescript
// Fade-in animációhoz
const useScrollFadeIn = () => {
  // IntersectionObserver figyeli az elemeket
  // Belépéskor hozzáadja az 'animate-in' osztályt
}
```

---

## Fájl Lista

| Művelet | Fájl |
|---------|------|
| CREATE | `src/components/gallery/ImageLightbox.tsx` |
| CREATE | `src/components/gallery/GalleryGrid.tsx` |
| CREATE | `src/components/gallery/FoodGallery.tsx` |
| CREATE | `src/components/gallery/InteriorGallery.tsx` |
| CREATE | `src/pages/Gallery.tsx` |
| MODIFY | `src/components/admin/GalleryManagement.tsx` |
| MODIFY | `src/components/sections/GallerySection.tsx` |
| MODIFY | `src/App.tsx` (új route) |
| MIGRATION | `gallery_type` és `title` oszlopok |
