

# Operacional + Uzleti Fejlesztesek: Bevételi Riport, Waste Tracking, Review Email, Kupon Rendszer

Ez a terv 4 fo fejlesztest tartalmaz, prioritas sorrendben. A NAV online szamla integraciot kulon fazisra halasztjuk, mert komplex kulso API integraciot igenyel (NAV Online Szamla 3.0 API), sajat tanusitvanyokkal es tesztkornyezettel.

---

## 1. Napi beveteli riport email (automatikus)

### Mukodes
- Uj edge function: `send-daily-report`
- Nap vegen (pl. 15:30-kor, zaras utan) elkuldodik az email a tulajdonosnak
- Tartalom: mai bevetel, rendelésszam, keszpenz/kartya bontas, top 5 rendelt etel, atlag rendelesi ertek
- Cron job-bol hivhato (pg_cron + pg_net)

### Technikai reszletek
- Uj fajl: `supabase/functions/send-daily-report/index.ts`
- A function lekerdezi az aznapi `orders`-t (status != 'cancelled'), aggregalja a bevetelt
- Resend API-val kuldi az emailt a `kiscsibeetterem@gmail.com`-ra
- Config.toml: `verify_jwt = false` (cron hivja)
- Az admin feluleten egy "Teszt riport kuldese" gomb lesz a Dashboard-on

### Email tartalom
- Napi osszbevetel
- Rendelesek szama (teljesitett / lemondott)
- Keszpenz vs kartya megoszlas
- Top 5 legtobbet rendelt tetel
- Atlagos rendelesi ertek

---

## 2. Pazarlas (waste) tracking

### Adatbazis
Uj tabla: `daily_waste_log`

| Oszlop | Tipus | Leiras |
|--------|-------|--------|
| id | uuid PK | |
| date | date NOT NULL | A nap |
| item_name | text NOT NULL | Etel neve |
| planned_portions | integer | Tervezett adagszam |
| sold_portions | integer | Eladott adagszam |
| wasted_portions | integer NOT NULL | El nem kelt adagok |
| notes | text | Megjegyzes |
| logged_by | uuid | Ki rogzitette |
| created_at | timestamptz DEFAULT now() | |

RLS: Admin CRUD, staff INSERT + SELECT.

### Admin felulet
- Uj tab az Analytics oldalon: "Pazarlas"
- Vagy kulon szekcio a Dashboard-on
- Napi rogzites: a `daily_offers` es `daily_offer_menus` tablabol automatikusan kiszamolja a remaining_portions erteket záráskor
- "Nap lezarasa" gomb: automatikusan loggolja a maradekot a `daily_waste_log`-ba
- Trend diagram: het/honap szinten a pazarlas mennyisege, aranya
- Top pazarolt etelek listaja

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| Uj: `src/components/admin/WasteTracking.tsx` | Pazarlas rogzito + trend megjelenitő |
| `src/pages/admin/Analytics.tsx` | Uj tab: "Pazarlas" |
| `src/pages/admin/Dashboard.tsx` | "Nap lezarasa" gomb hozzaadasa |

---

## 3. Google Review keres email

### Mukodes
- A `send-order-status-email` edge function bovitese: a `completed` statusznal a meglevo "Koszonjuk" email kiegeszul egy Google Review linkkel
- Nem kell kulon edge function -- egyszeruen a `completed` email sablonba bekerul egy CTA gomb: "Ertekeld a tapasztalatod!" linkkel a Google Maps review URL-re
- Az URL-t a `settings` tablabol vesszuk (key: `google_review_url`), amit az admin beallithat

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `supabase/functions/send-order-status-email/index.ts` | Google Review CTA gomb hozzaadasa a `completed` emailhez |
| `src/pages/admin/Dashboard.tsx` vagy Settings | Google Review URL beallitas mezo |

---

## 4. Kupon/kedvezmeny rendszer

### Adatbazis
Uj tabla: `coupons`

| Oszlop | Tipus | Leiras |
|--------|-------|--------|
| id | uuid PK | |
| code | text NOT NULL UNIQUE | Kupon kod (pl. "ELSO10") |
| discount_type | text NOT NULL | 'percentage' vagy 'fixed' |
| discount_value | integer NOT NULL | Ertek (10 = 10% vagy 500 = 500 Ft) |
| min_order_huf | integer DEFAULT 0 | Minimum rendelesi ertek |
| max_uses | integer | Max felhasznalasok szama (NULL = korlatlan) |
| used_count | integer DEFAULT 0 | Eddigi felhasznalasok |
| valid_from | timestamptz DEFAULT now() | Ervenyesseg kezdete |
| valid_until | timestamptz | Ervenyesseg vege (NULL = nincs lejarat) |
| is_active | boolean DEFAULT true | Aktiv-e |
| created_at | timestamptz DEFAULT now() | |

