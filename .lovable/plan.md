# Admin felület és mobil napi ajánlat javítása

## Cél
- A „Módosítási napló” teljes felületi eltávolítása, hogy az admin használói ne lássák a korábbi módosításokat.
- A „Frissítések és újítások” lista aktualizálása a legutóbbi, valóban elkészült fejlesztésekkel.
- Az admin felület vizuális közelítése a jelenlegi Kiscsibe főoldal sötét navy/charcoal, krémszöveges és sárga kiemelésű világához.
- A mobil napi ajánlat fejlécében a dátum és a „Holnapi ajánlatok” címke elcsúszásának javítása, valamint a hasonló nyilvános elrendezések ellenőrzése.

## Megvalósítás
1. **Módosítási napló eltávolítása**
   - Kiveszem a Napló menüpontot az asztali és mobil admin navigációból.
   - Megszüntetem a `/admin/activity` oldal elérhetőségét, és eltávolítom a kézikönyv Naplóra mutató elemeit.
   - Az adatbázisban lévő auditadatokat és az automatikus naplózást biztonsági okból érintetlenül hagyom; csak a látható admin felület kerül ki.

2. **Frissítések és újítások aktualizálása**
   - A jelenlegi, júliusi lista elé rövid, közérthető szeptemberi bejegyzések kerülnek a legutóbbi fontos javításokról: biztonságos rendeléskeresés, hétvégi időpontvédelem, lemondáskori készlet-visszaállítás, stabilabb értesítések és e-mailek, heti ajánlat duplikációvédelme, új nyitóképek és Kiscsibe ikon.
   - A felső értesítősáv és a csengőből nyíló lista továbbra is megtartja a megtekintett/elrejtett állapotokat.
   - A frissítéstípusok színei a Kiscsibe szemantikus színkészletét használják, idegen kék/zöld/piros foltok nélkül.

3. **Admin vizuális összehangolása**
   - Az admin fejlécet, navigációt, panelek és statisztikai kártyák felületeit a főoldal sötét navy/charcoal, meleg krém és Kiscsibe-sárga rendszeréhez igazítom.
   - Megtartom a jelenlegi admin elrendezést, menüpontokat, jogosultságokat és működést; csak a megjelenési réteg változik.
   - A mobil admin fejléc és vízszintesen görgethető navigáció olvashatóságát is ellenőrzöm.

4. **„Holnapi ajánlatok” mobil javítása**
   - A dátum és a címke sora mobilon tördelhető, stabil kéthasábos helyett egymás alá rendeződő elrendezést kap; a címke saját tartalmához igazodó, szabályos keretet és biztos szélességet kap.
   - Ugyanezt az elvet alkalmazom a közös napi ajánlat naptár megfelelő fejlécváltozatainál, hogy más dátumnál vagy hosszabb magyar szövegnél se csússzon el.

5. **Ellenőrzés**
   - Mobilon (393 px) és asztali nézetben ellenőrzöm az `/etlap` dátum/címke sort, a heti dátumválasztót, napi menüt és a hasonló címke–címsor párokat.
   - Ellenőrzöm az admin fejlécet, navigációt, irányítópultot, frissítési sávot és párbeszédablakot; nem lehet vízszintes kilógás vagy szövegátfedés.
   - Futtatom a típusellenőrzést és a célzott minőségi teszteket. A változtatás csak előnézetben marad, nem publikálom.

## Nem változik
- Rendelési, ár-, készlet-, Supabase-, jogosultsági, admin-belépési és auditnaplózási üzleti logika.
- A nyilvános oldal szerkezete a jelzett elrendezési javításon kívül.
