# Probléma

A heti ajánlat (`daily_offers`, `daily_offer_items`) felvitele azért bukik el, mert a Postgres logok szerint:

```
permission denied for function is_admin_or_staff
permission denied for function is_weekend
permission denied for function bootstrap_first_admin
```

Az `admin_audit_log` tábla `INSERT` policy-jának `WITH CHECK` kifejezése `is_admin_or_staff(auth.uid())` — amit az `audit_log_trigger` trigger hív minden módosító műveletnél a `daily_offer_items` / `daily_offers` / `menu_items` táblákon. Mivel az `authenticated` szerepkörnek nincs `EXECUTE` joga ezekre a `SECURITY DEFINER` függvényekre, a trigger insert visszagörgeti az egész tranzakciót — így nem lehet új ajánlatot/tételt felvinni.

A `bootstrap_first_admin` (admin oldalon hívva), és az `is_weekend` (capacity/order ellenőrzések) ugyanígy némán hibázik.

# Megoldás

Egyetlen migrációs lépés: minden RLS-ben vagy kliens oldalon hívott `SECURITY DEFINER` függvényre adunk `EXECUTE` jogot az `authenticated` (és ahol releváns: `anon`) szerepkörnek.

```sql
GRANT EXECUTE ON FUNCTION public.is_admin_or_staff(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid)          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid)          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid)          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_weekend(date)        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_date_in_past(date)   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_access()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid)     TO authenticated;
```

# Miért ez a helyes javítás

- A függvények `SECURITY DEFINER`-ek, tehát a tényleges RLS-bypass logikájuk biztonságosan megmarad — csak a hívás joga hiányzik.
- A `WeeklyMenuGrid` / `QuickEntryBar` / `WeeklyExcelImport` kódja teljesen rendben van, nem kell hozzá nyúlni.
- Egyetlen migráció, nincs séma-változás, nincs adatkockázat.

# Verifikáció

Migráció után:
1. Belépés admin felhasználóval → `/admin/daily-menu`
2. `QuickEntryBar` → étel kiválasztás → siker toast
3. Excel sablon letöltés → kitöltés → import → siker toast
4. Postgres logokban nem jelenik meg többé `permission denied for function …`
