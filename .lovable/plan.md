## Amit most bizonyítottan látok az adatbázisban

- Utolsó sikeres rendelés: **2026-07-02**. Azóta 11 nap alatt **egyetlen** rendelés sem érkezett.
- `abandoned_carts`: **teljesen üres** — nincs nyoma egyetlen "submit_attempt", "validation_blocked" vagy "submit_failed" sornak sem.
- `order_attempts`: utolsó bejegyzés is **2026-07-02** (payment_method=`card`, "Rendelés mentési hiba").
- `submit-order` edge function logok: **nincs friss hívás** (`No logs found`).

Ez azt jelenti, hogy a vendégek **el sem érnek a backendig**, és a beépített tracking sem lát semmit. Ennek gyakorlatilag csak két oka lehet:

1. **A publikus/custom domain (`kiscsibe-etterem.hu`) még a régi, hibás checkout kódot szolgálja ki** — a júliusi javítások soha nem lettek élesítve. Ez a legvalószínűbb.
2. Van egy csendes JS hiba a publikus buildben, ami megakadályozza a submit lefutását, még a tracking előtt.

Ehhez jönnek másodlagos, de valós zsákutcák a jelenlegi checkoutban is.

## A gyökérokok, amiket most javítunk

### A. Publikálási/verzió-rés (elsődleges gyanú)
- A `useAbandonedCartTracking` és `persistCheckoutSnapshot` már bőven ír, de nulla sor keletkezik → a vendégek nem ezt a kódot futtatják.
- Meg kell erősíteni éles felől: build hash, `submit-order` verzió, DevTools-ban látszó `abandoned_carts` fetch a publikus domainen.

### B. Késői napi menü zsákutca (bizonyított logikai hiba)
- `fetchTimeSlots` szűrője kizár minden slotot, ami `<= most + 15 perc`.
- Ha valaki 14:45 után a mai napi menüt teszi kosárba, `dailyDates = [ma]`, a `targetDates` **csak** a mai napot tartalmazza → nulla slot, `pickup_type=scheduled` kényszerítve, `pickup_time` üres → soha nem lehet leadni.
- A backend viszont még 15:00-ig fogadná — ez frontend-only zsákutca.

### C. Session/idempotencia normalizáció
- Az idempotencia kulcs a nyers `customer.phone` mezőt használja, a frontend viszont `+36<normalizált>` alakot küld, de a régi cache-ből érkező kliens `+36 30 …` szóközös alakot is küldhet → két retry két külön kulcsot ad, duplikált rendelés keletkezhet.
- Kell egy egységes szerveroldali telefon-normalizálás az idempotencia kulcs képzésekor.

### D. Silent RLS/anon insert kockázat
- Az `abandoned_carts` INSERT policy megköveteli, hogy a `session_id` egyezzen a `x-session-id` fejléccel. A tracking küldi a headert, de ha bármelyik réteg (CDN, proxy) leszedi, minden insert csendben elbukik → láthatatlanul veszítünk el minden nyomot.
- Kell egy szerveroldali fallback út: az `submit-order` edge function is írjon `abandoned_carts` sort minden bejövő próbálkozásra (submit_attempt) és minden hibára (submit_failed), service role kulccsal — így soha nem tűnhet el a nyom.

### E. Fizetési mód konzisztencia
- `orders_payment_method_check` engedi: `cash`, `pos`, `card_online`.
- A UI csak `cash` és `pos` opciót kínál. A régi kliensek `card` értéket küldhetnek → a backend már normalizálja `pos`-ra, de a `card_online` út nincs karbantartva és nincs UI-ban.
- Nem hozunk vissza online fizetést — csak biztosítjuk, hogy minden bejövő érték biztonságosan `cash`/`pos`-ra normalizálódjon, és semmi ne akadjon el rejtett check-constraint hibán.

### F. Telefon-mező tapasztalati botlások
- A `+36` prefix fixen látszik, de a `+` karaktert az onChange kiszűri, így a beillesztett `+36 30 …` érték `36 30 …`-vé válik és `normalizeHungarianPhone` ezt már kezeli — jó.
- Viszont ha valaki a `+36` prefix mellé `+3630…` alakot ír, vizuálisan `+36+3630…` látszik. A submit ettől még leadja a rendelést, de a UX zavaró és pánikot okoz. Kell egy szelídebb, csak-számokra szűrő + tippszöveg.

### G. Kosár + napi ajánlat kombinációk
- Ha a kosár két különböző dátumú napi ajánlatot tartalmaz, a submit teljesen blokkol egy piros szalaggal, de nincs egy-kattintásos "Távolítsd el az egyiket" gomb.
- Kell egy gyors CTA, ami vagy a régebbi napi tételt tartja meg, vagy a felhasználót visszaviszi a kosárba.

## Javítási terv (kód + élesítés)

### 1. Élesítési sanity check és kényszerű publikálás
- A javítások után **azonnal publikálunk** a custom domainre. Ha nem publikáljuk, mindez hatástalan.
- Nyitunk egy `/admin` alatt látható "utolsó publikált build ideje" jelzést a `AdminUpdatesBanner`-be, hogy a tulaj bármikor le tudja ellenőrizni, éles-e a legfrissebb kód.

