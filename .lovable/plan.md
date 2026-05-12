## Cél

Két javítás:
1. **Menü részeként jelölt étel külön is rendelhető legyen** (ne csak a komplett menüben).
2. **AI képgenerálás kiterjesztése** további helyekre (Mesterétel-könyvtár, Ideiglenes ételek, Galéria).

---

## 1) Menüs ételek külön rendelhetősége

### Jelenlegi állapot

A `daily_offer_items` tábla `is_menu_part` mezője alapján:
- A komplett menü (leves + főétel + desszert) egyben rendelhető a `DailyMenuPanel`-ből.
- Az "extra ételek" listából (`Etlap.tsx` 267. sor: `!item.is_menu_part`) **kiszűrjük** azokat, amik menü részei → ezért nem rendelhetők egyedileg.

### Megoldás

**Frontend változtatás (semmi DB / backend logika nem érintett):**

- `src/pages/Etlap.tsx` és `src/components/UnifiedDailySection.tsx`:
  - Az `extraItems` szűrése változik: **minden napi ajánlat elemet megjeleníteni** egyedi rendelhetőként, az egyedi áron (a `menu_items.price_huf`).
  - A menüs ételek továbbra is megjelennek a komplett menü blokkban a menü áron.
  - A menü részeként jelölt ételek mellé (egyedi listában) **kis "Menüben is" badge** kerül, hogy a vendég lássa.
- `DailyOffersPanel.tsx` és `DailyMenuPanel.tsx`:
  - A megjelenítési logika kiegészül: a menüs leves/főétel egyenként is megjelenik az egyedi áron.
  - Kosárba helyezéskor a meglévő `complete_menu_id_soup_main` cart deduplikációs logika nem zavar (külön ID külön rendelésnek).

### Eredmény

- A vendég választhat:
  - **Komplett menü** (leves + főétel + desszert) → menü ár (pl. 2200 Ft)
  - **Csak főétel** vagy **csak leves** → egyedi `menu_items.price_huf` áron.
- Üzleti logika, ár, KDS, számlázás érintetlen.

---

## 2) AI képgenerálás kiterjesztése

### Jelenlegi állapot

`generate-food-image` edge function létezik (Gemini 2.5 Flash Image), de UI-ban csak:
- `MenuItemManagement` (Mesterétel-könyvtár batch generátor — `AIBatchImageGenerator`).

### Hiányzó helyek

| Hely | Komponens | Mi kerül oda |
|---|---|---|
| Egyedi ételszerkesztés | `MenuItemEditDialog.tsx` | "AI kép generálása" gomb a kép mező mellé |
| Ideiglenes étel létrehozása | `TemporaryItemCreator.tsx` | Ugyanaz a gomb |
| Ideiglenes ételek könyvtára | `TemporaryItemsLibrary.tsx` | Gomb a kép nélküli elemekhez |
| Galéria felöltés (Ételek) | `GalleryManagement.tsx` | "AI generálás az étel nevével" opció |

### Implementáció

- Új közös komponens: `src/components/admin/AIGenerateImageButton.tsx`
  - Props: `itemName`, `onGenerated(url)`, opcionális `description`
  - Hívja a meglévő `generate-food-image` edge functiont
  - Loading állapot, toast visszajelzés, hiba kezelés (429/402)
- Beillesztjük a fenti 4 komponensbe a meglévő képfelöltő mezők mellé, "VAGY AI-val" módban.
- Galériánál opcionális mező: a felhasználó beír egy ételnevet, és AI generál képet hozzá.

### Stílus

A meglévő gomb stílusát (`Sparkles` ikon, `bg-gradient-to-r from-primary`) követjük az `AIBatchImageGenerator`-ból, hogy konzisztens legyen.

---

## Mit nem érintünk

- Backend / DB séma változás nincs.
- A `generate-food-image` edge function nem módosul.
- A meglévő rendelésfeldolgozás, KDS, hírlevél, számla logika érintetlen.

## QA

- Mobil + desktop nézet ellenőrzés (402px breakpoint).
- Menü blokk + egyedi rendelés egyszerre megjelenik, kosárba mindkettő külön kerül.
- AI gomb működik mind a 4 helyen, generált kép mentődik a megfelelő `image_url` mezőbe.
