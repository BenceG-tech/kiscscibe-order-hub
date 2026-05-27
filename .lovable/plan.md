## Cél

A `kiscsibeetterem@gmail.com` fiók jelenleg csak `staff` szerepkörrel rendelkezik, ezért a `requireAdmin` által védett admin oldalak (számlák, partnerek, heti menü kezelő, kupon, dokumentumok, analitika, gyűjtemény, hulladék, beállítások stb.) átirányítják a főoldalra. A megoldás: kapja meg az `admin` szerepkört, így mindent lát és módosíthat ugyanúgy, mint a tulajdonos.

## Lépések

1. **Allowlist frissítés** — `admin_email_allowlist` táblában a `kiscsibeetterem@gmail.com` sor `role` mezőjét `staff`-ról `admin`-ra állítjuk (vagy új sort szúrunk be, ha még nem létezik). Így jövőbeli új bejelentkezéskor a `claim_admin_access` RPC automatikusan admin szerepet ad.

2. **Azonnali szerepkör hozzáadás** — beszúrunk egy új sort a `user_roles` táblába (`user_id` = a kiscsibeetterem fiók ID-je, `role` = `admin`), `ON CONFLICT DO NOTHING`. A meglévő `staff` sort meghagyjuk (nem zavar, de eltávolítható ha szeretnéd).

3. **Ellenőrzés** — query-vel megerősítjük hogy a fiók most már mindkét szerepkört (vagy csak admin-t) viseli, és a `is_admin()` RPC `true`-t ad vissza neki.

## Mit fog ezután látni

- `/admin` (dashboard), `/admin/daily-menu` (heti menü + új mobil quick entry / excel import), `/admin/invoices` (számlák + új draft persistence), `/admin/partners` (partnerek + új draft persistence), `/admin/menu`, `/admin/gallery`, `/admin/coupons`, `/admin/analytics`, `/admin/documents`, `/admin/legal`, `/admin/about`, `/admin/faq`, `/admin/fix-items`, `/admin/capacity`, `/admin/activity` — mind elérhető lesz.
- A rejtett admin belépés (5 kattintás a fejlécre/logóra) változatlan.

## Megjegyzés a memóriához

A projekt memory jelenleg úgy rögzíti hogy `kiscsibeetterem@gmail.com` = staff. A módosítás után a memóriát is frissítem (`mem://auth/hidden-administrative-access`), hogy tükrözze: ez az email mostantól teljes admin.

## Technikai részletek

```sql
-- 1. Allowlist: staff → admin (vagy új sor)
INSERT INTO public.admin_email_allowlist (email, role, label, is_active)
VALUES ('kiscsibeetterem@gmail.com', 'admin', 'Étterem fő admin', true)
ON CONFLICT (email) DO UPDATE
  SET role = 'admin', is_active = true, updated_at = now();

-- 2. Azonnali admin szerepkör
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'kiscsibeetterem@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

A migráció DB-only — kódváltozás nem szükséges. A felhasználónak ki kell jelentkeznie és vissza, hogy az új szerepkör betöltődjön az AuthContext-be (vagy egyszerűen frissíteni az oldalt).
