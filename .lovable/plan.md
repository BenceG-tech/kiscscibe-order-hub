
# Étel Név Normalizálás + Keresés Javítás + Köret Ajánló

## Összefoglaló

Három fő változtatást végzünk:

1. **Étel nevek automatikus nagybetűsítése** - Mentéskor automatikusan nagybetűvel kezdődik minden étel neve
2. **Accent-insensitive keresés mindenhol** - Minden keresőmezőben működjön a "gulyas" → "Gulyásleves" típusú keresés
3. **Köret ajánló főételekhez** - Amikor a felhasználó főételt tesz a kosárba, mindig feldobjon egy köret választó ablakot

---

## 1. Étel Nevek Automatikus Nagybetűsítése

### Probléma
Jelenleg a `capitalizeFirst()` funkció csak a megjelenítésnél fut le, de az adatok mentésekor nem alkalmazzák. Így az adatbázisban maradnak kisbetűs ételnevek.

### Megoldás
Minden mentési műveletnél automatikusan alkalmazzuk a `capitalizeFirst()` függvényt a név mezőre.

### Érintett fájlok:

| Fájl | Változás |
|------|----------|
| `src/components/admin/MenuItemEditDialog.tsx` | Mentéskor `capitalizeFirst(name)` |
| `src/pages/admin/MenuItemManagement.tsx` | Mentéskor `capitalizeFirst(itemForm.name)` |
| `src/pages/admin/MenuManagement.tsx` | Mentéskor `capitalizeFirst(itemForm.name)` |
| `src/components/admin/TemporaryItemCreator.tsx` | Mentéskor `capitalizeFirst(name)` |

### Kód változás (példa MenuItemEditDialog.tsx):

```tsx
// Mentés előtt normalizáljuk a nevet
const { error } = await supabase
  .from("menu_items")
  .update({
    name: capitalizeFirst(name.trim()), // <-- Hozzáadva
    ...
  })
```

---

## 2. Accent-Insensitive Keresés Mindenhol

### Probléma
Néhány komponens már használja a `normalizeText()` függvényt (FoodSearchCommand, MenuManagement), de mások nem:
- TemporaryItemsLibrary - NEM használja
- StreamlinedDailyOffers - NEM használja
- MenuItemManagement - NEM használja

### Megoldás
1. A `normalizeText()` függvényt áthelyezzük a közös `src/lib/utils.ts` fájlba
2. Minden keresési helyen alkalmazzuk

### Kód a utils.ts-be:

```tsx
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
```

### Érintett fájlok:

| Fájl | Változás |
|------|----------|
| `src/lib/utils.ts` | `normalizeText` export hozzáadása |
| `src/components/admin/FoodSearchCommand.tsx` | Import utils-ból |
| `src/pages/admin/MenuManagement.tsx` | Import utils-ból |
| `src/components/admin/TemporaryItemsLibrary.tsx` | `normalizeText` használata |
| `src/components/admin/StreamlinedDailyOffers.tsx` | `normalizeText` használata |
| `src/pages/admin/MenuItemManagement.tsx` | `normalizeText` használata |

---

## 3. Köret Ajánló Főételekhez

### Probléma
Jelenleg a `SidePickerModal` csak akkor jelenik meg, ha:
- Az étel `requires_side_selection = true`, VAGY
- Az ételhez van `menu_item_sides` konfiguráció

A felhasználó kérése: **minden főételnél** (nem leves kategória) jelenjen meg a köret ajánló.

### Megoldás
1. A `handleAddItemToCart` függvényekben ellenőrizzük, hogy az étel főétel-e (nem leves kategória)
2. Ha főétel, megnyitjuk a köret választó modalt
3. A köret választás opcionális lesz (nem kötelező), de mindig felajánljuk

### Logika:

```tsx
// Kategória ellenőrzés - ha nem "Levesek", akkor főétel
const isMainCourse = !categoryName.toLowerCase().includes("leves");

if (isMainCourse) {
  // Nyissuk meg a köret választó modalt
  openSidePickerModal(item);
} else {
  // Közvetlenül kosárba
  addItem(...);
}
```

### Érintett fájlok:

| Fájl | Változás |
|------|----------|
| `src/pages/Etlap.tsx` | Import SidePickerModal, köret ajánló logika |

### Új State és Handler az Etlap.tsx-ben:

