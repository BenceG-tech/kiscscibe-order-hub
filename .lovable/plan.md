## Cél
Végignézni azokat a rejtett pontokat a rendelésleadásban, ahol az Erikáéhoz hasonlóan némán elakadhat egy rendelés, és javítani a valós kockázatokat.

## Talált kockázatok (submit-order/index.ts + kapcsolódók)

### 1. Legacy ISO `pickup_time` → időzóna-eltolódás (ugyanaz a családi hiba, mint Erikánál) — MAGAS
`supabase/functions/submit-order/index.ts` 439–444. sor: ha a kliens `pickup_time` ISO-t küld (nem az új `pickup_date` + `pickup_time_slot` formátumot), a szerver
```
date = pickupDate.toISOString().split('T')[0]
time = pickupDate.toTimeString()...
```
használ. Az edge function UTC-ben fut, tehát 10:30 budapesti idő → 08:30 UTC, dátum akár előző napra csúszik. Ezt a `capacity_slots` kereséséhez / létrehozásához, és utána a `validate_pickup_time` triggerhez adjuk tovább — pont a 10:30-as ablakot lőheti szét, és a `is_weekend`-et is elronthatja szombat-vasárnap környékén.

**Javítás:** ugyanaz a Budapest-alapú kiszedés, mint az új formátumnál (Intl.DateTimeFormat `Europe/Budapest` vagy egyszerűen kényszerítsük az új formátumot: ha csak `pickup_time` érkezik, alakítsuk át Budapest wall-time-ra és úgy dolgozzunk vele).

### 2. Napi tétel „múltbeli dátum" ellenőrzés UTC-ben — KÖZEPES
321–327. sor: `new Date(itemDateStr + 'T00:00:00.000Z')` vs. `today = new Date(); today.setHours(0,0,0,0)`. Az edge function UTC-ben fut, tehát pont éjfél körül a magyar „ma" és a szerver „today" 1–2 órányit szétcsúszhat. Késő este (22:00–23:59 Bp) tudná visszadobni a másnapi tételt „múltbeli dátum" hibával az extrém esetben — vagy fordítva átengedni. Kicsi, de meglévő.

**Javítás:** a `today` értéket is Europe/Budapest szerinti YYYY-MM-DD-re számoljuk (mint a `system-health-check`-ben már használt Intl formatter), és stringen hasonlítsunk.

### 3. Capacity fallback nyitvatartás ütközik a `validate_pickup_time`-mal — KÖZEPES
486–503. sor: a fallback slot létrehozás `hours >= 7 && hours < 16` alapján dönt, míg a DB trigger csak 10:30–15:00 között enged. Ha valami miatt kliens 09:30-at küld (vagy régi cache-elt slot), az edge function létrehozza a capacity slotot és foglal, majd az `orders` INSERT-en a trigger `Pickup time is outside business hours`-ral kilő — közben a capacity_slot már inkrementálódott, tehát „szellemfoglalás" marad + a vevő „Rendelés mentési hiba" toastot lát. Ez pontosan Erika típusú tünet.

**Javítás:** a fallback ablakot igazítsuk a triggerhez (10:30–15:00) ÉS Budapest időben számoljuk a napot/órát; így vagy már itt tiszta hibaüzenetet adunk, vagy nem foglalunk el kapacitást feleslegesen. Plusz: ha az `orders` INSERT hibára fut, engedjük vissza a `capacity_slot.booked_orders`-t.

