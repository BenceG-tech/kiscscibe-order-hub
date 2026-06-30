## Probléma

A vendégoldal csak a publikált (`is_published=true`) napi ajánlatokat mutatja. Az aktuális hét mind az 5 napja létrehozva, de **piszkozat** állapotban van — ezért nem látszik a fronton. A jelenlegi "Hét publikálása" gomb beleolvad a fejlécbe, és nem hívja fel a figyelmet arra, hogy van mit publikálni.

## Megoldás: feltűnő publikálási sáv + auto-emlékeztető

### 1. Figyelmeztető banner a heti rács tetején (`WeeklyMenuGrid.tsx`)

Ha a megjelenített héten van **bármilyen piszkozat** ajánlat:

- Sárga/amber színű banner sáv a heti fejléc fölött
- Szöveg: „**X nap piszkozatban — a vendégek nem látják!**" (X = piszkozatban lévő napok száma)
- Mellette nagy, elsődleges színű gomb: **„Egész hét publikálása most"**
- Ha minden napra publikálva van: zöld pipa + halvány szöveg „Hét publikálva — a vendégek látják"

### 2. Napi cellák erősebb vizuális jelzése

- Piszkozat napoknál a teljes cella körül szaggatott amber keret (nem csak a kis gomb)
- A „Piszkozat" szöveg helyett: **„⚠ Nem látható"** badge
- Publikált napoknál: **„👁 Látható"** badge zöld háttérrel

### 3. Mentés utáni toast emlékeztető

Amikor menüpontot adunk hozzá / módosítunk egy piszkozat naphoz, a sikeres mentés toast után jelenjen meg egy **second toast „Ne felejtsd el publikálni!"** akció gombbal, ami egy kattintással publikálja az adott napot.

### 4. Súgó szöveg

A heti rács fejlécében egy `InfoTip` ikon rövid magyarázattal: „A piszkozat ajánlatok csak nálad látszanak. A vendégek csak a publikált napokat látják az étlapon."

### 5. Egyszeri javítás most

A jelenlegi 5 darab piszkozat (2026-06-29 – 2026-07-03) **publikálása** — ezt rád bízzuk: az új banner megjelenése után egy kattintás. Nem nyúlok a DB-hez automatikusan, mert lehet hogy szándékos volt a piszkozat.

## Érintett fájlok

- `src/components/admin/WeeklyMenuGrid.tsx` — banner, badge-ek, toast emlékeztető, súgó tooltip
- `src/data/adminChangelog.ts` — bejegyzés a változásról

Nincs DB migráció, nincs backend változás.