```tsx
// Új state
const [sidePickerOpen, setSidePickerOpen] = useState(false);
const [pendingCartItem, setPendingCartItem] = useState<MenuItem | null>(null);

// Módosított handleAddItemToCart
const handleAddItemToCart = async (item: MenuItem) => {
  // Ellenőrizzük, hogy van-e köret konfiguráció
  const { data: sideConfigs } = await supabase
    .from('menu_item_sides')
    .select('side_item_id')
    .eq('main_item_id', item.item_id)
    .limit(1);
  
  // Ha van köret konfiguráció, nyissuk meg a modalt
  if (sideConfigs && sideConfigs.length > 0) {
    setPendingCartItem(item);
    setSidePickerOpen(true);
    return;
  }
  
  // Ha nincs, közvetlenül kosárba
  addItem({...});
  toast({...});
};

// Köret kiválasztás handler
const handleSideSelected = (selectedSides: SideItem[]) => {
  if (!pendingCartItem) return;
  
  addItemWithSides({
    id: pendingCartItem.item_id,
    name: pendingCartItem.item_name,
    price_huf: pendingCartItem.item_price_huf,
    modifiers: [],
    image_url: pendingCartItem.item_image_url
  }, selectedSides);
  
  toast({
    title: "Kosárba tetve",
    description: `${pendingCartItem.item_name} hozzáadva a kosárhoz`
  });
  
  setPendingCartItem(null);
};
```

### Modal hozzáadása a JSX-hez:

```tsx
<SidePickerModal
  open={sidePickerOpen}
  onOpenChange={(open) => {
    setSidePickerOpen(open);
    if (!open && pendingCartItem) {
      // Ha bezárják köret nélkül, mégis kosárba tesszük
      addItem({
        id: pendingCartItem.item_id,
        name: pendingCartItem.item_name,
        price_huf: pendingCartItem.item_price_huf,
        modifiers: [],
        sides: [],
        image_url: pendingCartItem.item_image_url
      });
      toast({
        title: "Kosárba tetve",
        description: `${pendingCartItem.item_name} hozzáadva köret nélkül`
      });
      setPendingCartItem(null);
    }
  }}
  mainItemId={pendingCartItem?.item_id || ""}
  mainItemName={pendingCartItem?.item_name || ""}
  mainItemRequiresSideSelection={false}
  onSideSelected={handleSideSelected}
/>
```

---

## 4. SidePickerModal Módosítás

A modal jelenleg ellenőrzi, hogy van-e köret konfiguráció az ételhez. Ha nincs, bezárja magát. Ezt módosítani kell, hogy mutassa a globális köreteket (pl. "Hagyományos köretek", "Extra köretek" kategóriákból).

### Alternatív megoldás:

Ha az ételhez nincs specifikus köret konfiguráció a `menu_item_sides` táblában, akkor jelenítse meg az összes "Köretek" kategóriájú ételt választási lehetőségként.

### Módosítás a SidePickerModal.tsx-ben:

```tsx
// Ha nincs specifikus köret, mutassuk az általános köreteket
if (!configs || configs.length === 0) {
  // Fetch all items from "Köretek" category
  const { data: sideItems } = await supabase
    .from('menu_items')
    .select('id, name, description, image_url, price_huf')
    .eq('category_id', 'a4c74b22-3789-45e0-b09d-24315e43b8a2') // Köretek kategória
    .eq('is_active', true);
  
  if (sideItems && sideItems.length > 0) {
    setSideItems(sideItems);
    setMinSelect(0); // Opcionális
    setMaxSelect(1); // Max 1 köret
    setIsRequired(false);
  } else {
    onOpenChange(false); // Nincs elérhető köret
    return;
  }
}
```

---

## 5. Fájl Lista

| Prioritás | Művelet | Fájl | Leírás |
|-----------|---------|------|--------|
| 1 | MODIFY | `src/lib/utils.ts` | `normalizeText` export hozzáadása |
| 2 | MODIFY | `src/components/admin/MenuItemEditDialog.tsx` | Név nagybetűsítés mentéskor |
| 3 | MODIFY | `src/pages/admin/MenuItemManagement.tsx` | Név nagybetűsítés + normalizeText keresés |
| 4 | MODIFY | `src/pages/admin/MenuManagement.tsx` | Név nagybetűsítés + normalizeText import |
| 5 | MODIFY | `src/components/admin/TemporaryItemCreator.tsx` | Név nagybetűsítés |
| 6 | MODIFY | `src/components/admin/TemporaryItemsLibrary.tsx` | normalizeText keresés |
| 7 | MODIFY | `src/components/admin/StreamlinedDailyOffers.tsx` | normalizeText keresés |
| 8 | MODIFY | `src/components/admin/FoodSearchCommand.tsx` | normalizeText import utils-ból |
| 9 | MODIFY | `src/components/SidePickerModal.tsx` | Általános köretek fallback |
| 10 | MODIFY | `src/pages/Etlap.tsx` | Köret ajánló modal integráció |

---

## 6. Eredmény

| Változtatás | Előny |
|-------------|-------|
| Automatikus nagybetűsítés | Egységes megjelenés, nem kell manuálisan javítani |
| Accent-insensitive keresés | "gulyas" → "Gulyásleves" működik mindenhol |
| Köret ajánló | Jobb felhasználói élmény, nem marad le a köret választás |
