

# Phase 1: Admin Dashboard -- Napi Osszefoglalo

## Cel

Amikor az admin bejelentkezik, egy azonnali attekintes fogadja a mai nap legfontosabb adataival, gyors hozzaferesekkel es figyelmeztetesekkel. Jelenleg az admin a Rendelesek oldalra erkezik -- nincs "home base".

## Mit tartalmaz

### 1. Napi snapsho kartyak (felso sor)
Negy kartya egymans mellett (mobilon 2x2 grid):

- **Mai rendelesek**: darabszam + ossz bevetel (Ft)
- **Aktiv rendelesek**: eppen folyamatban levo rendelesek szama (new + preparing + ready)
- **Mai kapacitas**: napi osszes menu adagszam / elfogyott arany szazalekban
- **Atlagos rendelesi ertek**: mai rendelesek atlaga Ft-ban

### 2. Elo rendeles feed (kozepso szekci)
- Utolso 5 rendeles valso idoben frissulve (Supabase realtime -- mar mukodik)
- Minden sorban: rendeles kod, nev, osszeg, statusz badge, ido
- Kattintasra atvalt a Rendelesek oldalra

### 3. Figyelmezteto bannerek
- "Holnapi menu meg nincs beallitva" -- ha a kovetkezo munkanap `daily_offers`-ben nincs bejegyzes
- "X etel kepe hianyzik" -- ha `menu_items` kep nelkuli aktiv etelek szama > 10
- "Alacsony adagszam" -- ha barmelyik mai daily offer/menu `remaining_portions < 5`

### 4. Gyors muveletek
- "Holnapi menu beallitasa" gomb -> `/admin/daily-menu`
- "Mai rendelesek" gomb -> `/admin/orders`
- "Etlap szerkesztes" gomb -> `/admin/menu`

## Technikai megvalositas

### Uj fajlok
| Fajl | Leiras |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Dashboard oldal komponens |
| `src/components/admin/DashboardStatCard.tsx` | Ujrahasznalhato statisztika kartya |
| `src/components/admin/RecentOrdersFeed.tsx` | Elo rendeles lista |
| `src/components/admin/DashboardAlerts.tsx` | Figyelmezteto bannerek |

### Modositando fajlok
| Fajl | Valtozas |
|------|----------|
| `src/App.tsx` | Uj route: `/admin` -> Dashboard |
| `src/pages/admin/AdminLayout.tsx` | Uj nav item: "Iranyitopult" (Home ikon), elso helyen |

### Adatforrasok (meglevo tablak, NEM kell migracio)
- `orders` tabla: mai rendelesek szama, osszeg, statusz -- `SELECT` + `WHERE created_at >= today`
- `daily_offers` tabla: holnapi ajanlat letezese -- `SELECT WHERE date = tomorrow`
- `daily_offer_menus` tabla: mai menu adagszam -- `SELECT WHERE daily_offer_id = today's offer`
- `menu_items` tabla: kep nelkuli etelek -- `SELECT WHERE is_active = true AND image_url IS NULL`

### RLS
Minden hasznalt tabla mar rendelkezik admin SELECT policy-val, NEM kell uj RLS szabaly.

### Teljesitmeny
- A dashboard 4 parhuzamos Supabase query-t futtat (`Promise.all`)
- Valso ideju frissites a rendelesekhez (mar mukodo `orders` realtime channel)
- A tobbi adat csak oldal betolteskor frissul (nem kell realtime)

### Nem modosul
- Rendelesi/kosar/checkout logika
- Staff KDS oldal
- Menu szerkesztes
- Meglevo admin funkciok
- Backend/edge function-ok
