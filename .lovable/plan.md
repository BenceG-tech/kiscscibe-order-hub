

# Hiba javitas es Staff/Admin Rendelesek fejlesztes

## 1. "Rendered more hooks" hiba javitasa (KRITIKUS)

### A problema oka
Az `OrderNotificationsProvider` komponens feltetelesen rendereli az `ActiveNotifications` komponenst vagy egy ures kontextus providert. Amikor az auth allapot valtozik (`loading` -> `canViewOrders`), React megprobalja osszehasonlitani a ket kulonbozo komponenst, es a hook-ok szama elter koztuk - ez okozza a "Rendered more hooks than during the previous render" hibat es az ures kepernyot.

### Megoldas
A `useGlobalOrderNotifications` hookot atalakitjuk ugy, hogy kapjon egy `enabled` parametert. Igy a hook MINDIG meghivasra kerul (ugyanannyi hook minden renderben), de az `enabled=false` eseten a side effectek nem futnak. Az `OrderNotificationsProvider` egyetlen komponens lesz, nem fog feltetelesen renderelni `ActiveNotifications`-t vs. ures providert.

**Elott (hibas):**
```text
OrderNotificationsProvider:
  if loading -> ures Provider (0 belso hook)
  if canViewOrders -> ActiveNotifications (18 belso hook)  ← HOOK SZAM ELTER!
  else -> ures Provider (0 belso hook)
```

**Utan (javitott):**
```text
OrderNotificationsProvider:
  useAuth()                                    ← mindig 1 hook
  useGlobalOrderNotifications(enabled)          ← mindig 17 hook
  // Mindig 18 hook, fuggetlenul az auth allapottol
```

### Modositando fajlok:
- `src/hooks/useGlobalOrderNotifications.tsx` - `enabled` parameter hozzaadasa, effectek feltetelesse tetele
- `src/contexts/OrderNotificationsContext.tsx` - egyetlen komponens, nem felteteles renderelesEz veglegesen megoldja a hook-szam inkonzisztencia problemat.

---

## 2. Staff tabok ragadossa tetele (sticky tabs)

### Jelenlegi allapot
A `StatusSummaryBar` (Uj/Keszul/Kesz gombok) a `StaffOrders` oldalon nem ragados - gorgetesnel eltunnek.

### Megoldas
A `StatusSummaryBar`-t `sticky` pozicioval latjuk el, ugy hogy a StaffLayout header es navigacios sav alatti pozicioban ragadjon:

```text
sticky top-[calc(env(safe-area-inset-top,0)+56px+48px)] z-30 bg-background
```

### Modositando fajl:
- `src/pages/staff/StaffOrders.tsx` - A `StatusSummaryBar` wrapper div-jet sticky-re allitjuk

---

## 3. Mobilon tabok egymas mellett + swipe navigacio

### Jelenlegi allapot
Mobilon a harom Kanban oszlop egymas alatt jelenik meg (`grid-cols-1`), ami sok gorgetest igenyel.

### Megoldas
Mobilon es tableten a harom oszlop kozul egyszerre csak egyet mutatunk, a `StatusSummaryBar` gombjaival lehet kozottuk valtani. A gombok vizualisan is jelzik melyik aktiv. Desktopra (`lg:` breakpoint) megmarad a harom oszlopos racsozat.

A swipe funkciot touch eventekkel valositsuk meg:
- `touchstart` es `touchend` esemenyek figyelese a kartya kontener div-en
- Ha a vizszintes eltolas > 50px, akkor lepes a kovetkezo/elozo tabra

### Modositando fajlok:
- `src/components/staff/StatusSummaryBar.tsx` - Aktiv tab jelzese, `onTabChange` callback
- `src/pages/staff/StaffOrders.tsx` - Aktiv tab allapot, mobilon egyetlen oszlop megjelenitese, swipe esemenyek

---

## 4. Admin oldalon rendelesek archivalasa es torlese

### Jelenlegi allapot
Az archivalas mar implementalva van a kodban (archiveOrder, archiveAllPast fuggvenyek, PastOrdersTab komponens). A torles viszont hianzik.

