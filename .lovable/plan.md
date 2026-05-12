# Probléma

1. **Az „Étel szerkesztése" dialógusban (és több admin felületen) a kis képre még mindig nem lehet rákattintani**, hogy nagyban megnézd. A `MenuItemEditDialog`, `QuickImageUpload`, `MultiImageUpload`, `WeeklyGridCell`, `DailyOfferImageGenerator` mind sima `<img>`-et használ, lightbox nélkül.
2. **A Fix tételek oldalon** a kategóriák egy hosszú vízszintes scrollos tab-sávban vannak (Levesek, Tészta ételek, Köretek, Főzelékek, Főzelék feltét, Rántott ételek, Desszertek, Csirkés-zöldséges, …). Ennyi kategóriánál a horizontális görgetés sem desktopon, sem mobilon nem felhasználóbarát.

# Megoldás

## 1) „Nagyítható kép" mindenhol — egységes megoldás

Minden helyen ugyanazt a **`ImagePreviewLightbox`** komponenst használjuk (már létezik). Bevezetünk egy apró, egyszerű wrapper komponenst, hogy ne ismételjük magunkat:

- **Új:** `src/components/admin/ZoomableImage.tsx` — egy `<button>` + `<img>` + beépített `ImagePreviewLightbox`. Props: `src, alt, className, thumbClassName`. A hover-en megjelenik egy `Maximize2` ikon overlay (mint az `ImageUpload`-ban).
- A jelenlegi `<img>` használatokat lecseréljük `ZoomableImage`-re az alábbi fájlokban:
  - `src/components/admin/MenuItemEditDialog.tsx` (a 334. sor körüli preview kép — **ez a csatolt képen látható konkrét eset**)
  - `src/components/admin/QuickImageUpload.tsx` (147. sor)
  - `src/components/admin/MultiImageUpload.tsx` (197. sor)
  - `src/components/admin/WeeklyGridCell.tsx` (109. és 230. sor — napi rácson látható thumbnail-ek)
  - `src/components/admin/DailyOfferImageGenerator.tsx` (750., 889., 940. sor — a generált FB képek és előnézetek)

A meglévő törlés/X gombok és funkciók változatlanok maradnak, csak a thumbnail kattinthatóvá válik (a delete `<button>` `onClick` `e.stopPropagation()`-nel marad).

## 2) Fix tételek kategória-navigáció — új layout

A jelenlegi `Tabs` + horizontal scroll helyett **kétféle nézet, breakpoint alapján**:

### Desktop (md ≥ 768px) — bal oldali sticky kategória-lista
```text
┌─────────────────┬───────────────────────────────────────┐
│  KATEGÓRIÁK     │  Rántott ételek           [Képes ⊙]   │
│  ──────────     │  3 tétel    [+ Új]  [Meglévő]         │
│  ▸ Levesek   0  │  ─────────────────────────────────    │
│  ▸ Tészta    0  │  ⋮⋮  🍗  Rántott csirkemell  2150 Ft │
│  ▸ Köretek   0  │  ⋮⋮  🍖  Rántott karaj      2150 Ft  │
│  ▸ Főzelék   0  │  ⋮⋮  🧀  Rántott sajt       2150 Ft  │
│  ● Rántott   3  │                                       │
│  ▸ Desszert  0  │                                       │
│  ▸ Csirkés…  0  │                                       │
└─────────────────┴───────────────────────────────────────┘
```
- Bal oldal: **`w-56` sticky vertikális lista** (sticky `top-32`), saját scrollbar ha sok a kategória.
- Minden sor: kategória név + jobb oldalt count badge.
- Aktív kategória: `bg-primary/10 border-l-4 border-primary text-primary` kiemelés.
- Üres kategóriák halványabban (`text-muted-foreground`) — látszik melyikben van valódi tartalom.
- Opcionális mini „search" input a lista tetején, ha 8+ kategória van (gyors szűrés név alapján). Csak az ikon-input megy be, kis YAGNI-toleranciával — egy `Input` `placeholder="Keresés…"`.

### Mobil (< md) — sima `Select` dropdown
- A bal sávot egy szép, full-width **`Select`** váltja ki: pl. „Rántott ételek (3)".
- Egy kattintás → natív-szerű dropdown az összes kategóriával + count-tal.
- Nincs többé vízszintes görgetés. Az aktív kategória neve és a count azonnal látszik.
- A kategória-fejléc (cím + Képes toggle + Új/Meglévő gombok) marad a tartalom tetején, kompakt elrendezésben.

### Megtartjuk a `Tabs` állapotkezelést
A `Tabs` Radix komponens a háttérben marad (állapot + content váltás), csak a `TabsList` UI-t cseréljük le a fenti két nézetre (`hidden md:block` + `md:hidden`). Az `activeTab` state és minden meglévő logika változatlan.

# Érintett fájlok

- **Új:** `src/components/admin/ZoomableImage.tsx`
- `src/components/admin/MenuItemEditDialog.tsx` (1 csere)
- `src/components/admin/QuickImageUpload.tsx` (1 csere)
- `src/components/admin/MultiImageUpload.tsx` (1 csere)
- `src/components/admin/WeeklyGridCell.tsx` (2 csere)
- `src/components/admin/DailyOfferImageGenerator.tsx` (3 csere)
- `src/pages/admin/FixItems.tsx` — a `TabsList` blokk (kb. 408–439 sor) cseréje a fenti split layoutra; a `TabsContent` rész marad. A `Card` belső header (cím + Képes toggle + gombok) és a sortable lista szintén marad.

# Nem változik

- Adatlekérdezések, mutációk, RLS, üzleti logika, képgeneráló edge function.
- A drag-and-drop sorrendezés, a Képes/Lista toggle, az „Új tétel" / „Meglévő hozzáadása" funkciók viselkedése.
- Az `ImagePreviewLightbox` komponens API-ja.
