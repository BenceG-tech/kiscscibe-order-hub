# Kiscsibe „Soft Editorial” vizuális finomítás

## Cél
A jelenlegi sötét, filmes Kiscsibe-hangulat megtartása mellett megszüntetni a túl szögletes érzetet. Az eredmény lágyabb és modernebb lesz, de nem válik buborékos, játékos vagy generikus alkalmazásdizájnná.

## Megvalósítás
1. **Egységes formai rendszer**
   - Megszüntetem azt a főoldali felülírást, amely a nagyobb lekerekítéseket 8 px-re kényszeríti.
   - Három következetes ívet használok: kisebb vezérlők, normál panelek, nagy ételfotók.
   - A sarkok jellemzően 12–18 px között maradnak; teljes kapszulaforma csak címkéknél és kompakt akcióknál lesz.

2. **Ételképek és tartalmi panelek**
   - A napi menü, reggeli, állandó kínálat és galéria képei lágyabb sarkot, finom belső fényt és visszafogott mélységi árnyékot kapnak.
   - A képek hover-effektje lassú, kis mértékű közelítés és enyhe felemelkedés lesz, hirtelen skálázás nélkül.
   - Az egymás melletti kép és szöveg vizuálisan összetartozó, folytonos egységet alkot majd.

3. **Gombok és kisebb vezérlők**
   - A közös gombstílus lágyabb, 12 px körüli sarkot és finom lenyomási/kiemelkedési reakciót kap.
   - A sárga elsődleges gombok megőrzik a nagy kontrasztot; az outline gombok áttetsző, enyhén üveges sötét felületet kapnak.
   - Az ikon-gombok kör alakúak maradnak, a széles műveleti gombok nem lesznek túlzottan kapszula alakúak.

4. **Heti dátumsáv és naptár**
   - A napok különálló, lágy sarkú „dátumlapokká” válnak stabil mérettel.
   - A kiválasztott nap sárga kiemelést, finom fényt és enyhe emelkedést kap; a mai nap vékony gyűrűvel jelenik meg.
   - A navigációs nyilak és az „ez a hét lezárult” sáv ugyanazt a puha formanyelvet követik.
   - A teljes havi naptár napjai és állapotjelölései is ugyanezzel a formával egységesülnek mobilon és asztali nézetben.

5. **Modern, de visszafogott effektek**
   - Finom, kurzort követő fény csak a fontos ételkártyákon, ahol nem zavarja az olvashatóságot.
   - Rövid, ruganyos nélküli átmenetek: árnyék, keret, képzoom és 1–2 px-es elmozdulás.
   - A `prefers-reduced-motion` beállítás minden új mozgást kikapcsol.

6. **Érintett nyilvános felületek**
   - Nyitóoldali napi menü, reggeli, állandó kínálat, galéria és kiemelt akciók.
   - Heti dátumválasztó és a vendégek havi ajánlati naptára.
   - Közös gomb- és kártyaalapok úgy, hogy az adminfelület működése ne változzon.

## Ellenőrzés
- Asztali és mobil vizuális ellenőrzés, külön figyelve a képekre, gombokra és dátumokra.
- Kattintható felületek, naptárválasztás, kosárgombok és route-ok működésének ellenőrzése.
- Csökkentett mozgás, túlcsordulás, típusellenőrzés és célzott lint.

## Korlátok
- Nincs adatbázis-, Supabase-, RLS-, auth-, admin-, ár- vagy rendelési logika módosítás.
- A sötét navy/ink alaphangulat, Kiscsibe-sárga akciószín és a hero videó változatlan marad.
- A piros továbbra is kizárólag a hero fotó terítőjén jelenhet meg.
- Csak preview; publikálás nem történik.