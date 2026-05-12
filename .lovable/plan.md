## Cél

A `MenuItemEditDialog` jelenlegi duplikáció-figyelmeztetése csak egy szöveges ⚠️ üzenet ("Kattints újra ha mégis folytatnád"). Helyette: ha egy vagy több azonos nevű (ékezet/kisbetű független) étel már létezik, dobjon fel egy **összehasonlító dialógust**, amiben az admin oldalra látja a meglévő(eke)t és az újat, és egy kattintással eldöntheti, melyiket tartsa meg.

## Új komponens — `DuplicateResolverDialog`

Helye: `src/components/admin/DuplicateResolverDialog.tsx`

**Megjelenés (mobilon egymás alatt, deszkopon 2 oszlop):**
- Bal kártya: **Meglévő étel** (ha több is van, kis tabok közöttük: "1 · Rántott sajt", "2 · Rántott Sajt").
- Jobb kártya: **Új / szerkesztett változat** (a form jelenlegi állapota).

Mindkét kártya tartalma:
- Kép thumbnail (vagy "Nincs kép" placeholder)
- Név
- Kategória neve
- Ár (Ft)
- Leírás (rövidítve)
- Allergének badge-ek
- Státusz: aktív / inaktív, mindig elérhető, ideiglenes
- Eltérő mezők kiemelve (sárga háttér / `bg-primary/10`), hogy az admin azonnal lássa a különbséget

**Akciógombok (alul):**
1. **„Meglévő megtartása"** — bezár, mentés nélkül. (Ez az alapértelmezett biztonságos opció.)
2. **„Meglévő felülírása az újjal"** — a kiválasztott meglévő rekordot frissíti az új mezőkkel (ha új-rekord létrehozása volt, akkor `update` a meglévő id-jén; ha szerkesztés volt, akkor a meglévő törlődik és az aktuális marad). Ha a meglévő hivatkozott (van `daily_offer_items` vagy `order_items` rá), a törlés helyett `is_active = false` jelölés és toast-figyelmeztetés.
3. **„Mindkettő megtartása"** — figyelmen kívül hagyja a duplikációt, simán menti az újat.
4. **„Mégse"** — bezár, marad a szerkesztő.

## Integráció a `MenuItemEditDialog`-ba

A jelenlegi `handleSave` logikát átírjuk:

```text
1. Név validáció (változatlan)
2. ilike lekérdezés → ha van találat:
     - setDuplicates(existing)  // teljes mezőkkel: id, name, category_id, price_huf, image_url, description, allergens, is_active, is_temporary, is_always_available
     - setShowDuplicateResolver(true)
     - return
3. Egyébként: saveMutation.mutate()
```

A `DuplicateResolverDialog` callbackjei:
- `onKeepExisting()` → resolver bezár, szerkesztő nyitva marad (a felhasználó vagy módosítja a nevet, vagy bezárja).
- `onReplaceExisting(existingId)` → meglévő törlése (vagy archiválása, ha hivatkozott) + saveMutation.
- `onKeepBoth()` → saveMutation azonnal.

A korábbi `duplicateWarning` state és a "destructive" gomb-variáns törlődik — a resolver dialog veszi át a szerepet.

### Hivatkozott rekord kezelése

A „felülírás" akciónál először lekérdezzük:
```text
exists in daily_offer_items where item_id = X  → bool
exists in order_items where item_id = X        → bool
```
Ha bármelyik létezik:
- A meglévő rekordot **nem töröljük**, hanem `is_active = false`-ra állítjuk és átnevezzük (`name + " (régi)"`).
- Toast: „A régi étel hivatkozva van rendelésekben/ajánlatokban — inaktívvá tettük az adatok megőrzése érdekében."

Ha sehol nincs hivatkozva → DELETE a régire, INSERT az újra (ha új-rekord létrehozás), vagy UPDATE új mezőkkel és DELETE a duplikátumra (ha szerkesztés módban).

## Érintett fájlok

- **Új**: `src/components/admin/DuplicateResolverDialog.tsx` — összehasonlító dialógus, kategória név lookup-pal.
- **Módosul**: `src/components/admin/MenuItemEditDialog.tsx` — `handleSave` átírása, `duplicateWarning` state lecserélése `duplicates` + `showResolver`-re; resolver render az `<Dialog>` mellé/után.

## Mit nem érint a változás

- A `MasterMenuImport` (Excel import) saját duplikátum-szűrése változatlan.
- A `TemporaryItemCreator` (ideiglenes ételek) most nem ellenőriz duplikátumot — opcionális kiterjesztés, jelen körből kihagyva.
- A backend / adatbázis séma változatlan — pure frontend változás.
