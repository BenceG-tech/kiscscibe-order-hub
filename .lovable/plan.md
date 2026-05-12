## Probléma

Az `/admin/menu` oldalon a „Tétel szerkesztése" dialógusban (és az „Új étel" létrehozásnál) hiányzik az AI képgeneráló gomb. A dialógus a közös `ImageUpload` komponenst használja, amibe sosem lett bekötve az `AIGenerateImageButton` — csak a `MenuItemEditDialog` (másik felület) tartalmazza.

## Megoldás

Bekötjük az `AIGenerateImageButton`-t az `ImageUpload` komponensbe, hogy minden helyen elérhető legyen ahol ez fut (Menüszerkesztés, MenuItemManagement, és bárhol máshol).

### Változtatások

**`src/components/admin/ImageUpload.tsx`**
- Új opcionális propok: `itemName?: string`, `itemId?: string`.
- Az upload terület alatt (vagy a kép-előnézet alatt) megjelenítjük az `AIGenerateImageButton`-t, ha `itemName` van adva.
- A gomb `onGenerated` callback-je hívja: `setPreviewUrl(url)` + `onImageUploaded(url)` — így a parent form is frissül, és az előnézet azonnal látszik.
- A `hasExistingImage` flag-et átadjuk (`!!previewUrl`), hogy a feliratot „AI kép" / „Új AI kép"-re váltsa.

**`src/pages/admin/MenuManagement.tsx`** (kb. 328. sor)
- Az `<ImageUpload>` hívásra hozzáadjuk: `itemName={itemForm.name}` és `itemId={editingItem?.id}`.

**`src/pages/admin/MenuItemManagement.tsx`** (kb. 787. sor)
- Ugyanaz: `itemName={itemForm.name}` és `itemId={editingItem?.id}`.

## Nem változik

- `MenuItemEditDialog.tsx` (már tartalmazza az AI gombot saját maga, nem `ImageUpload`-ot használ).
- A képgeneráló edge function, az upload logika, a Lightbox.
- Backend / RLS.

## Érintett fájlok

- `src/components/admin/ImageUpload.tsx` (kis kibővítés)
- `src/pages/admin/MenuManagement.tsx` (1 prop átadás)
- `src/pages/admin/MenuItemManagement.tsx` (1 prop átadás)
