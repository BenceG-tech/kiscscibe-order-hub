# Prémium kompakt ételkártyák

## Cél
A napi ételek legyenek gyorsan átfuthatók, könnyen olvashatók és modernebbek mobilon és asztali nézetben is, a jelenlegi sötét Kiscsibe-arculat megtartásával.

## Változtatások
1. **Erősebb ételnév-hierarchia**
   - A további napi ételek neve mobilon is legalább 18 px-es, hangsúlyos, jól olvasható betűt kap.
   - A hosszú ételnevek több sorban jelenhetnek meg, elegendő hellyel; nem szorítja össze őket az ár vagy a kép.
   - A Sofia karakteres marad, de tisztább sortávval és jobb kontraszttal.

2. **Prémium kompakt kártyafelépítés**
   - Bal oldalon: ételnév, opcionális leírás és „Menüben is” jelzés.
   - Jobb oldalon: nagyobb, lágyan lekerekített, stabil méretű ételfotó.
   - Alul külön, könnyen felismerhető akciósor: hangsúlyos sárga ár és ikon+szöveg kosárgomb.
   - Finom belső fény, árnyék és sárga fókuszkeret; visszafogott emelkedés érintésre/rámutatásra.

3. **Napi menü két fő kártyája**
   - A leves és főétel neve nagyobb, kontrasztosabb lesz.
   - A címke, név és leírás közötti vizuális sorrend tisztább lesz.
   - A fotók, az árjelzés és a közös kosárgomb ugyanazt a prémium formanyelvet követik.

4. **Kis képernyős finomhangolás**
   - A kép nem veszi el a helyet a hosszú nevektől.
   - A gombok érintési felülete kényelmes marad.
   - Nem lesz vízszintes túlcsordulás vagy egymásra csúszó szöveg.

## Technikai keretek
- Csak a vendégoldali ételkártyák megjelenése változik.
- A napi adatok, árak, kosár, köretválasztás, route-ok és rendelési logika érintetlen marad.
- A meglévő szemantikus színtokeneket használjuk; új piros felületi elem nem kerül be.
- A mozgások tiszteletben tartják a csökkentett mozgás beállítást.

## Ellenőrzés
- Mobil nézet: 393×852.
- Asztali nézet: 1280×1800.
- Hosszú ételnév, hiányzó kép és hiányzó leírás ellenőrzése.
- Kosárgomb és köretválasztás működésének ellenőrzése.
- Típusellenőrzés és célzott lint.
- Preview-only; publikálás nem történik.
