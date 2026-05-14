## Probléma

A reggeli tételek tényleg fel vannak vive az adatbázisba és fix tételek:

- Bundáskenyér
- Töltött bundáskenyér (1 db)
- Töltött bundáskenyér (2 db)
- Óriás melegszendvics
- Ham & Eggs
- Omlett
- Szendvicsek (többféle)

A publikus oldalon azért nem jelennek meg, mert a böngészőben a `menu_items` lekérdezés 401 hibával elhasal:

`permission denied for function is_admin`

Ez egy RLS/jogosultsági hiba: a publikus olvasási policy mellett van admin policy is, ami anon felhasználónál meghívja az `is_admin()` függvényt, de a publikus role nem futtathatja ezt.

## Javítási terv

1. **Adatbázis jogosultság javítása**
   - A `is_admin`, `is_staff`, `is_admin_or_staff`, `has_role` szerepkör-ellenőrző függvényekre megadom a szükséges futtatási jogosultságot az `anon` és `authenticated` role-oknak.
   - Ez nem tesz senkit adminná, csak azt engedi, hogy az RLS policy biztonságosan kiértékelődjön.

2. **Publikus menü olvasás ellenőrzése**
   - Ellenőrzöm, hogy a `menu_items` publikus lekérdezés már 200-as választ ad.
   - A főoldali `BreakfastSection` így megkapja a reggeli tételeket.

3. **Admin/Fix tételek megőrzése**
   - Nem változtatok az admin logikán.
   - A reggelik továbbra is `is_always_available = true`, tehát fix tételként szerkeszthetők maradnak, és az AI kép generátor ugyanúgy elérhető hozzájuk a meglévő admin felületen.

4. **Megjelenés ellenőrzése mobilon**
   - Főoldalon ellenőrzöm, hogy a Hero alatt megjelenik a Reggeli szekció.
   - Napi ajánlat/Étlap oldalon ellenőrzöm, hogy a Reggeli blokk megjelenik és nem duplikálódik a fix tételeknél.

## Amit nem módosítok

- Nem nyúlok a rendelési logikához.
- Nem módosítom a napi menü működését.
- Nem veszem ki a reggeliket az adminból vagy a fix tételekből.