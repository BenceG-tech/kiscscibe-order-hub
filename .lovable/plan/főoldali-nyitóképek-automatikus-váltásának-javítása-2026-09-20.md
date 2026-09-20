# Főoldali nyitóképek automatikus váltásának javítása

## Cél
A főoldal három nyitóképe látható böngészőlapon, normál mozgásbeállítás mellett megbízhatóan váltson 3 másodpercenként.

## Megállapított ok
A váltás időzítője jelenleg 3 másodperces, de a teljes nyitóképes rész fölé érkező egér azonnal szünetelteti. Mivel ez a rész szinte kitölti az első képernyőt, asztali használatkor az automatikus váltás könnyen folyamatosan leáll.

## Tervezett módosítások
1. **Megbízható automatikus váltás**
   - A teljes nyitóképes területhez kötött egér-szüneteltetést megszüntetem.
   - A képek 3 másodpercenként körbeváltanak: ebéd → reggeli → pult → ebéd.
   - A kézi képválasztó pontok továbbra is működnek; választás után új, teljes 3 másodperces ciklus indul.

2. **Akadálymentes és takarékos működés**
   - A böngésző csökkentett mozgás beállításánál az első kép marad statikus.
   - Háttérbe tett böngészőlapon a váltás szünetel, visszatéréskor folytatódik.
   - A képválasztó billentyűzetes fókusza alatt nem indul váratlan váltás.
   - Az AVIF/WebP képforrások, a mobil–asztali szétválasztás és az első kép gyors betöltése változatlan marad.

3. **Ellenőrzés**
   - 390 px-es mobil- és 1440 px-es asztali nézetben időzítve ellenőrzöm legalább két automatikus váltást.
   - Ellenőrzöm a kézi pontválasztást, a csökkentett mozgást, a képek sikeres betöltését és az oldal elcsúszásmentességét.
   - Lefuttatom a típus- és célzott minőségellenőrzést.

## Hatókör
Csak a főoldali nyitóképek váltásának vezérlése változik. A szövegek, képek, menüadatok, rendelés, adminfelület és háttérrendszer érintetlen marad. Az eredmény csak előnézetben marad; nem publikálom.
