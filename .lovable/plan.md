

# Ugyfelelmenyt Novelo Funkciok — 5 uj fejlesztes

## Osszefoglalas

Ot uj funkcio az ugyfelek elmenynek javitasara es a visszatero vasarlok szamanak novelesere. Mivel a rendszer jelenleg anonim rendelest hasznal (nincs vevoi bejelentkezes), a megoldasok telefon + email alapu azonositasra epulnek.

---

## 1. Torzsvasarloi rendszer

**Cel:** X rendeles utan automatikus kedvezmeny/kupon generalas. A vendeg telefon + email paros alapjan van azonositva.

**Adatbazis migracio:**
- Uj tabla: `customer_loyalty`
  - `id` uuid PK default gen_random_uuid()
  - `phone` text NOT NULL (normalizalt, pl. +36...)
  - `email` text
  - `order_count` integer NOT NULL DEFAULT 0
  - `total_spent_huf` integer NOT NULL DEFAULT 0
  - `current_tier` text NOT NULL DEFAULT 'bronze' (bronze/silver/gold)
  - `last_order_at` timestamptz
  - `created_at` timestamptz DEFAULT now()
  - UNIQUE(phone)
  - RLS: service_role full access, public no access

- Uj tabla: `loyalty_rewards`
  - `id` uuid PK
  - `phone` text NOT NULL
  - `reward_type` text NOT NULL ('percentage_discount' | 'fixed_discount' | 'free_item')
  - `reward_value` integer NOT NULL
  - `coupon_code` text (ha kupon generalodott)
  - `is_claimed` boolean DEFAULT false
  - `triggered_at_order_count` integer NOT NULL
  - `created_at` timestamptz DEFAULT now()
  - RLS: service_role only

**Modositott fajlok:**
- `supabase/functions/submit-order/index.ts` — rendeles vegén:
  1. Upsert `customer_loyalty` rekord (order_count + 1, total_spent + amount)
  2. Ellenorzi milestoneokat (5., 10., 20. rendeles)
  3. Ha milestone: general kupon kodot a `coupons` tablaba es `loyalty_rewards`-ba menti
  4. A valasz tartalmazza ha van uj jutalom

- `src/pages/OrderConfirmation.tsx` — ha a submit-order valaszban van `loyalty_reward`:
  - Megjelenit egy szines kartya: "Koszonjuk a husegeted! 🎉 Uj kuponod: XXXXX (10% kedvezmeny)"

**Tier logika (submit-order-ben):**
- 5 rendeles: 5% kedvezmeny kupon
- 10 rendeles: 10% kedvezmeny kupon
- 20 rendeles: 500 Ft kedvezmeny kupon
- Minden 10. rendeles utan: 5% kedvezmeny kupon

---

## 2. "Kedvenc rendelesem" gomb

**Cel:** Ugyfel elmentheti korabbi rendeleset es egy kattintassal ujrarendelheti. localStorage-alapu (nincs bejelentkezes).

**Uj fajlok:**
- `src/hooks/useFavoriteOrders.ts` — localStorage hook
  - `saveFavorite(order)` — elmenti a rendelest: nev, tetelek (item_id, name, price, sides, modifiers), datum
  - `getFavorites()` — visszaadja az elmentett rendleseket (max 5)
  - `removeFavorite(id)` — torli az elmentettet
  - `reorder(favorite)` — betolti a kosarba (CartContext addItem-mel)
  - Kulcs: `kiscsibe-favorites`
  - Validacio: ujrarendeles elott ellenorzi, hogy a menu item-ek meg aktívak-e (is_active check)

- `src/components/FavoriteOrderButton.tsx` — "Mentes kedvencnek" gomb
  - Sziv ikon + felirat
  - Az OrderConfirmation oldalon jelenik meg a rendelesi osszesito alatt
  - Kattintasra menti az aktualis rendeles osszetevoit

- `src/components/FavoriteOrdersPanel.tsx` — Kedvencek panel
  - Az Etlap oldalon jelenik meg egy kicsi kartya: "Kedvenc rendelseid"
  - Lista: rendeles nev, tetelek osszefoglalas, osszeg
  - "Ujrarendeles" gomb: betolti a kosarba es atiranyit a checkout-ra
  - "Torles" gomb: eltavolitja a kedvencek kozul

