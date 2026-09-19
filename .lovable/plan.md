# Modern Kiscsibe nyitóoldal

## Cél
A kiválasztott „Modern Zugló bistro” irány alapján újratervezni a teljes nyitóoldalt: erős ételfotós nyitány, magazinos ritmus, több interakció és egységesebb vizuális élmény. A meglévő rendelési, kosár-, napi ajánlat- és adminfunkciók változatlanok maradnak.

## Megvalósítás

### 1. Új, látványos nyitóképernyő
- Teljes szélességű, sötét tónusú ételfotós kompozíció a **Kiscsibe Reggeliző & Étterem** névvel.
- A meglévő Sofia betűtípus és a kiválasztott modern városi paletta marad: grafit, sötétkék, Kiscsibe-sárga és világos szürke.
- A háttérben 3–4 egységes ételfotó finom, automatikus áttűnéssel; kézi váltási lehetőséggel és mozgáscsökkentési beállítás támogatásával.
- Jól látható „Rendelés leadása” és „Mai ajánlat” gombok.
- Dinamikus nyitvatartás és valós étteremcím jelenik meg, nem beégetett mintaadat.
- A következő tartalmi rész minden kijelzőn láthatóan elkezdődik, hogy egyértelmű legyen a görgetés iránya.

### 2. Élő napi ajánlat a nyitóképben
- A kiválasztott terv lebegő ajánlatpanelje a valódi napi kínálatból kap adatot.
- A panelen leves, főétel és aktuális ár jelenik meg tömören; kattintásra a napi ajánlathoz visz.
- Betöltési, üres és zárva állapot kulturált kezelést kap, kitalált ételnevek nélkül.
- Mobilon a panel nem lebeg rá a szövegre, hanem kompakt, jól olvasható sávként folytatódik a nyitókép alatt.

### 3. A teljes nyitóoldal vizuális egységesítése
- A reggeli, napi ajánlat, állandó kínálat, előnyök, vélemények, galéria, promóció, allergének, térkép, kérdések és hírlevél részek egységes magazinos hierarchiát kapnak.
- Erősebb fotóhasználat, tisztább tipográfia, kevesebb egymásba ágyazott kártya és határozottabb szekcióváltások.
- A jelenlegi szövegek és funkciók megmaradnak; csak a megjelenés, elrendezés és finom interakciók változnak.
- A felső navigáció és a mobil alsó navigáció vizuálisan hozzáigazodik az új nyitóoldalhoz.

### 4. Mozgás és interakció
- Filmszerű, lassú képáttűnés, finom képmozgás és szakaszonkénti belépő animációk.
- Visszafogott interakció az ajánlatokon és ételfotókon; nem lesz túlmozgatott vagy zavaró.
- A `prefers-reduced-motion` beállítás esetén minden lényegi tartalom animáció nélkül is azonnal elérhető.

### 5. Képi anyag
- A meglévő valódi Kiscsibe-fotókat használjuk elsőként.
- A hiányzó nyitóképekhez egymással egységes, étvágygerjesztő, modern bisztrófotók készülnek; nem használunk külső hotlinkeket.
- Videó helyett első körben gyorsabb és mobilbarátabb képsorozat készül. A szerkezet később saját rövid éttermi videóra cserélhető, amikor rendelkezésre áll valódi Kiscsibe-felvétel.

## Technikai részletek
- A színek, árnyékok és felületek központi design tokenekből készülnek, világos és sötét témában megfelelő kontraszttal.
- A napi ajánlat meglévő adatforrásához csak olvasási célú nyitóoldali megjelenítés kapcsolódik; üzleti szabály vagy adatbázis-logika nem változik.
- A képek optimalizált méretben, reszponzív betöltéssel és stabil képaránnyal jelennek meg.

## Ellenőrzés
- Asztali és mobil nézet ellenőrzése valódi adatokkal.
- Gombok, képváltás, napi ajánlatra ugrás, rendelési útvonal, kosár és navigáció végigpróbálása.
- Szöveg-átfedések, betöltési hibák, kontraszt, csökkentett mozgás és böngészőhibák ellenőrzése.
- A módosítás nem érinti az adminfelületet vagy a rendelési üzleti logikát.
