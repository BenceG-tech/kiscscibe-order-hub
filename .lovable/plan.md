

# Facebook kepgenerator + Napi ajanlat kepfeltoltes

Ket iranyu megoldast epitunk ki: (1) az admin a rendszer adataibol automatikusan generalhat letoltheto napi ajanlat kepet Facebookra, es (2) feltolthet egy sajat kepet is (pl. korabban keszitettet), ami megjelenik a weboldalon.

---

## 1. Napi ajanlat kep generalasa (admin -> Facebook)

Az admin feluletrol egy gombbal generalhat egy kepet, amely pontosan ugy nez ki, mint a feltoltott mintakep: sotet hatter, arany cimsor, feher etellista arakkal, alul menu szekcioval.

### Megoldas: HTML Canvas rendereles

Egy uj admin komponenst keszitunk (`DailyOfferImageGenerator`), amely:
- Betolti az adott nap napi ajanlat adatait (mar meglevo adatok a rendszerben)
- Egy rejtett `<canvas>` elemen megrajzolja a kepet a mintakep stilusaban:
  - Sotet gradiens hatter
  - Arany szinu fejlec: "Napi ajanlat 02.09. hetfo 11:30-tol"
  - Feher szoveggel az etelek felsorolva, jobbra igazitott arakkal
  - Alul arany vonattal elvalasztva a "Menu" szekcioval
  - Alul kisbetus megjegyzes (elvitel, koretek, stb.)
- A "Kep letoltese" gombbal PNG-kent letoltheto
- Elonezet a canvasrol kozvetlenul latszik

### Elhelyezes az admin feluleten

A `DailyMenuManagement.tsx` oldalra uj "Facebook kep" tab:

```text
[Ajanlatok] [Kapacitas] [Import] [Hirlevel] [Facebook kep]
```

### Technikai megvalositasi reszletek

A canvas rajzolas tiszta JavaScript-tel tortenik (nincs szukseg kulso konyvtarra):
- `canvas.getContext('2d')` hasznalata
- Betutipusok: sans-serif a normalis szoveghez, kurziv/serif az "Napi ajanlat" fejlecnek
- Szinpaletta a mintakepe alapjan:
  - Hatter: sotet szurke/fekete gradiens (#1a1a2e -> #16213e)
  - Fejlec szoveg: arany (#d4a843)
  - Etelnevek: feher (#ffffff)
  - Arak: feher, jobbra igazitva
  - Menu szekcioval elvalaszto vonal: arany
  - Megjegyzes: kisbetus, halvanyszurke szoveg
- Canvas merete: 1080x1350 px (Instagram/Facebook optimalis)

A komponens nap-valasztoval rendelkezik, es az adott nap adatait betolti, megrajzolja a canvasra, es egy gombbal letolthetobbe teszi.

---

## 2. Napi ajanlat kep feltoltese (Facebook -> weboldal)

Az admin feltolthet egy kepet is az adott napra (pl. a korabban Facebook-ra posztolt kepet), ami megjelenik a weboldalon.

### Adatbazis valtozas

Uj oszlop a `daily_offers` tablaban:

```text
ALTER TABLE daily_offers ADD COLUMN facebook_image_url TEXT;
```

Ez tarolja a feltoltott kep URL-jet (Supabase Storage, `menu-images` bucket).

### Admin felulet valtozas

A napi ajanlatok admin feluleten (WeeklyGridMobile / WeeklyGridCell) vagy a "Facebook kep" tabon egy kepfeltolto mezo jelenik meg naponta, amely:
- Lehetove teszi kep feltolteset a meglevo `menu-images` Supabase Storage bucket-be
- A feltoltott kep URL-je a `daily_offers.facebook_image_url` oszlopba kerul
- Torles es csere lehetseges

### Weboldalon megjelenites

Az `Etlap.tsx` es `UnifiedDailySection.tsx` oldalakon, ha van feltoltott kep az adott napra, az megjelenik:
- A napi menu szekcion felul vagy mellett, mint "Mai ajanlat" kep
- Kattintasra nagyithato (lightbox)
- Ha nincs kep, a jelenlegi dizajn marad valtozatlanul

---

## Technikai reszletek

### Fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | Uj komponens - canvas-alapu kepgenerator |
| `src/pages/admin/DailyMenuManagement.tsx` | Uj "Facebook kep" tab |
| `supabase/migrations/add_facebook_image_url.sql` | Uj oszlop: daily_offers.facebook_image_url |
| `src/pages/Etlap.tsx` | Feltoltott kep megjelenitese |
| `src/components/UnifiedDailySection.tsx` | Feltoltott kep megjelenitese a folapon |
| `src/integrations/supabase/types.ts` | Tipus frissites az uj oszloppal |

### Canvas rajzolas pszeudokod

```text
1. Hatter rajzolasa (sotet gradiens)
2. Fejlec: "Napi ajanlat MM.DD. napnev HH:MM-tol" (arany szin, nagyobb betu)
3. Vizszintes vonal (arany)
4. Minden etelez:
   - Nev balra igazitva (feher)
   - Ar jobbra igazitva (feher, "X.XXX.-" formatum)
5. Megjegyzes szekcioval (kisbetus, halvanyszurke)
6. Vizszintes vonal (arany)
7. Menu szekcioval:
   - "Menu" felirat (arany, kurziv)
   - Menu etelek felsorolasa
   - "Helyben: X.XXX,- Ft" (arany, nagyobb betu)
   - "(+ 200,- Ft a 2 doboz elvitelre)" megjegyzes
```

### Datum- es napvalaszto

A generatornak van egy datum-valasztoja (az admin kivalaszthatja melyik napra generalja a kepet). Az adott nap adatai automatikusan betoltodnek a `daily_offers` + `daily_offer_items` + `menu_items` tablakbol (ugyanugy mint a WeeklyNewsletterPanel-ben).

### Kepletoltes

A canvas tartalma `canvas.toDataURL('image/png')` segitsegevel konvertalodik, majd egy letoltheto linkkel mentheto. A fajlnev: `napi_ajanlat_2026-02-09.png`.

### RPC/lekerdezesi minta

A meglevo `get_daily_data` RPC-t hasznaljuk az adott nap adatainak lekerdezesehez, ugyanugy mint az Etlap.tsx-ben. Kiegeszitjuk a menu ar lekerdezesevel is.

### Biztonsagi megjegyzesek

- A kepfeltoltes a meglevo `menu-images` Supabase Storage bucket-et hasznalja
- Az admin RLS-ek mar ervenyben vannak
- A canvas rendereles kliensoldalon tortenik, nincs szerver-oldali erintettseg

