# Jövő heti ajánlat mentés javítása

## Probléma

A toast pontosan ezt mutatja: **"Hiba: permission denied for function is_weekend"**.

A `daily_offer_items` táblán lévő `validate_daily_item_date` trigger meghívja a `public.is_weekend(date)` függvényt, hogy ellenőrizze, hétvégére esik-e az új tétel. A függvényre azonban csak a `postgres` és `service_role` szerepköröknek van EXECUTE joga — az `authenticated` (admin felhasználó) szerepkörnek nincs, így a trigger elhasal és semmit nem lehet menteni.

## Megoldás

Egyetlen migráció, ami megadja az EXECUTE jogot a hiányzó függvényekre:

```sql
GRANT EXECUTE ON FUNCTION public.is_weekend(date) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_daily_item_date() TO authenticated, anon;
```

Ezek SECURITY DEFINER függvények, tehát a végrehajtási jog megadása nem ad új adathozzáférést — csak engedi meghívni őket a trigger láncon keresztül.

## Várt eredmény

- A heti rácsban (Napi ajánlatok → Ajánlatok) a tételek hozzáadása/módosítása újra menthető hétköznapokra
- Hétvégi dátumok továbbra is el lesznek utasítva a trigger logikája szerint
- A korábbi munka során bevezetett dinamikus hibaüzenet (`error.message`) megmarad jövőbeli debug-hoz
