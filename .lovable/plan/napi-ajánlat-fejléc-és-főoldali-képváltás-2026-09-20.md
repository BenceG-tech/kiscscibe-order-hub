# Napi ajánlat fejléc és főoldali képváltás

## Változtatások

- A `/etlap` napi ajánlat fejlécében a jelenlegi régi képet lecserélem a főoldalhoz illő, már meglévő Kiscsibe ételfotóra.
- Külön mobil és asztali képet használok, AVIF elsődleges és WebP tartalék formátummal, hogy gyors és éles maradjon.
- A cím és alcím mögötti sötét fedést megerősítem, a szöveget meleg, világos színnel és jól elkülönülő hierarchiával jelenítem meg, így minden képernyőn könnyen olvasható lesz.
- A fejléc stabil magasságát és képarányát megtartom, hogy betöltéskor ne ugorjon az oldal.
- A főoldali három kép automatikus váltását 6 másodpercről körülbelül 3 másodpercre módosítom.
- Megtartom a finom áttűnést, a kézi pontválasztást, a rámutatás/fókusz és háttérbe tett lap alatti szüneteltetést, valamint a csökkentett mozgást kérő felhasználóknál a statikus első képet.

## Ellenőrzés

- Mobilon (390 px) és asztali nézetben (1440 px) ellenőrzöm a cím és alcím olvashatóságát, a megfelelő mobil/asztali kép kiválasztását és a vízszintes túlcsordulás hiányát.
- Ellenőrzöm, hogy a főoldali képek nagyjából 3 másodpercenként váltanak, az áttűnés működik, és nincs látható elrendezésugrás.
- Típusellenőrzést és célzott minőségi ellenőrzést futtatok.

## Korlátok

- A rendelési működéshez, árakhoz, adatokhoz, adminfelülethez és belépéshez nem nyúlok.
- Csak az előnézetet módosítom; nem publikálom az oldalt.
