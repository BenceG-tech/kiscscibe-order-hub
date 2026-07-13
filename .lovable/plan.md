Köszönöm a nyitvatartás pontosítást. Most már **egy forrásból** tudom kezelni az egész rendszert.

## Nyitvatartási szabályok (véglegesítve)

| Napszak | Mit lehet | Mikor |
|---|---|---|
| **Reggeli átvétel** | Csak reggeli tételek | H–P 07:00–10:00 |
| **Ebéd átvétel** | Ebéd / napi menü tételek | H–P 10:30–16:00 |
| **Mai napra rendelés cutoff** | Aznapra még leadható | 15:30-ig |
| **15:30 után** | Csak másnaptól előrendelés | — |
| **Hétvége** | Zárva, semmi nem rendelhető | Szo–V |

Ezt az `openingHours.ts` modulba égetem be konstansként (később könnyen áthelyezhető a `settings` táblába, de a mostani fix üzemidőnél felesleges).

---

## Amit javítok — fontossági sorrendben

### 1. [KRITIKUS] Napi teljes menük fix (DB migráció)
Az `update_daily_portions` függvény jelenleg elutasít **minden** `daily_offer_menus` táblás hívást (`'Invalid table name'` hibával). Ez azt jelenti, hogy **a leves + főétel csomag rendelések 100%-a csendben elbukik hónapok óta**. Ez önmagában megmagyarázza a 20-30 000 Ft-os elveszett rendeléseket. Egy migráció, `daily_offer_menus` ág hozzáadása ugyanazzal a `FOR UPDATE` lock mintával mint a másik két ág.

### 2. [KRITIKUS] Duplakattintás-védelem + retry hálózati hibára
- `useRef` alapú `submissionLock` — az első kattintáskor azonnal blokkol, még a React state update előtt (a mostani `disabled={isSubmitting}` háromszor is elsülhet gyors kattintásra).
- `AbortController` 30 másodperces timeout — a vendég ne várjon némán percekig.
- **Hálózati hiba esetén**: piros doboz „A rendelést nem sikerült elküldeni. Ellenőrizd az internetet és próbáld újra." + újra aktív gomb, de **ugyanazzal az idempotencia kulccsal** → ha a backend mégis megkapta, nem lesz duplikáció.
- Sikeres válasz után a gomb végleg tiltva marad, redirect az `OrderConfirmation`-re.

### 3. Egységes nyitvatartás minden rétegben
- Új `src/lib/openingHours.ts` a fenti szabályokkal:
  - `isBreakfastPickupAllowed(datetime)` — 07:00–10:00
  - `isLunchPickupAllowed(datetime)` — 10:30–16:00
  - `canOrderForToday(now)` — false ha aznap már ≥15:30
  - `getEarliestPickup(now)` — visszaadja a legkorábbi valid slotot (mai 15:30 előtt: most+puffer; utána: holnap 07:00 / 10:30)
- A `Checkout.tsx` és `submit-order/index.ts` innen olvas — vége a három különböző implementációnak.
- A `validate_pickup_time` DB triggert is frissítjük: 07:00–16:00 valid, de a business logika a kosár tartalmától függően szűkíti (reggeli vs ebéd) az edge functionben.
- **A 15:30 cutoff-ot** a Checkout időpont-választóban is érvényesítjük: 15:30 után a „Ma" opció eltűnik, csak holnap+ marad.

### 4. Minden validációs hiba nyoma megmarad
Jelenleg a `handleSubmit` korai return-jei (rossz telefon, hiányzó név, nincs időpont, több napi dátum) csak toast-ot dobnak és **semmi** nyoma nincs az adminnak. Innentől:
- Minden ilyen `return` előtt egy `persistCheckoutSnapshot('validation_blocked', errorMessage)` hívás.
- A `submit-order` edge function `catch` ágai szintén írnak `abandoned_carts`-ba service role key-jel — még ha az idempotencia vagy készlet check dob, akkor is látszik az adminban.
- A `FailedAndAbandoned` admin panel új „Utolsó 24 óra próbálkozásai" kártya: összes próbálkozás, top 3 hibaüzenet, gyors szűrők.

