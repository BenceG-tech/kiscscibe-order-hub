## Terv: valós próbarendelés + két bizonyíték-válasz + K1 lezárás

### 1. Bizonyíték-válasz #1 — timezone a 07-02-i `validate_pickup_time`-ben

A régi (`20260702072305`) trigger-törzs **helyesen** Budapest fali időben hasonlított — nem timezone-bug:

```sql
local_ts := (pickup_datetime AT TIME ZONE 'Europe/Budapest');
pickup_time_local := local_ts::time;
...
IF pickup_time_local < '10:30'::time OR pickup_time_local > '15:00'::time THEN
    RETURN false;
END IF;
```

Ítélet: **nem timezone-eltolódás**, hanem valódi ablak-szűkítés — a fejlesztő szándékosan (vagy tévedésből) csak ebédidőre engedte a rendeléseket. Reggeli (07:00–10:29) és késő délutáni (15:01–16:00) pickup-ok mind elhasaltak a `validate_order_date` triggeren. Ez az egyetlen gyökérok a 07-02-i leálláshoz.

### 2. Bizonyíték-válasz #2 — miért csak 1 `order_attempts` rekord

Adatbázis-lekérdezések eredménye (07-02 → 07-14):
- `orders`: **2 sor** (mindkettő 07-02)
- `order_attempts`: **1 sor** (07-02 06:05 UTC)
- `abandoned_carts`: **0 sor**

A `submit-order` catch-ág **igenis ír** `order_attempts`-be és `abandoned_carts`-ba (service role, RLS-bypass — kódutalás: `submit-order/index.ts:1355, 1389`). Tehát ha lettek volna trigger-elutasított próbálkozások, itt látszaniuk kellene.

Két lehetséges olvasat, mindkettőt közlöm a tulajjal:

**(a) Ez a DB nem a produkciós adathalmaz.** `SELECT DATE(created_at), COUNT(*) FROM orders WHERE created_at >= '2026-06-25'` összesen 2 rendelést hoz, mindkettő 07-02. Egy működő étterem 10 nap alatt ennyi rendelést nem produkál. Valószínű: staging/dev környezet, vagy a produkciós rendelések másik projektben landolnak. **Ezt előbb tisztáznod kell a tulajjal**, mert ha igen, a 10 napos „leállás" itt nem is látható — csak a séma-hibát javítottuk, a hatás-becslést nem tudom számszerűsíteni ebből a DB-ből.

**(b) Ha ez tényleg a produkciós DB:** akkor a felhasználók 10 napig még próbálkozni sem próbáltak, mert az UI (`Checkout.tsx` client-side `validate_pickup_time`) még a `submit-order` hívás **előtt** blokkolta a rendelést → `submit-order` nem futott → catch-ág nem írt sehova. Vagyis a tracking-táblák hallgatása egybevág a totális UI-szintű blokkolással, és **veszteség-becsléshez a `postgres_logs`/edge function log-ok szükségesek**, nem a DB-táblák.

Kérdés a tulajhoz: melyik Supabase projekt-ref az élesé? Ha ez (`gvtsbnivuysunnjrpndk`), akkor (b) áll; ha másik, akkor a fenti számok irrelevánsak és át kell váltani a hatás-becsléshez.

### 3. Valós próbarendelés-verifikáció (te vezérled)

Amikor jelzed „nyitva az admin, DevTools console fut":

1. Te leadsz egy inkognitó próbarendelést telefonról, `notes` mezőbe „TEST_K1_LIVE".
2. Én kérni fogom:
   - console log copy-paste (grep: `[Notifications]`, `useRealtimeOrders`, `Channel status`) — bizonyíték 2b (dedupe = 1 toast + 1 modal + 1 sound).
   - screenshot vagy megerősítés, hogy mindkét címzett (`kiscsibeetterem@gmail.com` + Bence) megkapta-e az emailt — ez az M5+M4 előtti empirikus email-baseline.
3. Utána megadod a rendelés `code`-ját, és **egyetlen `supabase--migration`** cleanup fut: `DELETE FROM order_item_options WHERE order_item_id IN (…) ; DELETE FROM order_items WHERE order_id = … ; DELETE FROM invoices WHERE order_id = … ; DELETE FROM orders WHERE id = …` — a `create_invoice_on_order_complete` trigger miatt fontos az `invoices` sor kitörlése is, ha státusz `completed`-re ment.

Ha 2b zöld (pontosan 1 értesítés) és mindkét email megjött **VAGY** a hiányzó email dokumentálva → K1 lezárva → **M5+M4 következik** (email_send_log tábla + bcc-szétbontás + admin Email státusz oszlop) a korábbi terv szerint.

### Fájl-változás ebben a lépésben

Nincs. Csak olvasás + a te live rendelésed + cleanup migráció a rendelés után.