### Megoldas
Hozzaadjuk a torles funkciota:
- `deleteOrder` fuggveny az `OrdersManagement`-ben
- Torles gomb minden lezart rendeles mellett (megerosites dialoggal)
- Az `order_items` es `order_item_options` is torlodnek (cascade)

### Modositando fajl:
- `src/pages/admin/OrdersManagement.tsx` - `deleteOrder` fuggveny, torles gomb a PastOrderAdminCard-ban

---

## 5. Admin multbeli rendelesek kompaktabb megjelenitese

### Jelenlegi allapot
A `PastOrderAdminCard` mar kibonthato (Collapsible), datum csoportositassal es email/telefon megjelenitéssel. Ez mar kesz.

Nincs szukseg valtoztatásra - a jelenlegi implementacio mar megfelel a kovetelmenynek. Az ures kepernyo hiba miatt a felhasznalo nem lathatta.

---

## Technikai reszletek

### useGlobalOrderNotifications.tsx - Fo valtozasok

```text
// Elott:
export const useGlobalOrderNotifications = () => {

// Utan:
export const useGlobalOrderNotifications = (enabled: boolean = true) => {
  // Minden hook MINDIG meghivasra kerul
  // De az effectek ellenorzik: if (!enabled) return;
```

Minden `useEffect` ellenorzi az `enabled` flaget:
- Audio unlock effect: if (!enabled) return
- Fetch initial orders: if (!enabled) return  
- Subscription setup: if (!enabled) return, + cleanup ha enabled false-ra valt

### OrderNotificationsContext.tsx - Egyszerusitett struktura

```text
// Elott: ActiveNotifications + 3 felteteles return path
// Utan: egyetlen komponens

export const OrderNotificationsProvider = ({ children }) => {
  const { canViewOrders, loading, rolesLoading, isAdmin } = useAuth();
  
  const enabled = !loading && !rolesLoading && canViewOrders;
  
  const { ... } = useGlobalOrderNotifications(enabled);  // MINDIG hivva
  
  return (
    <Context.Provider value={...}>
      {enabled && currentNotification && <OrderNotificationModal ... />}
      {children}
    </Context.Provider>
  );
};
```

### StaffOrders.tsx - Mobil tab navigacio

```text
const [activeTab, setActiveTab] = useState<"new" | "preparing" | "ready">("new");

// Mobilon: egyetlen oszlop a kivalasztott statusszal
// Desktopra: megmarad a 3 oszlopos grid

// Swipe:
const touchStartRef = useRef(0);
onTouchStart = (e) => touchStartRef.current = e.touches[0].clientX;
onTouchEnd = (e) => {
  const diff = e.changedTouches[0].clientX - touchStartRef.current;
  if (Math.abs(diff) > 50) {
    // Lepes kovetkezo/elozo tabra
  }
};
```

### StatusSummaryBar.tsx - Aktiv tab + sticky

```text
// Uj prop: activeTab, onTabChange
// Vizualis jelzes az aktiv tabra (atkozvetett border/ring)
// Sticky wrapper a StaffOrders-ben
```

### Fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `src/hooks/useGlobalOrderNotifications.tsx` | `enabled` parameter, felteteles effectek |
| `src/contexts/OrderNotificationsContext.tsx` | Egyetlen komponens, nincs felteteles rendereleseru |
| `src/components/staff/StatusSummaryBar.tsx` | `activeTab` + `onTabChange` propok, aktiv vizualis jelzes |
| `src/pages/staff/StaffOrders.tsx` | Mobil tab allapot, swipe, sticky summary bar |
| `src/pages/admin/OrdersManagement.tsx` | Torles funkcio es gomb |

### Vart eredmenyek

1. Az ures kepernyo hiba megszunik - a hook szam mindig konzisztens
2. A staff tabok ragadosak lesznek gorgeteskor
3. Mobilon egymas mellett lesznek a tabok, swipe-olhatoak
4. Az admin oldal tamogatja a torles funkciotalast is (archivalas mellett)
5. A multbeli rendelesek kompaktak es kibonthatoak (mar kesz, most lathato lesz)

