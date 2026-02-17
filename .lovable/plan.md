
# Checkout rendelesi problema javitasa

## Talalt problemak

A tesztelés során három különálló hibát azonosítottam:

### 1. Idozóna hiba a dátumok megjelenítésében
A checkout oldalon a "Napi ajánlat/menü miatt csak **február 16**.-án lehet átvenni" üzenet jelenik meg, holott a napi ajánlat **február 17**-re (ma) szól. Ez azért van, mert a `getPickupConstraint()` függvény `new Date(dailyDates[0])` hívást használ, ami a "2026-02-17" stringet UTC éjfélként értelmezi, ami CET időzónában február 16. 23:00-nak felel meg.

Ugyanez a hiba érinti:
- A `formatTimeSlot()` függvényt (a dátum kijelzőben "febr. 16." jelenik meg "febr. 17." helyett)
- A rendelés összesítőben az item dátum megjelenítését (`new Date(item.daily_date)`)

### 2. Múltbeli időpont kiválasztása
A `fetchTimeSlots` függvény szűrője nem megfelelően működik, és múltbeli időpontokat (pl. 08:00, amikor már 15:43 van) is felajánl. Ennek eredményeként a szerveren "Cannot place orders for past dates or times" hibaüzenet keletkezik.

### 3. Kosár betöltési versenyhelyzet (race condition)
Amikor a felhasználó közvetlenül a `/checkout` URL-re navigál, a CartContext a `useReducer` inicializálásánál üres kosárral indul, és a localStorage-ból való betöltés csak az első `useEffect` lefutása után történik meg. A Checkout komponens viszont az első rendereléskor `cart.items.length === 0` feltételt ellenőrzi és átirányít az étlapra.

---

## Megoldási terv

### Fájl: `src/pages/Checkout.tsx`

**A) Dátum megjelenítés javítása** - A `getPickupConstraint()` (sor 389), `formatTimeSlot()` (sor 417) és a dátum kijelzés (sor 611) mind a `makeDate()` helper-t fogja használni `new Date()` helyett:

```typescript
// getPickupConstraint - sor 389
const date = makeDate(dailyDates[0]); // new Date(dailyDates[0]) helyett

// formatTimeSlot - sor 417
const dateObj = makeDate(date); // new Date(date) helyett

// item.daily_date megjelenítés - sor 611
{makeDate(item.daily_date).toLocaleDateString(...)} // new Date(item.daily_date) helyett
```

**B) Múltbeli időpontok jobb szűrése** - A `fetchTimeSlots` szűrőjében biztosítjuk, hogy a mai napra vonatkozó időpontoknál legalább 30 perc ráhagyás legyen:

```typescript
const now = new Date();
const minFutureTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 perc buffer
if (slotDate <= minFutureTime) return false;
```

### Fájl: `src/contexts/CartContext.tsx`

**C) Kosár betöltési állapot** - Új `isLoaded` állapot hozzáadása, ami jelzi, hogy a localStorage-ból már betöltődött a kosár:

```typescript
const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
  // ... load from localStorage
  setIsLoaded(true);
}, []);
```

A `CartContextType`-hoz hozzáadjuk az `isLoaded` mezőt. A Checkout.tsx-ben a redirect feltételt módosítjuk:

```typescript
// Checkout.tsx - csak akkor irányítunk át, ha a kosár már betöltődött
if (isLoaded && cart.items.length === 0) {
  navigate("/etlap");
  return;
}
```
