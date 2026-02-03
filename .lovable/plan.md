
# Plan: Enhanced Weekly Menu Grid with Dark Theme Default

## Overview

This plan addresses 5 user requests:
1. Make dark theme the default for all visitors
2. Add button to add extra items per row (multiple items per category per day)
3. Allow editing the price once menu is set
4. Add image management directly in the weekly grid (not just in Étlap kezelés)
5. Ensure the menu is saved and editable

---

## 1. Dark Theme as Default

**Current State:** The ThemeProvider in `App.tsx` has `defaultTheme="light"`

**Change:** Update to `defaultTheme="dark"` so the website starts in dark mode for all new visitors.

| File | Change |
|------|--------|
| `src/App.tsx` | Change `defaultTheme="light"` to `defaultTheme="dark"` |

---

## 2. Add Extra Items Per Category Row

**Current State:** Each cell in the weekly grid allows only 1 item per category per day. The grid shows a dropdown when empty and a single item when selected.

**New Design:** Each cell can have multiple items. Add a "+" button to add additional items within the same category for the same day.

```text
+------------------+-------------------------+
| Levesek          | [Paradicsom leves] [X]  |
|                  | [Húsleves] [X]          |
|                  | [+ Hozzáadás]           |
+------------------+-------------------------+
```

**Technical Changes:**

| File | Change |
|------|--------|
| `src/components/admin/WeeklyMenuGrid.tsx` | Update `gridData` structure to support arrays of items per cell instead of single item |
| `src/components/admin/WeeklyGridCell.tsx` | Redesign to show a list of selected items with individual remove buttons and an "Add" button at the bottom |
| `src/components/admin/WeeklyGridMobile.tsx` | Apply same multi-item logic for mobile view |

**Data Structure Change:**
```typescript
// Before: single item per cell
gridData[date][categoryId] = { itemId, itemName, offerId, offerItemId }

// After: array of items per cell
gridData[date][categoryId] = [
  { itemId, itemName, offerId, offerItemId },
  { itemId, itemName, offerId, offerItemId }
]
```

---

## 3. Edit Price for Daily Offer

**Current State:** The `daily_offers` table has a `price_huf` column that is not exposed in the UI. Prices come from individual menu items.

**New Feature:** Add a "Daily Price" editor above or beside the grid that allows setting a custom price for the entire day's offering (like a menu deal price).

**UI Design:**
- Add a row at the top of the grid table for "Napi menü ár" (Daily menu price)
- Each day column gets an editable price input field
- Prices are stored in the `daily_offers.price_huf` column

```text
+------------------+----------+----------+
| Napi ár          | [2490]Ft | [2490]Ft |
+------------------+----------+----------+
| Levesek          | ...      | ...      |
```

**Technical Changes:**

| File | Change |
|------|--------|
| `src/components/admin/WeeklyMenuGrid.tsx` | Fetch and display `price_huf` from `daily_offers`; add mutation for updating price |
| New Component: `src/components/admin/DailyPriceInput.tsx` | Inline editable price input with debounced auto-save |

---

## 4. Add Images Directly in Weekly Grid

**Current State:** Images can only be added through the "Étlap kezelés" (Menu Item Management) section. The grid cells don't show images or allow image editing.

**New Feature:** Add quick image upload capability within the weekly grid. When an item is selected, show a small image thumbnail and allow uploading/changing the image directly.

**UI Design:**
```text
+----------------------------------+
| [Image] Paradicsom leves [X]     |
| [📷 Kép] [Edit]                  |
+----------------------------------+
```

**Technical Changes:**

| File | Change |
|------|--------|
| `src/components/admin/WeeklyGridCell.tsx` | Add small image thumbnail display and quick upload button |
| `src/components/admin/QuickImageUpload.tsx` | New lightweight image upload dialog triggered from grid cells |
| `src/components/admin/WeeklyMenuGrid.tsx` | Add mutation for updating `menu_items.image_url` |

---

## 5. Save and Edit Menu for the Week

**Current State:** Changes are auto-saved individually when items are selected/removed, but there's no explicit "Save" feedback or bulk operations.

**Enhancements:**
- The menu is already being saved automatically to the database
- Add visual confirmation that data is saved (checkmark indicator)
- Add "Mentve" (Saved) status indicator in the header
- The week navigation already allows viewing and editing past/future weeks

**Technical Changes:**

| File | Change |
|------|--------|
| `src/components/admin/WeeklyMenuGrid.tsx` | Add "Mentve" indicator that shows when no mutations are pending; optionally add a "Save All" button for explicit save action |

---

## Implementation Summary

| Priority | Feature | Files Affected |
|----------|---------|----------------|
| 1 | Dark theme default | `App.tsx` (1 line change) |
| 2 | Multi-item per cell | `WeeklyMenuGrid.tsx`, `WeeklyGridCell.tsx`, `WeeklyGridMobile.tsx` |
| 3 | Price editing | `WeeklyMenuGrid.tsx`, new `DailyPriceInput.tsx` |
| 4 | Quick image upload | `WeeklyGridCell.tsx`, new `QuickImageUpload.tsx`, `WeeklyMenuGrid.tsx` |
| 5 | Save status indicator | `WeeklyMenuGrid.tsx` |

---

## Database Impact

No database schema changes required. The existing tables already support:
- Multiple `daily_offer_items` per `daily_offer` (for multi-item cells)
- `daily_offers.price_huf` for custom daily pricing
- `menu_items.image_url` for item images

---

## UI Component Flow (Multi-Item Cell)

```text
WeeklyGridCell (Enhanced)
├── List of Selected Items
│   ├── Item 1: [Thumbnail] [Name] [X Remove]
│   ├── Item 2: [Thumbnail] [Name] [X Remove]
│   └── ...
├── Add Item Button [+]
│   └── Opens Popover with searchable item list
└── Quick Image Upload (per item)
    └── Opens small dialog to upload/change image
```
