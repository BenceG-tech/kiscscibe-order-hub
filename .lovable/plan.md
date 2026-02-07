

# KDS Gombok - Vegso Javitas

## Talalt Problemak (Teljesen Vegignyomozva)

### 1. problema: A toast ertesitesek LATHATATLANOK (A fo ok!)

A `StaffOrders.tsx` a **shadcn toast rendszert** hasznalja (`useToast()` hook), de az `App.tsx`-ben **csak a Sonner** komponens van renderelve. A shadcn `<Toaster />` komponens **egyaltalan nincs a komponensfaban**.

Ez azt jelenti, hogy MINDEN gombnyomas utan -- legyen az sikeres vagy sikertelen -- a felhasznalo **semmilyen vizualis visszajelzest nem kap**. A rendeles kartyaja elmozdul a megfelelo oszlopba, de a felhasznalo azt gondolja, hogy semmi sem tortent, mert nincs toast uzenet.

**Bizonytiek a konzolbol:**
```text
[KDS] Updating order #F20564: new -> preparing
[KDS] Update successful for #F20564: status is now "preparing"
```

A frissitesek MUKODNEK a szerveren. A trigger fix (INSERT-only validacio) helyes. Az RLS policyk helyesek. A frontend kod helyes. De a felhasznalo errol semmit nem tud, mert a toast ertesitesek nem jelennek meg.

### 2. problema: Ketszeres gombnyomas (race condition)

A realtime subscription (`event: "*"`) minden UPDATE utan ujratolt minden rendelest. Ez egy rovid villanast okoz es neha dupla log uzenetet:

```text
[KDS] Updating order #X55288: new -> preparing
[KDS] Update successful for #X55288: status is now "preparing"
[KDS] Updating order #X55288: new -> preparing    <-- DUPLA!
[KDS] Update successful for #X55288: status is now "preparing"
```

### 3. problema: AuthContext dupla fetchProfile

Mind a `getSession()`, mind az `onAuthStateChange` meghivja a `fetchProfile()`-t parhuzamosan, ami felesleges halozati hivasokat es potencialis allapot-konfliktusokat okoz.

---

## Javitasi Terv

### 1. Javitas: Toast rendszer kicserelese Sonner-re (A legfontosabb!)

A `StaffOrders.tsx`-ben a `useToast()` (shadcn) hivasokat lecsereljuk a `toast()` fuggvenyre a `sonner` konyvtarbol, ami mar renderelve van az `App.tsx`-ben. Igy MINDEN toast azonnal lathato lesz.

Valtozas:
- Import csere: `import { toast } from "sonner"` hasznalatara
- `toast({ title: "...", description: "..." })` -> `toast.success("...")` vagy `toast.error("...")`
- A `useToast()` hook teljesen eltavolithato a fajlbol

### 2. Javitas: Dupla-tuzeles megakadalyozasa

A realtime subscription `fetchOrders` hivasa kavet egy rovid debounce logika (pl. `setTimeout` + `clearTimeout` 300ms-mal). Ez megakadalyozza, hogy a realtime es a lokalis allapotfrissites egymasra hasson.

Emellett: amikor egy status update sikeresen visszajon (`.select()` adattal), **optimistikusan frissitjuk a lokalis allapotot** is, igy a kartya azonnal atmozdul anelkul, hogy az osszes rendelest ujratoltenenk.

### 3. Javitas: AuthContext robusztusabb fetchProfile

Egy `isFetchingRef` flag megakadalyozza, hogy a `fetchProfile` ketszer fusson parhuzamosan. Ha a `getSession` mar elinditotta, az `onAuthStateChange` nem indit ujabb hivast.

---

## Technikai Reszletek

### Modositando fajlok

| Fajl | Valtozas |
|------|---------|
| `src/pages/staff/StaffOrders.tsx` | `useToast()` csere `sonner` `toast`-ra, optimistikus allapotfrissites, realtime debounce |
| `src/contexts/AuthContext.tsx` | `isFetchingRef` dupla-hivas vedekezeshez |

### StaffOrders.tsx konkret valtozasok

**Import csere:**
```text
TOROLNI: import { useToast } from "@/components/ui/use-toast";
HOZZAADNI: import { toast } from "sonner";
```

**Hook eltavolitasa:**
```text
TOROLNI: const { toast } = useToast();
```

**handleStatusChange toast hivasok atirasa:**

```text
JELENLEGI (lathatatlan):
  toast({ title: "Hiba", description: error.message, variant: "destructive" })
  toast({ title: statusLabels[newStatus] })

JAVITOTT (lathato):
  toast.error(error.message || "Nem sikerult frissiteni a statuszt")
  toast.success(statusLabels[newStatus] || "Statusz frissitve")
```

**fetchOrders toast atirasa:**
```text
JELENLEGI: toast({ title: "Hiba", description: "...", variant: "destructive" })
JAVITOTT: toast.error("Nem sikerult betolteni a rendeleseket")
```

**Optimistikus allapotfrissites a handleStatusChange-ben:**
```text
// Sikeres update utan azonnal frissitjuk a lokalis allapotot
setOrders(prev =>
  prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
);
```

**Realtime debounce:**
```text
// useRef a debounce timer-hez
const refetchTimerRef = useRef<NodeJS.Timeout>();

// A realtime callbackban:
.on("postgres_changes", { event: "*", ... }, () => {
  clearTimeout(refetchTimerRef.current);
  refetchTimerRef.current = setTimeout(() => fetchOrders(), 300);
})
```

### AuthContext.tsx valtozasok

```text
// useRef hozzaadasa:
const isFetchingRef = useRef(false);

// fetchProfile elejen:
if (isFetchingRef.current) return;
isFetchingRef.current = true;

// fetchProfile finally blokkjaban:
isFetchingRef.current = false;
```

Ez megakadalyozza, hogy a `getSession` es az `onAuthStateChange` parhuzamosan kethivast inditsanak.
