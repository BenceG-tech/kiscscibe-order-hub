
# Napi Menu Ar Javitas + Mobil Design Fejlesztes

## 1. Ar Problema - Gyoker Ok

Az adatbazis ket kulonbozo helyen tarlja az arat:

- `daily_offers.price_huf` = **2200 Ft** (ezt allitod be az admin "Napi menu ar" mezoben)
- `daily_offer_menus.menu_price_huf` = **1800 Ft** (ezt hozza letre automatikusan a korabbi javitas, kemenykoddolt ertekkel)

A frontend a `daily_offer_menus.menu_price_huf`-ot jelenititi meg a vasarloknak, ezert latnak 1800 Ft-ot 2200 helyett.

Harom hely van, ahol az ar helytelen:

1. **Auto-create logika** (`WeeklyMenuGrid.tsx`): kemenykoddolt `1800` Ft-tal hozza letre a `daily_offer_menus` rekordot, ahelyett, hogy a `daily_offers.price_huf` erteket hasznalna
2. **PromoSection.tsx**: kemenykoddolt "2 200 Ft" szoveg, nem adatbazisbol jon
3. **Jelenlegi adat**: A feb. 9-i rekord is 1800 Ft-tal lett letrehozva

## 2. Javitasi Terv

### 2a. WeeklyMenuGrid.tsx - Auto-create logika javitasa

Az `updateMenuPartMutation`-ban a `daily_offer_menus` letrehozasakor:

```text
JELENLEGI (hibas):
  menu_price_huf: 1800  <-- kemenykoddolt

JAVITOTT:
  1. Lekerdezes: SELECT price_huf FROM daily_offers WHERE id = offerId
  2. Ha van offer_price: menu_price_huf = offer_price
  3. Ha nincs: menu_price_huf = 1800 (fallback)
```

### 2b. WeeklyMenuGrid.tsx - Ar valtozas szinkronizalasa

Amikor az admin megvaltoztatja a "Napi menu ar" mezot (`updatePriceMutation`), szinkronizalni kell a `daily_offer_menus.menu_price_huf`-ot is:

```text
JELENLEGI:
  UPDATE daily_offers SET price_huf = X

JAVITOTT:
  1. UPDATE daily_offers SET price_huf = X
  2. SELECT id FROM daily_offer_menus WHERE daily_offer_id = offerId
  3. Ha letezik: UPDATE daily_offer_menus SET menu_price_huf = X
```

Ez biztositja, hogy az ar valtozas azonnal megjelenik a frontenden is.

### 2c. Jelenlegi adatok javitasa

A feb. 9-i rekordot es az osszes tobbi hibas rekordot javitani kell:

```sql
UPDATE daily_offer_menus dom
SET menu_price_huf = d.price_huf
FROM daily_offers d
WHERE dom.daily_offer_id = d.id
AND dom.menu_price_huf != d.price_huf;
```

Ez egy egyszeri migracios lepkent kerul be.

### 2d. PromoSection.tsx - Dinamikus ar

A PromoSection jelenleg kemenykoddolt "2 200 Ft"-ot mutat. Ezt lecsereljuk dinamikus lekerdezesre, ami a mai nap `daily_offer_menus.menu_price_huf` erteket hasznalja, fallback-kel az alapertelmezett 2200 Ft-ra.

## 3. Mobil Design Fejlesztes - Napi Menu

A jelenlegi mobil nezet funkcionalis, de nem eleg felhasznalobaarat. Javitasok:

### 3a. DailyMenuPanel.tsx - Kompaktabb, vonzobb mobil kartya

**Jelenlegi**: Ket darab 16:9-es kep egymas alatt (hosszu gorgetesre kenyszerit). Az ar egy kis badge.

**Javitott mobil nezet**:
- A ket etelkep **egymas mellett** jelenik meg mobilon is (2 hasabos racs), de kisebb meretu kartyakkal
- Az ar badge nagyobb es kiemeltebb, kozepre pozicionalva a kartya tetején
- A "Leves + Foetel kedvezmenyes aron" szoveg rogton az ar ala kerul
- Az etelkep aranyat mobilon `aspect-[4/3]`-ra csokkentjuk a kompaktabb nezetert (desktopon marad 16:9)
- A CTA "Menu kosarba" gomb teljes szelessegu mobilon, nagyobb padding-gel

