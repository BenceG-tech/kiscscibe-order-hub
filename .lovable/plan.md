
# Plan: Weekly Grid Menu Management Redesign

## Overview

Based on the Excel screenshot, we'll redesign the admin menu management to use a **weekly grid layout** where:
- **Columns** = Days of the week (Hétfő, Kedd, Szerda, Csütörtök, Péntek)
- **Rows** = Food categories (Levesek, Tészta, Főételek, Halételek, etc.)
- **Cells** = Dropdown selectors to pick items from the master menu library

This is significantly more intuitive than the current calendar + form approach, allowing admins to see and edit the entire week at a glance.

## Current State

The existing interface uses:
- A calendar picker to select one date at a time
- A separate form area to add/remove items for that date
- Multiple tabs (Napi ajánlatok, Ütemezés, Sablonok, Kapacitás, Import)

## New Design

```text
+------------------+----------+----------+----------+----------+----------+
| Kategória        | Hétfő    | Kedd     | Szerda   | Csütörtök| Péntek   |
+------------------+----------+----------+----------+----------+----------+
| Menü Leves       | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  |
| (yellow)         |          |          |          |          |          |
+------------------+----------+----------+----------+----------+----------+
| Tészta           | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  |
| (peach)          |          |          |          |          |          |
+------------------+----------+----------+----------+----------+----------+
| Halételek        | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  |
| (tan)            |          |          |          |          |          |
+------------------+----------+----------+----------+----------+----------+
| Marhahúsos       | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  |
+------------------+----------+----------+----------+----------+----------+
| Prémium ételek   | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  |
| (orange)         |          |          |          |          |          |
+------------------+----------+----------+----------+----------+----------+
| Főzelék          | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  | [▼ ...]  |
| (green)          |          |          |          |          |          |
+------------------+----------+----------+----------+----------+----------+
```

### Key Features

1. **Week Navigation**: Buttons to go to previous/next week
2. **Dropdown Selectors**: Each cell has a searchable dropdown filtered to that category's items
3. **Color-Coded Rows**: Categories have distinct background colors matching the Excel design
4. **Auto-Save**: Changes save automatically when a selection is made
5. **Quick Clear**: Click X to remove an item from a cell
6. **Mobile Responsive**: On mobile, show a day-by-day accordion view

## Technical Implementation

### Step 1: Create WeeklyMenuGrid Component

Create a new component `src/components/admin/WeeklyMenuGrid.tsx` that:
- Fetches the current week's daily offers
- Fetches all menu items grouped by category
- Renders a table with categories as rows and days as columns
- Uses Combobox/Command for searchable dropdowns in each cell

### Step 2: Database Queries

For each cell (category + day combination):
- Check if there's an existing `daily_offer` for that date
- Check if there's a `daily_offer_item` linking to an item in that category
- When user selects an item:
  1. Create/update `daily_offers` record for that date if needed
  2. Create/update `daily_offer_items` record for the selected item

### Step 3: Update DailyMenuManagement Page

Replace the current "Napi ajánlatok" tab content with the new `WeeklyMenuGrid` component. Keep other tabs (Sablonok, Kapacitás, Import) as-is.

### Step 4: Mobile Optimization

On mobile devices:
- Show a horizontal scrollable table OR
- Use an accordion where each category expands to show the week's selections

## File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/admin/WeeklyMenuGrid.tsx` | CREATE | New weekly grid component |
| `src/pages/admin/DailyMenuManagement.tsx` | MODIFY | Replace first tab with WeeklyMenuGrid |
| `src/components/admin/StreamlinedDailyOffers.tsx` | KEEP | Keep as fallback or remove later |

## Category Row Colors

Based on the Excel screenshot, we'll use these color categories:
- **Levesek** (Menü Leves): Yellow/Gold (`#FFF9E3` or `bg-yellow-50`)
- **Tészta**: Peach (`#FFE8D4` or `bg-orange-50`)
- **Sütőben/Főételek**: Light tan
- **Halételek**: Neutral
- **Marhahúsos ételek**: Neutral
- **Prémium ételek**: Orange (`#FFD9B3` or `bg-amber-100`)
- **Főzelék**: Green (`#E8F5E9` or `bg-green-50`)

## UI Components Used

- `Table` from shadcn/ui for the grid structure
- `Popover` + `Command` for searchable dropdowns
- `Button` for week navigation
- `Badge` to show selected items
- `ScrollArea` for horizontal scroll on mobile

## User Flow

1. Admin opens "Napi ajánlatok" tab
2. Sees the current week's grid (Mon-Fri columns, categories as rows)
3. Clicks any cell to open a searchable dropdown
4. Types to filter items within that category
5. Selects an item - it saves automatically
6. Clicks X on a selected item to remove it
7. Uses arrow buttons to navigate to next/previous week

## Technical Notes

- The grid auto-creates `daily_offers` records when first item is added to a day
- Empty days (no items) don't have database records until an item is added
- Weekend columns are not shown (restaurant closed on weekends)
- Each category can have 0-1 items per day (matching the Excel single-dropdown design)
- Menu composition (leves + főétel = combined price) remains handled separately
