## Terv

### 1) Kép nagyítás (lightbox) minden AI kép generálási helyen

**Új komponens:** `src/components/admin/ImagePreviewLightbox.tsx`
- Egyszerű Dialog, ami teljes méretben megjeleníti a képet
- Bezárás X-szel vagy háttérre kattintással
- Letöltés gomb opcionálisan

**`src/components/admin/ImageUpload.tsx` módosítása:**
- A jelenlegi thumbnail képet `<button>`-ba csomagoljuk
- Kattintásra megnyílik a lightbox
- A meglévő ✕ (eltávolítás) gomb külön marad, nem indítja a lightboxot
- Hover állapotban kis nagyító (Maximize2) ikon a kép sarkában jelzi, hogy kattintható

Ez automatikusan érvényesül mindenhol, ahol `ImageUpload` van használva:
- Fix tételek dialog
- MenuItemEditDialog (étlap szerkesztés)
- Daily menu szerkesztés
- TemporaryItemCreator
- Galéria feltöltés stb.

**Egyéb képes helyek ellenőrzése:**
- `MultiImageUpload.tsx`, `QuickImageUpload.tsx`, `AnnouncementEditor.tsx` banner kép, `DailyOfferImageGenerator.tsx` előnézet → ugyanazt a lightboxot kapják

### 2) Fix tételek átláthatóbb megjelenítése (tab-os nézet)

**`src/pages/admin/FixItems.tsx` átalakítása:**

Jelenleg minden kategória egymás alatt egy nagy Card-ban → sok görgetés.
Helyette **kategória tab sáv** felül:

```text
[Italok 12] [Savanyúság 4] [Desszertek 6] [Köretek 3] ...
```

- `Tabs` komponens (shadcn) horizontálisan görgethető tab listával (mobilon `overflow-x-auto`, AdminLayout standard)
- Minden tab fülön: az adott kategória darabszám badge + display toggle (Képes/Lista) + "Új" / "Meglévő hozzáadása" gombok egy kompakt sorban
- Alatta csak az adott kategória drag-and-drop listája
- "Mind" fül opcionálisan: mindent egyben mutat (jelenlegi nézet), ha valakinek mégis kell

**URL state:** aktív tab `?cat=<id>` query paraméterben → frissítés után megőrzi
**Üres kategóriák:** halványítva, de elérhetők (hogy hozzá tudj adni)
**Kategória nélküli** elemek külön "Egyéb" tab-on

**Eredmény:** egyszerre csak 1 kategóriát látsz → jóval kevesebb görgetés, gyorsabb átkapcsolás.

### Érintett fájlok

- ÚJ: `src/components/admin/ImagePreviewLightbox.tsx`
- MÓD: `src/components/admin/ImageUpload.tsx` (kattintható thumb + lightbox)
- MÓD: `src/pages/admin/FixItems.tsx` (Tabs alapú elrendezés)
- (esetleg) MÓD: `MultiImageUpload.tsx`, `QuickImageUpload.tsx` ha gyorsan beleilleszthető

Backend / adatbázis változás **nincs**, csak UI.
