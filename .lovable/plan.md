## Diagnózis — miért nem működik a „Fix" fül

A böngésző console tisztán mutatja:

```
TypeError: Importing a module script failed.
ErrorBoundary caught: TypeError ... Suspense ...
```

Ez **NEM a `FixItems` oldal hibája** — a kód, a route (`/admin/fix-items`), a menüpont és az AdminLayout wiring rendben van, és nincs runtime hiba a FixItems komponensben.

**Gyökér-ok:** klasszikus Vite „stale chunk after deploy":
1. A felhasználó admin fülét reggel/tegnap töltötte be → a memóriában a régi `index-BId3OQ2d.js` fut.
2. Azóta új build ment ki (M4/M5, K-3, migráció, stb.), a régi lazy-chunk fájlok (pl. a FixItems külön chunkja) már nincsenek a szerveren.
3. Amikor a felhasználó rákattint a Fix fülre, a `React.lazy(() => import("./pages/admin/FixItems"))` egy már nem létező hash-elt fájlt próbál lehúzni → `Importing a module script failed`.
4. Az `ErrorBoundary` elkapja, de a jelenlegi „Újratöltés" gomb `window.location.reload()`-ot hív, ami **nem cache-bustol** — ha a HTML shell is cache-elt, ugyanaz a stale index.js töltődik újra, végtelen loop.

Ugyanez az esemény bármelyik lazy-loadolt admin aloldalt eltalálhatja (Analytics, Dashboard, Documents, Invoices stb.) — nem csak a Fix fület. Ez magyarázza, hogy „hirtelen nem működik".

## Terv

Egy fókuszált, kis fix — nem nyúlok a FixItems oldalhoz, nem nyúlok a rendelés-folyamhoz (mert a bizonyíték szerint azok működnek: a mai audit végén a Realtime, submit-order, email-log és admin nézet mind zöld volt).

### 1) Chunk-load-error automatikus helyreállítás

**`src/main.tsx`** — globális `window` listener a `vite:preloadError`-ra és a natív `error` eventre. Ha a hibaüzenet illeszkedik a stale-chunk mintára (`Importing a module script failed` / `Failed to fetch dynamically imported module` / `error loading dynamically imported module` / `ChunkLoadError`), akkor **egyszer** újratöltjük az oldalt cache-bust query-vel (`?_r=<timestamp>`). Egy `sessionStorage` flaggel megakadályozzuk a végtelen újratöltő loopot: ha ugyanabban a session-ben már próbáltunk cache-bustolni és megint elbukott, hagyjuk az ErrorBoundary-t megjeleníteni.

**`src/components/ErrorBoundary.tsx`** — a `componentDidCatch`-ben ugyanezt a mintát detektáljuk, és az „Újratöltés" gomb szintén cache-bust query-vel tölt újra (`window.location.href = window.location.pathname + '?_r=' + Date.now()`), nem sima `reload()`-dal. A hibaüzenet szövege pontosabb magyarra vált, ha stale chunk: „Új verzió érkezett — frissítjük az oldalt…".

Ez egyben megoldja a Fix fület **és** ugyanazt a hibát bármelyik jövőbeli lazy admin oldalon.

### 2) Rendelés-folyam gyors ellenőrzés (kód-review, nem futtatás)

A user kérte a rendelés leadás / érkezés / kezelés átnézését. A mai auditban ez már teljeskörűen le lett tesztelve (E1–E9, overlay 1/2/4/10 hullám, dátum-guardos takarítás, email_send_log 39 bizonyítékkal). Nem futtatok újra teszt-rendeléseket (adna zajt), csak **statikus kód-review-t** végzek:

- `supabase/functions/submit-order/index.ts` — a validációs láncolat, mapper, dupla admin email + feltételes vevői email, waitUntil, error mapping.
- `src/pages/Checkout.tsx` — az iménti K-3 magyar hibaüzenet kinyerése az edge fn body-ból.
- `src/hooks/useRealtimeOrders.tsx` + `src/hooks/useGlobalOrderNotifications.tsx` — dedupe, polling fallback, reconnect backoff.
- `src/pages/admin/OrdersManagement.tsx` + `EmailStatusBadge.tsx` — a lista + inline email státusz ikonok.
- `src/contexts/OrderNotificationsContext.tsx` + `OrderNotificationOverlay.tsx` — audio unlock, dismiss.

Ha bármelyikben regressziót vagy nyilvánvaló hibát találok (nem stílus, hanem funkció), külön jelentem — **de nem javítom ki ebben a körben**, a fegyelmed szerint „egy hiba – egy fix". Ha semmi rendellenes: jelentem, hogy tiszta.

### 3) Verifikáció

- `tsgo` typecheck a két érintett fájlra.
- Kérni foglak, hogy a preview-ban tölts újra (Ctrl+Shift+R / iOS Safari „Reload without cache"), és **próbáld meg még egyszer a Fix fület**. Várhatóan azonnal megnyílik.
- A jövőben, ha még egy régi tabot használsz deploy után → az új handler átirányít cache-busttal, egyetlen villanás → új build, hibaüzenet nélkül.

### Miért NEM módosítom most

- **FixItems.tsx maga**: nincs benne hiba, a lazy import felé bukott el.
- **Rendelés-folyam kód**: ma reggel élesben minden zöld volt (Realtime, hang, email_send_log 39 sor sent, K-3 magyar hibaüzenet). Ok nélkül nem nyúlok hozzá.
- **AdminLayout tab**: a `to="/admin/fix-items"` link jó, route wiring jó.

### Fájlok, amiket módosítok
- `src/main.tsx` — globális chunk-error handler (~15 sor)
- `src/components/ErrorBoundary.tsx` — cache-bust reload + jobb szöveg stale chunk esetén (~10 sor)

### Kockázat
Minimális. A handler csak akkor tüzel, ha a hibaüzenet illeszkedik a stale-chunk mintára, egyébként az ErrorBoundary a régi módon dolgozik.