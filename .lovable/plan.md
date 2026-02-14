

# Admin UI javitasok: Mobil tab bar + Pentek delutani auto-navigacio

## 1. Mobil tab bar: vissza a horizontalis scroll-ra

A 3x3 grid tul sok helyet foglal mobilon. Visszaallitjuk a korabbi horizontalis scrollozhato megoldast, de optimalizalva:

- A `grid grid-cols-3` blokkot lecsereljuk egy `overflow-x-auto flex` elrendezesre
- Kompakt gombok: ikon + rovid cimke egymas mellett (nem egymas alatt)
- `no-scrollbar` class a scroll bar elrejtesere
- Kisebb padding es spacing a kompaktsag erdekeben

### Erintett fajl
| Fajl | Valtozas |
|------|----------|
| `src/pages/admin/AdminLayout.tsx` | Mobil navigacio: grid helyett horizontalis scroll visszaallitasa, kompaktabb elemekkel |

---

## 2. FB kep generator: pentek 16:00 utan jovo het

A `DailyOfferImageGenerator.tsx`-ben a `weekOffset` allapot inicializalasat modositjuk:

- Ha pentek van es 16:00 utan van → `weekOffset` alaperteke `1` (jovo het)
- Egyebkent `0` (aktualis het)
- A `selectedDate` szinten a jovo het hetfojere all ilyenkor

```text
Logika:
const now = new Date();
const isFridayAfternoon = getDay(now) === 5 && now.getHours() >= 16;
const initialOffset = isFridayAfternoon ? 1 : 0;
```

### Erintett fajl
| Fajl | Valtozas |
|------|----------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | `weekOffset` es `selectedDate` init logika: pentek 16:00 utan jovo het |

---

## Nem modosul
- Adatbazis, RLS
- Desktop tab bar (az marad ahogy van)
- Canvas rajzolas / feltoltes logika
- Egyeb oldalak

