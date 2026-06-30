## Cél
Az ételek szerkesztésénél (admin) legyen lehetőség megadni az adag méretét **dkg-ban** (tömeg) vagy **db-ban** (darabszám). Ez megjelenjen a vendég felé az étlapon is, hogy lássák mekkora porciót kapnak.

## Mit változik

### 1. Adatbázis (migráció)
A `menu_items` táblához két új mező:
- `portion_size` (szám, opcionális) — pl. 25, 2, 350
- `portion_unit` (szöveg, opcionális) — `'dkg'`, `'db'`, `'g'`, vagy `'ml'` (alapból dkg/db közül választhat az admin, de a g/ml is engedélyezve van, ha később kell)

Régi ételek `NULL`-on maradnak (nem jelenik meg semmi extra) — nincs törő változás.

### 2. Admin szerkesztő — `MenuItemEditDialog.tsx`
Új mezőcsoport "Ár" alatt: **Adag mérete**
```
[ Szám input ]  [ Egység választó: dkg | db ]
```
- Egyik sem kötelező, üresen hagyható.
- Ha az admin beír egy számot egység nélkül, dkg az alapértelmezett.
- Mentéskor együtt mennek a többi mezővel.

### 3. Megjelenítés a vendég oldalon
Ahol az étel neve/leírása megjelenik (étlap kártyák, napi ajánlat, kosár), kicsi szürke címke a név mellé:
- `25 dkg` vagy `2 db`
- Csak akkor látszik, ha ki van töltve

Érintett komponensek (csak megjelenítés, logika nem változik):
- `src/components/DailyOffersPanel.tsx` / `DailyMenuPanel.tsx`
- `src/components/sections/AlwaysAvailableSection.tsx`
- `src/components/sections/BreakfastSection.tsx`
- `src/pages/Etlap.tsx` / `Menu.tsx`
- Kosár (`CartDialog.tsx`) — opcionális, csak ha elfér

### 4. Adminon listanézet
A `MenuItemManagement.tsx` táblázatban új kis oszlop vagy a név alatt halvány jelzés, hogy egy pillantásra látszik mely ételeknél van már megadva adag.

### 5. RPC frissítés
A `get_daily_data` SQL függvény visszaad még két mezőt (`item_portion_size`, `item_portion_unit`), hogy a napi ajánlatban is megjelenjen.

## Mit NEM változtatunk
- Régi rendelések, számlák, e-mailek formátuma változatlan.
- Árlogika és kosár mechanika érintetlen.
- A `portion_size` csak informatív címke — nem befolyásolja a készlet/portion számítást (azt továbbra is a `max_portions`/`remaining_portions` kezeli).