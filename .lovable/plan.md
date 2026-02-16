
# Kupon megjelenites a rendeleseknel

## Osszefoglalas

A `coupon_code` es `discount_huf` mezok mar leteznek az `orders` tablaban, es a `select('*')` lekerdezesek mar lekerdezik oket. A feladat: az Order interface-ek bovitese es a kupon informacio megjelentitese az admin es staff rendelesi kartyakon.

## Valtozasok

### 1. Admin OrdersManagement - Order interface bovitese

**Fajl:** `src/pages/admin/OrdersManagement.tsx`

- Az `Order` interface-hez ket uj mezo: `coupon_code?: string | null` es `discount_huf?: number`
- Az `ActiveOrderCard`-ban a vegosszeg mellett megjelenik a kupon info, ha van:
  - Pelda: "Kupon: KISCSIBENCE (-12 270 Ft)"
  - A `Tag` ikont hasznaljuk (lucide-react)
  - Szin: zold badge stilusban

### 2. Staff KanbanOrderCard bovitese

**Fajl:** `src/components/staff/KanbanOrderCard.tsx`

- Az `Order` interface-hez: `coupon_code?: string | null`, `discount_huf?: number`
- A vegosszeg ala, ha `coupon_code` letezik, egy kis sor: "Kupon: CODE (-X Ft)"
- Diszkret megjelenes, `text-xs text-green-600 dark:text-green-400`

### 3. Staff KanbanColumn interface szinkron

**Fajl:** `src/components/staff/KanbanColumn.tsx`

- Az `Order` interface-hez szinten hozzaadjuk: `coupon_code?: string | null`, `discount_huf?: number`

### 4. Staff StaffOrders interface szinkron

**Fajl:** `src/pages/staff/StaffOrders.tsx`

- Az `Order` interface-hez: `coupon_code?: string | null`, `discount_huf?: number`

## Erintett fajlok

| Fajl | Muvelet |
|------|---------|
| `src/pages/admin/OrdersManagement.tsx` | Interface bovites + kupon megjelenites az ActiveOrderCard-ban |
| `src/components/staff/KanbanOrderCard.tsx` | Interface bovites + kupon megjelenites |
| `src/components/staff/KanbanColumn.tsx` | Interface bovites |
| `src/pages/staff/StaffOrders.tsx` | Interface bovites |

## Technikai reszletek

A kupon informacio megjelenesenek feltetele: `order.coupon_code && order.discount_huf && order.discount_huf > 0`

Admin kartyan (ActiveOrderCard) a vegosszeg alatt:
```text
1 250 Ft
Kupon: KISCSIBENCE (-12 270 Ft)
```

Staff kartyan (KanbanOrderCard) a vegosszeg alatt:
```text
12 520 Ft
Kupon: KISCSIBENCE (-12 270 Ft)
```
