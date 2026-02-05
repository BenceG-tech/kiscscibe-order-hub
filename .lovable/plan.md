

# Admin Napi Ajánlatok Egyszerűsítése + Excel Export

## Összefoglaló

Három fő változtatást végzünk:
1. **Ütemezés és Sablonok tab-ok eltávolítása** - Az admin felület egyszerűsítése
2. **Teljes étel szerkesztés hozzáadása** - Minden mezőt (név, leírás, allergének stb.) lehessen szerkeszteni a napi ajánlat nézetből
3. **Excel export funkció** - A heti ajánlat letöltése Excel formátumban

---

## 1. Tab-ok Eltávolítása

### Jelenlegi állapot (5 tab):
- Napi ajánlatok
- Ütemezés ← **Törlendő**
- Sablonok ← **Törlendő**
- Kapacitás
- Excel Import

### Új állapot (3 tab):
- Napi ajánlatok
- Kapacitás  
- Excel Import

**Fájl:** `src/pages/admin/DailyMenuManagement.tsx`

Törlendő elemek:
- Import: `MenuScheduling`, `TemplateManagement`
- Tab Trigger: "Ütemezés" és "Sablonok"
- Tab Content: `scheduling` és `templates`

---

## 2. Étel Szerkesztés Dialógus

### Jelenlegi helyzet:
A `WeeklyGridCell` komponensben csak gyors műveletek vannak:
- Kép feltöltés
- Ár módosítás
- Menü rész toggle
- Törlés

### Megoldás:
Új "Szerkesztés" gomb hozzáadása, amely megnyit egy teljes szerkesztő dialógust:

**Új komponens:** `src/components/admin/MenuItemEditDialog.tsx`

Ez egy önálló, újrafelhasználható dialógus komponens, amely tartalmazza:
- Név
- Leírás  
- Ár
- Kategória
- Kép feltöltés
- Allergének
- Aktív/Kiemelt státusz
- Kötelező köret választás

**Működési elv:**
1. Admin kattint a "✏️" ikonra egy ételen
2. Megnyílik a szerkesztő dialógus az étel adataival
3. Mentéskor a `menu_items` tábla frissül
4. React Query invalidálja mindkét query-t (`daily-offers-week` + `menu-items-all`)
5. Mindkét felület (Napi ajánlatok + Étlap kezelés) automatikusan frissül

### Fájl változások:

| Fájl | Művelet |
|------|---------|
| `src/components/admin/MenuItemEditDialog.tsx` | **CREATE** - Új szerkesztő dialógus |
| `src/components/admin/WeeklyGridCell.tsx` | **MODIFY** - Szerkesztés gomb + dialógus integráció |
| `src/components/admin/WeeklyGridMobile.tsx` | **MODIFY** - Callback prop hozzáadása |
| `src/components/admin/WeeklyMenuGrid.tsx` | **MODIFY** - Callback function hozzáadása |

---

## 3. Excel Export Funkció

### Excel struktúra:

```text
| Kategória        | Hétfő       | Kedd        | Szerda      | Csütörtök   | Péntek      |
|------------------|-------------|-------------|-------------|-------------|-------------|
| Napi menü ár     | 1890 Ft     | 1890 Ft     | -           | 1890 Ft     | 1890 Ft     |
| Levesek          | Gulyásleves | Húsleves    | Paradicsom  | Gyümölcs    | Bableves    |
| Tészta ételek    | Bolognai    | Carbonara   | -           | -           | Penne       |
| Főzelékek        | Tökfőzelék  | Lencsefőz.  | -           | Zöldbab     | Kelkáposzta |
```

### Export gomb elhelyezése:

A heti navigációs sávban, a "Mentve" státusz mellé:

```text
[<] [>] [Ma]     2026. február 3. – 7.     ✓ Mentve  [📥 Export]
```

### Fájlnév formátum:
`napi_ajanlatok_2026-02-03_2026-02-07.xlsx`

**Fájl:** `src/components/admin/WeeklyMenuGrid.tsx` és `WeeklyGridMobile.tsx`

**Megjegyzés:** A projekt már tartalmazza az `xlsx` könyvtárat (^0.18.5), nem kell telepíteni.

---

## 4. Részletes Implementáció

### MenuItemEditDialog.tsx struktúra:

```tsx
interface MenuItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  onSaved: () => void;
}

// A dialógus:
// 1. Betölti az item adatait az itemId alapján
// 2. Form mezők: név, leírás, ár, kategória, kép, allergének, switchek
// 3. Mentéskor: supabase update + onSaved callback
```

### WeeklyGridCell módosítás:

```tsx
// Új prop:
onItemEdit?: (itemId: string) => void;

// Új gomb a többi mellé (M, Ft, 📷, X előtt):
<Button onClick={() => onItemEdit?.(selectedItem.itemId)}>
  <Edit className="h-3 w-3" />
</Button>
```

### Excel export implementáció:

```tsx
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  const exportData = [];
  
  // Fejléc
  exportData.push(['Kategória', ...weekDates.map(d => 
    format(d, 'EEEE MM.dd.', { locale: hu })
  )]);
  
  // Napi menü ár sor
  exportData.push(['Napi menü ár', ...weekDates.map(d => {
    const price = priceData[format(d, 'yyyy-MM-dd')]?.price;
    return price ? `${price} Ft` : '-';
  })]);
  
  // Kategória sorok
  foodCategories.forEach(category => {
    const row = [category.name];
    weekDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const items = gridData[dateStr]?.[category.id] || [];
      row.push(items.map(i => i.itemName).join(', ') || '-');
    });
    exportData.push(row);
  });
  
  // Excel fájl létrehozása
  const ws = XLSX.utils.aoa_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Heti Ajánlat');
  
  // Oszlopszélességek
  ws['!cols'] = [{ wch: 20 }, ...weekDates.map(() => ({ wch: 25 }))];
  
  // Letöltés
  const fileName = `napi_ajanlatok_${format(currentWeekStart, 'yyyy-MM-dd')}_${format(addDays(currentWeekStart, 4), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
```

---

## 5. Fájl Lista

| Prioritás | Művelet | Fájl | Leírás |
|-----------|---------|------|--------|
| 1 | MODIFY | `src/pages/admin/DailyMenuManagement.tsx` | Tab-ok eltávolítása |
| 2 | CREATE | `src/components/admin/MenuItemEditDialog.tsx` | Újrafelhasználható szerkesztő dialógus |
| 3 | MODIFY | `src/components/admin/WeeklyGridCell.tsx` | Szerkesztés gomb + dialógus |
| 4 | MODIFY | `src/components/admin/WeeklyMenuGrid.tsx` | Export + edit callback |
| 5 | MODIFY | `src/components/admin/WeeklyGridMobile.tsx` | Export + edit callback |

---

## 6. Eredmény

| Változtatás | Előny |
|-------------|-------|
| 2 tab eltávolítása | Egyszerűbb, áttekinthetőbb admin felület |
| Teljes étel szerkesztés | Nem kell az Étlap kezelés oldalra navigálni |
| Automatikus szinkronizáció | Mindkét nézet frissül mentéskor |
| Excel export | Heti terv megosztható, nyomtatható |

