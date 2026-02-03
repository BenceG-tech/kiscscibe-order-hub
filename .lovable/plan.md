
# Footer Komponens és Rejtett Admin Belépés Implementálása

## Összefoglaló

Létrehozunk egy elegáns Footer komponenst a feltöltött Kiscsibe logóval, amelyben rejtett admin belépési pont lesz: a logóra 5-ször kattintva előjön a bejelentkezési oldal.

---

## Előkészítés

### Logo Fájl Másolása
A feltöltött `kiscsibe_logo.jpeg` képet átmásoljuk a `src/assets/` mappába:
```
user-uploads://kiscsibe_logo.jpeg → src/assets/kiscsibe_logo.jpeg
```

---

## Változtatások

### 1. Új Footer Komponens Létrehozása

**Fájl:** `src/components/Footer.tsx`

A footer tartalma:
- **Logó** (kattintásszámlálóval - 5 kattintás → /auth)
- **Elérhetőségek** (cím, telefon, email)
- **Nyitvatartás**
- **Linkek** (Főoldal, Napi Ajánlat, Rólunk, Kapcsolat)
- **Copyright szöveg**

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    [LOGO]          Elérhetőség         Nyitvatartás        │
│   Kiscsibe         Budapest...          H-P: 7-16          │
│   gyorsétterem     +36 1 234...         Szo-V: Zárva       │
│                                                             │
│    Linkek                                                   │
│    Főoldal | Étlap | Rólunk | Kapcsolat                    │
│                                                             │
│    ─────────────────────────────────────────                │
│    © 2025 Kiscsibe. Minden jog fenntartva.                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Rejtett Admin Belépés Logika

A logóra kattintva egy számláló növekszik. Ha 5-öt elér 2 másodpercen belül, akkor átirányít a `/auth` oldalra.

```tsx
const [clickCount, setClickCount] = useState(0);
const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleLogoClick = () => {
  const newCount = clickCount + 1;
  setClickCount(newCount);
  
  // Reset timeout minden kattintáskor
  if (clickTimeoutRef.current) {
    clearTimeout(clickTimeoutRef.current);
  }
  
  if (newCount >= 5) {
    navigate('/auth');
    setClickCount(0);
  } else {
    // 2 másodperc után reset
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);
  }
};
```

### 3. Admin Link Végleges Eltávolítása a Navigációból

**Fájl:** `src/components/ModernNavigation.tsx`

Az admin/staff linkek teljesen eltávolítódnak a navigációs menüből - ezeket a linkeket csak a footer rejtett módon tartalmazza majd.

```tsx
// Módosítás: Eltávolítjuk az admin/staff linkeket
const navLinks = [
  { href: "/", label: "Főoldal" },
  { href: "/etlap", label: "Napi Ajánlat" },
  { href: "/about", label: "Rólunk" },
  { href: "/contact", label: "Kapcsolat" },
  // Admin linkek eltávolítva - footer logón keresztül elérhető
];
```

### 4. Footer Hozzáadása az Oldalakhoz

Minden oldal aljára hozzáadjuk a Footer komponenst:

| Fájl | Változás |
|------|----------|
| `src/pages/Index.tsx` | + `<Footer />` a main után |
| `src/pages/About.tsx` | + `<Footer />` |
| `src/pages/Contact.tsx` | + `<Footer />` |
| `src/pages/Etlap.tsx` | + `<Footer />` |
| `src/pages/Gallery.tsx` | + `<Footer />` |

---

## Footer Komponens Részletes Terv

### Design
- Háttér: `bg-gray-900` (sötét)
- Szöveg: `text-gray-300` / `text-white`
- Logo: kerek formátum, megtartva a feltöltött képet
- Responsive: 1 oszlop mobilon, 3-4 oszlop desktopon

### Reszponzív Layout

**Mobil (1 oszlop):**
```
Logo + Név
Elérhetőségek
Nyitvatartás
Linkek
Copyright
```

**Desktop (3 oszlop):**
```
[Logo + Név] | [Elérhetőségek + Nyitva] | [Linkek]
                   [Copyright]
```

---

## Vizuális Visszajelzés (opcionális)

A logón való kattintáskor finom vizuális visszajelzés (pulse animáció), de nem túl feltűnő, hogy a rejtett funkció ne legyen nyilvánvaló:

```css
/* Logo hover */
.logo-container:active {
  transform: scale(0.95);
}
```

---

## Fájl Lista

| Művelet | Fájl |
|---------|------|
| COPY | `user-uploads://kiscsibe_logo.jpeg` → `src/assets/kiscsibe_logo.jpeg` |
| CREATE | `src/components/Footer.tsx` |
| MODIFY | `src/components/ModernNavigation.tsx` (admin linkek eltávolítása) |
| MODIFY | `src/pages/Index.tsx` (+ Footer) |
| MODIFY | `src/pages/About.tsx` (+ Footer) |
| MODIFY | `src/pages/Contact.tsx` (+ Footer) |
| MODIFY | `src/pages/Etlap.tsx` (+ Footer) |
| MODIFY | `src/pages/Gallery.tsx` (+ Footer) |

---

## Technikai Részletek

### Footer Props Interface
```typescript
interface FooterProps {
  className?: string;
}
```

### Click Counter Hook (opcionális kiemelés)
```typescript
// A számláló ref-ben tárolódik, nem okoz felesleges renderelést
const clickCountRef = useRef(0);
```

### Navigation Import
```typescript
import { useNavigate } from 'react-router-dom';
import kiscsibeLogo from '@/assets/kiscsibe_logo.jpeg';
```

---

## Biztonsági Megjegyzés

Ez a rejtett admin belépési pont nem biztonsági rés, mert:
1. Az `/auth` oldal publikus (bárki elérheti a címet közvetlenül)
2. A valódi védelem a bejelentkezésnél és a `ProtectedRoute` komponensnél van
3. Ez csak UX döntés, hogy az admin link ne legyen látható a normál vendégeknek

---

## Előnyök

1. **Tisztább felhasználói felület** - Vendégek nem látják az "Admin" linket
2. **Diszkrét belépés** - Alkalmazottak tudják a trükköt (5x logo kattintás)
3. **Professzionális megjelenés** - Nem zavar az admin link a navigációban
4. **Elegáns footer** - Modern, informatív lábrész az oldalhoz
