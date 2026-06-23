## Cél

Két új funkció a heti/napi ajánlatok adminisztrációjához:

1. **Piszkozat → Publikálás munkafolyamat**: Új napi ajánlatok alapból piszkozatként készüljenek, ne jelenjenek meg a publikus oldalon, amíg nincsenek kifejezetten publikálva.
2. **Másolás előnézet**: A „Menü másolása" dialógusban látni lehessen, hogy a kiválasztott forrás hét / nap milyen tételeket tartalmaz, mielőtt rákattintunk a másolásra.

---

## 1. Piszkozat / Publikálás rendszer

### Adatbázis
- Új oszlop: `daily_offers.is_published boolean NOT NULL DEFAULT false`.
- Migráció a meglévő rekordokhoz: minden korábbi `daily_offers` sor `is_published = true` legyen (visszamenőleg ne tűnjön el semmi a publikus oldalról).
- RLS frissítés: a publikus (anon + customer) SELECT policy a `daily_offers` és kapcsolt `daily_offer_items`, `daily_offer_menus` táblákon csak akkor adja vissza a sort, ha `is_published = true`. Az admin/staff policy változatlan: mindent lát.

### Admin felület
- `WeeklyMenuGrid.tsx` napi oszlopok fejlécében egy új státusz-badge és kapcsoló:
  - „Piszkozat" (sárga) / „Publikálva" (zöld).
  - Gomb: „Publikálás" / „Visszavonás piszkozatba".
- Heti szintű gyors művelet a fejlécben: „Egész hét publikálása" / „Egész hét piszkozatba".
- `CopyMenuDialog` másolás után a célnapokat továbbra is piszkozatként hozza létre — a felhasználó utólag dönt a publikálásról.
- `UnifiedDailyManagement` és `StreamlinedDailyOffers` napi nézetekben is ugyanaz a badge + gomb.

### Publikus oldal
- Minden olyan komponensben, ami a `daily_offers` táblát olvassa az anon kulccsal (`Etlap.tsx`, `UnifiedDailySection.tsx`, `DailyOfferCalendar.tsx`), `eq("is_published", true)` szűrő — biztonsági öv az RLS mellett.
- Ha egy napra nincs publikált ajánlat: a meglévő „nincs napi ajánlat" üres állapot jelenik meg (nem hibaüzenet).

### Admin kézikönyv (`adminHelpContent.ts`) + changelog
- Új rövid szekció: „Piszkozat és publikálás" — hogyan készítsünk előre jövő heti menüt anélkül, hogy a vendégek látnák.

---

## 2. Másolás előnézet a `CopyMenuDialog`-ban

### „Hét másolása" tab
- A forrás hét kiválasztása után (Select onChange) automatikus lekérdezés a `daily_offers` + `daily_offer_items` + `menu_items.name` táblákból az 5 napra.
- Alatta egy kompakt előnézet kártya:
  - 5 nap egymás alatt (H/K/Sze/Cs/P, dátum).
  - Naponként: Leves (menü rész), Főétel (menü rész), egyéb à la carte tételek listája — csak nevek, vesszővel.
  - Üres nap: halvány „Nincs ajánlat" felirat.
- Loading skeleton az előnézet alatt, amíg a query fut.

### „Nap másolása" tab
- A forrás nap kiválasztása után ugyanaz a kis kártya: 1 nap részletes tartalma (leves, főétel, à la carte).
- A cél nap kiválasztása után második kártya: mi van most a célnapon (ha valami már létezik), hogy lássuk mit fog kiegészíteni a másolás.

### Technikai megvalósítás
- React Query `useQuery` az előnézethez, kulcs: `["copy-preview", sourceDate(s)]`, így a dialóg újranyitás gyors cache-ből.
- Új kis komponens: `CopyMenuPreviewCard.tsx` (egy nap megjelenítése), újrahasznosítva a hét és nap tabon.

---

## Érintett fájlok

**Új:**
- `supabase/migrations/<új>.sql` — `is_published` oszlop + RLS frissítés.
- `src/components/admin/CopyMenuPreviewCard.tsx`
- `src/components/admin/PublishStatusToggle.tsx` (badge + gomb, újrahasznosítható)

**Módosítás:**
- `src/components/admin/CopyMenuDialog.tsx` — előnézet query + kártyák.
- `src/components/admin/WeeklyMenuGrid.tsx` — publikálás badge/gomb napi és heti szinten.
- `src/components/admin/UnifiedDailyManagement.tsx`, `StreamlinedDailyOffers.tsx` — publikálás badge.
- `src/pages/Etlap.tsx`, `src/components/UnifiedDailySection.tsx`, `src/components/DailyOfferCalendar.tsx` — `is_published = true` szűrő.
- `src/integrations/supabase/types.ts` — automatikusan frissül a migráció után.
- `src/data/adminHelpContent.ts`, `src/data/adminChangelog.ts` — dokumentáció + új bejegyzés.

---

## Mit NEM csinálunk most
- Nem vezetünk be több szintű jóváhagyást (pl. szerkesztő → tulajdonos). Egy gomb = publikálás.
- Nem ütemezett publikálás (időzítve). Ha kéred, külön körben hozzáadható.
- A `daily_menus` / `daily_offer_menus` rekordok automatikusan követik a szülő `daily_offers.is_published` értékét — külön kapcsoló nem kell.
