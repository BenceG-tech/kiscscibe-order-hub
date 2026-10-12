# Napi menük helyreállítása és adminellenőrzés

## Ellenőrzött helyzet
- Október 12–14-re egy-egy leves és főétel helyesen ki van jelölve, de hiányzik a rendelhető menü rekordja.
- Október 15-re a húsleves mellé két főétel van megjelölve: Rántott sertéskaraj és Vadas sertésszelet. Emiatt a jelenlegi, pontosan egy levesből és egy főételből álló menüszabály nem teljesül.
- Október 16-ra a menü rekordja megvan.
- A menüösszekapcsolás jelenleg a heti szerkesztő egyetlen kijelölési műveletéhez kötött; a tényleges adatbázisban nincs menüszinkronizáló trigger.

## Javítás
1. **Helyreállítás:** a helyesen kijelölt, de hiányzó menüket helyreállítjuk. Meglévő menük árát, azonosítóját és megmaradt adagjait nem írjuk felül. A további érintett napokat is ellenőrizzük.
2. **Megbízható összekapcsolás:** a kijelölések módosítása, hozzáadása és eltávolítása után az összekapcsolás az adatbázisban, egyetlen tranzakcióban történjen. Így nem marad félkész állapot két külön mentés között. A rendeléshez valódi menüazonosító kell: nem pusztán elrejtjük az üzenetet, és nem hozunk létre képzeletbeli menüt a megjelenítéshez.
3. **Adminfigyelmeztetés:** minden érintett napnál jól látható magyar jelzés mutassa, ha több leves vagy főétel lett kijelölve, illetve hiányos a menü. Marad a szabály: egy leves és egy főétel menünként. Csütörtökön nem választunk önkényesen a két étel közül; az adminnak jelezzük, hogy egy főételt kell megtartania a menüben. A külön rendelhető ételeket nem töröljük.
4. **Ellenőrzés:** automata tesztek a hiányzó menü helyreállítására, ismételt szinkronra, több főételre és a meglévő készlet megőrzésére; a főoldalon és a napi ajánlat oldalon ellenőrizzük a teljes menü megjelenését és kosárba helyezését, több napon. Admin belépés nélkül az adminfolyamat teljes ellenőrzését nem állítjuk sikeresnek.

## Technikai keretek
- Az ár és adagkeret meglévő beállításait, valamint az admin eddigi alapértelmezéseit használjuk; nem változtatjuk a rendelési határidőt, a dobozdíjat vagy az e-mailküldést.
- A szinkron nem nullázza a lefoglalt készletet, és nem töröl történeti menüazonosítót, amelyre rendelési foglalás hivatkozhat.
- A vendégoldal csak teljes, valódi menüt kínáljon fel; több kijelölt főételnél ne válasszon tetszőleges ételt.
- A rendelési értesítők jelenlegi címzettjei már az eredeti két cím: info@kiscsibeetterem.hu és gataibence@gmail.com; itt nincs visszaállítandó módosítás. Tesztlevelet nem küldünk.
- Az oldal nem kerül publikálásra. Az adatjavítás és adatbázis-szinkron a kapcsolt Supabase-ra kerül, ezért annak hatása az élő adatokon is érvényesül; a felületi változtatások előnézetben maradnak.
