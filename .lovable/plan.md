# Probléma

A `/admin/daily-menu` → "Napi ajánlatok" tab `WeeklyMenuGrid` táblázata 900px+ széles. Desktopon, ha valaki **nem** trackpadet használ, a vízszintes görgetéshez le kell tekerni a lap aljára, hogy elérje a böngésző alján megjelenő scrollbart. Ez nehezíti a péntek oszlop elérését.

# Megoldás

A `WeeklyMenuGrid.tsx` jelenleg egy `ScrollArea`-t használ vízszintes `ScrollBar`-ral a tartalom alatt. Több, egymást kiegészítő apró javítást teszünk, ami egér-felhasználóknak is azonnal kényelmessé teszi a navigációt — minden a komponens prezentációs rétegében marad, üzleti logika nem változik.

## 1) Felül egy "navigációs sáv" a napokhoz (fő megoldás)

A táblázat fölé, a hét-választó alá berakunk egy **sticky** kis sávot:
- Bal/jobb nyíl gombok (oszlopnyi görgetés balra/jobbra).
- 5 nap "chip" (H, K, Sze, Cs, P + dátum), kattintásra az adott oszlop a látható területre görget (`scrollIntoView({ behavior:"smooth", inline:"center" })`).
- Az aktuálisan látható nap chipje kiemelve.
- A sáv `sticky top-…` a admin headert követve, hogy görgetés közben is elérhető legyen.

Így soha nem kell az aljára menni: egy kattintás = ugrás Péntekre.

## 2) Tükrözött vízszintes scrollbar a tetején

Egy vékony, mindig látható horizontal scrollbar a táblázat **fölé**, ami szinkronban van az alsóval (két `div` `onScroll` egymást vezérli). Egér-húzásos görgetésre is alkalmas anélkül, hogy a táblázat aljáig kéne menni.

## 3) Shift + egérgörgő → vízszintes görgetés

A scroll konténerre `onWheel` handler: ha `e.shiftKey` (vagy ha vízszintes mozgás 0 és csak vertikális van, opcionálisan átfordítjuk Shift nélkül is — ezt biztonság kedvéért csak Shift-tel csináljuk, hogy a normál függőleges görgetést ne törjük).

## 4) Apróságok

- A scroll konténerre `tabIndex={0}` + `←`/`→` billentyű = oszloplépés.
- A bal nyíl gomb disabled-re vált, ha már a Hétfő látszik; jobb nyíl, ha a Péntek látszik (egyszerű `scrollLeft`/`scrollWidth` ellenőrzés).

# Érintett fájl

- `src/components/admin/WeeklyMenuGrid.tsx` — kb. 711–851 sor körüli render rész:
  - A `ScrollArea` helyett (vagy köré) sima `div ref` + `overflow-x-auto` konténer, hogy `scrollLeft`-et tudjunk vezérelni.
  - Új kis komponens helyben: `DayJumpBar` (nyilak + chipek + felső scrollbar), nem külön fájlban, hogy a meglévő struktúra ne bomoljon.
  - A `<th>` cellákhoz `data-day-index` attribútum, hogy a chipekből el tudjuk érni őket scrollIntoView-hoz.

# Nem változik

- Adatlekérdezések, mutációk, RLS, üzleti logika, mobil nézet (`WeeklyGridMobile`).
- Színek/tokenek a meglévő semantic tokeneket használják.