### 2. Késői napi menü fallback (B pont)
- Ha a `dailyDates` csak a mai napot tartalmazza és minden mai slot lejárt a +15 perc puffer miatt:
  - Automatikusan felajánljuk a **most azonnali** átvételt (ASAP), ha Budapest-idő szerint még 15:00 előtt vagyunk.
  - Ha az ASAP is tiltott, mutassunk egy egyértelmű üzenetet ("Ma már nem tudunk új rendelést fogadni") ahelyett, hogy csendes zsákutcába vinnénk.
- A +15 perces puffert 10 percre csökkentjük a UI oldalon, hogy ne veszítsünk el használható slotot.

### 3. Szerveroldali telefon-normalizálás és idempotencia (C pont)
- `submit-order` elején egységesen normalizáljuk a `customer.phone` értéket ugyanazzal a logikával, mint a frontend: minden nem-számjegyet levágunk, `0036`/`36`/`06` prefixeket kezeljük, végül `+36<9-jegy>` alakra hozzuk.
- Az idempotencia kulcs a normalizált telefonszámmal képződjön → egy vendég két retry-a azonos kulcsot kap → duplikáció kizárva.

### 4. Szerveroldali abandoned_carts fallback (D pont)
- A `submit-order` a legelső biztos ponton (JSON parse után) írjon egy `submit_attempt` sort `abandoned_carts`-ba service role kulccsal, `session_id` és a kosár snapshot alapján.
- Bármelyik `throw` esetén a `catch` ág frissítse ezt a sort `submit_failed` állapotra, a konkrét hibaüzenettel.
- Így akkor is látjuk a próbálkozást, ha a kliens oldali tracking headere elveszik útközben, vagy a vendég böngészője azonnal bezárul.
- A meglévő `order_attempts` táblát külön is töltjük hibaesetekre, a mostani logika szerint.

### 5. Fizetési mód biztonsági háló (E pont)
- A `submit-order` az elején fehérlistát alkalmaz: `cash` és `pos` mennek át; `card` → `pos` (már megvan); minden más `payment_method` → `cash`-re esik vissza + figyelmeztetés a logban, hogy soha ne bukjon check-constraint miatt.
- A UI-ban a jelenlegi két rádiógomb marad ("Készpénz átvételkor" / "Bankkártya átvételkor"), egyértelmű címkékkel, alapértelmezetten `cash`.

### 6. Checkout UX finomhangolás (F–G pont)
- A telefon mezőn:
  - Beviteli hint: "Csak a számokat írd, országhívó nem kell — pl. `30 123 4567`".
  - Az onChange végén, ha a bevitel `+36`-tal vagy `06`-tal kezdődik, csendben levágjuk.
- A "különböző dátumú napi ajánlatok" bannerhez adunk egy **"Vissza a kosárhoz"** gombot és egy **"Töröld a régebbit"** egykattintásos akciót.
- A "Rendelés leadása" gomb továbbra sem tiltható a felhasználó által látott validációk alapján — kattintáskor toast + inline hibaüzenet vezeti végig, hogy mit kell javítani. (Ez már így van, csak megerősítjük a szövegeket.)

### 7. Rendelési kísérletek admin láthatósága
- A `FailedAndAbandoned` panelen külön szekcióba kerülnek a `submit_attempt` (bejövő próbálkozás) és `submit_failed` (backend elutasította) sorok, az utóbbi mellett a konkrét hibaüzenettel.
- A rendeléskezelő tetején lévő "Figyelem" kártyán megjelenik az utolsó 24/72 óra próbálkozási száma, hogy azonnal látszódjon, ha ismét némán "eltűnnek" rendelések.

### 8. Ellenőrzés élesben
- A publikálás után Playwright + saját kézi teszt:
  - Név + `06 30 …` telefon + készpénz → sikeres rendelés.
  - Név + `+36 30 …` telefon + POS → sikeres rendelés.
  - Késői (14:50) napi menü kosárban → felajánlott ASAP átvétel → sikeres rendelés.
  - Két különböző dátumú napi menü → egykattintásos feloldás → sikeres rendelés.
- DB ellenőrzés a teszt után:
  - `orders` táblában megjelennek az új sorok.
  - `abandoned_carts` mind a sikeres, mind a szándékosan hibás próbálkozásra tartalmaz sort.

## Technikai részletek (fejlesztőnek)

- **Frontend érintett fájlok:** `src/pages/Checkout.tsx`, `src/hooks/useAbandonedCartTracking.tsx`.
- **Backend érintett fájl:** `supabase/functions/submit-order/index.ts` (telefon-normalizálás, szerver oldali `abandoned_carts` írás service role kulccsal, payment_method fehérlista).
- **Admin érintett fájl:** `src/components/admin/orders/FailedAndAbandoned.tsx`, `src/pages/admin/OrdersManagement.tsx`, `src/components/admin/AdminUpdatesBanner.tsx` (build/publish jelzés).
- **DB migráció nem szükséges** — az `abandoned_carts` táblán van `service_role` grant, a jelenlegi séma elég.
- **Élesítés:** kód javítás után `preview_ui--publish` a custom domainre. Enélkül semmi nem ér el a vendégekhez.

## Kockázat, amit vállalunk

- A szerveroldali `abandoned_carts` írás minden bejövő hívást kb. 1-2 plusz DB művelettel terhel — elhanyagolható.
- A telefon-normalizálás megváltoztathat régebbi rögzítési szokásokat (a rendelésekben mostantól konzisztensen `+36<9jegy>` formátum lesz), de a KDS és az admin nézet ezt már így kezeli.
