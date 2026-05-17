# 🐥 Kiscsibe Order Hub — Teljes körű audit jelentés

**Dátum:** 2026. május 17.
**Tesztkörnyezet:** Preview (391×844 mobil + 1223×854 desktop), bejelentkezve `gataibence@gmail.com` (owner)

---

## ✅ Mi működik kifogástalanul

### Publikus felület
- **Főoldal** — Hero, USP, napi ajánlat, fix tételek teaser, promo, gallery preview, reviews (5★), FAQ, map, newsletter, footer mind betölt, animációk simák.
- **Étlap** (`/etlap`) — `WeeklyDateStrip` hibátlan navigáció (hétfő-péntek), napi menü 2200 Ft, kombó preview, fix tételek `#mindig-elerheto` anchorral.
- **Kosárba rakás** — Toast visszajelzés („Menü hozzáadva a kosárhoz"), badge frissül a fejlécben.
- **CartDialog** — Mennyiség módosítás, ürítés, „Tovább a fizetéshez" navigáció.
- **Checkout** — `Minél hamarabb` opció **helyesen letiltva** ha zárva van, „Napi ajánlat miatt csak 2026. máj. 18-án lehet átvenni" üzenet pontos, +36 telefon prefix, validáció működik.
- **Cookie banner + bottom nav** — Z-indexek nem ütköznek (cookie `bottom-[72px]`).

### Backend
- **Realtime értesítés** — Console log: `✅ Successfully subscribed to order-notifications`, 39 meglévő rendelés betöltve.
- **Auth + RBAC** — `owner=true, admin=true` helyesen detektálva, ProtectedRoute működik.
- **DB** — 776 menü tétel, 47 napi ajánlat, 45 galéria kép, 6 számla, 2 kupon, 39 rendelés, 2 user.
- **Recent rendelések** — Az utolsó 10 rendelés mind valid státuszban (new/preparing/ready/completed/cancelled), nincs árva sor.

### Edge function-ök
- 17 edge function deploy-olva, az `submit-order` / `send-order-status-email` / `extract-invoice-data` mind szerepel a `config.toml`-ban helyes `verify_jwt` beállítással.
- `_shared/auth.ts` egységesen kezeli a `requireAdmin` / `requireAdminOrInternal` / `hasInternalSecret` flow-kat.

---

## ⚠️ Apró figyelmeztetések (nem kritikus)

| # | Mi | Hol | Severity |
|---|-----|-----|----------|
| 1 | React Router v7 deprecation warning (`startTransition`, `relativeSplatPath`) | console | Info — csak warning, működést nem érinti |
| 2 | Supabase linter: 16 db `SECURITY DEFINER` függvény publikusan/auth-userek számára EXECUTE-olható | DB | Low — ezek mind szándékosan publikusak (`is_admin`, `has_role`, `validate_coupon_code`, `get_customer_order_secure`, stb.) az auth flow-hoz. Memóriában dokumentált. |
| 3 | A `submit-order` és `send-order-status-email` log üres az elmúlt órákra (nincs új teszt rendelés ma) | edge logs | Info — utolsó forgalom 2026-04-28-án volt. |

---

## 🔴 Funkcionális bugok

**Nem találtam funkcionális bugot a teszt során.**

A korábbi körökben már javítva:
- ✅ AI képgenerálás auth fix (`invokeAuth.ts`)
- ✅ Security: edge function admin auth (`send-order-status-email`, `send-rating-request`, `submit-order`)
- ✅ `validate_order_date` trigger csak INSERT-re (state változás nem akad el)

---

## 💡 UX egyszerűsítési javaslatok

| # | Javaslat | Hatás |
|---|----------|-------|
| 1 | **Checkout: alapból a teljes név + email előtöltése** bejelentkezett usernek (`profiles` táblából). Jelenleg üresen kell kitölteni minden rendelésnél. | -2 kattintás / rendelés |
| 2 | **„Kosár ürítése" megerősítő dialog** — jelenleg egy kattintással eltűnik a teljes kosár. | Adatvesztés-védelem |
| 3 | **„Tovább a fizetéshez" gomb sticky a kosár-dialógban**, hosszú kosárnál görgetés után is látszik. | Mobil UX |
| 4 | **Napi menü inline kombó-választó** — most a kombó leves+főétel auto-fix; ha lenne 2-2 választás (pl. „választható leves"), az emelné a perceived value-t. | Differenciáció |
| 5 | **Order tracking link az emailben** — `/rendeles/{code}` publikus oldal, ahol a vevő kód+telefon nélkül láthatja a státuszt (1 kattintás az emailből). | Kevesebb support kérdés |
| 6 | **Admin Dashboard: „mai bevétel" + „nyitott rendelések" big number** — most a stat kártyák szerény méretűek. | Glance-ability |
| 7 | **Bulk státusz váltás** — több rendelést egyszerre `ready`-re állítani check-list módon. | Csúcsidős hatékonyság |
| 8 | **Email template editor admin felületen** — most a HTML hard-coded az edge function-ben. | Önkiszolgáló brandelés |
| 9 | **Hidden admin (5 kattintás) hint** — első alkalommal egy diszkrét tooltip („Tipp: admin belépéshez…"). | Onboarding |
| 10 | **WeeklyDateStrip hover preview desktopon** — egy kis tooltip a napi menü nevével. | Felfedezhetőség |

---

## 🚀 Hiányzó funkciók / növekedési lehetőségek

### Magas prioritás (eladási érvet ad)
1. **Online fizetés** — Stripe vagy SimplePay integráció (most csak átvételkor készpénz/kártya). Kifőzde-piacon még ritka, USP lehet.
2. **SMS értesítés** — „Rendelése elkészült, átveheti" SMS-ben (Twilio vagy magyar SMS gateway). Az emailt sok vendég nem nyitja meg azonnal.
3. **Asztalfoglalás modul** — Külön táblával, capacity slot-okra építve. Sok kifőzde+étterem hibrid.
4. **Vendég pontrendszer** — Most 5/10/20 rendelés után kupon. Igazi pont-alapú loyalty (1 Ft = 1 pont, 1000 pont = 500 Ft kedvezmény) erősebb.
5. **Heti/havi előfizetés** — „10 ebéd csomag 19 900 Ft" prepay. Cash-flow boost a kifőzdének, kedvezmény a vevőnek.

### Közepes prioritás
6. **Többnyelvűség (EN/UA/DE)** — `i18n` setup. Turistáknak, ukrán vendégeknek.
7. **„Kedvenc rendelésem újra" 1 kattintás** — már van `FavoriteOrderButton`, de a homepage-en nem feltűnő.
8. **Push notification opt-in onboarding** — most a `usePushNotifications` hookkal megvan, de nincs CTA, ami felajánlja.
9. **Foglalkozás-egészségügyi „étkezési utalvány" támogatás** — SZÉP kártya, Edenred, Erzsébet utalvány választható fizetési mód.
10. **AI étrend-ajánló** — „Ezen a héten az alábbi 3 menüt ajánljuk neked" a vendég korábbi rendelései alapján (Lovable AI Gateway).

### Alacsony prioritás
11. **Több telephely / franchise mód** — `restaurant_id` minden táblába, location switcher.
12. **Vendégvélemény-moderációs felület** — most csak forced 5★, de saját rendszerből gyűjtve lehetne valódi felülvizsgálatot, csak a jót posztolni Google-re.
13. **Konyhai videó-fal mód** — full-screen Kanban tablethez/TV-hez.
14. **Beszállító portál** — partnerek saját login, számla feltöltés.
15. **„Megrendelni rendszeresen" subscription** — heti automatikus újrarendelés.

---

## 📊 Számszerű állapot (2026-05-17)

| Mutató | Érték |
|--------|-------|
| Étlap tételek | 776 |
| Napi ajánlatok | 47 |
| Rendelések összesen | 39 |
| Galéria képek | 45 |
| Bejövő/kimenő számlák | 6 |
| Partnerek | 1 |
| Aktív kuponok | 2 |
| Regisztrált userek | 2 (owner + staff) |
| Edge function-ök | 17 |
| Lovable memóriák | ~70 |

---

## 🎯 Összegzés

A rendszer **production-ready**, kritikus bug nincs. A backend stabil, az edge function-ök egységes auth flow-val, a frontend gyors és reszponzív. A javasolt fejlesztések 90%-a UX-finomítás vagy bevételnövelő feature (online fizetés, előfizetés, loyalty), nem hibajavítás.

**Eladási szempontból a rendszer minden olyat tud, amit egy kifőzde-tulajdonos elvárhat, és sok olyat is, amit nem is tudna kérni** (AI képgenerálás, AI számla OCR, AI árazás-javaslat, időjárás-alapú forecast, KDS print, EU allergén compliance, GDPR cookie consent, dinamikus jogi szövegek, audit log).
