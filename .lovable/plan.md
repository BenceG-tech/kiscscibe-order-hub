
# Terv — Rendelés-leadási hiba javítása custom domainen (CORS)

## Mi a hiba?

Megnéztem a kódot és megtaláltam a problémát. **Nem véletlen, hogy csak te tudsz Lovable-ből rendelni — Krisztina gépén CORS-hiba miatt blokkolja a böngésző a rendelést.**

A részletek:

A rendszer az élesben két cím alatt érhető el:
- `https://kiscsibe-etterem.hu`
- `https://kiscsibeetterem.hu`

Az edge function-ök (köztük a `submit-order`, ami a rendelést leadja) egy közös CORS-listát használnak, ami a `supabase/functions/_shared/cors.ts` fájlban van. Ebben a listában jelenleg **csak** a Lovable preview és published címek szerepelnek:

```text
https://kiscscibe-order-hub.lovable.app
https://id-preview--98ed56c3-...lovable.app
http://localhost:5173
http://localhost:3000
http://localhost:8080
+ wildcard: bármi ami .lovable.app vagy .lovableproject.com végű
```

A két éles custom domain (`kiscsibe-etterem.hu`, `kiscsibeetterem.hu`) **nincs benne**.

Ennek a hatása: ha valaki a `kiscsibe-etterem.hu` oldalon nyitja meg az appot, és megpróbál rendelést leadni, a böngészője Origin-ellenőrzést végez. Mivel az edge function nem küld vissza érvényes `Access-Control-Allow-Origin` fejlécet erre a domainre, a böngésző elutasítja a választ, és a rendelés "csendben" elhal — a felhasználó csak annyit lát, hogy nem történik semmi, vagy hibát kap.

Te azért tudsz rendelni, mert a Lovable preview-ből (`*.lovable.app`) dolgozol, ami benne van az allowlistában.

## Mit javítok?

Egy fájlt érint, a `supabase/functions/_shared/cors.ts`-t. Két lépést teszek:

1. **Hozzáadom mindkét custom domaint** az `ALLOWED_ORIGINS` listához:
   - `https://kiscsibe-etterem.hu`
   - `https://www.kiscsibe-etterem.hu`
   - `https://kiscsibeetterem.hu`
   - `https://www.kiscsibeetterem.hu`

2. Ez **minden edge function-re egyszerre** érvényes lesz, mert mindegyik ezt a közös CORS-modult használja. Tehát nem csak a rendelés-leadás javul meg, hanem a kapcsolati űrlap, hírlevél, értékelés, stb. is — bármi, ami eddig a custom domainen csendben elhalt volna.

## Mit nem nyúlok hozzá

- Semmi más logikához nem nyúlok: rendelési flow, validáció, RLS, email küldés, minden marad ugyanaz.
- A meglévő Lovable és localhost engedélyek megmaradnak, hogy a fejlesztés és a Lovable preview tovább működjön.
- Adatbázis-változtatás nincs.

## Tesztelés a javítás után

A deploy automatikus. Utána Krisztina ezt tudja tesztelni:

1. Bemegy a `https://kiscsibe-etterem.hu` oldalra (a saját gépén).
2. Hozzáad egy ételt a kosárhoz, kitölti a checkout adatokat, és leadja a rendelést.
3. Sikeres rendelés esetén megjelenik a megerősítő oldal a rendelési kóddal.

Ha a böngésző DevTools Console-ja még mindig CORS-hibát mutat, az azt jelenti, hogy esetleg cache-eli a régi preflight választ — egy hard refresh (Ctrl+Shift+R / Cmd+Shift+R) megoldja.

## Miért fordulhatott elő ez?

A Lovable platform alapból csak a saját `.lovable.app` URL-eket ismeri. Amikor a custom domaineket (`kiscsibe-etterem.hu`, `kiscsibeetterem.hu`) hozzákapcsolták a projekthez, az edge function-ök CORS-listáját nem frissítették velük együtt. Ez egy klasszikus "csak a fejlesztőnek működik" típusú hiba: te a Lovable preview-ből tesztelted, ami engedélyezett origin, így nálad sosem jött elő.
