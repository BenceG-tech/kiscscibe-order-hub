## Cél
Javítani a `validate_pickup_time()` trigger időzóna hibáját, ami miatt Erika (és mások) 10:30-as rendelése elutasításra került, majd berögzíteni Erika elveszett rendelését.

## Lépések

### 1. Migráció: `validate_pickup_time()` javítása
A funkció jelenleg a `pickup_datetime::time` értéket UTC-ben értelmezi. Budapest nyári időszámításban (UTC+2) egy 10:30-as rendelés 08:30 UTC-ként jelenik meg, ami kívül esik a 10:30–15:00 ablakon → a DB elutasítja.

Javítás: `AT TIME ZONE 'Europe/Budapest'` konverzió alkalmazása, mielőtt kinyerjük az időt és a napot.

```sql
CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    local_ts timestamp;
    pickup_time_local time;
    day_of_week integer;
BEGIN
    local_ts := (pickup_datetime AT TIME ZONE 'Europe/Budapest');
    pickup_time_local := local_ts::time;
    day_of_week := EXTRACT(DOW FROM local_ts::date);

    IF day_of_week IN (0, 6) THEN
        RETURN false;
    END IF;
    IF pickup_time_local < '10:30'::time OR pickup_time_local > '15:00'::time THEN
        RETURN false;
    END IF;
    RETURN true;
END;
$$;
```

### 2. Erika rendelésének berögzítése
Az `order_attempts` táblából kiolvasom Erika adatait (név, telefon, tételek, összeg, átvételi idő), majd `INSERT`-elem az `orders` + `order_items` táblákba `status='new'` státusszal, hogy az étterem lássa és kezelni tudja. Ehhez a migráció után az `insert` eszközt fogom használni (miután megnéztem a pontos rekordot).

### 3. Changelog + admin banner
Új bejegyzés: „Javítva: 10:30-as rendelések elutasítása időzóna hiba miatt. Erika elveszett rendelése kézzel berögzítve."

## Sorrend
1. Migráció futtatása (trigger függvény javítása)
2. Erika `order_attempts` rekord kiolvasása → `orders`/`order_items` insert
3. Changelog frissítése (`src/data/adminChangelog.ts`)
