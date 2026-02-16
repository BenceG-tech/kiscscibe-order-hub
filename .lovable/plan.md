

# Napi Uzemeltetesi Funkciok — 5 uj fejlesztes

## Osszefoglalas

Ot uj funkcio a napi mukodesek egyszerusitesere: (1) automatikus napi zaro riport bovitese, (2) keszlet/alapanyag becsles, (3) idojaras-alapu forgalom elorejelzes, (4) egy kattintasos heti menu masolas, (5) nyomtathato napi osszesito.

---

## 1. Automatikus napi zaro riport bovitese

**Cel:** A meglevo `send-daily-report` edge function bovitese az elfogyott etelek listajával, majd pg_cron utemezese este 20:00-ra.

**Modositott fajlok:**
- `supabase/functions/send-daily-report/index.ts` — Uj szekciok az email-ben:
  - "Elfogyott etelek": lekerdezi a `daily_offer_items` tablat ahol `is_sold_out = true` az adott napra, a `menu_items` nevet is lekerdezve
  - "Maradek adagok": a `daily_offers.remaining_portions` es `daily_offer_menus.remaining_portions` ertekeit
  - Idosavos bontas: reggeli rendelesek (7-10), delutas (10-14), keso (14-16) — az orders created_at alapjan
  - Az emailben ezek uj szekciokent jelennek meg a meglevo top etelek es fizetesi modok mellett

**Automatizalas:** pg_cron job minden munkanapon 20:00-kor meghivja a `send-daily-report` edge function-t. Ezt SQL inserttel rogzitjuk (nem migracio).

---

## 2. Keszlet/alapanyag becsles

**Cel:** A holnapi menu tetelek es korabbi rendelesi adatok alapjan becsulje meg a szukseges adagszamot.

**Uj fajlok:**
- `src/components/admin/IngredientEstimate.tsx` — UI komponens a DailyMenuManagement oldalra
  - Lekerdezi a holnapi (vagy kivalasztott nap) `daily_offer_items`-et a `menu_items` nevel
  - Lekerdezi az elozo 4 het azonos napjainak rendeleseit (pl. ha holnap szerda, az elmult 4 szerda)
  - Kiszamolja az atlagos rendelt adagszamot tetelenkent
  - Megjelenitit tablazatban: Etel neve | Beallitott adag | Becsult igeny (atlag) | Javasolt adag
  - Szinkodolas: zold ha eleg, sarga ha szoros, piros ha tul keves a beallitott
  - Nyomtathato: egyetlen gombnyomasra `window.print()` kompatibilis

**Modositott fajlok:**
- `src/pages/admin/DailyMenuManagement.tsx` — uj "Becsles" tab a meglevo tabfuulek melle

---

## 3. Idojaras-alapu forgalom elorejelzes

**Cel:** Korabbi rendelesi adatok + ingyenes idojaras API alapjan becsult forgalom holnapra.

**Uj fajlok:**
- `supabase/functions/weather-forecast/index.ts` — Edge function
  - Meghivja az Open-Meteo API-t (ingyenes, nincs API kulcs szukseges): `https://api.open-meteo.com/v1/forecast`
  - Az ettermere vonatkozo GPS koordinatakat hasznaja (Budapest kornyeke)
  - Visszaadja: holnapi homerseklet, csapadek valoszinuseg, idojaras kod
  - Lekerdezi az `orders` tablabol az elmult 8 het azonos napjainak rendelesi adatait
  - Egyszeru korrelacio: esos napokon atlagosan hany %-kal kevesebb rendeles volt
  - Visszaad: becsult rendelesi szam, becsult bevetel, idojaras szoveg

- `src/components/admin/WeatherForecast.tsx` — Dashboard kartya
  - Megjeleníti: holnapi idojaras ikon + homerseklet + csapadek %
  - Becsult forgalom: "Holnap varhato: ~25 rendeles (~85.000 Ft)"
  - Osszehasonlitas: "Ez ~20%-kal kevesebb a szokasosnal (esos ido)"
  - Egyszeruu vizualizacio, nem pontos — "tapasztalati becsles" felirattal

**Modositott fajlok:**
- `src/pages/admin/Dashboard.tsx` — WeatherForecast komponens beillesztese a stat kartyak ala
- `supabase/config.toml` — uj function szekci o

---

## 4. "Egy kattintasos" heti menu masolas

**Cel:** Az elozo het teljes menujenet atmasolasa az aktualis hetre.

