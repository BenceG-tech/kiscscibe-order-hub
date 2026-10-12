# E-mail küldés ellenőrzése – csak gataibence@gmail.com címre

## Mit találtam eddig
- Feladó: `rendeles@kiscsibeetterem.hu`, válaszcím: `info@kiscsibeetterem.hu`.
- Rendelésnél az admin értesítő két címre megy: `info@kiscsibeetterem.hu` és `gataibence@gmail.com`. Egy valódi próbarendelés tehát Krisztiánhoz is eljutna — ezért **nem adok le próbarendelést**.
- A napi és havi jelentés szintén mindkét címre megy, ezeket sem indítom el.

## Hogyan tesztelek
1. **Napló átnézése**: az e-mail naplóban megnézem az elmúlt napok sorait (sikeres / sikertelen / kihagyott, hibaüzenet), hogy a Resend elfogadja-e már a kiscsibeetterem.hu feladót.
2. **Külön teszt-küldő**: ideiglenes, jelszóval védett háttérfunkció, ami **kizárólag a gataibence@gmail.com címre** küld — a cím be van égetve, más címre nem tud küldeni. Ugyanazzal a beállítással és sablonokkal küld, mint az éles levelek:
   - admin „új rendelés” értesítő (mintaadatokkal),
   - vásárlói visszaigazolás,
   - státusz levelek (készül / átvehető / elkészült értékelő linkkel),
   - kapcsolatfelvételi üzenet,
   - hírlevél üdvözlő.
3. Minden küldés eredménye bekerül a naplóba (Resend azonosítóval vagy a pontos hibával), adatbázisban rendelés nem jön létre, készlet nem változik.
4. Eredmény alapján:
   - ha a Resend elfogadja: megkérlek, nézd meg a Gmail fiókodat (beérkezett + spam), és jelezd, megjöttek-e;
   - ha elutasítja (pl. a domain még nincs igazolva): pontosan leírom, mi hiányzik.
5. Teszt után a teszt-küldőt törlöm, hogy ne maradjon kiskapu.

## Amit nem csinálok
- Nem adok le próbarendelést, nem futtatok napi/havi jelentést, nem küldök hírlevelet a feliratkozóknak.
- Nem változtatok az éles levelek címzettjein, sablonjain, a rendelési folyamaton.
- Nem publikálok.

## Technikai részletek
- Új edge function `email-selftest`: `TEST_RECIPIENT = "gataibence@gmail.com"` konstans, a kérésből címet nem fogad el; védelem `generate_secret`-tel létrehozott `EMAIL_SELFTEST_TOKEN` fejléccel.
- A `_shared/email.ts` `sendEmail` és a meglévő sablon-építők újrahasznosítása, `email_send_log` sor `sent/failed` státusszal, tárgy elején „[TESZT]”.
- Hívás `supabase--curl_edge_functions`-szel, majd naplólekérdezés; végül `supabase--delete_edge_functions` + fájl törlés.
