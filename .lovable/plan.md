# Rendelés leadásának javítása nyitási ablakon kívül

## Ok
Reggel 8:34-kor a „Minél hamarabb" opció ki volt jelölve, pedig mellette „Zárva" felirat állt (ebéd ASAP csak 10:30–16:00). Az oldal csak napi ajánlatos kosárnál vált át automatikusan „Időpont foglalása"-ra; egyéb esetben a zárt opció kijelölve marad, ezért a szerver jogosan elutasítja a rendelést.

## Javítás (csak a rendelési oldal)
1. Ha az azonnali átvétel éppen nem elérhető (zárva vagy csak ütemezetten), az oldal automatikusan „Időpont foglalása"-ra vált, és az első szabad időpontot előre kiválasztja.
2. A „Minél hamarabb" opció ilyenkor tiltott, rövid magyarázattal (pl. „Ebéd 10:30-tól rendelhető azonnalra").
3. Ha mégis zárt ASAP-pal próbálna küldeni, a gomb megnyomása előtt barátságos üzenet jelenik meg és az időpontválasztóra ugrik — nem a szerver hibája.

A szerver szabályai, árak, időablakok változatlanok.

## Ellenőrzés
Típusellenőrzés, tesztek, Playwright: 8:30-ra szimulált idővel a checkout ütemezettre vált és leadható; 11:00-kor ASAP működik. Nem publikálok.
