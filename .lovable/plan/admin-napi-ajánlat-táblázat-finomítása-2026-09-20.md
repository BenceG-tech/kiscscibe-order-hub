# Admin napi ajánlat táblázat finomítása

## Cél
A heti táblázat maradjon ismerős az asszisztens számára, de legyen tömörebb, és a felső napválasztó egyetlen kattintással vigyen a kiválasztott naphoz.

## Jelenlegi helyzet
- Az asztali táblázat legalább 900 px széles, a naposzlopoknak csak minimumszélessége van; a cellák tartalma ezért tovább tudja szélesíteni őket.
- A napválasztó egy rögzített, 192 px-es bal oldali oszlopszélességgel számol, miközben a táblázat tényleges szélességét a böngésző alakítja.
- A kattintás sima görgetést indít, közben az aktív napot a táblázat közepéhez legközelebbi oszlop alapján újraszámolja. Ez együtt pontatlan, lépcsőzetes érzetet adhat.
- A mobilnézet külön, lenyitható napos felépítést használ; ezt nem szükséges átalakítani.

## Tervezett módosítások
1. **Kompaktabb, stabil oszlopszélességek**
   - Az asztali táblázat kategória- és naposzlopai kiszámítható, tömörebb szélességet kapnak.
   - A hosszabb ételnevek és a meglévő műveleti ikonok nem szélesíthetik tovább az egész oszlopot; kulturáltan törnek vagy rövidülnek, a teljes név továbbra is elérhető marad.
   - A rögzített kategóriaoszlop és minden jelenlegi szerkesztési lehetőség megmarad.

2. **Egykattintásos napugrás**
   - A napgomb a kiválasztott oszlop tényleges helyzetéből és a kategóriaoszlop valódi szélességéből számolja ki a célpontot.
   - Egy kattintás közvetlenül a megfelelő napot igazítja a rögzített kategóriaoszlop mellé; a szélső napoknál a görgetési határt helyesen kezeli.
   - A kijelölt nap azonnal és stabilan látszik a felső sávban. A bal/jobb nyilak és a felső görgetősáv megmaradnak tartalék navigációnak.

3. **Visszafogott vizuális finomítás**
   - A felső napválasztó és a táblázat fejléce az admin jelenlegi sötét–sárga stílusához igazodik.
   - Nem változik a heti navigáció, az ételkeresés, a hozzáadás/törlés, az ár, a menürész, az elfogyott állapot vagy a publikálás működése.

4. **Ellenőrzés**
   - Asztali és keskenyebb laptopnézetben ellenőrzöm mind az öt nap közvetlen elérését, az oszlopszélességet és a vízszintes görgetést.
   - Mobilon ellenőrzöm, hogy a jelenlegi lenyitható napnézet változatlanul működik.
   - Lefuttatom a típusellenőrzést, a célzott minőségellenőrzést és a heti menü megbízhatósági tesztjeit.

## Technikai részletek
A változás csak az admin napi ajánlat táblázatának megjelenítését és kliensoldali navigációját érinti. Adatbázis-, jogosultság-, rendelési és publikálási logika nem változik. Az eredmény továbbra is csak előnézetben marad; nem publikálom.
