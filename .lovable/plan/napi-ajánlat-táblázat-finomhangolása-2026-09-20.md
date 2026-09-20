# Napi ajánlat táblázat finomhangolása

## Cél
A naposzlopok maradjanak kompaktak, de legyen bennük elegendő hely az ételhez tartozó összes műveleti ikonnak, a levágott ételnevek pedig egérrel könnyen elolvashatók legyenek.

## Tervezett módosítások
1. **Kissé szélesebb naposzlopok**
   - A jelenlegi 148 px-es naposzlopokat csak mérsékelten szélesítem, annyira, hogy a képen bekarikázott ikonsor egy sorban, takarás nélkül elférjen.
   - A kategóriaoszlop, az ötnapos heti felépítés és a vízszintes görgetés változatlan marad.

2. **Teljes ételnév rámutatáskor**
   - A hosszú ételnév továbbra is rövidítve jelenik meg, hogy ne növelje meg a cellát.
   - Egérrel a rövidített név fölé állva egy jól olvasható lebegő címke mutatja a teljes ételnevet.
   - A címke billentyűzetes fókusznál is elérhető lesz.

3. **Ellenőrzés**
   - Ellenőrzöm rövid és hosszú nevekkel, hogy az ikonok nem lógnak ki és nem fedik egymást.
   - Keskenyebb és szélesebb asztali nézetben ellenőrzöm a táblázatot, valamint azt, hogy az egykattintásos napugrás az új oszlopszélességgel is pontos marad.
   - A mobilos napi nézethez és az étlap működéséhez nem nyúlok.

## Technikai részletek
A módosítás kizárólag az admin napi ajánlat táblázatának asztali megjelenését érinti. Adatbázis-, rendelési-, jogosultsági és publikálási logika nem változik. Az eredmény előnézetben marad; nem publikálom.
