

# Terv — Dokumentumtár felhasználóbarátabbá tétele + „Mi változott?” működésének tisztázása

## 1. Dokumentumkártyák 3 pontos menüjének kibővítése

A dokumentumkártyák jobb felső / név melletti **3 pontos menüje** most csak alap műveleteket tud. Kibővítem úgy, hogy innen lehessen gyorsan rendezni a fájlokat, ne kelljen mindig megnyitni a részletező ablakot.

Új menüpontok:

```text
Megnyitás
Letöltés
Részletek szerkesztése

Mappa
  Nincs mappa
  Szerződések
  Számlák
  NAV / hivatalos
  ...

Címkék
  + Sürgős
  + Fizetendő
  ✓ Könyvelőnek
  ...

Csillagozás / Csillag levétele
Verziók
Törlés
```

### Mit tud majd?

- **Mappához rendelés közvetlenül a 3 pontból**
- **Címke hozzáadása / levétele közvetlenül a 3 pontból**
- **Csillagozás szöveges menüpontként is**, nem csak kis ikonként
- **Részletek szerkesztése** menüpont, ami megnyitja a mostani szerkesztő dialogot
- A tag-ek színei a menüben is látszanak kis pöttyként

Ez főleg az adminnak / asszisztensnek lesz gyorsabb, mert nem kell minden dokumentumot külön megnyitni csak azért, hogy átrakja mappába vagy címkézze.

---

## 2. Dokumentumkártyák információgazdagabbá tétele

A kártyákon jobban látszódjon, hogy mi micsoda.

Kiegészítések:

- mappa neve kis badge-ként, ha van mappában
- tag-ek színesebben és érthetőbben
- feltöltő + dátum rövidebb, olvashatóbb formában
- fájltípus jelölés:
  - kép
  - PDF
  - Word / Excel
  - egyéb fájl
- verzió badge marad
- „csillagos” dokumentumok vizuálisan kicsit jobban kiemelve

Példa:

```text
[ kép / PDF előnézet ]

Szerződés_2026.pdf       ⋮
📁 Szerződések
#Fizetendő  #Könyvelőnek
PDF · 1.4 MB · v2
iroda@... · ápr. 22.
```

---

## 3. Feltöltő rész átalakítása: mappa + tag választás feltöltés előtt

A feltöltő doboz most egyszerű, de nem irányítja eléggé a felhasználót.

Új feltöltési élmény:

```text
Feltöltés dokumentumtárba

Mappa: [Nincs mappa / Számlák / Szerződések / ...]
Címkék: [Fizetendő] [Sürgős] [Könyvelőnek]

[ Húzd ide a fájlokat ]
[ Fájl választás ] [ Fotózás ]
```

### Működés

- Ha bal oldalt egy mappa van kiválasztva, azt előtölti.
- Ha tag filter aktív, azt is felajánlja alapértelmezett címkének.
- Feltöltés előtt lehessen kiválasztani:
  - mappát
  - egy vagy több címkét
- Feltöltés után a fájl már rögtön rendezve kerül be.

Ez különösen hasznos számláknál, szerződéseknél, NAV dokumentumoknál.

---

## 4. Gyors szerkesztő dialog finomítása

A meglévő dokumentum részletező ablakot megtartom, de használhatóbbá teszem.

Bővítések:

- mappa választó jobban kiemelve
- címkék mellett „Új címke” gyors gomb
- „Mentés” gombnál loading állapot
- sikeres mentés után toast:
  - „Dokumentum frissítve”
- meta adatok rendezettebb blokkokban:
  - fájl adatok
  - feltöltési adatok
  - verzió adatok

Nem alakítom át az adatlogikát, csak az élményt javítom.

---

## 5. Tömeges műveletek bővítése

A kijelölt dokumentumoknál most van:

- áthelyezés mappába
- törlés

Ezt kibővítem:

```text
3 kiválasztva
[ Áthelyezés... ]
[ Címke hozzáadása... ]
[ Címke eltávolítása... ]
[ Csillagozás ]
[ Törlés ]
```

Így egyszerre több fájl rendezhető.

---

## 6. Oldalsáv javítása

