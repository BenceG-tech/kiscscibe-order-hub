
# Mély audit — rendelés-folyam + automatikus emailek

Egy nagy futam, de belül szigorú fegyelem: **egyszerre egy hiba** (diagnózis → bizonyíték → minimális fix → verifikáció → tovább). Semmi destruktív, minden teszt-rendelés `TESZT` névvel, futás végén törlöm őket (orders + order_items + order_item_options + esetleg invoices), de az `email_send_log` sorokat **bizonyítéknak meghagyom**. Vevői email mindig `gataibence@gmail.com`.

## Munkarend (fázisok)

### F0 — Előkészítés (read-only)
- `submit-order/index.ts` teljes végigolvasása: minden `return`, `catch`, feltétel felsorolása → **email-ág lefedettségi mátrix** (mely ágon van/nincs `email_send_log` insert).
- `validate_pickup_time` DB függvény + frontend időpont-választó + publikus nyitvatartás-szöveg **három-oldali összevetés**.
- Anon RLS gyors ellenőrzés `orders`, `order_items`, `order_item_options`, `capacity_slots`, `daily_offers`, `menu_items`, `coupons`, `abandoned_carts` táblákra (mit lát/ír egy nem-belépett vevő).
- DNS lekérdezés kívülről (nem dashboard!): `dig TXT kiscsibeetterem.hu`, `dig TXT resend._domainkey.kiscsibeetterem.hu`, `dig TXT _dmarc.kiscsibeetterem.hu` — SPF/DKIM/DMARC állapot.

### F1 — Élet-jelzés (1 rendelés, minden csatorna zöld?)
- **E2** (email-lel) elsőnek Playwright-tal, inkognitó, `http://localhost:8080` alól. Ha ez nem zöld, minden más másodlagos: itt megáll, javít, tovább.
- Bizonyíték: DB sor, `email_send_log` 3 sora, Resend message ID-k, admin oldal Realtime console log (1 esemény), új ikonok állapota.

### F2 — E1–E9 futtatása egyenként
Minden teszt külön Playwright script `/tmp/browser/<slug>/`. Sorrend:
1. **E1** — email nélkül (skipped log-ág)
2. **E3** — dupla-klikk (idempotencia)
3. **E4** — időhatárok (07:00 / 16:00 / 15:59 / 06:59 / szombat / múlt) — csak a hibaüzenet-minőséget nézem, a szabályt nem írom át
4. **E5** — ASAP este 21:00 után (mit lát a vevő?)
5. **E6** — napi menüs tétel (portion csökken)
6. **E7** — kupon: aktív TESZT-prefixű kupont insert-ttel felveszek, tesztelek, törlöm
7. **E8** — XSS a névben + hosszú megjegyzés + emoji → admin DOM + email HTML **escape** ellenőrzés (ez a kritikus, mert a jelenlegi email-render kézzel épített stringből dolgozhat)
8. **E9** — telefonformátumok normalizálása

Minden E-hez táblázatsor: várt / tényleges / DB / log / admin.

### F3 — Email mély audit
- Kód-út lefedettségi táblázat (F0-ból).
- Resend válasz-idézetek minden send-hez (message ID vagy status/body).
- DNS jelentés SPF/DKIM/DMARC — hiány esetén **FEJLESZTŐI TEENDŐ** pontos rekord-értékekkel (Resend dashboardból másolandó, én csak a szükségességet jelzem).
- Email HTML minőség: méret (Gmail 102KB), subject-formátum, mobil-olvashatóság (screenshot Playwright-tal iPhone viewporttal renderelve egy Gmail-szerű keretben — vagy csak forráskód-inspection).
- `EdgeRuntime.waitUntil` időzítés: submit-order edge log timestampek — response-kiadás vs. Resend send.

