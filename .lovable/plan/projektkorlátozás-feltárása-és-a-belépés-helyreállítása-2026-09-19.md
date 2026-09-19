# Projektkorlátozás feltárása és a belépés helyreállítása

## Megerősített állapot
- A képen látható üzenet nem hibás emailt vagy jelszót jelez: a bejelentkezési kérés a projekt szolgáltatási korlátozásán akad el.
- A munkaterület Pro előfizetése aktív.
- Jelenleg 76,82 felhasználható Cloud-kredit látható.
- Sem projekt-, sem munkaterület-szinten nem található beállított Cloud `block_usage` korlát.
- Emiatt az üzenet pontos számlázási vagy szolgáltatási kiváltó oka még nem igazolt.

## Lépések
1. Ellenőrzöm a projekt Cloud- és hitelesítési állapotát, valamint a sikertelen belépési kérés részletes naplóját.
2. Azonosítom, hogy korábbi túllépésből maradt korlátozás, számlázási állapot vagy más projektoldali tiltás okozza-e.
3. A feltárt oknak megfelelően helyreállítjuk a szolgáltatást; az alkalmazás kódját csak akkor módosítom, ha valóban ott van a hiba.
4. Inkognitó ablakban újratesztelem a belépést, majd az admin oldal adatbetöltését.
5. Ellenőrzöm a nyilvános étlapot és a rendelési folyamatot is, mert ugyanaz a korlátozás ezeket is érintheti.

## Sikerkritérium
- A belépés korlátozási hiba nélkül sikerül.
- Az admin felület és a nyilvános adatbetöltések működnek.
- A korlátozás pontos oka és a végrehajtott helyreállítás dokumentálva van.
