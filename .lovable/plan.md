

# Dokumentumtár ("Kiscsibe Drive") — Részletes Terv

## A. Adatbázis (migráció)

### Új táblák

**`document_folders`** — mappák (egyszintű)
- `id`, `name`, `color` (text, alapértelmezett `#F6C22D`), `created_by`, `created_at`

**`document_tags`** — színes címkék
- `id`, `name` (UNIQUE), `color`, `created_at`

**`documents`** — fájlok meta adatai
- `id`, `name` (megjelenített név), `original_filename`
- `file_path` (storage path), `file_size`, `mime_type`
- `folder_id` (nullable → "Nincs mappa"), `tags` (text[])
- `description`, `is_starred` (boolean)
- `version` (int, alapértelmezett 1)
- `parent_document_id` (nullable, önreferencia → verziókhoz)
- `is_latest_version` (boolean, alapértelmezett true)
- `uploaded_by` (uuid → profiles.user_id), `uploaded_by_name` (snapshot)
- `created_at`, `updated_at`

### Verziókövetés logikája
Új feltöltéskor: ha létezik már `documents` rekord ugyanazzal a `name` + `folder_id` + `is_latest_version=true` kombinációval:
1. A régi rekordnál `is_latest_version = false`
2. Új rekord beszúrása: `version = old.version + 1`, `parent_document_id = old.parent_document_id ?? old.id`
3. A grid alapból csak `is_latest_version=true` rekordokat mutat
4. Egy fájlnál látható lesz egy "Verziók (3)" gomb → előzmények listája

### Storage bucket
Új `documents` bucket (privát). RLS a `storage.objects`-en: csak `is_admin_or_staff()` férhet hozzá (SELECT/INSERT/UPDATE/DELETE).

### RLS a táblákon
Minden műveletet `is_admin_or_staff(auth.uid())` enged — így a tulaj és az asszisztens (mindkettő admin) használhatja.

### Aktivitás napló (alap)
Egy `document_activity` tábla: `document_id`, `action` (uploaded/renamed/moved/tagged/deleted/restored), `user_id`, `user_name`, `details` (jsonb), `created_at`. Egyelőre csak rögzítjük, nem mutatjuk UI-on (későbbi fejlesztés).

## B. Frontend komponensek

### Új fájlok
- `src/pages/admin/Documents.tsx` — fő oldal, sidebar + grid layout
- `src/components/admin/documents/DocumentUploader.tsx` — drag & drop + fájl/kamera gomb, progress bar
- `src/components/admin/documents/DocumentGrid.tsx` — rács/lista nézet kapcsoló
- `src/components/admin/documents/DocumentCard.tsx` — egy fájl: kép thumbnail vagy mime ikon, név, méret, feltöltő, címkék, csillag, ⋮ menü
- `src/components/admin/documents/DocumentDetailDialog.tsx` — kattintásra: nagy nézet, leírás szerk., címkék, verzió-történet, letöltés
- `src/components/admin/documents/FolderSidebar.tsx` — mappa lista, "Új mappa" gomb, gyors szűrők (Csillagos, Legutóbbi, Az enyém)
- `src/components/admin/documents/TagManager.tsx` — címkék létrehozása/törlése színpalettával
- `src/components/admin/documents/VersionHistory.tsx` — egy fájl verzióinak listája (ki, mikor, méret)
- `src/hooks/useDocuments.ts` — React Query alapú adathívások és mutációk

### Útvonal és navigáció
- `src/App.tsx` — új route: `/admin/documents` (`ProtectedRoute requireAdmin`-nel, mert csak admin/staff férhet hozzá → most A opció: csak admin)
- `src/pages/admin/AdminLayout.tsx` — új menüpont: **„Dokumentumok"** `FolderOpen` ikonnal a Számlák után

## C. Felhasználói folyamatok