### 4. Nincs rollback részleges hiba után — MAGAS (részben nyitott az AUDIT-ban is)
Ha bármely lépés a `capacity_slot` foglalás UTÁN elhasal (pl. #3, `gen_order_code` ütközés, `orders` INSERT, `order_items` INSERT), a `remaining_portions` és a `capacity_slots.booked_orders` már csökkent — vevő nem lát rendelést, admin sem, de a készlet fogy. Idővel „elfogyott" hazug jelzés.

**Javítás:** try/catch-ben tartsunk nyilván inkrementált slot/portion listát; hiba esetén tegyünk visszaállító RPC hívásokat (`update_daily_portions` negatív mennyiséggel + capacity_slot dekrement). Vagy egyetlen tranzakciós SQL funkcióba tolni (nagyobb refaktor, most nem kell).

### 5. `gen_order_code` ütközés-védelem hiányzik — ALACSONY
`gen_order_code`: egy random betű + epoch mod 100000. Két egyidejű rendelés azonos másodpercben azonos betűt húz → egyedi kulcs ütközés az `orders.code`-on → „Rendelés mentési hiba". Ritka, de van rá esély csúcsidőben.

**Javítás:** próbáljuk meg 3× újragenerálni ütközés esetén, vagy toldjuk meg a kódot még 1 random karakterrel (kód formátum akkor 7 karakter — kell egyeztetni, hogy a nyomtatás/UI elviseli).

### 6. `menu_item_sides` több konfig — ALACSONY
158–168. sor: csak az első sor `is_required` / `min` / `max` alapján validál. Ha valakinek több side-csoportja van egy főételhez, félreértékeli és vagy hazug „köret hiányzik" hibát dob, vagy engedi. Erika-szerű néma elakadást nem okoz, de érdemes megjegyezni.

**Javítás:** csoportonként ellenőrzés, `sides`-t modifier_group_id szerint csoportosítva.

## Mit csináljunk most

Konkrét javítási sorrend (mind a `submit-order/index.ts`-ben, migráció nem kell):

1. **#1 + #2 + #3 együtt**: bevezetünk egy közös `getBudapestDateParts(iso|null)` helpert, ami mindenhol Europe/Budapest szerinti `date` (YYYY-MM-DD) és `time` (HH:MM) értéket ad. Ezt használjuk:
   - legacy `pickup_time` ág átalakítására,
   - napi tétel „múltbeli dátum" hasonlításra (string szintű),
   - fallback capacity slot nap/óra ellenőrzésre.
   - A fallback nyitvatartást 10:30–15:00 közé szűkítjük, hogy egyezzen a DB triggerrel.

2. **#4 rollback safety net**: az edge functionben követjük a végrehajtott `update_daily_portions` és `update_capacity_slot` hívásokat egy `compensations: Array<() => Promise>` tömbben; a `catch` ágban fordított sorrendben végig futtatjuk őket, mielőtt `order_attempts`-be logolunk. Nem tranzakció, de megelőzi a szellem-készletcsökkenést.

3. **#5 order code retry**: `orders` INSERT `code` unique ütközés (`23505`) esetén max. 3× újragenerálás + retry, csak utána adjuk fel.

4. **Changelog + audit doc**: adminChangelog-ba egy „Rendelési stabilitás: időzóna és rollback javítások" bejegyzés + az `AUDIT_AND_IMPROVEMENT_PLAN.md` 1.1/1.3 és 3.2 pontjait áthúzzuk „✅ Javítva" jelzéssel.

5. **Egészségellenőrzés kibővítés**: a `system-health-check`-be jön még egy „foglalt de rendelés nélküli capacity slotok" próba (`capacity_slots.booked_orders > count(orders az adott date+time-on)`), és a `system-health-fix` ezeket vissza tudja állítani egy gombnyomásra — így ha múltbeli szellemfoglalás keletkezett, egyszerűen tisztítható.

## Amit NEM csinálunk most
- #6 (több side csoport): érintett séma nincs élesben így, jelezzük a changelogban „ismert korlát"-ként, migráció nélkül nem indokolt most javítani.
- Teljes atomikus DB funkció (`submit_order_atomic`): nagy refaktor, a fenti rollback safety net most elég.

## Fájlok, amiket érintenék
- `supabase/functions/submit-order/index.ts` (fő javítás)
- `supabase/functions/system-health-check/index.ts` (+ szellemfoglalás check)
- `supabase/functions/system-health-fix/index.ts` (+ tisztító művelet)
- `src/data/adminChangelog.ts` (bejegyzés)
- `AUDIT_AND_IMPROVEMENT_PLAN.md` (státuszfrissítés)

Mehet így, vagy szűkítsük csak a KRITIKUS pontokra (#1 + #3 + #4)?
