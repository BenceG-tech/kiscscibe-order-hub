
# Harom fo problema javitasa

## Azonositott problemak es okok

### 1. Statusz emailek nem erkeznek meg
A `send-order-status-email` edge function-nek **egyetlen log bejegyzese sincs** - soha nem lett meghivva sikeresen. A frontend kod (StaffOrders.tsx es OrdersManagement.tsx) tartalmazza a hivast, de a function valoszinuleg **nem lett uzembe helyezve**. Ujra kell deployolni.

### 2. Ertesitesek csak az admin/staff oldalakon mukodnek
Az `useGlobalOrderNotifications` hook jelenleg **csak** az `AdminLayout`-ban es a `StaffLayout`-ban fut. Ha a staff a fo oldalon (Index, Menu, About stb.) bongesz, **nincs aktiv realtime subscription**, igy nem kap ertesitest. A megoldas: az ertesitesi rendszert **az egesz alkalmazas szintjere** kell emelni.

### 3. Uj rendelesek nem jelennek meg frissites nelkul
A `useGlobalOrderNotifications` hook-ban **hiba van**: a `knownOrderIds` (Set) a subscription effect fuggosegeiben van (162. sor). Minden uj rendeles erkeztekor a Set valtozik, ami **ujracsatlakozast okoz** - rovid kimaradasokat es elveszett esemenyeket eredmenyezhet. A javitas: `useRef` hasznalata `useState` helyett.

---

## Megoldasi terv

### 1. lepes: Ertesitesi hook javitasa (`useGlobalOrderNotifications.tsx`)
- A `knownOrderIds`-t `useRef<Set<string>>` tipusra valtoztatjuk `useState` helyett
- Ezzel a subscription **nem irodik ujra** minden uj rendeles utan
- A subscription stabil marad az egesz munkamenet alatt

### 2. lepes: Globalis ertesitesi kontextus letrehozasa
Uj fajl: `src/contexts/OrderNotificationsContext.tsx`

Ez a kontextus:
- Ellenorzi az `useAuth`-bol, hogy a felhasznalo admin vagy staff-e
- Ha igen: aktivalja az ertesitesi hook-ot es rendereli a felugro ablakot
- Ha nem (sima vasarlo): nem csinal semmit
- Az ertesitesi allapotot (szamlalo, torles) kontextusban elerheto teszi

Igy **minden oldalon** (fooldal, menu, kapcsolat, admin stb.) mukodnek az ertesitesek ha a felhasznalo admin/staff.

### 3. lepes: App.tsx frissitese
- Az `OrderNotificationsProvider`-t beillesztjuk a `BrowserRouter`-on belul (mert a `useNavigate`-hez kell) es az `AuthProvider`-on belul (mert a `useAuth`-hoz kell)

### 4. lepes: AdminLayout es StaffLayout egyszerusitese
- Mindket layoutbol **eltavolitjuk** a kozvetlen `useGlobalOrderNotifications` hivast es az `OrderNotificationModal`-t
- Helyette a kontextusbol olvassak az adatokat (badge szamlalo, torles)
- Ezzel megszunik a dupla subscription problema

### 5. lepes: Edge function ujratelepitese
- A `send-order-status-email` function-t ujra deployoljuk
- Ellenorizzuk, hogy mukodik-e

---

## Technikai reszletek

### useGlobalOrderNotifications.tsx - Fo valtozasok
```text
JELENLEGI (hibas):
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());
  // ...
  useEffect(() => { ... }, [playNotificationSound, knownOrderIds]);
  // ^ Ez MINDEN uj rendeles utan ujracsatlakozik!

JAVITOTT:
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  // ...
  useEffect(() => { ... }, [playNotificationSound]);
  // ^ Stabil subscription, nem irodik ujra
```

### OrderNotificationsContext.tsx - Uj fajl
```text
Struktura:
  OrderNotificationsContext -> createContext
  OrderNotificationsProvider:
    - useAuth() -> isAdmin, isStaff ellenorzes
    - Ha admin/staff: renderel egy belso komponenst ami:
      - useGlobalOrderNotifications() hook-ot hasznalja
      - OrderNotificationModal-t rendereli
      - Kontextusba irja az ertesitesi adatokat
    - Ha nem admin/staff: ures kontextust ad
  useOrderNotifications() -> context hook
```

### App.tsx - Modositasok
```text
JELENLEGI:
  AuthProvider > CartProvider > TooltipProvider > BrowserRouter > Routes

JAVITOTT:
  AuthProvider > CartProvider > TooltipProvider > BrowserRouter >
    OrderNotificationsProvider > Routes
```

### AdminLayout.tsx / StaffLayout.tsx - Modositasok
```text
JELENLEGI:
  import { useGlobalOrderNotifications } from '...';
  import OrderNotificationModal from '...';
  const { newOrdersCount, ... } = useGlobalOrderNotifications();
  <OrderNotificationModal ... />

JAVITOTT:
  import { useOrderNotifications } from '@/contexts/OrderNotificationsContext';
  const { newOrdersCount, clearNewOrdersCount } = useOrderNotifications();
  // Nincs OrderNotificationModal - az App szinten van
```

### Modositando fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `src/hooks/useGlobalOrderNotifications.tsx` | `knownOrderIds` ref-re csere, stabil subscription |
| `src/contexts/OrderNotificationsContext.tsx` | **UJ** - globalis ertesitesi kontextus |
| `src/App.tsx` | `OrderNotificationsProvider` beillesztese |
| `src/pages/admin/AdminLayout.tsx` | Kontextusbol olvas, nincs kozvetlen hook/modal |
| `src/pages/staff/StaffLayout.tsx` | Kontextusbol olvas, nincs kozvetlen hook/modal |
| `supabase/functions/send-order-status-email/index.ts` | Ujratelepites (deploy) |

### Vart eredmenyek

1. **Statusz emailek mukodni fognak** - az ugyfel emailt kap ha "keszitjuk", "kesz" es "atveve" statuszra kerul a rendelese
2. **Ertesitesek mindenhol mukodnek** - ha a staff a fooldalon bongesz, attol meg kap popup-ot es hangjelzest uj rendeles eseten
3. **Nincs oldalfrissites szukseg** - az uj rendelesek azonnal megjelennek a Kanban tablan es az admin oldal listajaban