1. **Feltöltés**: drag & drop bárhova az oldalon → progress bar minden fájlnál → automatikus „Cím" generálás a fájlnévből → mehet a kiválasztott mappába
2. **Mobilról fotózás**: kamera ikon a mobil view-ban → azonnal felmegy az aktuális mappába
3. **Verziókezelés**: ha „Beszallitoi_szamla.pdf" feltöltődik egy mappába ahol már van ilyen → automatikusan v2-ként mentődik. A grid-ben csak a v2 látszik, de ⋮ menüből → „Verziók" → v1 letölthető
4. **Címkézés**: kattints a kártyára → tagek hozzáadása dropdown-ból, vagy gyorsan a kártya alján
5. **Keresés**: felül egy kereső input → ékezetfüggetlen, név + leírás + címke alapján

## D. További egyszerűsítési ötletek (amire még nem gondoltunk)

Az MVP után/közben javasolt apró extrák, amik nagyon megkönnyítik a használatot:

1. **Gyors-kategorizálás feltöltéskor**: drag & drop közben a dialog megkérdezi: melyik mappa + címkék (nem kell utólag kattintgatni)
2. **Tömeges műveletek**: shift-klikk → több fájl kijelölése → áthelyezés/címkézés/törlés egyben
3. **„Számla" gyors-flow**: jobb felső sarokban egy „📄 Új számla" nagy gomb → előre kitöltött „Számlák [év]" mappa + „🔴 Fizetendő" címke. Egy kattintással kategorizálva
4. **Automatikus mappa-javaslat fájlnév alapján**: ha a fájlnév tartalmazza pl. „szamla", „invoice" → felajánlja a Számlák mappát
5. **PDF előnézet a kártyán**: első oldal thumbnail (mint a képeknél)
6. **„Gyorsbillentyű" kereséshez**: `/` megnyomására fókusz a keresőre
7. **Mobil-optimalizált nézet**: alapból kompakt lista a mobilon (nem rács), nagy érintés-gombok
8. **Jobb klikk menü**: gyors átnevezés/törlés/letöltés/másol-link
9. **„Megnyitás új lapon" minden fájlnál** — gyors PDF/kép nézegetés
10. **Storage használati indikátor**: a sidebar alján „Felhasznált tárhely: 124 MB" — látható meddig mehet

Ezek közül **az 1, 2, 3, 5, 7 pontot az első verzióban beépítjük**, a többit későbbi iterációként hagyjuk (hogy ne legyen túl bonyolult elsőre).

## E. Hozzáférés (A opció)

Csak `is_admin_or_staff()` férhet hozzá. Mivel jelenleg csak Te vagy admin, a tulaj és az asszisztens később egyszerűen kapnak admin szerepet (a `/admin/users` oldalon vagy SQL-lel, ahogy szoktad). Bármikor amikor megadják az emailt, csak hozzáadod őket — nincs külön szerepkör beállítás a dokumentumtárhoz.

## F. Megvalósítási sorrend

1. **Migráció** — táblák + storage bucket + RLS + indexek
2. **`useDocuments.ts` hook** — adatlekérés/mutációk
3. **Fő oldal + sidebar + uploader** (drag & drop, verzió-logika)
4. **Grid + Card + Detail dialog** (címkék, csillag, leírás, verzió-történet)
5. **Tag Manager + Folder Manager**
6. **Navigáció hozzáadása** (`AdminLayout` + `App.tsx` route)
7. **Tesztelés**: feltöltés, verziózás, mappa, címke, keresés, törlés, mobil

## G. Érintett fájlok

| Fájl | Változás |
|---|---|
| Migration | `document_folders`, `document_tags`, `documents`, `document_activity` táblák + `documents` bucket + RLS |
| `src/pages/admin/Documents.tsx` | **ÚJ** — fő oldal |
| `src/components/admin/documents/*` | **ÚJ** — 7 komponens |
| `src/hooks/useDocuments.ts` | **ÚJ** — hook |
| `src/App.tsx` | Új route |
| `src/pages/admin/AdminLayout.tsx` | Új menüpont |