**Modositott fajlok:**
- `src/pages/OrderConfirmation.tsx` — FavoriteOrderButton beillesztese az akciogombok koze
- `src/pages/Etlap.tsx` — FavoriteOrdersPanel megjelenitese a napi ajanlat felett (ha vannak mentett kedvencek)

---

## 3. Rendelesi elozmynyek

**Cel:** Email/telefon alapjan megtekinthetoek a korabbi rendelesek.

**Adatbazis:**
- Uj RPC fuggveny: `get_customer_orders(customer_phone text)`
  - SECURITY DEFINER, stabil
  - Visszaadja az utolso 20 rendelest: id, code, total_huf, status, created_at, pickup_time
  - Csak a phone alapjan szur (nem igenyel auth-t)

**Uj fajlok:**
- `src/components/OrderHistoryLookup.tsx` — komponens
  - Telefonszam mezo + "Kereses" gomb
  - RPC hivassal lekerdezi a korabbi rendleseket
  - Lista: datum, kod, osszeg, statusz badge
  - Kattintasra megnyitja a reszleteket (uj lapon: /order-confirmation?code=X&phone=Y)
  - Max 20 rendeles, rendezve datum szerint csokkenoen

**Modositott fajlok:**
- `src/pages/Etlap.tsx` — Uj szekci o az oldal aljan: "Korabbi rendelseid"
  - Collapsible/Accordion, alapbol zarva
  - Benne: OrderHistoryLookup komponens

---

## 4. Ertekeles rendeles utan

**Cel:** 1 oraval az atvétel után email: "Hogy izlett?" 1-5 csillag + szoveg.

**Adatbazis migracio:**
- Uj tabla: `order_ratings`
  - `id` uuid PK
  - `order_id` uuid NOT NULL UNIQUE
  - `rating` integer NOT NULL (1-5)
  - `comment` text
  - `created_at` timestamptz DEFAULT now()
  - RLS: insert barhonnan (anon), select admin-only

**Uj fajlok:**
- `supabase/functions/send-rating-request/index.ts` — Edge function
  - Bemenet: `{ order_id }`
  - Lekerdezi a rendelest
  - General egy egyedi tokent (order_id hash-elve)
  - Email: "Hogy izlett?" + 5 csillag link (1-5, mindegyik kulon URL)
  - Link: `{SITE_URL}/rate?order={order_id}&token={token}&rating=5`
  - A Google Review link is szerepel a levélben

- `src/pages/Rate.tsx` — Ertekeles oldal
  - URL param-bol kiolvassa az order_id-t, tokent, elozeteli ertékelést
  - Megjeleníti a csillagokat (1-5, kattinthato)
  - Opcionalis megjegyzes mezo
  - "Kuldés" gomb — insert `order_ratings`-ba
  - Sikeres kuldes utan: "Koszonjuk! 💛" + Google Review redirect link

**Modositott fajlok:**
- `supabase/functions/send-order-status-email/index.ts` — a `completed` status email-hez hozzaadja: "1 ora mulva kuldunk egy rovid kérdoivet"
- `src/App.tsx` — uj Route: `/rate` => Rate komponens
- `supabase/config.toml` — uj function szekci o

**Automatizalas:** A `send-order-status-email` function-ben, ha a status `completed`, beallítunk egy 60 perces keseltetést: a `completed` email elkuldese utan meghivja a `send-rating-request` edge function-t (vagy pg_cron schedule-t hasznalunk a kozeljovoben esedékes ratingekre).

---

## 5. PWA push ertesites

**Cel:** "A rendelesed elkeszult!" + napi menu ertesites — nem kell emailt nezni.

**Uj fajlok:**
- `public/manifest.json` — PWA manifest
  - name: "Kiscsibe Rendelés"
  - short_name: "Kiscsibe"
  - start_url: "/etlap"
  - display: "standalone"
  - theme_color, background_color, icons (a meglevo logok)

- `public/sw.js` — Service Worker (minimal, cache-first statikus fajlokra + push event handler)
  - `push` event: notification megjelenitese
  - `notificationclick` event: megnyitja az etlapot vagy rendelest