A bal oldali Dokumentumok oldalsávban most vannak mappák és címkék. Ezt átláthatóbbá teszem:

- aktív mappa / tag erősebb kijelölése
- mappák mellett dokumentumszám, ha könnyen megoldható meglévő lekérdezésből
- „Új mappa” és „Új címke” gombok szövegesebbek legyenek, ne csak kis plusz ikon
- címke-kezelőben lehessen látni a színeket és példákat:
  - Sürgős
  - Fizetendő
  - Könyvelőnek
  - Szerződés
  - NAV

Adatbázis-módosítás ehhez várhatóan nem kell, mert a mappa, címke és szín rendszer már létezik.

---

## 7. Rendezés és nézet opciók

A dokumentumtár tetejére bekerül egy egyszerűbb vezérlősor:

```text
Keresés...
Rendezés: [Legújabb elöl] [Név szerint] [Méret szerint]
Nézet: [Kártya] [Lista]
```

Első körben:

- kártya nézet marad alapértelmezett
- lista nézet opcionálisan bekerülhet egyszerű táblázatos formában:
  - név
  - mappa
  - címkék
  - feltöltő
  - dátum
  - műveletek

Ha túl nagy lenne egy körben, akkor a lista nézetet külön második lépésként hagyom, de a rendezést mindenképp érdemes beépíteni.

---

## 8. „Mi változott?” rész működése

A „Mi változott?” rész jelenleg **nem automatikusan az adatbázisból frissül**, hanem a fejlesztői changelog listából:

```text
src/data/adminChangelog.ts
```

Ez azt jelenti:

- amikor új funkciót vagy javítást készítünk,
- hozzá kell adni egy új bejegyzést ebbe a fájlba,
- ekkor jelenik meg az admin kézikönyv „Mi változott?” részében.

A piros szám badge úgy működik, hogy:

- az elmúlt 7 nap friss bejegyzéseit nézi,
- amit a felhasználó még nem nyitott meg, azt újnak számolja,
- ha megnyitja a „Mi változott?” részt, a rendszer elmenti localStorage-ba, hogy látta.

### Ezt most javítom dokumentáció szinten is

A kézikönyvben a „Mi változott?” rész tetejére bekerül egy rövid magyarázat:

```text
Ez a lista akkor frissül, amikor új fejlesztés vagy javítás kerül az oldalba.
Az új bejegyzések 7 napig számítanak frissnek.
```

És ehhez a mostani dokumentumtár-fejlesztéshez is bekerül egy új changelog bejegyzés:

```text
ÚJ / JAVÍTVA — Dokumentumtár gyors műveletek
Mappázás, címkézés és csillagozás közvetlenül a dokumentumkártyák 3 pontos menüjéből.
```

---

## Érintett fájlok

| Fájl | Módosítás |
|---|---|
| `src/components/admin/documents/DocumentCard.tsx` | 3 pontos menü kibővítése mappa/tag/csillag/részletek műveletekkel |
| `src/components/admin/documents/DocumentUploader.tsx` | feltöltés előtti mappa és címke választás |
| `src/components/admin/documents/DocumentDetailDialog.tsx` | szerkesztő dialog finomítása |
| `src/components/admin/documents/FolderSidebar.tsx` | oldalsáv használhatósági javítások |
| `src/pages/admin/Documents.tsx` | rendezés, tömeges tag műveletek, feltöltőhöz aktív tag átadása |
| `src/hooks/useDocuments.ts` | kisebb helper logika a tag/mappa frissítésekhez |
| `src/data/adminChangelog.ts` | új bejegyzés a dokumentumtár fejlesztésről |
| `src/data/adminHelpContent.ts` | dokumentumtár kézikönyv téma bővítése |
| `src/components/admin/AdminHelpPanel.tsx` | „Mi változott?” magyarázó szöveg hozzáadása |

---

## Megvalósítási sorrend

1. Dokumentumkártya 3 pontos menüjének kibővítése
2. Feltöltő doboz mappa + címke választóval
3. Tömeges címke műveletek
4. Oldalsáv és részletező dialog finomítása
5. Rendezés hozzáadása
6. Kézikönyv + „Mi változott?” magyarázat + changelog bejegyzés