### F4 — Admin oldal
- K1 verifikáció: `/admin/orders` nyitva, teszt-rendelés, console-ban **pontosan 1** `[Notifications]` (vagy hasonló) log.
- Új `EmailStatusBadge` ikonok — E1 (skipped szürke) és E2 (sent zöld) mind a két helyen (admin + customer).
- Státusz-váltás (elfogadva/kész) továbbra is működik.
- Pickup time megjelenítés Europe/Budapest.

### F5 — Business rule konzisztencia
- 3-oldali összevetés eredménye. Ha eltérés van: **frontend igazítása a triggerhez** (szigorúbb) — ez az egyetlen ág ahol business-rule kódot módosíthatok, mert a trigger a végső védvonal és a frontend-eltérés csendes elhalás forrása volt. Végleges szabály maga = **TULAJDONOSI DÖNTÉS KELL**.

### F6 — Resilience
- Resend 500 szimuláció: **izolált teszt-hívás** rossz Bearer kulccsal a gatewayhez (nem az éles secret átírásával) → verifikálom hogy a `submit-order` a hibát `email_send_log/failed` sorként rögzíti és a rendelést nem borítja.
- `gen_order_code` kód-tér elemzése (26 × 100000 = 2.6M, születésnap-paradoxon számítás forgalommal).
- Kliens-óra eltérés: 10 perc siet — a `validate_order_date` triggernek van 5 perc grace-je, tehát 10 perc siet OK a felhasználónak, 10 perc késik → a validáció DOB-e érvényes rendelést? Playwright-tal `Date.now` override.
- Autofill: `autocomplete="tel"` / `email"` a checkout mezőkön.
- `/order-confirmation` frissítés-túlélés (URL param vs. state).
- Rate limit: kód-review — van-e bármi limit (Supabase edge default nincs).

### F7 — Javítási ciklus (fegyelmezetten)
Minden talált hibára **külön** cikluson megyek végig:
1. **Diagnózis** — mi és hol (fájl+sor)
2. **Bizonyíték** — log/screenshot/DB-sor
3. **Minimális fix** — a lehető legkisebb változtatás
4. **Verifikáció** — ugyanaz a teszt zöldre fordul, a szomszédos tesztek nem törnek
5. **Csak utána** a következő hiba

Ha valami **üzleti döntést** igényel: NEM javítom, hanem **TULAJDONOSI DÖNTÉS KELL** címkével felírom.

### F8 — Takarítás
- Minden `TESZT` nevű rendelés + gyerekrekord DELETE-tel (invoice trigger nem fut mert csak `completed`-nél; ha mégis van invoice, azt is).
- `email_send_log` sorok **maradnak**.
- Verifikáció: `SELECT count(*) FROM orders WHERE name ILIKE '%TESZT%'` = 0.

## Kimenet (a válasz felépítése)

1. **Vezetői összefoglaló** — 5 mondat
2. **Teszt-mátrix** — E1–E9 + F3–F6 tételek, ✅/❌/⚠️ + 1 sor bizonyíték
3. **Proaktívan javított hibák** — fájl:sor, előtte/utána, verifikáció
4. **TULAJDONOSI DÖNTÉS KELL** — lista
5. **FEJLESZTŐI TEENDŐ** — Resend DNS pontos rekord-értékek, egyéb dashboard-only
6. **Takarítás igazolás** — count queryk
7. **Kiküldött teszt-emailek** — message ID + timestamp táblázat (telefonos ellenőrzéshez)

## Kockázat és korlát

- Playwright anon inkognitó `http://localhost:8080` alatt — a preview-től eltérően nincs auth injektálva, ez pont jó a vendég-flow-hoz. Admin oldal ellenőrzéséhez viszont `LOVABLE_BROWSER_AUTH_STATUS` szerint járok el (ha `injected`, session restore; ha nem, admin-oldali teszteket kihagyom és jelzem).
- Nem módosítok DB-triggert, nem nyúlok éles secrethez, nem futtatok `pg_dump`-ot.
- Ha bármelyik ciklus 3× beragad ugyanabba a hibába → megállok, jelentek, kérdek.

Ha oké, indítom F0-val.
