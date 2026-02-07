

# Napi menu nem jelenik meg - Hiányzó daily_offer_menus rekord

## A problema gyokere

Az admin feluleten a heti racs nezetben (`WeeklyMenuGrid`) az "M/L/F" gombokkal jelolod ki a menu reszeket (leves es foetel). Ez **csak** a `daily_offer_items` tablaban frissiti az `is_menu_part` es `menu_role` mezokat.

**DE** a frontend (`get_daily_data` RPC fuggveny) a `daily_offer_menus` tablabol olvassa ki, hogy letezik-e napi menu. Ha nincs ilyen rekord, a `menu_id` null lesz, es a frontend azt irja: "Az adott napra meg nincs teljes menu kijelolve."

Jelenlegi allapot (februar 9., hetfo):

```text
daily_offers:       letezik (id: 1564a56d, ar: 2200 Ft)
daily_offer_items:  Bableves (leves) + Csirkecomb paprikas (foetel) - JELOLVE
daily_offer_menus:  NEM LETEZIK <-- ez a problema!
```

Az adatbazis `validate_menu_composition` fuggvenye igazat ad vissza (van 1 leves + 1 foetel), de senki nem hozza letre a `daily_offer_menus` rekordot.

## Javitasi terv

### 1. WeeklyMenuGrid: Auto-create/delete daily_offer_menus

A `updateMenuPartMutation` mutaciot bovitjuk. Miutan frissiti az etel menu-jeloleset, automatikusan:

- Lekerdezi a `daily_offer_id`-t az adott itembol
- Ellenorzi a menu osszetitelt (van-e 1 leves + 1 foetel)
- Ha ERVENYES menu es NINCS meg `daily_offer_menus` rekord: **letrehozza** (alapertelmezett arral: 1800 Ft, 30 adag)
- Ha ERVENYTELEN menu (pl. eltavolitottak egy reszt) es VAN `daily_offer_menus` rekord: **torli**

Ez biztositja, hogy a menu-jeloles es a menu rekord mindig szinkronban legyen.

### 2. Ertesites az adminnak

Amikor automatikusan letrejon a menu rekord, egy toast uzeneten keresztul tajekoztatjuk az admint:
- "Napi menu automatikusan letrehozva (1800 Ft)" - ha uj rekord keletkezett
- "Napi menu beallitas mentve" - ha csak a jeloles valtozott
- "Napi menu eltavolitva" - ha a menu ervenytelen lett

## Technikai reszletek

### Modositando fajl

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/WeeklyMenuGrid.tsx` | `updateMenuPartMutation` bovitese auto-create/delete logikával |

### Uj mutacios logika (updateMenuPartMutation)

```text
JELENLEGI:
  1. UPDATE daily_offer_items SET is_menu_part, menu_role
  2. invalidateQueries
  3. toast.success("Menu beallitas mentve")

JAVITOTT:
  1. UPDATE daily_offer_items SET is_menu_part, menu_role
  2. Lekerdezes: SELECT daily_offer_id FROM daily_offer_items WHERE id = offerItemId
  3. Lekerdezes: SELECT * FROM daily_offer_items WHERE daily_offer_id = X AND is_menu_part = true
  4. Van-e 1 "leves" + 1 "foetel"?
     HA IGEN:
       - Lekerdezes: SELECT * FROM daily_offer_menus WHERE daily_offer_id = X
       - Ha nincs rekord: INSERT INTO daily_offer_menus (daily_offer_id, menu_price_huf, max_portions, remaining_portions)
         VALUES (X, 1800, 30, 30)
       - Toast: "Napi menu automatikusan letrehozva (1800 Ft)"
     HA NEM:
       - Lekerdezes: SELECT * FROM daily_offer_menus WHERE daily_offer_id = X
       - Ha van rekord: DELETE FROM daily_offer_menus WHERE daily_offer_id = X
       - Toast: "Napi menu eltavolitva"
  5. invalidateQueries
```

### Miert 1800 Ft az alapertelmezett ar?

A korabbi `daily_offer_menus` rekordok mindegyike 1800 Ft-tal lett letrehozva (a legutobbi 4 rekord is). Az admin barmikor modosithatja ezt az arat a menu kezelesi feluletrol.

