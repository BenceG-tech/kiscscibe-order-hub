
## 1. Fix tételek admin – felhasználóbarátabb kezelés

**`src/pages/admin/FixItems.tsx`**

- **„Új tétel" gomb → dropdown / kis menü** kategóriánként két opcióval:
  - **„Új tétel létrehozása"** – a jelenlegi szerkesztő dialógus (új menu_item, `is_always_available = true`).
  - **„Meglévő tétel hozzáadása"** – új választó dialógus (`AddExistingItemDialog`), amely a `menu_items`-ből listázza azokat, ahol `is_always_available = false`. Keresőmező + kategória szűrés, kép + név + ár előnézet, többes kijelölés. Mentésnél csak a `is_always_available = true` és a megfelelő `display_order` frissül – semmi más adat nem változik. Mivel ugyanaz a `menu_items` rekord, a változás automatikusan megjelenik mindenhol (étlap, daily offer, stb.).

- **Szerkesztő dialógus bővítés** (`Tétel szerkesztése` / `Új fix tétel`):
  - A kép feltöltő mellé / alá tegyük be az `AIGenerateImageButton`-t (ugyanúgy, mint a `MenuItemEditDialog`-ban). `itemId` csak meglévő tételnél, `itemName` mindig a `form.name`. Generálás után `setForm({ ...form, image_url: url })`.
  - „Eltávolítás a fixekből" gomb a delete mellé: `is_always_available = false`-ra állítja (megőrzi a tételt az étlapon, csak kiveszi a fix listából). A delete továbbra is teljes törlés marad, megerősítéssel egyértelművé tesszük a különbséget.

- **Apró UX finomítás**: kategória fejléc jobb felső sarkában a kapcsoló mellé világos felirat (`Képes` / `Lista`), gombok ikonnal és tooltippel.

## 2. Adatkonzisztencia

A `FixItems` és a többi admin felület (Menu, MenuItemManagement) ugyanazt a `menu_items` táblát használja, így bármilyen módosítás (név, ár, kép, allergének) automatikusan szinkronban van. Nincs szükséges sémaváltozás. A `display_order` a fix listán belüli sorrendet jelöli, az étlap továbbra is a saját rendezését használja.

## 3. Étlap mobil – „Kosárba" gomb lecsúszik a kártyáról

**`src/components/sections/AlwaysAvailableSection.tsx`**

Probléma: képes nézetben `grid-cols-2`, kis mobil szélességen a `flex items-center justify-between` sorba egymás mellé teszi a `2150 Ft` badge-et és a `Kosárba` gombot, de a gomb felirata kilóg a kártyából (lásd csatolt képernyőkép).

Megoldás (csak prezentációs kód):
- Kis kártyában (mobilon, `grid-cols-2`) a price + gomb **egymás alá**: `flex-col items-stretch gap-2`, badge balra, gomb teljes szélességű.
- `sm:` breakpointtól vissza a jelenlegi `flex-row justify-between` elrendezésre.
- Gomb: `w-full sm:w-auto`, ikon + „Kosárba" felirat marad, `truncate`-tel biztosítjuk hogy ne nőjjön ki.
- Ár badge: `self-start` mobilon.

Eredmény: minden tartalom a kártyán belül marad, a gomb tappolható és olvasható méretű 360–414 px szélességen is.

## QA

- Admin fix tételek: meglévő tétel hozzáadása → megjelenik a fix listában, eredeti étlapon ár/név változatlan.
- AI kép generálás a fix tétel szerkesztőben működik, kép mentődik.
- Étlap mobil 375 / 402 px viewporton: „Kosárba" gomb a kártyán belül van, nem csúszik le.
