## Cél

A "fix tételek" (állandó ételek, italok, savanyúságok stb.) kezelése külön, dedikált admin felületre kerüljön, ahol könnyen átlátható, drag-and-drop módon sorrendezhető, és kategóriánként beállítható, hogy a vendégoldalon képpel vagy kép nélkül (tisztán szöveges listaként) jelenjenek meg.

## Mit építünk

### 1) Új admin tab: "Fix tételek"
- Az admin menüben új menüpont (`/admin/fix-items`) a meglévő "Étlap kezelés" mellé.
- Csak az `is_always_available = true` tételek listája — kategóriákra bontva (Italok, Savanyúság, Desszert stb.).
- Kategóriánként összecsukható szekció, fejlécben:
  - kategória név + tételszám
  - **"Megjelenítés képpel" kapcsoló** (per kategória)
  - **"Új tétel"** gomb (előre kitöltött kategóriával, `is_always_available=true`)
- Tételsorok kompakt formában: drag-fogantyú, mini kép (vagy csak név ha nincs kép), név, ár, allergének badge, gyors gombok (szerkeszt, aktív/inaktív, töröl).

### 2) Drag-and-drop sorrendezés
- `@dnd-kit/core` + `@dnd-kit/sortable` (már használjuk a projektben galériánál — ha nem, telepítjük).
- Mobilon fogantyú ikon hosszú nyomásra/megfogásra húzható.
- Sorrend mentése azonnali (drop után), optimistic update + toast.

### 3) Kategória-szintű "képes / lista" beállítás
- A vendégoldali `AlwaysAvailableSection` kategóriánként vagy képes kártyaként, vagy egyszerű felsorolásként rendereli a tételeket.
- Lista mód: nincs logo placeholder, nincs kép — csak név · rövid leírás · ár · "Kosárba" gomb, vékony sorokkal.

### 4) Beállítások mentése
- Új `settings` kulcs: `always_available_display` (JSON), pl. `{ "<categoryId>": { "showImages": false } }`.
- Új mező `menu_items` táblán: `display_order INTEGER` (sorrendezéshez, kategórián belül).

## Vendégoldali változás

A `AlwaysAvailableSection.tsx` lekéri a beállítást és a `display_order` szerint rendez. Lista módnál a kártyás grid helyett egyszerű, sűrűn szedett lista jelenik meg (logó/placeholder nélkül).

## Technikai részletek

**Adatbázis migráció:**
- `ALTER TABLE menu_items ADD COLUMN display_order INTEGER DEFAULT 0;`
- Index `(category_id, display_order)`-re.
- Initial backfill: `display_order = row_number() OVER (PARTITION BY category_id ORDER BY name)`.
- `settings` táblába új sor `key='always_available_display'` (RLS már megengedő publikus olvasásra → új policy `key = 'always_available_display'`-re).

**Frontend fájlok:**
- ÚJ: `src/pages/admin/FixItems.tsx` — fő oldal.
- ÚJ: `src/components/admin/FixItemRow.tsx` — sortable sor.
- ÚJ: `src/components/admin/FixItemCategoryBlock.tsx` — kategória blokk + kapcsoló.
- MÓD: `src/pages/admin/AdminLayout.tsx` — új nav link.
- MÓD: `src/App.tsx` — új route.
- MÓD: `src/components/sections/AlwaysAvailableSection.tsx` — display setting + display_order alkalmazása, lista mód renderelés.
- MÓD: `src/hooks/useRestaurantSettings.ts` (vagy új `useAlwaysAvailableDisplay`) — beállítás betöltése.

**Megmarad:** Az "Étlap kezelés" oldal érintetlen, ott is látszanak a fix tételek (a "📌 Fix tételek" szűrő marad), de a kényelmes kezelés az új tabon.

## Nyitott kérdés (építés közben tisztázható)

A kép/lista kapcsoló legyen-e **globális** (egy kapcsoló az egész "Mindig elérhető" szekcióra) vagy **kategóriánként** (italok lista, desszert kép)? Tervben kategóriánként van — ez rugalmasabb, és ha mindig ugyanazt akarják, akkor is két kattintás az egész.