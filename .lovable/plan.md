## Cél

A rendszer önellenőrzés után minden hiba/figyelmeztetés mellé kerüljön egy **"Javítás"** gomb (ahol van automatikus megoldás), illetve egy **"Részletek"** gomb, amely felugró ablakban mutatja a hiba pontos okát, technikai részleteit, és egy lépésről-lépésre útmutatót, hogyan lehet manuálisan rendbe tenni.

## Funkció

### 1. "Javítás" gomb (csak ahol van értelme)
Minden ellenőrzési pont mellé — ha a státusz `warn` vagy `fail` — kis **Javítás** gomb kerül, amely az adott hibára szabott automatikus műveletet futtat.

| Ellenőrzés | Javítás művelet |
|---|---|
| `daily_offer` – nincs mai napi ajánlat | A legutóbbi sablon másolása mára (ha létezik); különben az admin /admin/menu-schedule oldalra navigálás. |
| `daily_offer` – létezik, de nincs tétel | Navigálás a mai napi ajánlat szerkesztőjére. |
| `capacity` – kevés idősáv | Az alapértelmezett idősáv-sablonból feltölti a mai napot (capacity_slots insert 11:00-15:30 között 30 percenként). |
| `submit_order` – nem elérhető | Csak újra futtatás (retry) gomb. |
| `db_write` – sikertelen | Csak újra futtatás. |
| `email` – RESEND nincs / nem elérhető | Link a Supabase secrets oldalra. |
| `stuck` – régóta nyitott rendelések | Modal: listázza a régi rendeléseket, és gombokkal lehet `cancelled` állapotba állítani őket (vagy egyenként megnyitni az OrdersManagement-ben). |
| `sold_out` – minden tétel kifogyott | Egy kattintással visszaállítja az `is_sold_out = false` értéket a mai napi ajánlat összes tételén. |

A javításokat egy új edge function végzi: **`system-health-fix`**, amely paraméterül kapja a `check_id`-t és elvégzi a megfelelő SERVICE_ROLE szintű műveletet. Ezzel biztonságosan, ellenőrzött kódból futtatjuk a javítást (nem a böngészőből).

A javítás után automatikusan újra fut az ellenőrzés, hogy lássuk az eredményt.

### 2. "Részletek" gomb
Minden ellenőrzési pont mellett (státusztól függetlenül) megjelenik egy kis **info ikon / Részletek** link, amely egy **Dialog**-ot nyit meg a következőkkel:
- Ellenőrzés neve és státusza
- Mit ellenőriz (rövid leírás, magyarul)
- Aktuális üzenet és technikai részlet (ha van: `detail` mező)
- Lehetséges okok (előre megírt magyarázat ellenőrzésenként)
- Mit lehet tenni manuálisan (lépésről lépésre)
- (Ha van) Közvetlen link az érintett admin oldalra

A magyarázatokat egy `healthCheckExplanations.ts` adatfájlban tartjuk, hogy könnyen bővíthető legyen.

### 3. Tömeges "Mindent javítani próbál" gomb
A kártya tetejére kerül egy másodlagos **"Hibák javítása"** gomb (csak akkor jelenik meg, ha van `warn` vagy `fail`), amely sorban végigfut minden javítható ponton és lefuttatja a javítást, majd újra ellenőrzést indít.

## Érintett fájlok

**Módosítás:**
- `src/components/admin/SystemHealthCheck.tsx` – per-row "Javítás" és "Részletek" gombok, tömeges javítás gomb, dialog kezelés
- `supabase/functions/system-health-check/index.ts` – minden check kap egy `fixable: boolean` mezőt, hogy a UI tudja, mit lehet javítani

**Új fájlok:**
- `src/data/healthCheckExplanations.ts` – ellenőrzésenkénti magyarázatok és manuális lépések
- `src/components/admin/HealthCheckDetailDialog.tsx` – a Részletek dialog
- `supabase/functions/system-health-fix/index.ts` – új edge function a javításokra

**Nincs DB migráció**, mert csak meglévő táblákon írunk (mint a `capacity_slots`, `daily_offer_items`, `orders`).

## Hatókör

- Nem érintünk üzleti logikát rendelés vagy menü kezelés területén — csak az admin ellenőrző felületet bővítjük.
- A `daily_offer` "másolás sablonból" csak akkor működik, ha legalább egy `daily_offer_templates` rekord létezik; különben átirányítás.
- Minden javítás csak admin/owner jogosultsággal fut (a fix edge function ellenőrzi a JWT-t).