- `src/hooks/usePushNotifications.ts` — hook
  - `requestPermission()` — megkeri az engedelyt
  - `subscribe()` — PushManager.subscribe(), elkuldi a subscription-t a szervernek
  - `unsubscribe()` — leiratozas
  - Megegyszer: a subscription endpoint-ot elkuldi egy Edge Function-nek

- `supabase/functions/register-push/index.ts` — Edge function
  - Fogadja a push subscription-t (endpoint, keys)
  - Elmenti a `push_subscriptions` tablaba (phone-hoz kotve)

**Adatbazis migracio:**
- Uj tabla: `push_subscriptions`
  - `id` uuid PK
  - `phone` text NOT NULL
  - `endpoint` text NOT NULL UNIQUE
  - `keys_json` jsonb NOT NULL
  - `created_at` timestamptz DEFAULT now()
  - RLS: service_role only

**Modositott fajlok:**
- `index.html` — manifest link + service worker regisztracio script
- `src/pages/OrderConfirmation.tsx` — "Ertesitesek bekapcsolasa" gomb, ha a bongeszo tamogatja
- `supabase/config.toml` — uj function

**Megjegyzes:** A push notification kuldese a `send-order-status-email` edge function-bol tortenik: a status valtozas utan nem csak emailt kuld, hanem push notification-t is (ha van subscription az adott telefonszamhoz). Ehhez VAPID kulcsok szuksegesek (uj secret-knt: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

---

## Erintett fajlok osszesitese

| Fajl | Muvelet |
|------|---------|
| Migracio: `customer_loyalty` + `loyalty_rewards` | UJ |
| Migracio: `order_ratings` | UJ |
| Migracio: `push_subscriptions` | UJ |
| DB RPC: `get_customer_orders` | UJ |
| `supabase/functions/submit-order/index.ts` | Modositas (loyalty logika) |
| `supabase/functions/send-order-status-email/index.ts` | Modositas (push + rating trigger) |
| `supabase/functions/send-rating-request/index.ts` | UJ |
| `supabase/functions/register-push/index.ts` | UJ |
| `supabase/config.toml` | Modositas (2 uj function) |
| `src/hooks/useFavoriteOrders.ts` | UJ |
| `src/hooks/usePushNotifications.ts` | UJ |
| `src/components/FavoriteOrderButton.tsx` | UJ |
| `src/components/FavoriteOrdersPanel.tsx` | UJ |
| `src/components/OrderHistoryLookup.tsx` | UJ |
| `src/pages/Rate.tsx` | UJ |
| `src/pages/OrderConfirmation.tsx` | Modositas (kedvenc + push + loyalty) |
| `src/pages/Etlap.tsx` | Modositas (kedvencek panel + elozmynyek) |
| `src/App.tsx` | Modositas (uj /rate route) |
| `public/manifest.json` | UJ |
| `public/sw.js` | UJ |
| `index.html` | Modositas (manifest + SW) |

## Implementacios sorrend

1. **Adatbazis migraciok** — 3 uj tabla + 1 RPC fuggveny
2. **Kedvenc rendelesem** — tisztan kliens oldali (localStorage), legkisebb kockazat
3. **Rendelesi elozmynyek** — RPC + UI komponens
4. **Torzsvasarloi rendszer** — submit-order bovites + OrderConfirmation UI
5. **Ertekeles rendeles utan** — uj edge function + Rate oldal
6. **PWA push ertesites** — manifest + SW + push subscription + VAPID

## Fontos megjegyzesek

- A torzsvasarloi rendszer es az elozmynyek telefon alapjan azonositanak — nincs szukseg bejelentkezesre
- A kedvencek localStorage-ban tarolodnak, igy eszkoz-fuggoek (de nincs szukseg auth-ra)
- A push notification-hoz VAPID kulcsok szuksegesek — ezeket uj secretkent kell beallitani
- Az ertekeles oldal publikusan elerheto (token-nel vedve), nem igenyel bejelentkezest
- A `get_customer_orders` RPC SECURITY DEFINER, igy nem fedi fel mas vendegek adatait — csak a sajat telefonszammal lekerdezhetok

