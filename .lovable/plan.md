

# Plan: Fix Login, Price Editing, and Add Daily Menu Combo Selection

## Issues Identified

### 1. Login "Failed to Fetch" Error
The auth logs show successful logins for `gataibence@gmail.com`. The "Failed to fetch" errors are **network connectivity issues** with the preview environment, not code problems. The previous fix for the `is_admin` function overload was successfully applied. No code changes needed - just retry login.

### 2. Per-Item Price Not Visible
The `QuickPriceEdit` component doesn't show when an item has price = 0.

**Root Cause**: Line 85 in `WeeklyGridCell.tsx`:
```typescript
{onPriceChange && selectedItem.price && (  // 0 is falsy!
```

**Fix**: Change condition to check for undefined instead of truthy:
```typescript
{onPriceChange && selectedItem.price !== undefined && (
```

### 3. Daily Menu Combo Selection Missing
The database already supports daily menu combos (`is_menu_part`, `menu_role` columns), but the admin UI doesn't expose this feature.

**Solution**: Add toggle buttons in each grid cell to mark items as part of the daily menu:
- A "Menü" toggle for each item
- When toggled, show a role selector: "Leves" or "Főétel"
- Create/update `daily_offer_menus` record with the combo price

---

## Implementation Steps

### Step 1: Fix Price Condition in WeeklyGridCell

**File:** `src/components/admin/WeeklyGridCell.tsx`

Change line 85 from:
```typescript
{onPriceChange && selectedItem.price && (
```
to:
```typescript
{onPriceChange && selectedItem.price !== undefined && (
```

---

### Step 2: Update Grid Data to Include Menu Part Info

**File:** `src/components/admin/WeeklyMenuGrid.tsx`

Modify the query to fetch `is_menu_part` and `menu_role` from `daily_offer_items`, and add mutations to update these fields.

```typescript
// Updated query in daily offers fetch
daily_offer_items (
  id,
  daily_offer_id,
  item_id,
  is_menu_part,    // Add this
  menu_role,       // Add this
  menu_items (...)
)

// Updated SelectedItem interface
interface SelectedItem {
  itemId: string;
  itemName: string;
  offerId: string;
  offerItemId: string;
  imageUrl?: string | null;
  price?: number;
  isMenuPart: boolean;    // Add this
  menuRole?: string;      // Add this
}

// New mutation for toggling menu part
const updateMenuPartMutation = useMutation({
  mutationFn: async ({ 
    offerItemId, 
    isMenuPart, 
    menuRole 
  }: { 
    offerItemId: string; 
    isMenuPart: boolean; 
    menuRole: string | null;
  }) => {
    const { error } = await supabase
      .from("daily_offer_items")
      .update({ 
        is_menu_part: isMenuPart, 
        menu_role: menuRole 
      })
      .eq("id", offerItemId);
    
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
    toast.success("Menü beállítás mentve");
  },
});
```

---

### Step 3: Create MenuPartToggle Component

**New File:** `src/components/admin/MenuPartToggle.tsx`

A compact toggle button that shows:
- Gray when not part of menu
- Colored when part of menu, with role indicator (L = Leves, F = Főétel)

```typescript
interface MenuPartToggleProps {
  offerItemId: string;
  isMenuPart: boolean;
  menuRole: string | null;
  categoryName: string;
  onToggle: (offerItemId: string, isMenuPart: boolean, menuRole: string | null) => void;
}
```

UI Design:
```text
Item not in menu:     [M]  (gray, outlined)
Item is soup:         [L]  (orange, filled)
Item is main:         [F]  (green, filled)
```

Clicking toggles through: Off → Leves → Főétel → Off

---

### Step 4: Add Toggle to WeeklyGridCell

**File:** `src/components/admin/WeeklyGridCell.tsx`

Add the `MenuPartToggle` component to each selected item in the grid cell:

```typescript
<div className="flex items-center gap-1 p-1 bg-background rounded border">
  {/* Image Thumbnail */}
  ...
  
  {/* Item Name */}
  <span className="flex-1 text-xs font-medium truncate">
    {selectedItem.itemName}
  </span>
  
  {/* Menu Part Toggle - NEW */}
  <MenuPartToggle
    offerItemId={selectedItem.offerItemId}
    isMenuPart={selectedItem.isMenuPart}
    menuRole={selectedItem.menuRole}
    categoryName={categoryName}
    onToggle={onMenuPartToggle}
  />
  
  {/* Price Edit */}
  ...
  
  {/* Image Upload */}
  ...
  
  {/* Remove Button */}
  ...
</div>
```

---

### Step 5: Update Mobile Grid

**File:** `src/components/admin/WeeklyGridMobile.tsx`

Apply the same changes to the mobile view to ensure consistency.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/WeeklyGridCell.tsx` | MODIFY | Fix price condition; add MenuPartToggle |
| `src/components/admin/WeeklyMenuGrid.tsx` | MODIFY | Fetch is_menu_part/menu_role; add mutation; pass callback |
| `src/components/admin/MenuPartToggle.tsx` | CREATE | New toggle component for daily menu selection |
| `src/components/admin/WeeklyGridMobile.tsx` | MODIFY | Add MenuPartToggle support for mobile |

---

## Database Impact

No schema changes needed. The required columns already exist:
- `daily_offer_items.is_menu_part` (boolean)
- `daily_offer_items.menu_role` (text: "leves" or "főétel")
- `daily_offer_menus` table for combo pricing

---

## UI Flow

```text
1. Admin adds items to a day's menu grid
2. For each item, admin can click the [M] toggle:
   - First click: Item becomes "Leves" (soup) → [L] orange
   - Second click: Item becomes "Főétel" (main) → [F] green  
   - Third click: Item removed from menu → [M] gray
3. Items marked as menu parts appear in the "Napi Menü" combo on the public Etlap page
4. The combo price is set via the "Napi menü ár" row at the top of the grid
```

---

## Visual Example

After implementation, each item in the grid will look like:

```text
┌─────────────────────────────────────────────────────┐
│ [🖼️] Bableves      [L] [💰 1290] [📷] [✕]          │
│      ^name          ^   ^price   ^img  ^delete      │
│                     │                               │
│                     └── Menu toggle (Leves = orange)│
└─────────────────────────────────────────────────────┘
```

