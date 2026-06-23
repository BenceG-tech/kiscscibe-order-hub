## Problémák

1. **Túl nagy helyet foglal** a sáv, és mobilon a hosszú leírás még mindig nehezen olvasható egyben.
2. **A "Megtekintve" véglegesen eltüntette** egy bejegyzést — nincs visszavonás, és nincs olyan hely, ahol később vissza lehetne nézni az újításokat.

> Megjegyzés: a "Megtekintve" eddig is csak az adott eszközön (böngészőben) rejtette el — a többi admin saját gépén továbbra is látja. A probléma inkább az, hogy **te** nem tudod visszahozni amit véletlenül kikattintottál.

## Javaslat

### 1) Kompakt, kihajtható sáv
- Alapból **egysoros** "csík": kis ikon + típuscímke + cím + "1/N" + jobbra egy ✕ a teljes elrejtéshez és egy lefelé chevron ("Részletek").
- A leírás csak akkor látszik, ha a felhasználó **rákattint a sávra vagy a chevronra** (kihajtható).
- A "Megtekintve" gomb **csak a kibontott állapotban** látszik — így nem lehet véletlenül kikattintani.
- Magasság becsült alapesetben: ~36 px (jelenleg ~80–110 px).

### 2) "Frissítések" központi nézet — visszanézés és visszavonás
- Az admin fejlécben (a Kijelentkezés mellett) egy kis **harang/szikra ikon** ("Frissítések"), ami egy dialógust nyit.
- A dialógus mutatja a **teljes elmúlt 30 nap** changelogját, kategorizálva (ÚJ / FEJLESZTÉS / JAVÍTÁS), olvasható formátumban.
- Minden tétel mellett "Megtekintve / Visszaállítás" toggle — a véletlen kattintás visszavonható.
- Egy "Mind visszaállítása" gomb is van a dialógus tetején.
- A fejléc ikon piros pötty jelzést kap, ha van új, meg nem nézett bejegyzés.

### 3) Toast a "Megtekintve" után
- Amikor valaki rákattint a "Megtekintve"-re, egy toast jelenik meg "Elrejtve – Visszavonás" gombbal (5 mp), hogy azonnal vissza lehessen csinálni.

## Érintett fájlok

- `src/components/admin/AdminUpdatesBanner.tsx` — kompakt + kihajtható + toast-tal
- `src/components/admin/AdminUpdatesDialog.tsx` *(új)* — teljes lista + visszaállítás
- `src/pages/admin/AdminLayout.tsx` — fejlécben harang/szikra ikon piros pöttyel

## Nincs benne

- Per-user szinkronizálás adatbázisban (a dismiss állapot továbbra is localStorage-ban marad — minden admin saját gépén külön nézi, így másokat nem érint, ha te elrejted).
- A changelog tartalmának módosítása.
