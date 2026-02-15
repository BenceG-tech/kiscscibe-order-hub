

# Staff "Elfogyott" jeloles + hang teszt

## Osszefoglalas

Ket fejlesztes a staff feluleten: (1) az elkeszitendo tetelek listajan "Elfogyott" kapcsolo minden etelhez, amely a `daily_offer_items.is_sold_out` mezot allitja, es (2) ertesitesi hang teszt gomb a fejlecben.

## 1. "Elfogyott" jeloles az ItemsToPrepareSummary-ban

### Problema

A jelenlegi komponens csak aggregalt etelnev + darabszam parokat mutat, a rendelesekbol szarmaztatva. Nincs kapcsolata a `daily_offer_items` tablaval, igy nem tudja kozvetlenul megjelolni az eteleket elfogyottnak.

### Megoldas

A komponensbe beepitjuk a mai nap `daily_offer_items` rekordjainak lekerdezeset, es nev alapjan osszekapcsoljuk az aggregalt tetelek listajaval.

**Uj logika az `ItemsToPrepareSummary.tsx`-ben:**

1. `useEffect`-tel lekerdezzuk a mai nap `daily_offer_items` rekordjait (a `daily_offers` tablan keresztul, `date = today`):
   ```
   supabase
     .from("daily_offer_items")
     .select("id, is_sold_out, menu_items(name), daily_offer_id, daily_offers!inner(date)")
     .eq("daily_offers.date", today)
   ```
2. Letrehozunk egy `Map<string, { id: string; is_sold_out: boolean }>` strukturat az etelnev -> daily_offer_item_id parokkal
3. Minden aggregalt etelhez: ha talalhato a map-ben, megjelenik egy piros/zold toggle gomb
4. Kattintasra: `supabase.from("daily_offer_items").update({ is_sold_out: !current }).eq("id", itemId)`
5. Vizualis visszajelzes: athuzott nev + halvany szin + "Elfogyott" badge
6. Toast ertesites: "Husleves megjelolve elfogyottkent" / "Husleves ujra elerheto"

**Interfesz bovites:**

- Az aggregalt tetelek listaja kiegeszul az `is_sold_out` allapottal es a `daily_offer_item_id`-val
- Uj state: `soldOutMap` (a DB-bol toltott es lokalis toggle utan frissitett)
- Uj state: `togglingId` (loading allapot az eppen toggle-olt itemhez)

**UI:**

```text
  3x  Húsleves                    [Elfogyott]    <- piros toggle gomb
  2x  ~~Rántott csirke~~  Elfogyott  [Elérhető]  <- athuzva + badge + zold gomb
  5x  Túrós csusza                [Elfogyott]
```

- A gomb `variant="ghost"` + `size="sm"`, piros szoveg ha aktiv, zold ha visszaallithato
- Az athuzott stilus: `line-through opacity-60` a neven
- Badge: `variant="destructive"` "Elfogyott" szoveggel

**RLS:** A `daily_offer_items` UPDATE policy `is_admin(auth.uid())`-t hasznal. A staff felhasznaloknak nincs UPDATE joguk. Ez problema!

**RLS javitas szukseges:** Uj policy kell a `daily_offer_items` tablara:
```sql
CREATE POLICY "Staff can update sold out status"
ON daily_offer_items FOR UPDATE
USING (is_admin_or_staff(auth.uid()))
WITH CHECK (is_admin_or_staff(auth.uid()));
```

Mivel a jelenlegi admin UPDATE policy mar letezik, a staff policy nem utkozik vele (mindketto RESTRICTIVE, de az `is_admin_or_staff` tartalmazza az admint is). **A legegyszerubb megoldas:** a meglevo "Admin can update daily offer items" policyt modositjuk `is_admin_or_staff`-ra, vagy uj PERMISSIVE policyt adunk hozza.

### Erintett fajlok

- `src/components/staff/ItemsToPrepareSummary.tsx` — teljes atalakitas
- Supabase migracio — RLS policy bovites a `daily_offer_items` tablara staff UPDATE-hez

## 2. Hang teszt gomb a StaffLayout fejlecben

### Megoldas

Az `OrderNotificationsContext`-bol expozaljuk a `playNotificationSound` es `audioUnlocked` ertekeket.

**Modositasok:**

1. **`src/hooks/useGlobalOrderNotifications.tsx`**: Mar visszaadja az `audioUnlocked`-ot (229. sor), es a `playNotificationSound`-ot kozvetetten hasznalja. A hook-bol expozaljuk a `playNotificationSound` fuggvenyt is a return-ben.

2. **`src/contexts/OrderNotificationsContext.tsx`**:
   - Interface bovites: `playNotificationSound: () => void` es `audioUnlocked: boolean`
   - Hook-bol kinyerjuk es tovabbitjuk a context value-ban

3. **`src/pages/staff/StaffLayout.tsx`**:
   - Import: `Volume2`, `VolumeX` a `lucide-react`-bol
   - Import: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` a `@/components/ui/tooltip`-bol
   - A "Szemelyzet" badge melle kerul egy ikongomb
   - Ha `audioUnlocked`: zold `Volume2` ikon
   - Ha nem: sarga `VolumeX` ikon
   - Kattintasra: `playNotificationSound()` hivas
   - Tooltip: "Ertesitesi hang tesztelese"
   - `min-h-[44px] min-w-[44px]` az erintesi terulethez

**UI:**

```text
  [Szemelyzet badge] [🔊] [Kijelentkezes]
```

### Erintett fajlok

- `src/hooks/useGlobalOrderNotifications.tsx` — `playNotificationSound` expozalasa a return-ben
- `src/contexts/OrderNotificationsContext.tsx` — `playNotificationSound` + `audioUnlocked` expozalasa
- `src/pages/staff/StaffLayout.tsx` — hang teszt gomb UI

## Technikai reszletek

| Elem | Megoldas |
|------|---------|
| Napi tetelek lekerdezes | `daily_offer_items` + `daily_offers!inner(date)` + `menu_items(name)` join, `date = today` |
| Sold-out toggle | `supabase.from("daily_offer_items").update({ is_sold_out }).eq("id", id)` |
| RLS | Uj/modositott policy: `is_admin_or_staff(auth.uid())` az UPDATE-hez |
| Hang expozalas | `playNotificationSound` hozzaadasa a context interface-hez es return-hez |
| Audio allapot | `audioUnlocked` boolean az ikon szinehez |
| Erintesi terulet | `min-h-[44px] min-w-[44px]` a hang teszt gombra |
| Toast | `sonner` toast a sold-out toggle utan |

## Migracio

```sql
-- Staff sold-out toggle engedelyezese
CREATE POLICY "Staff can update daily offer items sold out"
ON public.daily_offer_items
FOR UPDATE
USING (is_admin_or_staff(auth.uid()));
```

