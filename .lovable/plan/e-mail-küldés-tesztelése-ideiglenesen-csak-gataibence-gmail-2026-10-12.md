# E-mail küldés tesztelése – ideiglenesen csak gataibence@gmail.com

## Lényeg
A teszt idejére minden admin értesítő **csak a gataibence@gmail.com** címre megy, Krisztián (info@kiscsibeetterem.hu) nem kap semmit. A teszt után visszaállítom az eredeti két címet.

## Lépések
1. **Átállítás**: rendelés-értesítő, napi és havi jelentés címzettje ideiglenesen csak `gataibence@gmail.com`. Mivel a Resend most lett újracsatlakoztatva, a régi naplóhibákat nem vesszük figyelembe.
2. **Valódi próbarendelés** az előnézetben, a vásárlói e-mail mezőben is a te címed. Ellenőrzöm:
   - admin „új rendelés” levél,
   - vásárlói visszaigazolás,
   - státusz levelek: készül → átvehető → elkészült (értékelő linkkel), valamint lemondás.
3. **Kapcsolatfelvételi űrlap** egy üzenettel (ez is csak hozzád megy az átállítás alatt).
4. Minden küldés eredményét kiolvasom az e-mail naplóból (sikeres + Resend azonosító, vagy a pontos hiba). Megkérlek, nézd meg a Gmailt (beérkezett + spam).
5. **Takarítás**: a próbarendelést lemondom (a készlet visszaáll) és törlöm, a teszt naplósorok megmaradnak.
6. **Visszaállítás**: az admin címzettek újra `info@kiscsibeetterem.hu` + `gataibence@gmail.com`, újratelepítés, és ellenőrzöm, hogy a kód valóban az eredeti állapotban van.

## Fontos
- Az átállítás az élő háttérrendszert érinti: ha a teszt alatt valódi vendég rendel, annak értesítője is csak hozzád megy. Ezért gyorsan (kb. 15–20 perc) végzek, és késő este van, így kicsi a kockázat.
- Nem publikálok, a rendelési folyamaton nem változtatok.

## Technikai részletek
- `supabase/functions/submit-order/index.ts` `ADMIN_RECIPIENTS`, `send-contact-email` címzett, `send-daily-report`, `send-monthly-report` `to` tömbje → ideiglenesen `['gataibence@gmail.com']`; deploy, teszt, majd vissza és újra deploy.
- Ellenőrzés: `email_send_log` lekérdezés, `edge_function_logs`.
