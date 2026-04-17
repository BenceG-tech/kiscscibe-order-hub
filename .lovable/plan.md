

# Közös dokumentumtár — "Kiscsibe Drive" admin szekció

## Cél

Egy beépített dokumentumtár az admin felületen belül, ahol a tulaj és az asszisztens (és bármely admin/staff felhasználó) közösen feltölthetnek, rendszerezhetnek és megoszthatnak fájlokat — képeket, PDF-eket, számlákat, szerződéseket, recepteket, bármit. Nem kell külön Google Drive.

## Funkciók (felhasználóbarát megközelítés)

### 1. Fájlfeltöltés
- **Drag & drop** zóna a felület tetején — egyszerűen oda lehet húzni a fájlokat
- **Több fájl egyszerre** feltölthető
- **Mobil támogatás**: kamera ikon → azonnal fotózhat (számla, termék, beszállítás)
- **Bármilyen formátum**: kép (JPG, PNG, HEIC), PDF, Word, Excel, videó

### 2. Mappák (egyszintű, nem bonyolult)
A tulajdonos létrehozhat **mappákat** (pl. „Számlák 2026", „Receptek", „Engedélyek", „Marketing képek"). Egyetlen szint — nem labirintus.

### 3. Címkék (tagek) színekkel
Minden fájlhoz hozzá lehet adni **színes címkéket** (pl. 🔴 Sürgős, 🟡 Várakozó, 🟢 Elintézve, 🔵 Fontos). A címkéket az admin szabadon létrehozhatja és szerkesztheti.

### 4. Keresés és szűrés
- Fájlnévre keresés (ékezetfüggetlen)
- Szűrés mappa, címke, feltöltő, dátum szerint
- Rendezés: legújabb / név / méret szerint

### 5. Megjelenítés
- **Rács nézet** (képeknél miniatűrökkel) vagy **lista nézet** (asztali számítógépen)
- Képek **lightbox**-ban megnyithatók
- PDF-ek új lapon
- Minden fájlnál látszik: ki töltötte fel, mikor, milyen címkéket kapott

### 6. Megosztás belül
- **Megjegyzés/leírás** mező minden fájlhoz (pl. "Ez a januári rezsi, fizetve")
- **Csillagozás (★)** a kedvencekhez / fontos fájlokhoz
- Letöltés vagy közvetlen link másolás

### 7. Műveletek
- Átnevezés, áthelyezés mappák között, törlés (megerősítéssel)
- Tömeges műveletek (több fájl kijelölése egyszerre)

## Technikai megvalósítás

### Adatbázis
Új tábla: `documents`
- `id`, `name`, `file_url`, `file_size`, `mime_type`
- `folder_id` (opcionális, hivatkozik egy `document_folders` táblára)
- `tags` (text[] tömb a címke nevekhez)
- `description`, `is_starred`
- `uploaded_by` (uuid), `created_at`

Új tábla: `document_folders`
- `id`, `name`, `color`, `created_at`

Új tábla: `document_tags`
- `id`, `name`, `color`, `created_at`

### Tárolás
Új Supabase **storage bucket**: `documents` (privát, csak admin/staff férhet hozzá)

### RLS biztonság
Csak az `is_admin_or_staff()` felhasználók látják, tölthetnek fel, törölhetnek — így a tulaj és az asszisztens egyaránt használhatja.

### Új admin oldal
- `/admin/documents` útvonal
- Új menüpont az admin navigációban (📁 Dokumentumok ikonnal)
- Frissítjük az `AdminLayout.tsx`-et

## Felhasználói folyamat (példa)

1. Asszisztens befotózza az új beszállítói számlát mobiltelefonon
2. Bekerül a „Számlák 2026" mappába, „🔴 Fizetendő" címkével
3. Tulaj megnyitja, megnézi, fizet
4. Tulaj átcímkézi „🟢 Elintézve"-re és hozzáír egy megjegyzést („Átutalva 04.18-án")
5. Mindkettő látja a változást valós időben

## Asszisztens admin hozzáférés

A jelenlegi rendszerben már léteznek `admin` és `staff` szerepkörök. Két lehetőség:
- **A**: Az asszisztens kap teljes **admin** hozzáférést (mindent lát, mindent szerkeszthet)
- **B**: Új korlátozott szerep, ami csak bizonyos szekciókhoz fér hozzá (pl. csak rendelések + dokumentumok)

Az **A opciót** javaslom — egyszerűbb, és a tulaj eldöntheti, kinek ad fiókot. Az asszisztensnek ugyanúgy kell egy admin email + jelszó, amit a tulaj hoz létre.

## Érintett fájlok / új fájlok

| Fájl | Változás |
|---|---|
| Migration SQL | `documents`, `document_folders`, `document_tags` táblák + RLS + `documents` storage bucket |
| `src/pages/admin/Documents.tsx` | **ÚJ** — fő dokumentumtár oldal |
| `src/components/admin/documents/DocumentUploader.tsx` | **ÚJ** — drag & drop + fotó/fájl gomb |
| `src/components/admin/documents/DocumentGrid.tsx` | **ÚJ** — rács/lista nézet |
| `src/components/admin/documents/DocumentCard.tsx` | **ÚJ** — egy fájl megjelenítése |
| `src/components/admin/documents/FolderSidebar.tsx` | **ÚJ** — mappák + címke szűrők |
| `src/components/admin/documents/TagManager.tsx` | **ÚJ** — címkék létrehozása/szerkesztése |
| `src/hooks/useDocuments.ts` | **ÚJ** — adatlekérés és műveletek |
| `src/App.tsx` | Új route: `/admin/documents` |
| `src/pages/admin/AdminLayout.tsx` | Új menüpont: „Dokumentumok" 📁 ikon |

## Megvalósítási sorrend

1. Adatbázis migráció (táblák + storage bucket + RLS)
2. `useDocuments.ts` hook
3. Fő oldal és aloldalak (uploader, grid, sidebar)
4. Navigáció és route hozzáadása
5. Tesztelés: feltöltés, mappa, címke, keresés, törlés

## Kérdés a folytatás előtt

Mielőtt elkezdjük, egy kérdést szeretnék pontosítani — nézd meg lent.

