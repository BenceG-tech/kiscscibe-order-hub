## RLS-regresszió fix — Opció A, minimális önálló commit

Csak és kizárólag az RLS policy-k átírása. K1/K2/egyéb javítás **nem része** ennek a commitnak.

### 1. Idővonal-egyeztetés (fix ELŐTT, jelentéssel)

Két read-only lekérdezés a diagnózis validálására:

```sql
SELECT version, name FROM supabase_migrations.schema_migrations
 WHERE version >= '20260701' ORDER BY version;
```

Majd az érintett migrációk SQL tartalmának letöltése (a `supabase/migrations/` fájlokból), grep `REVOKE` + `is_admin` mintára, hogy pontosan azonosítható legyen **az első** anon EXECUTE revoke migrációja.

**Két lehetséges kimenet:**
- (a) Az első revoke 07-02 körüli → magyarázza a 07-02-i leállást; jelentem és megyünk a fix-re.
- (b) Az első revoke csak 07-13-i → **STOP**: második gyökér-ok létezik a 07-02–07-12 időszakra. Nem javítok, hanem `postgres_logs` mélyebb analitikáját futtatom (2026-07-01 → 07-12) a `permission denied for function` mintára, és a `submit-order` `edge_logs`-ot ugyanerre az időszakra. A user jóváhagyása nélkül nem megyek tovább.

### 2. Coupons: NEM nyitunk anon SELECT-et

- **Kód-audit előre**: `rg -n "from\(['\"]coupons" src/` + `rg -n "\.rpc\(.*coupon" src/` — megnézem, van-e kliens-oldali `.from('coupons').select(...)` anon hívás.
- Létező helyzet: a `validate_coupon_code(p_code, p_order_total)` RPC már létezik és `SECURITY DEFINER`, csak érvényességet ad vissza, nem listáz — a kliens ezt hívja. Nem kell új RPC.
- **Fix**: `"Admin full access to coupons"` policy scope `{public}` → `{authenticated}`. Anon SELECT policy **nem** készül.
- Ha az audit talál közvetlen `.from('coupons').select(...)` anon hívást: **STOP** és jelentem — kód-refaktor kell hozzá, ami már nem RLS-fix.

### 3. Szisztematikus sweep — nem csak az 5 találat

Előfutás (read-only):

```sql
SELECT tablename, policyname, roles::text, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND roles::text = '{public}'
  AND (qual ~ 'is_admin|is_admin_or_staff|is_staff|is_owner|has_role'
    OR with_check ~ 'is_admin|is_admin_or_staff|is_staff|is_owner|has_role');
```

Az EDÉSZ találati listát a migrációban lekezelem, két minta szerint:

**Minta A — csak admin/staff/mutáció policy (nincs anon szükséglet):**
`DROP POLICY ... ; CREATE POLICY ... TO authenticated USING (is_admin(auth.uid()))` (`{public}` → `{authenticated}` szűkítés, változatlan qual).

**Minta B — vegyes: publikus olvasás + admin bypass egy policy-ban (menu_items, daily_offers, daily_offer_items, daily_offer_menus mintája):**
Szétbontás két külön policy-ra:
```sql
-- Anon: csak a publikus feltétel, függvényhívás NÉLKÜL
CREATE POLICY "Anon can view <x>" ON public.<t> FOR SELECT TO anon
  USING (<publikus_feltétel>);
-- Authenticated: publikus VAGY admin
CREATE POLICY "Authenticated can view <x>" ON public.<t> FOR SELECT TO authenticated
  USING (<publikus_feltétel> OR public.is_admin_or_staff(auth.uid()));
```

**Már ismert érintettek (bővíthető a sweep alapján):**
`menu_items`, `daily_offers`, `daily_offer_items`, `daily_offer_menus`, `coupons`. Az audit alapján valószínűleg még: `menu_item_sides`, `menu_categories`, `daily_menus`, `daily_menu_items`, `capacity_slots` (UPDATE), `gallery_images`, `item_modifiers`, `item_modifier_options`, `blackout_dates`, `settings` — de a sweep query végleges listája dönt.

A `service_role` policy-kat és auth-only táblák (`orders`, `profiles`, `user_roles`, `invoices`, stb.) admin policy-jait **nem** módosítom, ha nincs `{public}`+`is_*` kombináció.

### 4. Verifikáció a fix után (mielőtt lezárom)

Négy explicit lépés, mindegyik pass kell:

1. **Anon curl mátrix**: minden érintett tábla + a sweep listája → mind `HTTP 200`. Táblázatos jelentés.
2. **Playwright anon inkognitó, end-to-end**: `/` → `/etlap` → item kosárba → `/checkout` → form kitöltés (teszt telefonszám `+36301234567`, holnap 10:00 pickup) → submit → `/order-confirmation` betöltés. **Screenshot minden lépésnél.** Ez az email-ágat is éles teszteli (Resend valóban küld → utána a rendelést töröljük).
3. **`postgres_logs`** a Playwright futás időablakára szűrve: `event_message ~ 'permission denied for function'` **0 találat kell**.
4. **Admin realtime**: külön Playwright tab admin session-nel a `/admin/orders`-en, screenshot közvetlenül a submit után **refresh nélkül** — a teszt-rendelés látszik-e.

Ha bármelyik pass el nem éri: rollback nem kell (a policy-k idempotensek DROP+CREATE-tel), de jelentem és nem lezárom.

**Cleanup**: a Playwright teszt-rendelés törlése azonnal (`DELETE FROM orders WHERE code = 'TEST_...'`), plus a hozzátartozó `order_items`, `capacity_slots.booked_orders--`.

### 5. Commit-scope korlát

- Egyetlen migráció (`fix_rls_anon_regression`).
- **Nem** módosítok: Realtime hookokat (K1), `submit-order` edge fn-t, `validate_order_date` triggert (K3), tranzakciós refaktort (K2), sw.js-t, egyéb frontendet.
- Egyetlen kivétel a scope-on belül: **ha** a coupons kód-audit anon-`.from('coupons')` hívást talál, **STOP** és külön kérdezek — nem toldom hozzá csendben.

### Kimenet, amit adok

- Idővonal-jelentés (1. pont) → várok jóváhagyásra, ha (b) forgatókönyv áll fenn.
- Sweep-találati lista + migráció SQL preview → migration tool → user approve.
- Verifikációs jelentés (4×): anon curl mátrix, Playwright screenshot-sorozat, postgres_logs 0-találat bizonyíték, admin realtime screenshot.