### 5. Idempotencia időablak — ne veszítsünk el legitim ismétlő rendeléseket
Jelenleg az `idempotency_key` **örökre** globálisan egyedi. Ha ugyanaz a vendég 20 perccel később ugyanazt a kosarat rendeli, csendben az első rendelés kódját kapja vissza. Fix: a kulcshoz hozzáfűzünk egy 15-perces időbucket-et (`Math.floor(Date.now() / (15*60*1000))`). Gyors dupla kattintás → dedupál. 15 perc után új rendelés → átmegy.

### 6. ASAP rendelés is validálódik
Ha `pickup_time` üres, a backend most simán átengedi. Innentől kötelezően lefuttatja az `openingHours` check-et — hétvégén / záráskor nem enged át rendelést, még ha a kliens hibásan is küldi.

### 7. UX finomhangolás — egyszerűbb, felhasználóbarátabb checkout
- **Telefon mező**: onBlur is normalizál (nem csak submit-kor), zöld pipa látszik ha helyes formátum.
- **Kosár összesítő**: kattintható, összecsukható lista a Checkout tetején — vendég lássa mit rendel.
- **Progressive form szekciók**: „1. Kapcsolat → 2. Fizetés → 3. Átvétel" külön blokkokban, checkmarkkal a kitöltötteken. Mobilon így sokkal átláthatóbb.
- **Ha nincs elérhető slot**: egyértelmű üzenet + „Rendelj holnapra" gomb, ne csendes zsákutca.
- **Fizetés választó**: nagy kártya-szerű radio (Készpénz átvételkor / Bankkártya átvételkor), ikonokkal.

### 8. Élesítés + verifikáció
- Publikálás custom domainre.
- Playwright teszt matrix: teljes menü + POS, egyedi napi menü + készpénz, `+36 30…` és `06 30…` telefonformátum, duplakattintás (pontosan 1 rendelés).
- 15:30 utáni teszt: mai opció eltűnik, holnapra átengedi.
- DB-ben ellenőrzés: `orders` új sor + `abandoned_carts.step = submit_success` konvertálva.

---

## Technikai részletek (fejlesztőnek)

**Új fájlok:**
- `supabase/migrations/…_fix_update_daily_portions_and_pickup_hours.sql` — `update_daily_portions` `daily_offer_menus` ág + `validate_pickup_time` frissítés 07:00–16:00-ra.
- `src/lib/openingHours.ts` — egyetlen forrás a nyitvatartási / cutoff logikára.

**Módosított fájlok:**
- `src/pages/Checkout.tsx` — `submissionLock` ref, `AbortController`, minden early-return `persistCheckoutSnapshot('validation_blocked')`, `network_error` retry doboz, progressive form szekciók, 15:30 cutoff a date pickerben, kosár-összesítő fejléc.
- `src/hooks/useAbandonedCartTracking.tsx` — `logValidationBlock(reason)` helper, alacsonyabb hasContact küszöb.
- `src/components/admin/orders/FailedAndAbandoned.tsx` — „Utolsó 24 óra" statisztika kártya.
- `supabase/functions/submit-order/index.ts` — inline másolt `openingHours` logika (edge function nem tud `src/`-ből importálni), idempotencia 15-perc bucket, ASAP kötelező `isOpenNow` check, `catch` ág mindig `abandoned_carts.submit_failed` service role-lal.

**DB migráció szükséges**: 1 db, csak függvény body-k (`CREATE OR REPLACE`). Nincs séma változás, visszaállítható.

**Kockázat**: minimális. A `daily_offer_menus` ág hozzáadása nem érinti a többi táblát. Az idempotencia kulcs formátum váltás → élesítés utáni első 15 percben egy vendég ugyanazzal a kosárral kétszer is le tudna adni rendelést, ami elfogadható (eddig semmi nem ment át teljes menüből, tehát tiszta nyereség).

---

Jóváhagyás után indulhat az implementáció.