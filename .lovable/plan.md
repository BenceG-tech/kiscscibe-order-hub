## Cél

1. Átvételi időpontok korlátozása: ebéd rendelésnél az első választható idősáv 10:30 legyen (jelenleg 07:00‑tól indul, ezért tudtak 07:00‑os és 10:00‑es rendelések bejönni).
2. A jövőbeli napokon a már létező korai capacity_slots sorokat töröljük (azokat, ahol már nincs leadott rendelés).
3. Kivizsgálni, miért nem jelennek meg az "Új rendelések" fülön a C43220 és R44023 rendelések, és javítani.

---

## 1) Átvételi idősávok 10:30‑tól

**`src/pages/Checkout.tsx` – `generateBusinessHourSlots`:**
- Hétköznap (H–P): kezdés **10:30**, vég 15:00, 30 percenként → 10:30, 11:00, 11:30, 12:00, 12:30, 13:00, 13:30, 14:00, 14:30.
- Szombat: kezdés 10:30, vég 14:00 (ha az üzlet egyáltalán nyit szombaton — jelenleg a kód szombaton is generál; ezt is áthúzom 10:30‑ra, mert a memória szerint hétvégén zárva vagyunk, így a vasárnap‑szerű `return []` érvényes lehet szombatra is. **Megerősítést kérek**: szombaton zárva, ne legyen idősáv? Alapból zárva‑ként kezelem.)
- Az aktuális napra (ma) is csak a `now + 30 perc` utáni 10:30‑tól induló sávok jelennek meg (a meglévő szűrő marad).

**`supabase/functions/system-health-fix/index.ts` – `capacity` fix:**
- A "Alap idősávok létrehozása" auto‑fix már 11:00–15:30 közöttit hoz létre; ezt átírom **10:30‑tól 15:00‑ig** 30 percenként, hogy a frontenddel konzisztens legyen.
- `src/data/healthCheckExplanations.ts` szövegét is frissítem („10:30–15:00 között 30 percenként").

**Szerver‑oldali védelem (DB):**
- `public.validate_pickup_time(pickup_datetime)` függvényt frissítem migrációval: hétköznap engedélyezett tartomány **10:30 – 15:00** (jelenleg 07:00–16:00), szombat/vasárnap továbbra is tiltott. Így a rendelés leadás edge function és a `validate_order_date` trigger blokkolja a 10:30 előtti átvételt akkor is, ha valaki kerülő úton próbálkozik.

## 2) Korai capacity_slots takarítása (jövőbeli napok)

Egyszeri migráció, ami a **mai naptól előre** törli azokat a capacity_slots sorokat, ahol `timeslot < '10:30'` ÉS `booked_orders = 0`. A foglalt sorokat (pl. R44023 → 2026‑02‑18 07:00, 1 foglalás) **nem** törli — különben elveszne a kapcsolat a már leadott rendeléssel; ezek a sorok admin döntés alapján maradnak (és a rendelést a sztenderd folyamattal lehet törölni/áthelyezni).

## 3) "Új rendelések" fül nem mutatja az új rendeléseket

**Diagnózis:** Az `OrdersManagement` realtime feliratkozás csak `INSERT/UPDATE/DELETE` eseményre `fetchOrders`‑t hív, de a render után a `useEffect` lezárása miatt a status szűrés a memóriából megy. A két rendelés (status='new', archived=false, created_at < 30 nap) elvileg betöltődik — a képernyőn mégis 0. A legvalószínűbb okok:
- A felhasználó képernyője már leiratkozott (offline / hibernált tab), és a refetch nem futott le.
- A fetch limit (Supabase default 1000) elérve más zaj miatt — kevés esély, de ellenőrizzük.

**Javítás:**
- Az `OrdersManagement` fejlécbe egy kis **„Frissítés"** ikon gomb (RefreshCw) és **30 mp‑es automatikus polling** `setInterval`‑lal a realtime mellett, fallbackként.
- A realtime feliratkozást javítom: subscribe után `subscribe((status) => …)`, ha `CHANNEL_ERROR` vagy `TIMED_OUT`, akkor automatikus újracsatlakozás és azonnali `fetchOrders`.
- Hibakeresési naplót adok hozzá (`console.warn`) ha a fetch hibára fut, hogy legközelebb látható legyen.
- A „Rendszerellenőrzés" gombhoz a SystemHealthCheck‑be új check‑et adok: **"Új rendelések listája szinkronban"** — összehasonlítja a DB‑ben lévő `status='new'` darabszámát a kliensből küldött értékkel; ha eltér, javasolja a frissítést.

## Technikai részletek

- Csak frontend + 1 SQL migráció + 1 edge function frissítés.
- Nem nyúlunk üzleti logikához (ár, készlet, kupon).

## Érintett fájlok

- Módosítás: `src/pages/Checkout.tsx`, `src/pages/admin/OrdersManagement.tsx`, `src/data/healthCheckExplanations.ts`, `supabase/functions/system-health-fix/index.ts`, `src/data/adminChangelog.ts`
- Új migráció: `validate_pickup_time` frissítés + capacity_slots törlés (jövőbeli, foglalatlan, <10:30)
