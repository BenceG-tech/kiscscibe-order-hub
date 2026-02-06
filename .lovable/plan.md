
## Mit látok a képen (miért “csúszott el”)
1) **A sticky (fix) bal oszlop nem takarja ki rendesen az alatta lévő oszlopokat**  
   - A fejléc bal cellája (`bg-muted/50`) és a “Napi menü ár” bal cellája (`bg-primary/5`) **átlátszó** (opacity-s Tailwind osztály), ezért a mögötte lévő nap/oszlop feliratok “átütnek” (pl. “Hétfő” és a dátum látszik a “Kategória” alatt).

2) **A kategória-sticky háttér dark módban hibás**  
   - A jelenlegi kód `CATEGORY_COLORS[...].split(' ')[0]`-t használ, ami **csak a light módos** `bg-...` osztályt hagyja meg, a `dark:bg-...` részt eldobja.  
   - Emiatt dark témában a bal oszlop világos (szinte fehér) lesz, és összhatásra “szétcsúszottnak” tűnik.

3) **A három fül (Napi ajánlatok / Kapacitás / Excel Import) “fel van csúszva”**  
   - A `src/components/ui/tabs.tsx` alapból nagyon erősen “dizájnolt” (magasság `h-12 md:h-14`, shadow, aktív skálázás `scale-105`, touch-pan-x stb.).  
   - A `DailyMenuManagement.tsx`-ben most csak ráadás osztályokat adunk hozzá, így **nem cseréljük le** az alap stílust, hanem keveredik → ettől tud vizuálisan elcsúszni / ugrálni.

---

## Cél
- A bal “Kategória” oszlop legyen fix (sticky) és **teljesen nem átlátszó**.
- Dark módban is normálisan nézzen ki (ne legyen világos blokk).
- A fülek legyenek stabilak (ne skálázódjanak / ne legyen ütköző magasság).

---

## Konkrét javítási lépések

### 1) WeeklyMenuGrid: sticky cellák teljesen fedjenek (nincs áttűnés)
**Fájl:** `src/components/admin/WeeklyMenuGrid.tsx`

**Módosítások:**
- Fejléc sor: a `<tr className="bg-muted/50">` maradhat, de a sticky `<th>` legyen **OPAQUE**:
  - `bg-muted/50` → `bg-muted` (vagy `bg-card`)
  - Adjunk hozzá `border-r`-t és nagyobb z-indexet: `z-30`
- Ár sor: a sticky bal `<td>` legyen **OPAQUE**:
  - `bg-primary/5` (átlátszó) helyett `bg-accent` vagy `bg-muted` (ezek tipikusan nem áttetszők)
  - `border-r`, `z-20`

**Miért:** így a bal oszlop tényleg “kitakar”, és nem fog a hét nap felirata átlátszani alatta.

---

### 2) WeeklyMenuGrid: kategória sticky háttér legyen jó dark módban is + ne legyen áttetsző
**Fájl:** `src/components/admin/WeeklyMenuGrid.tsx`

**Jelenlegi gond:**
```ts
const stickyBgColor = CATEGORY_COLORS[category.name]
  ? CATEGORY_COLORS[category.name].split(' ')[0]  // eldobja a dark: részt
  : 'bg_background';
```

**Javítás elve:**
- A sticky cellára **mindkét** (light + dark) class menjen rá.
- A dark oldalon az `/30`, `/40` áttetszőséget vegyük le a sticky verzióban, hogy ne üssön át semmi.

**Megoldás:**
- A `stickyBgColor` számításnál:
  - használjuk a teljes stringet (ne split)
  - és alakítsuk “opaque”-ra: `dark:bg-.../30` → `dark:bg-...` (csak a sticky cellán)
- Példa logika (implementációban egyszerű regex csere):
  - `CATEGORY_COLORS[name].replace(/\/\d{1,3}(?=$|\s)/g, "")`

**Plusz:**
- A sticky kategória cellák kapjanak `border-r`-t + `z-10` oké, de a fejléc legyen felette `z-30`.

---

### 3) WeeklyMenuGrid: border-collapse okozta “furcsa” elcsúszás (opcionális, ha még mindig glitch-el)
**Fájl:** `src/components/admin/WeeklyMenuGrid.tsx`

Ha a sticky + border vizuálisan még mindig “szétcsúszik” bizonyos böngészőkben:
- `table`:
  - `border-collapse` helyett `border-separate border-spacing-0`
Ez sokszor stabilabb sticky oszlopnál.

---

### 4) Admin oldali belső Tabs (Napi ajánlatok/Kapacitás/Excel Import) stabilizálása
**Fájl:** `src/pages/admin/DailyMenuManagement.tsx`

**Ok:** a `TabsList` és `TabsTrigger` alap stílusai a `src/components/ui/tabs.tsx`-ből ráégnek (h-12, md:h-14, shadow, active:scale-105). A mostani admin-os className nem “kikapcsolja”, hanem keveri.

**Javítás:**
- Admin oldalon használjunk **Tailwind `!` (important)** felülírásokat, hogy ténylegesen neutralizáljuk az alapot:
  - TabsList: `!h-10 md:!h-10 !rounded-lg !p-1 !shadow-none !border ...`
  - TabsTrigger: `data-[state=active]:!scale-100 data-[state=active]:!shadow-none ...`
- Ezzel nem kell globálisan átírni a Tabs komponenst (más oldalak designját nem borítjuk).

---

### 5) Felső admin navigáció (Rendelések/Étlap kezelés/Napi ajánlat/Galéria) “felcsúszás” (ha még mindig zavaró)
**Fájl:** `src/pages/admin/AdminLayout.tsx`

**Lehetséges ok:** az aktív elemnél van extra `border-b-2`, a nem aktívnál nincs → magasság / baseline eltérés.

**Javítás:**
- Minden nav link kapjon alapból `border-b-2 border-transparent`
- Aktív állapotban csak a border színe változzon `border-primary`-ra
→ így nincs layout-ugrás, minden elem azonos magasságú.

---

## Ellenőrző lista (amit végigtesztelek implement után)
1) Dark módban: vízszintes scroll jobbra (csütörtök/péntek), **a bal “Kategória” oszlop nem átlátszó**, nem üt át “Hétfő”/dátum.
2) “Napi menü ár” sor bal cellája nem átlátszó, és nem látszik alatta input.
3) A belső 3 fül nem skálázódik, nem “ugrál”, nem csúszik el desktopon (md breakpointnál sem).
4) Admin felső nav aktív elem nem lóg le / nem ugrik magasságban.

---

## Érintett fájlok
- `src/components/admin/WeeklyMenuGrid.tsx` (sticky háttér + z-index + border + opcionális border-separate)
- `src/pages/admin/DailyMenuManagement.tsx` (TabsList/TabsTrigger important override-ok)
- `src/pages/admin/AdminLayout.tsx` (felső admin nav fix border-kezelés, ha szükséges)

---

## Kockázat minimalizálás
- Funkciót nem változtatunk (csak CSS/Tailwind class).
- A Tabs globális komponensét nem írjuk át (csak ezen az oldalon “! override”), így más oldalak tab dizájnja nem borul.