### 3b. DailyMenuPanel.tsx - Ar kiemeles

A menu ar jelenleg egy kis badge a jobb felso sarokban. Javitasok:
- Nagyobb, szembetunotobb ar megjeleniteis mobilon (text-2xl)
- Az ar a kartya kozepen jelenik meg mint fo elem
- Arnyekolt hatter a jobb lathatosagert

### 3c. Etlap.tsx - Menu kartya javitasa (konzisztencia)

Az Etlap.tsx-ben levo inline menu kartya ugyan azt a designt hasznalja mint a DailyMenuPanel, de redundans kodot tartalmaz. Lecsereljuk a DailyMenuPanel komponens hasznalatra a konzisztencia erdekeben (a memory szerint ez kotelezo).

## 4. Technikai Reszletek

### Modositando fajlok

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/WeeklyMenuGrid.tsx` | Auto-create ar javitas (offer price hasznalata), updatePriceMutation szinkron |
| `supabase/migrations/[timestamp]_sync_menu_prices.sql` | Egyszeri adat-javitas: meglevo rekordok arainak szinkronizalasa |
| `src/components/DailyMenuPanel.tsx` | Mobil-optimalizalt design: 2 hasabos racs, nagyobb ar, kompakt kepek |
| `src/components/sections/PromoSection.tsx` | Dinamikus ar lekerdezes a kemenykoddolt "2 200 Ft" helyett |
| `src/pages/Etlap.tsx` | DailyMenuPanel hasznalata az inline menu kartya helyett (konzisztencia) |

### WeeklyMenuGrid.tsx valtozasok

**updateMenuPartMutation (auto-create resz):**
```text
// Jelenlegi:
menu_price_huf: 1800

// Javitott:
// 1. Lekerdezes: daily_offers.price_huf
const { data: offerData } = await supabase
  .from("daily_offers")
  .select("price_huf")
  .eq("id", offerId)
  .single();
const menuPrice = offerData?.price_huf || 1800;

// 2. Hasznalat:
menu_price_huf: menuPrice
```

**updatePriceMutation (szinkron resz):**
```text
// A sikeres daily_offers.price_huf update utan:
// Szinkron: daily_offer_menus.menu_price_huf frissitese
const { data: existingMenu } = await supabase
  .from("daily_offer_menus")
  .select("id")
  .eq("daily_offer_id", offerId)
  .maybeSingle();

if (existingMenu) {
  await supabase
    .from("daily_offer_menus")
    .update({ menu_price_huf: price })
    .eq("daily_offer_id", offerId);
}
```

### DailyMenuPanel.tsx mobil design valtozasok

```text
JELENLEGI mobil:
- grid-cols-1 (1 hasab, ket nagy kartya egymas alatt)
- aspect-[16/9] kepek (nagyon magasak mobilon)
- Kis ar badge a fejlecben

JAVITOTT mobil:
- grid-cols-2 (2 hasab mobilon is, kompaktabb)
- aspect-[4/3] kepek mobilon, aspect-[16/9] desktopon
- Nagyobb ar badge kozepre pozicionalva
- Etelnev kicsit kisebb mobilon (text-base vs text-lg)
- CTA gomb teljes szelessegu, magasabb (h-12)
```

### PromoSection.tsx valtozasok

```text
JELENLEGI:
  <p className="text-2xl font-bold text-primary">2 200 Ft</p>

JAVITOTT:
  // Adatlekerdezes a mai nap menujabol
  const { data } = useQuery({
    queryKey: ["promo-menu-price"],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase.rpc('get_daily_data', { target_date: today });
      return data?.[0]?.menu_price_huf || 2200;
    }
  });
  
  // Megjelenitesben:
  <p className="text-2xl font-bold text-primary">
    {data ? data.toLocaleString('hu-HU') : '2 200'} Ft
  </p>
```
