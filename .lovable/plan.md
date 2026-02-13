
# Rolunk admin szerkeszto javitas, telefonszam eltavolitas es kozossegi media linkek

## 1. Kritikus hiba: A Rolunk oldal nem toltodik be a frontendon

A `settings` tabla RLS szabalya csak `legal_%` kulcsu bejegyzesek olvasasat engedelyezi a publikus felhasznaloknak. Az `about_page` kulcs NEM olvashatoo bejelentkezes nelkul, ezert a Rolunk oldal mindig a fallback tartalmat mutatja.

**Javitas:** Uj RLS policy hozzaadasa, amely lehetove teszi az `about_page` kulcs publikus olvasasat.

```sql
CREATE POLICY "Public can read about page settings"
ON public.settings
FOR SELECT
USING (key = 'about_page');
```

## 2. Telefonszam es "Hivas" gomb eltavolitasa mindenhonnan

Az alabbi fajlokbol kell eltavolitani a telefonszamot es a hivas gombot:

| Fajl | Mit kell eltavolitani |
|------|----------------------|
| `src/components/ModernNavigation.tsx` | Desktop: "Hivas" gomb (87-97. sor), Mobil menu: "Hivas" gomb (224-233. sor) |
| `src/components/StickyMobileCTA.tsx` | Telefon ikon gomb (17-26. sor) -- a "Rendelj most" gomb marad egyedul |
| `src/components/TopOrderBar.tsx` | "Hivas" gomb (27-37. sor) |
| `src/components/Footer.tsx` | Mobil: telefon sor (114-119. sor), Desktop: telefon sor (209-214. sor) |
| `src/components/contact/ContactInfo.tsx` | Telefon sor (36-40. sor) |

A `Phone` import is eltavolitando ahol mar nem kell. A rendelesi form telefonszam mezo (`Checkout.tsx`) es a staff/admin rendelesi oldalakon levo telefon (`KanbanOrderCard`, `OrdersManagement`, `StaffOrders`) MARAD, mert az a vendeg telefonszama a rendeleshez.

## 3. Kozossegi media linkek hozzaadasa

Harom helyre kerulnek social ikonok (Facebook, Instagram, TikTok):

### a) Footer -- uj "Kovess minket" szekció
- A mobil es desktop footer-be egyarant
- Facebook: aktiv link (`https://www.facebook.com/kiscsibeetteremXIV/?locale=hu_HU`)
- Instagram es TikTok: ikonok megjelennek de `#` link-kel (kesobb frissitheto)

### b) Kapcsolat oldal (`ContactInfo.tsx`)
- A telefonszam helyere kozossegi media ikonok kerulnek

### c) Navigacio mobil menu
- A hivas gomb helyere Facebook ikon kerul

## 4. Technikai reszletek

### Uj fuggoseg: NEM szukseges
A Lucide React csomag tartalmazza a `Facebook`, `Instagram` ikonokat. A TikTok-hoz egyedi SVG ikon kell, mert a lucide-react nem tartalmazza.

### Modositando fajlok osszefoglalasa

1. **Migracios SQL** -- uj RLS policy az `about_page` publikus olvasasahoz
2. **`src/components/ModernNavigation.tsx`** -- hivas gombok eltavolitasa (desktop + mobil), Facebook ikon hozzaadasa a mobil menuhoz
3. **`src/components/StickyMobileCTA.tsx`** -- telefon gomb eltavolitasa, csak "Rendelj most" marad
4. **`src/components/TopOrderBar.tsx`** -- hivas gomb eltavolitasa
5. **`src/components/Footer.tsx`** -- telefon sorok eltavolitasa, "Kovess minket" szekció hozzaadasa social ikonokkal
6. **`src/components/contact/ContactInfo.tsx`** -- telefon sor eltavolitasa, social ikonok hozzaadasa
7. **`src/components/sections/HeroSection.tsx`** -- NEM modosul (nincs benne telefon)

### Nem modosul (megorzes)
- `src/pages/Checkout.tsx` -- vendeg telefonszam mezo marad
- `src/components/staff/KanbanOrderCard.tsx` -- rendelesi telefon marad
- `src/pages/admin/OrdersManagement.tsx` -- rendelesi telefon marad
- `src/pages/staff/StaffOrders.tsx` -- rendelesi telefon marad
- `src/components/admin/AboutPageEditor.tsx` -- mar kesz, nem modosul
- `src/pages/About.tsx` -- nem modosul (a RLS fix utan automatikusan mukodni fog)
