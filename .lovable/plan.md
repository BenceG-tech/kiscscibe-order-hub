# Terv

Három független módosítás, mindegyik kis hatókörű:

## 1. Diák kedvezmény eltávolítása

A főoldal akciós sávjából (`src/components/sections/PromoSection.tsx`, 108. sor) eltávolítjuk a `-10% diák 11:30-13:00` chip-et. Más helyen nincs hivatkozás rá (egyetlen találat van az egész kódbázisban).

## 2. kiscsiberendeles@gmail.com = staff (csak rendelések)

Cél: ez a fiók ugyanazt lássa, mint a többi pultos / konyhás kolléga — csak a rendelési modulokat (`/staff`, `/admin/orders`), semmi mást (számlák, partnerek, menü szerkesztés, analitika nem elérhető).

DB migráció:

```sql
-- 1. Allowlist: staff szerepkör
INSERT INTO public.admin_email_allowlist (email, role, label, is_active)
VALUES ('kiscsiberendeles@gmail.com', 'staff', 'Étterem rendelés-kezelő', true)
ON CONFLICT (email) DO UPDATE
  SET role = 'staff', is_active = true, updated_at = now();

-- 2. Ha már létezik a fiók, azonnal staff szerepkör
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'staff'::app_role
FROM auth.users u
WHERE lower(u.email) = 'kiscsiberendeles@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Ha a fiók még nem regisztrált, a `claim_admin_access` RPC az első bejelentkezéskor automatikusan rárakja a staff szerepkört (az allowlist alapján). A `ProtectedRoute` `requireStaff` mezője már most beengedi staff-okat a rendelés oldalakra, `requireAdmin` viszont nem — tehát semmi kódváltozás nem kell, csak DB.

## 3. Szerkeszthető vélemények, dátum nélkül

Jelenleg a `src/components/sections/ReviewsSection.tsx` egy hardcoded 6 elemű `reviews` tömböt használ. Két lépés:

**a) Dátum eltávolítása a kártyáról**
A `ReviewCard` komponensben (kb. 125. sor) töröljük a `<p>{review.date}</p>` sort, hogy soha ne jelenjen meg „2 hete / 1 hónapja" sem. A datatípusból is kivesszük (opcionális mező lesz).

**b) Admin szerkesztő `/admin/reviews`**
A meglévő mintát követjük (mint `AboutPageEditor`, `AnnouncementEditor`):

- Új sor a `settings` táblába `key = 'homepage_reviews'`, `value_json = [{name, rating, text, verified}, ...]`. A nyilvános olvasásra már létezik policy (lásd `mem://tech/public-settings-read-policy`), csak fel kell venni a kulcsot az engedélyezett listára ha kulcs-szűrt — különben a meglévő globális read szabály engedi.
- Új komponens: `src/components/admin/ReviewsEditor.tsx` — egyszerű lista, soronként: név (input), 1-5 csillag (select), szöveg (textarea), „verified" toggle. Hozzáadás / törlés / sorrend (fel-le).
- Új admin oldal: `src/pages/admin/Reviews.tsx`, ami betölti a komponenst és menti a `settings` táblába (upsert) az `update_settings` mintával.
- Route felvétele `src/App.tsx`-be (`/admin/reviews`, `requireAdmin`).
- Belinkelés az admin oldalsávra/dashboardra (`AdminLayout.tsx` navigációba).
- A `ReviewsSection.tsx` lecserélve: `useEffect`-ben lekéri a `settings`-ből; ha nincs vagy üres → fallback a jelenlegi hardcoded listára (hogy ne tűnjön el semmi míg az admin be nem szerkeszt).

A `totalReviews = 127` és `averageRating = 5.0` változatlan marad, ahogyan eddig (memory szabály: minden nyilvános értékelés 5 csillag).

## Érintett fájlok

- `src/components/sections/PromoSection.tsx` — diák chip kivétele
- `src/components/sections/ReviewsSection.tsx` — dátum kivétele, DB betöltés fallback-kel
- `src/components/admin/ReviewsEditor.tsx` *(új)*
- `src/pages/admin/Reviews.tsx` *(új)*
- `src/App.tsx` — új route
- `src/pages/admin/AdminLayout.tsx` — menüpont
- Egy DB migráció a staff allowlist + user_role beszúrásra

## Megjegyzés

- A `kiscsiberendeles@gmail.com` fióknak ki kell jelentkeznie és vissza, hogy az új staff szerepkör betöltődjön (ha már létezik a fiók).
- A vélemény szerkesztő egyszerű, gyors űrlap — nem touch-friendly drag-and-drop, csak fel/le nyilak (mobilon is megbízható).