**Modositott fajlok:**
- `src/components/admin/WeeklyMenuGrid.tsx` — Uj "Het masolasa" gomb a heti navigacio sorabol
  - Kattintasra dialog: "Atmasolja az elozo het osszes napi ajanlat-tetelet az aktualis hetre?"
  - Logika:
    1. Lekerdezi az elozo het (currentWeekStart - 7 nap) `daily_offers` + `daily_offer_items` adatait
    2. Minden napra: ha meg nincs `daily_offer`, letrehozza
    3. A meglevo tetelek NEM torlodnek — csak azokat adja hozza, amik meg nincsenek (duplikaciomegelozés item_id alapjan)
    4. Atmasolja az arat (`price_huf`) es a menu beallitasokat (`is_menu_part`, `menu_role`)
    5. A `max_portions` es `remaining_portions` ujra 50-re allnak
  - Sikeruzenet: "X nap menuje atmasolva, Y uj tetel hozzaadva"
  - Hiba eseten rollback (nincs kulon tranzakcio, de az egyes muveletek hibait kezeli)

---

## 5. Nyomtathato napi osszesito (konyhai lista)

**Cel:** A mai nap osszesitoje nyomtatobarat formaban, amit ki lehet nyomtatni es kitenni a konyhaban.

**Uj fajlok:**
- `src/components/staff/PrintableDailySummary.tsx` — Nyomtatobarat komponens
  - Tartalom:
    - Datum es nap neve
    - Mai napi ajanlat tetelek listaja (nev, kategoria, beallitott adagszam)
    - Menu beallitas: melyik a leves, melyik a foetel, menu ar
    - Aktiv rendelesek osszesitese: tetelenkent hany darabot kell kesziteni (aggregalt, mint az ItemsToPrepareSummary)
    - Idosavos bontas: melyik rendelest mikorra kell elkesziteni (pickup_time alapjan)
  - CSS: `@media print` stilus — feher hatter, fekete szoveg, nincs navigacio, kompakt tabla
  - Gomb: "Nyomtatas" → `window.print()` hivasa

- `src/components/staff/PrintButton.tsx` — Kicsi gomb komponens ami megnyitja a nyomtatasi nezetet

**Modositott fajlok:**
- `src/pages/staff/StaffOrders.tsx` — PrintButton hozzaadasa a DailyStaffSummary melle
- Globalis CSS (`src/index.css` vagy `src/App.css`) — `@media print` szabalyok: elrejti a navigaciot, sidebarat, footer-t

---

## Erintett fajlok osszesitese

| Fajl | Muvelet |
|------|---------|
| `supabase/functions/send-daily-report/index.ts` | Modositas (elfogyott etelek, idosavos bontas) |
| `src/components/admin/IngredientEstimate.tsx` | UJ |
| `src/pages/admin/DailyMenuManagement.tsx` | Modositas (uj tab) |
| `supabase/functions/weather-forecast/index.ts` | UJ |
| `src/components/admin/WeatherForecast.tsx` | UJ |
| `src/pages/admin/Dashboard.tsx` | Modositas (idojaras kartya) |
| `supabase/config.toml` | Modositas (uj function) |
| `src/components/admin/WeeklyMenuGrid.tsx` | Modositas (masolas gomb) |
| `src/components/staff/PrintableDailySummary.tsx` | UJ |
| `src/components/staff/PrintButton.tsx` | UJ |
| `src/pages/staff/StaffOrders.tsx` | Modositas (nyomtatas gomb) |
| `src/App.css` | Modositas (print stilus) |

## Implementacios sorrend

1. **Napi zaro riport bovitese** — meglevo edge function modositasa, legkisebb kockazat
2. **Heti menu masolas** — tisztan kliens oldali, a WeeklyMenuGrid-be epul
3. **Nyomtathato napi osszesito** — uj komponensek, print CSS
4. **Keszlet becsles** — korabbi adatok aggregalasa, uj tab
5. **Idojaras elorejelzes** — uj edge function + external API, Dashboard bovites

## Megjegyzesek

- Az Open-Meteo API ingyenes es nem igenyel API kulcsot, ezert nincs szukseg uj secret-re
- A pg_cron job-ot (napi riport 20:00) SQL inserttel rogzitjuk, nem migraci oval
- A heti menu masolas nem torol semmit, csak hozzaad — biztonsagos muvelet
- A nyomtatasi nezet CSS-alapu, nem general PDF-et — egyszeruen a bongeszo nyomtatasi funkciojaval mukodik

