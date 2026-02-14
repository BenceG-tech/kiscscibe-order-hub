

# Admin UI javitasok: About Editor, Grafikonok, Tab bar

## 1. AboutPageEditor mobilbarattabb elrendezes

### Problema
Az "Ertekeink" es "Statisztikak" szekciokban az Ikon/Cim/Leiras mezok egy sorban vannak (`flex`), mobilon osszenyomodnak es a tartalom nem lathato. A bekezdesek Textarea-i tul kicsik (`rows={2}`).

### Megoldas
- **Ertekeink**: Mobilon (`md` breakpoint alatt) vertikalis kartya-elrendezes -- minden ertek kulon blokkban, a mezok egymas ala kerulnek
- **Statisztikak**: Hasonloan vertikalis mobilon
- **Bekezdesek**: `rows={2}` helyett `rows={4}` mobilon es `rows={3}` desktopon, hogy tobb szoveg lathato legyen
- **Kuldetés textarea**: `rows={4}` helyett `rows={6}`

### Erintett fajl
| Fajl | Valtozas |
|------|----------|
| `src/components/admin/AboutPageEditor.tsx` | Responsive layout: vertikalis elrendezes mobilon az Ertekeink es Statisztikak szekciokhoz, nagyobb textarea-k |

---

## 2. Grafikon tooltip szinek javitasa

### Problema
A Recharts tooltip feher hatterrel es vilagos szoveggel jelenik meg sotet temaban -- olvashatatlan. A screenshot-okon lathato: a "Bevetel: 3180 Ft" szoveg szurke/feher hattere es halvany szovege.

### Megoldas
- Egyedi `contentStyle` prop a Tooltip komponensekre minden analytics tabban:
  - `backgroundColor: "hsl(var(--card))"` 
  - `border: "1px solid hsl(var(--border))"`
  - `color: "hsl(var(--foreground))"`
  - `borderRadius: 8`
- A `labelStyle`-t is beallitjuk: `color: "hsl(var(--muted-foreground))"`

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/admin/analytics/RevenueTab.tsx` | Tooltip contentStyle + labelStyle minden chartra |
| `src/components/admin/analytics/OrdersTab.tsx` | Ugyanaz |
| `src/components/admin/analytics/MenuPerformanceTab.tsx` | Ugyanaz |
| `src/components/admin/analytics/CustomersTab.tsx` | Ugyanaz |

---

## 3. Tab bar: header ala csuszik desktopon

### Problema
A sticky nav (`top-[calc(env(safe-area-inset-top,0)+56px)]`) nem pontosan illeszkedik a header aljara -- a header magassaga valtozo es nem mindig 56px.

### Megoldas
- A header kap egy fix magassagot: `h-14` (56px)
- A nav `top` erteke pontosabb szamitas: `top-14` (Tailwind class, 56px), plusz safe-area-inset

### Erintett fajl
| Fajl | Valtozas |
|------|----------|
| `src/pages/admin/AdminLayout.tsx` | Header fix magassag + nav top ertek javitasa |

---

## 4. Mobilbarát tab bar

### Problema
Mobilon a tab sor horizontalisan scrollozhato, de 9 menu elem van es a felhasznalo nem latja az osszeset, a "Statisztika" pl. mar el van vagva.

### Megoldas
- Mobilon (`md` breakpoint alatt) a tab sor ket soros grid elrendezesbe kerul: `grid grid-cols-3` (3 oszlop, 3 sor = 9 elem)
- Desktopon marad az egyetlen soros horizontalis scroll
- Alternativ: az ikonok kisebbek lesznek mobilon es a cimke ala kerul

### Erintett fajl
| Fajl | Valtozas |
|------|----------|
| `src/pages/admin/AdminLayout.tsx` | Mobilon grid elrendezes a navigacios tabokra |

---

## Technikai osszefoglalas

### Modositando fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/admin/AboutPageEditor.tsx` | Responsive layout, nagyobb textarea-k |
| `src/components/admin/analytics/RevenueTab.tsx` | Tooltip szinek |
| `src/components/admin/analytics/OrdersTab.tsx` | Tooltip szinek |
| `src/components/admin/analytics/MenuPerformanceTab.tsx` | Tooltip szinek |
| `src/components/admin/analytics/CustomersTab.tsx` | Tooltip szinek |
| `src/pages/admin/AdminLayout.tsx` | Header magassag fix, nav pozicio, mobil grid nav |

### Nem modosul
- Adatbazis, RLS
- Frontend publikus oldalak
- Edge function-ok
- Admin logika / adatmentes