RLS: Admin CRUD, publikus SELECT (is_active = true, validitas ellenorzeshez).

Uj tabla: `coupon_usages`

| Oszlop | Tipus | Leiras |
|--------|-------|--------|
| id | uuid PK | |
| coupon_id | uuid FK -> coupons | |
| order_id | uuid FK -> orders | |
| discount_huf | integer NOT NULL | Alkalmazott kedvezmeny Ft-ban |
| created_at | timestamptz DEFAULT now() | |

RLS: Admin SELECT, service role ALL.

### Orders tabla bovites
- Uj oszlop: `coupon_code` (text, nullable) -- a felhasznalt kupon kodja
- Uj oszlop: `discount_huf` (integer, DEFAULT 0) -- az alkalmazott kedvezmeny

### Checkout integracjo
- A Checkout oldalon uj mezo: "Van kuponod?" -- szovegmezo + "Alkalmaz" gomb
- Validacio: letezik-e a kod, aktiv-e, nem jart-e le, nem hasznaltak-e el maxig, eleri-e a minimum rendelesi erteket
- Ha ervenyes: a vegosszegbol levonodik a kedvezmeny, zold kijelzes
- A `submit-order` edge function bovitese: kupon validalasa server-oldalon is, `used_count` novelese

### Admin felulet
- Uj admin oldal: `/admin/coupons` (vagy a Dashboard-on uj szekcio)
- Kuponok listaja: kod, tipus, ertek, felhasznalasok, allapot
- "Uj kupon" dialog: kod, tipus, ertek, min. rendelesi ertek, max hasznalat, lejarat
- Kupon aktiválás/deaktivalas toggle
- Felhasznalasi statisztika: mennyi bevetelt generalt, hany rendelesben hasznaltak

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| Uj: `src/pages/admin/Coupons.tsx` | Kupon kezelo admin oldal |
| `src/pages/Checkout.tsx` | Kupon kod mezo + validacio |
| `src/contexts/CartContext.tsx` | Kupon allapot tarolasa |
| `supabase/functions/submit-order/index.ts` | Kupon validalasa + used_count noveles |
| `src/App.tsx` | `/admin/coupons` route hozzaadasa |
| `src/pages/admin/AdminLayout.tsx` | "Kuponok" nav item hozzaadasa |

---

## 5. Fake kontakt adatok javitasa

### send-order-status-email
- A jelenlegi email sablon meg tartalmazza a "1234 Budapest, Pelda utca 12." cimet es a "+36 1 234 5678" telefonszamot
- Ezeket eltavolitjuk vagy generalikusra csereljuk ("Kiscsibe Etterem" felirat marad, cim/telefon nelkul)

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `supabase/functions/send-order-status-email/index.ts` | Fake cim/telefon torlese |

---

## 6. NAV Online Szamla (CSAK TERVEZES)

Ez a fejlesztes NEM kerul implementalasra ebben a fazisban. Indoklas:
- A NAV Online Szamla 3.0 API komplex XML-alapu interfeszt hasznal
- Tesztkornyezet regisztracio es tanusitvany szukseges
- Jogszabalyi kovetelmeny, de csak bizonyos osszeg felett (NAV altal meghatarozott hatarertekek)
- Kulon fazisban, a tényleges NAV regisztracio utan erdemes implementalni
- Szukseg lesz: technikai felhasznalo letrehozasa a NAV portálon, teszt + eles kornyezet, XML alairas

---

## Implementacios sorrend

1. **Fake kontakt adatok javitasa** (gyors, 5 perc)
2. **Google Review email** (egyszeru, a meglevo email bovitese)
3. **Napi beveteli riport** (uj edge function + cron)
4. **Pazarlas tracking** (uj tabla + admin UI)
5. **Kupon rendszer** (legnagyobb, uj tablak + checkout + admin)

---

## Nem modosul
- Staff KDS oldal (kiveve ha a waste tracking "Nap lezarasa" gombot a staff is lathassa)
- Menu szerkesztes
- Galeria
- Meglevo rendelesi logika (a kupon egy plusz lepes, nem valtoztatja meg az alap mukodest)
- Meglevo RLS szabalyok (csak ujak jonnek hozza)

