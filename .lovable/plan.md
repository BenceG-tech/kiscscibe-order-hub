## Cél
Teljes körű audit a rendelés életútjáról (leadás → tárolás → megjelenítés) + admin felület átláthatóvá és kezelhetővé tétele. A user "Jelentés + minden együtt" opciót választotta, tehát a plan tartalmazza az auditriportot ÉS a konkrét fixeket.

## 0. AZONNAL LÁTHATÓ KRITIKUS HIBA (konzolból)

A `useGlobalOrderNotifications` realtime csatorna **2 másodpercenként flappel**: SUBSCRIBED → CLOSED → új csatorna → SUBSCRIBED → CLOSED. Ez azt jelenti, hogy jelenleg is **nem érkezik meg az „új rendelés" hangjelzés/popup** valós időben — csak a 30 másodpercenkénti sweep menti meg. Kazi Cintia hibás rendelése (ma) valószínűleg emiatt is „nem tűnt fel" időben.

**Ok (nagy valószínűséggel):** az `orders` tábla nincs benne a `supabase_realtime` publication-ben (vagy `REPLICA IDENTITY FULL` hiányzik). Ellenőrzöm SQL-lel, és ha kell, migrációval hozzáadom:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
```
Emellett a hookba egy „ha 3× egymás után < 5 másodperc alatt CLOSED-ol → nem retry-olom végtelenül" biztosíték, hogy ne pörögjön feleslegesen és ne szemetelje a logot.

---

## 1. AUDIT RIPORT — hol tűnhet el egy rendelés?

### A. Rendelés leadás (`src/pages/Checkout.tsx` + `submit-order` edge function)

| # | Súlyosság | Probléma |
|---|---|---|
| A1 | HIGH | **Dupla-klikk / retry:** ha a user gyorsan kétszer klikkel, két külön `submit-order` invoke indul. Van `isSubmitting` guard, de a network timeout után a user visszakattinthat és duplán megy le a rendelés. Hiányzik idempotency-key (session_id + cart hash). |
| A2 | HIGH | **Edge function timeout (kb. 60s):** ha a Resend email küldés belassul, az egész response elszáll — a rendelés `orders` táblába **be lehet menve**, de a klienst hibaüzenet fogadja → user újra próbálkozik → **duplikát rendelés**. Az email-küldést a rendelés commit UTÁN, fire-and-forget kell futtatni. |
| A3 | HIGH | **`order_attempts` insert csak akkor fut, ha a catch-ág eléri:** ha az edge function timeout/crash-el a főtörzsben (nem a try/catch-ben), akkor sem `orders`, sem `order_attempts` nincs — **teljesen néma vesztés**. Kliens oldali fallback: `supabase.functions.invoke` `error` esetén a klienst rögzítsen egy sort a `abandoned_carts`-ba minimum. |
| A4 | MEDIUM | **Kupon race:** `coupons.used_count` frissítés nem-atomikus (SELECT + `count+1` UPDATE, nem `SET used_count = used_count + 1`). Két egyidejű rendelés ugyanazzal a kuponnal → `max_uses` túllépés lehetséges. |
| A5 | MEDIUM | **`order_items` insert nem tranzakcionális az `orders`-szel:** ha `orders` sikerült, de valamelyik item insert elszáll (constraint / hálózat), a rendelés **tétel nélkül** jelenik meg. A compensations array csak az orders **előtti** lépésekre vonatkozik. Fix: rollback `orders` DELETE-tel is compensations-be. |
| A6 | MEDIUM | **`order_item_options` metadata hiba csendben ignorálva** (line 716-719): daily item beazonosítás elveszhet → a konyhán nem látszik, melyik napi ajánlathoz tartozik. |
| A7 | LOW | **Telefonszám normalizálás:** `+36` prefix mindig hozzáragadt, de az ország-előtag már benne lévő számokból (`+3630…`) `+36303006938150` keletkezhet. |
| A8 | LOW | **Discount `NOT NULL DEFAULT 0` van, de a frontendről `discount_huf` nélkül megy le a body →** csak azért nem hasal el, mert az edge function 0-t rak be. Sérülékeny. |

### B. Adatbázis triggerek

| # | Súlyosság | Probléma |
|---|---|---|
| B1 | HIGH | **`validate_order_date` `pickup_time IS NOT NULL AND pickup_time < NOW()` — a `NOW()` UTC-ben.** ASAP rendelésnél `pickup_time = NULL`, ok. De egy 10:30-ra jövő rendelést 08:31 UTC (= 10:31 Budapest) után lead egy vendég → `pickup_time (08:30 UTC) < NOW() (08:31 UTC)` → **elutasítva**. A vendég 1 perc késéssel „lejárt" időpontra fut. |
| B2 | MEDIUM | **`create_invoice_on_order_complete` trigger** kerekítés: ha `total_huf` páratlan → `net + vat ≠ gross` 1 Ft-ra. Kis hiba, ÁFA exportot elronthatja. |
| B3 | MEDIUM | Nem látok explicit `AFTER INSERT` triggert `orders`-en, ami frissítené a `customer_loyalty` counter-t — a hűségprogram csak akkor számol, ha a frontend külön hív, ami nem konzisztens. |

### C. Realtime & admin megjelenítés

| # | Súlyosság | Probléma |
|---|---|---|
| C1 | **CRITICAL** | **Realtime csatorna flappelés** (fent, 0. pont). |
| C2 | HIGH | `useRealtimeOrders` (a Staff Orders használja) **külön** csatornát nyit `orders-changes` néven — ha C1 fix után a channel név ütközik, két helyen kétszer megy le a hang. Konszolidálni kell. |
| C3 | MEDIUM | `OrdersManagement` a lekérésnél `.gte("created_at", thirtyDaysAgo)` — **30 napnál régebbi „bejövő" rendelés eltűnik** a Múltbeliből is. Nem gond most, de bekavarhat. |
| C4 | MEDIUM | Nincs `orders.archived=true` esetére dedikált szűrő az admin listán — a `filter(o => !o.archived)` implicit; ha ez elmarad, archivált rendelések a top-on maradnak. |
| C5 | LOW | Nincs periodikus **polling fallback** a rendelés listára (csak realtime): ha C1 fix után is bedől a socket, csak lapfrissítéssel jön elő új rendelés. Kellene 60s-os React Query refetch. |

### D. Sikertelen / félbehagyott listák
| # | Súlyosság | Probléma |
|---|---|---|
| D1 | HIGH | **A „Sikertelen" fülnél a vendég nem tudja, hogy megkaptuk a próbálkozását.** Nincs auto-email vagy staff értesítés — az admin csak akkor tudja meg, ha aktívan rákattint. |
| D2 | MEDIUM | `abandoned_carts` szűrő: `last_activity_at < now() - 5 min` — de nem tisztul automatikusan 30 nap után csak manual RPC hívás után (`cleanup_old_order_tracking`), amit nem hív senki. |

---

## 2. KONKRÉT FIXEK (a plan-be sorolva prioritás szerint)

### Kritikus (most)
1. **Realtime publication** — SQL check + migráció ha kell (`orders` táblát a `supabase_realtime` publikációba, `REPLICA IDENTITY FULL`).
2. **Flap-védelem** a `useGlobalOrderNotifications`-ben: ha 3× < 5s alatt CLOSED, 60s cooldown + toast az adminnak („Valós idejű értesítés szünetel — 60s múlva újrapróbál").
3. **Email küldés post-commit + fire-and-forget** a `submit-order`-ben (`orders` és `order_items` sikeres insert után nem `await`-eljük az emailt). Megelőzi az A2 timeout okozta duplikátumot.
4. **Order compensations kiterjesztése**: ha `order_items` insert elszáll, DELETE `orders` és rollback minden készletet.
5. **Idempotency-key** a `submit-order`-ben: `session_id + hash(items+customer)` — ha 60 másodpercen belül ugyanaz jön, visszaadjuk az előző `orders.id`-t, nem hozunk létre másodikat.

### Fontos (ugyanabban a körben)
6. **Kupon `used_count`** SQL-oldalon atomikusan (`UPDATE coupons SET used_count = used_count + 1`).
7. **`validate_order_date` B1 fix**: `pickup_time < NOW() - INTERVAL '5 minutes'` (5 perc grace).
8. **Kliens fallback** `submit-order` hiba esetén: rögzíts sort az `abandoned_carts`-ba a kosárral + hibaüzenettel (ne csak a szerver oldali `order_attempts`).
9. **React Query polling fallback** az `OrdersManagement`-nek: `refetchInterval: 60_000`, `refetchOnWindowFocus: true` — realtime kiesés esetén max 60s késés.
10. **`order_item_options` metadata hiba** — ne swallow, ha daily item és nem sikerül a metadata mentés, jelezze staff-nek egy `admin_notes` bejegyzéssel („Rendelés #ABC1234 daily-item hivatkozás hiányzik — kézzel ellenőrizd").

### Admin UX átdolgozás
11. **Fejléc-sáv a listán:** ma X db új / Y db készül / mai átvételre Z db összesen — vizuális kompakt tábla a lista tetején (nem kártyák tömkelege).
12. **„Sürgős" kiemelés:** ha átvétel < 30 perc + `status='new'` → piros badge „SÜRGŐS" + felül tartás a listán (sorting override).
13. **Idővonalas sorbarendezés:** a mai rendelések átvétel-idő szerint (nem leadás szerint) rendezve, hogy staff sorban készíthesse; új tab: „**Ma átvétel szerint**".
14. **Keresés (kód / név / telefon)** az admin lista tetején — jelenleg csak fül-szűrés van.
15. **Tömeges műveletek:** checkbox-szal kijelölhető rendelések → "Készítés alatt / Kész / Archiválás" gombok.
16. **„Ismétlődő vendég" chip:** ha a telefonszám már szerepel legalább 3 rendelésben, egy kis „🔁 Törzsvendég (7×)" chip a névhez.
17. **Sikertelen fül badge:** ha van olvasatlan sikertelen próbálkozás, a fül nevén piros pötty + szám.
18. **Notes gyors-szerkesztés:** kártyán inline szerkeszthető megjegyzés (Enter-mentés), ne kelljen dialógusba menni.
19. **Print / KDS-nyomtatás:** a lista tetején „Ma minden új rendelés nyomtatása" gomb (a print már van, csak batch-elve).
20. **Mobil kártya optimalizálás:** az összes akció-gomb egyetlen `⋯ Több` menübe, hogy a kártya legfeljebb 3 gombot mutasson mobilon; sticky státusz-váltó a kártya jobb alsó sarkában.
21. **Konzol log zaj:** a `[Notifications]` logokat `import.meta.env.DEV` mögé rakni, hogy prod-ban ne öntse el a konzolt.

### Kényelmi (később)
22. Rendelés-részletek külön side sheet-ben (ne accordion), hogy egyszerre több rendelést tudj összehasonlítani.
23. „Vissza-hívás" gomb a sikertelen listán → CallLog `admin_notes`-ba log.
24. Napi PDF export „mai átvételek időrendben" (staff kinyomtathatja).

---

## 3. Végrehajtási sorrend (ha jóváhagyod)

**Kör 1 (kritikus + fontos, egy commit):** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 — backend + edge function + 1 hook fix.
**Kör 2 (UX átdolgozás, külön commit):** 11–21.
**Kör 3 (opcionális kényelmi):** 22–24, akkor csinálom, ha kéred.

---

## Kérdések / feltételezések
- **Feltételezés:** a realtime flap oka a publikáció hiánya. Ha SQL check megcáfolja, akkor RLS auth-probléma és külön diagnózis kell (JWT szintű Realtime authorization). Erre visszatérek build módban.
- **Feltételezés:** az idempotency-key-t 60 másodpercig őrzöm egy új `order_idempotency` táblában (`key text primary key, order_id uuid, expires_at`) — kell ez, vagy elég egy in-memory Deno Map (server restart törli)? Alap: DB-alapú, robosztus.
- A háttérben még fut egy részletesebb audit-agent; ha visszatér, apró finomításokat teszek a listához, de a fenti prioritások nem változnak.

**Jóváhagyod így, vagy vegyünk ki / tegyünk hozzá pontot Kör 1-hez?**
