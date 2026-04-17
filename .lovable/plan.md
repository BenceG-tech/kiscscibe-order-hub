

A user kérése 4 részből áll:

1. **FB poszt AI szöveg generátor** → integrálni a meglévő Kép generátor (DailyOfferImageGenerator) tabba, hogy a kép alatt egyből megjelenjen a generált szöveg is
2. **Tab sorrend a Napi ajánlat oldalon**: Excel Import legyen az utolsó, Kapacitás kerüljön előrébb + magyarázat hogy hogy működik
3. **Duplikáció ellenőrzés**: van-e most? jelez-e? felajánlja-e a törlést? — ezt először meg kell vizsgálni a kódban
4. **Fő admin tab sor (AdminLayout)** átláthatóbbá tétele relevancia szerint

Először nézzük meg a releváns fájlokat: DailyOfferImageGenerator (van-e már FB szöveg gen valahol — generate-facebook-post edge function létezik!), DailyMenu admin oldal tab sorrendje, AdminLayout fő nav, és duplikáció logika.

Ezután kérdezek a tab-sorrendről + duplikáció kezeléséről, majd tervet adok.

Megnézem párhuzamosan: DailyMenu page, AdminLayout, DailyOfferImageGenerator, generate-facebook-post function, és a duplikáció logika a useDocuments hookban (verziókezeléssel kapcsolatos) ill. menu_items / daily_offers oldalakon.

---

# Terv — 4 fejlesztés a Napi ajánlat + Admin felületen

## 1. FB poszt AI szöveg generátor a Kép generátor tab-ba

A `generate-facebook-post` edge function már létezik a projektben, de jelenleg külön komponens (`FacebookPostGenerator`) használja. Integrálom a `DailyOfferImageGenerator` komponensbe:

- **Kép generálás után** (vagy mellette egy „Szöveg generálása" gombbal) a kép alatt megjelenik egy szövegdoboz a generált FB poszt szöveggel
- **Funkciók**: 
  - Hangnem választó (Vidám / Profi / Étvágygerjesztő)
  - „Újragenerálás" gomb
  - „Szöveg másolása" gomb (vágólapra)
  - „Kép + szöveg együtt másolása" — egy kattintással megy minden FB-re
  - Szerkeszthető textarea (kézi finomítás)
- **Auto-generálás**: amikor az admin generál egy képet, a háttérben automatikusan generálódik a szöveg is (párhuzamosan), így mire kész a kép, a szöveg is ott van alatta

## 2. Tab sorrend a Napi ajánlat oldalon (`/admin/daily-menu`)

**Jelenlegi sorrend**: Napi ajánlatok | Kapacitás | Excel Import | Hírlevél | Kép generátor | Becslés

**Új sorrend (relevancia szerint)**:
1. **Napi ajánlatok** (napi munka)
2. **Kép generátor** (napi/heti munka — előrébb hozzuk)
3. **Hírlevél** (heti munka)
4. **Becslés** (heti munka)
5. **Kapacitás** (ritka, de fontos — magyarázattal)
6. **Excel Import** (csak fejlesztői/admin használat — utolsó)

## 3. Kapacitás tab — magyarázó panel hozzáadása

A Kapacitás tab tetejére hozzáadok egy összecsukható **„Hogyan működik?"** kártyát:

- Mire való a kapacitás
- Mit jelent a napi limit / kifizetési cutoff
- Mikor érdemes „Blackout napot" hozzáadni (pl. ünnepek)
- Mit lát a vásárló, ha betelt egy nap
- Konkrét példa lépésről lépésre

## 4. Duplikáció kezelés — vizsgálat + javaslat

**Először meg kell vizsgálnom**, mi a jelenlegi állapot — több helyen lehet duplikáció:

| Hely | Kockázat |
|---|---|
| `menu_items` (master étel-könyvtár) | Ugyanaz a név kétszer |
| `daily_offers` egy adott napon | Ugyanaz a leves/főétel kétszer |
| `documents` (Kiscsibe Drive) | Már megoldva — verziózás |
| Ügyfél rendelései | Nem releváns |

**Javasolt megoldás (a vizsgálat után pontosítom)**:
- Master étel-könyvtárban: feltöltés/létrehozás előtt ékezetfüggetlen név-egyezés ellenőrzés → ha van: dialog „Már létezik 'Sült csirke' — Mit szeretnél?" [Megnyitás] [Új létrehozása mégis] [Mégse]
- Napi ajánlatoknál: ugyanaz a tétel ne kerülhessen kétszer ugyanarra a napra (UI szinten szürkítés a már kiválasztott tételeknél)
- Egy új admin eszköz: **„Duplikáció ellenőrző"** a beállításokban, ami felsorolja a hasonló nevű tételeket és felajánlja az egyesítést

## 5. Fő admin navigáció (`AdminLayout`) átláthatóbbá tétele

**Jelenlegi tab sor (10+ elem)**: Irányítópult, Rendelések, Étlap kezelés, Napi ajánlat, Galéria, Jogi oldalak, Rólunk, GYIK, Számlák, Partnerek, Dokumentumok, ...

**Új struktúra — relevancia + csoportosítás szerint**:

**Mindig látható (top nav, napi munka)**:
1. Irányítópult
2. Rendelések
3. Napi ajánlat
4. Étlap kezelés
5. Számlák

**„Több" dropdown menüben (ritka használat)**:
- Galéria
- Dokumentumok
- Partnerek
- Rólunk
- GYIK
- Jogi oldalak
- Beállítások

A „Több" gomb dropdown menüvel nyílik, csoportosított ikonokkal. Mobilon ez már most is így van (horizontális scroll), desktop-on új a dropdown.

## Érintett fájlok

| Fájl | Változás |
|---|---|
| `src/components/admin/DailyOfferImageGenerator.tsx` | FB szöveg gen integrálás kép alá |
| `src/pages/admin/DailyMenu.tsx` | Tab sorrend változtatás |
| Új: `src/components/admin/CapacityHelpPanel.tsx` | Magyarázó kártya |
| `src/components/admin/CapacityManagement.tsx` | Help panel beillesztése a tetejére |
| `src/pages/admin/AdminLayout.tsx` | Fő nav átszervezés + „Több" dropdown |
| Új: `src/components/admin/DuplicateChecker.tsx` | (Vizsgálat után) duplikáció eszköz |
| `src/components/admin/MenuItemManagement.tsx` (vagy hasonló) | Duplikáció figyelmeztetés létrehozáskor |

## Megvalósítási sorrend

1. Megvizsgálom a duplikáció logikát (jelenlegi állapot)
2. AdminLayout fő nav átszervezés (legnagyobb UX javítás)
3. DailyMenu tab sorrend
4. CapacityHelpPanel hozzáadása
5. FB szöveg gen integrálás a Kép generátorba
6. Duplikáció figyelmeztetés (ha kell, a vizsgálat alapján)

