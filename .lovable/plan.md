# Félbehagyott rendelések és sikertelen próbálkozások követése

## Cél
Lássuk az adminban, ha valaki **megpróbálta** leadni a rendelést, de hibára futott, **vagy** ha csak rakosgatott a kosárba de nem véglegesítette. Erika és hasonló esetek így nyomon követhetők.

## Mit építünk

### 1. `order_attempts` tábla — sikertelen submit-ok
Minden alkalommal, amikor a vendég megnyomja a "Rendelés leadása" gombot, de a `submit-order` edge function hibára fut (rossz dátum, telített idősáv, fogyás, validációs hiba), elmentünk egy sort:
- név, telefon, email
- teljes kosár (JSON)
- végösszeg
- hibaüzenet (pl. „A napi ajánlat csak 2026-06-23-ra rendelhető")
- időpont, user agent

Hely: `submit-order` edge function — minden hibaág előtt beszúrjuk a `service_role` klienssel.

### 2. `abandoned_carts` tábla — félbehagyott kosarak
A Checkout oldalon, amint a vendég elkezdi kitölteni az adatait (név vagy telefon megvan ÉS van tétel a kosárban), 20 mp-enként debounce-olva upsert-elünk:
- session_id (localStorage-ban tárolt UUID)
- név, telefon, email (amit eddig beírt)
- kosár tartalom (JSON), végösszeg
- meddig jutott el (lépés: cart / details / payment)
- `last_activity_at`, `created_at`
- `converted_order_id` — ha sikeresen leadta, ide bekerül a rendelés id-ja (a `submit-order` állítja be), így szűrhető a „tényleg elhagyott" lista

Sikeres rendelés után megjelöljük konvertáltként, nem töröljük (statisztikához hasznos).

### 3. Admin UI — új fül: „Félbehagyott / Sikertelen"
`/admin/orders` mellé új tab vagy aloldal:
- **Sikertelen próbálkozások** lista: idő, név, telefon, összeg, hibaüzenet, kosár előnézet (kinyitható)
- **Félbehagyott kosarak** lista (csak `converted_order_id IS NULL` és > 5 perce nincs aktivitás): idő, név, telefon, összeg, kosár, meddig jutott
- Szűrés napra, keresés név/telefonra
- „Visszahívás" gomb: `tel:` link a telefonszámra

### 4. Adatmegőrzés és GDPR
- 30 nap után automatikus törlés (pg_cron napi job)
- Adatvédelmi tájékoztatóba 1 mondatos kiegészítés („technikai célból ideiglenesen tároljuk a meg nem kezdett rendelési adatokat")

## Technikai részletek
- **Migráció:** 2 új tábla + GRANT-ok + RLS (csak admin/staff olvashat, `service_role` írhat) + pg_cron törlő job
- **Edge function:** `submit-order` kiegészítése — minden `throw` előtt `order_attempts` insert; sikeres végén `abandoned_carts.converted_order_id` update
- **Frontend hook:** új `useAbandonedCartTracking` Checkout-ban — debounce 20mp, session_id localStorage-ban
- **Admin oldal:** új `AdminFailedOrders.tsx` + route `/admin/failed-orders` + link a meglévő admin nav-ba
- **Erika ügye:** sajnos visszamenőleg nem deríthető ki — a mostani logokban nincs nyoma. De holnaptól minden ilyen eset látszódni fog.

## Mit NEM változtatunk
- Meglévő rendelés flow, validációk, KDS, értesítések érintetlenek
- Brand/design szín, font, layout változatlan