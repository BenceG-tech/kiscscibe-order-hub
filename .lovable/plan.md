
# Rendelés-audit v2 — mit néztem át és mit javítok

Az előző körben javítottam a napi menü elutasítást, duplakattintást, 30s timeout retry-t, egységes nyitvatartást, ASAP validációt. Most **mindent újra átnéztem** (Checkout.tsx, submit-order edge function, DB függvények, indexek, publikációk, RLS, CORS, hookok, Resend). Öt új, valós hibaforrást találtam, amelyek pont a "rendelés nem jön be / nincs email" tünetet okozhatják.

---

## Új kritikus problémák

### 1. [KRITIKUS] Idempotencia kulcsra NINCS unique index
A `submit-order` pre-check-el keres, majd insert. Két gyors kérés között **ugyanaz az `idempotency_key` átcsúszhat két külön `orders` sorba** → két rendelés, két email, kapacitás/adag kétszer levonva. A 23505 dedup ág sem sülhet el, mert nincs constraint.

**Fix:** migrációban `CREATE UNIQUE INDEX orders_idempotency_key_uniq ON orders (idempotency_key) WHERE idempotency_key IS NOT NULL`.

### 2. [KRITIKUS] `abandoned_carts.session_id` unique constraint hiányzik → upsert csendben duplikál
A `on_conflict: 'session_id'` és a szerveroldali `upsert({...}, { onConflict: 'session_id' })` **constraint nélkül nem dedupál** — vagy hibát dob, vagy több sort hoz létre. Ezért lehet az adminban zavaros / hiányos „megkísérelt rendelés" nyoma.

**Fix:** `CREATE UNIQUE INDEX abandoned_carts_session_id_uniq ON abandoned_carts (session_id)`.

### 3. [KRITIKUS] Realtime értesítés kieshet — admin nem lát új rendelést, pedig a DB-ben ott van
Az `orders` benne van a `supabase_realtime` publikációban, de a `useRealtimeOrders` hook **egyszer** iratkozik fel, nincs újracsatlakozás alvó laptop / hálózatváltás után, nincs polling fallback. Ez pontosan az a tünet, amit a tulaj látott: „nem érkezik meg az admin felületre" — miközben a DB-ben ott a rendelés.

**Fix a hookban** (kizárólag admin oldali kód, a rendelésfogadást nem érinti):
- Websocket lecsatlakozás → automatikus resubscribe.
- **30 másodperces polling fallback** (`SELECT * FROM orders ORDER BY created_at DESC LIMIT 20`) → ha realtime kiesik, akkor is bejön a lista.
- Ablak visszakapcsolás (`visibilitychange` = visible) → azonnali refetch.
- Hangriasztás + toast változatlan.

### 4. [KRITIKUS] Resend feladó domain lehet nem verifikált → NULLA email megy ki
A feladó `rendeles@kiscsibe-etterem.hu` (kötőjeles), a BCC viszont `info@kiscsibeetterem.hu` (kötőjel nélküli). A tulaj domainje `kiscsibeetterem.hu` — ha a Resendben csak ez a verifikált domain, akkor a `send()` némán 403-mal elhal (és fire-and-forget, a rendelés amúgy létrejön → tulaj panasza: „nem kap emailt").

**Fix:**
- Feladó átírása `rendeles@kiscsibeetterem.hu`-ra (a tulaj bejáratott domainje).
- BCC lista változatlanul `info@kiscsibeetterem.hu` + `gataibence@gmail.com`.
- Email hiba **naplózása** `abandoned_carts` diagnosztikába (`email_send_status`) — a tulaj a felületen lássa, ha bármi email nem ment ki.

### 5. Reggeli átvételi ablak sosem aktiválódik
A `cartIsBreakfastOnly` a `cart.items.every(it => it.is_breakfast === true)` alapján dönt, de **a kosárba tett tételekben `is_breakfast` sehol nem kerül beállításra** (kód-átvizsgálás igazolta). Emiatt reggeli-only rendelésnél is a 10:30–16:00 lunch ablakot kényszeríti — reggeli tételre 8:00-ra soha nem lehet átvételi időpontot foglalni.

**Fix:**
- `CartContext.tsx` / `DailyItemSelector` / `BreakfastSection` `addToCart` hívások: reggeli kategóriájú tételeknél `is_breakfast: true` a payloadban.
- Egyszerű detektálás: `menu_categories.slug` vagy `menu_categories.name` tartalmazza a „reggeli" szót → `is_breakfast: true`.

---

## Amit még átnéztem és rendben van

- **CORS**: mindkét custom domain (`kiscsibe-etterem.hu`, `kiscsibeetterem.hu`) engedélyezve, subdomain wildcard is.
- **Payment method whitelist**: `normalizePaymentMethod` levédi az ismeretlen értékeket → sosem lesz 23514 check constraint hiba.
- **Telefon normalizáció**: kliens + szerver oldalon egységesen `+36XXXXXXXXX`.
- **Rollback kompenzációk**: adag + kapacitás + kupon + rendelés törlés reverse order — helyes.
- **Idempotency 15-min bucket** kliens+szerver: rendben (csak a unique index hiányzik hozzá).
- **Email fire-and-forget + `EdgeRuntime.waitUntil`**: nem blokkolja a választ, jó.
- **ASAP + weekend + 15:30 cutoff + reggeli/ebéd ablak validáció**: mind a három rétegben (kliens, edge, DB trigger) egységes.
- **RLS `orders` INSERT**: csak service_role — edge function service key-jel ír, kliens sosem tud direkt beírni.

---

## Változtatások összefoglaló

**DB migráció (1 db):**
1. `CREATE UNIQUE INDEX orders_idempotency_key_uniq ON public.orders (idempotency_key) WHERE idempotency_key IS NOT NULL;`
2. `CREATE UNIQUE INDEX abandoned_carts_session_id_uniq ON public.abandoned_carts (session_id);` (előtte duplikátumok deduplikálása `MAX(last_activity_at)` alapján).

**Kód:**
- `src/hooks/useRealtimeOrders.tsx` — resubscribe + 30s polling + visibilitychange refetch.
- `supabase/functions/submit-order/index.ts` — feladó `rendeles@kiscsibeetterem.hu`; email status naplózás abandoned_carts diagnosztikába.
- `src/contexts/CartContext.tsx` (+ `BreakfastSection.tsx` / `DailyItemSelector.tsx` addToCart hívók) — `is_breakfast: true` a reggeli kategóriás tételekre.
- `src/data/adminChangelog.ts` — új v-es bejegyzés.

**Verifikáció:**
- Playwright: teljes menü rendelés → DB `orders` sor + admin realtime toast lejön 5s-en belül.
- Kézi: laptop 2 percre elalvasztás → visszaébredés után polling fallback behúzza az új rendelést.
- Resend: éles email teszt `rendeles@kiscsibeetterem.hu` feladóval, sikeres delivery log.
- DB: `SELECT indexdef FROM pg_indexes WHERE indexname IN ('orders_idempotency_key_uniq','abandoned_carts_session_id_uniq')` visszatér.

**Kockázat:** minimális. Az idempotency unique index ütközne, ha a jelenlegi `orders` táblában lennének azonos `idempotency_key`-jű sorok — a migráció a NULL-ekre nem vonatkozik, és a nem-null kulcsok között az elmúlt hónapokban nincs duplikátum (ellenőriztem).

Jóváhagyás után indul az implementáció.
