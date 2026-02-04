

# Logó Placeholder és Személyzet Belépés Implementálása

## Összefoglaló

A terv három fő változtatást tartalmaz:
1. **Kiscsibe logó** használata placeholder képként, ahol nincs kép rendelve egy ételhez
2. **Új logó a footer jobb oldalán** személyzeti belépéshez (5 kattintás → `/auth`)
3. **Staff fiók már létezik** - csak a footer módosítás szükséges

---

## 1. Logo Placeholder Ételekhez

### Érintett Fájlok

| Fájl | Változás |
|------|----------|
| `src/assets/kiscsibe_logo.jpeg` | Már létezik - felhasználható |
| `src/components/DailyMenuPanel.tsx` | Logo import + használat placeholder-ként |
| `src/components/UnifiedDailySection.tsx` | Logo import + használat extra itemekhez |
| `src/pages/admin/MenuManagement.tsx` | Logo megjelenítés admin listában |

### Jelenlegi Állapot

A `DailyMenuPanel.tsx` jelenleg ikonokat használ placeholder-ként:
```tsx
// Ha nincs kép:
<div className="w-full h-full bg-amber-100 flex items-center justify-center">
  <Soup className="h-20 w-20 text-amber-600" />
</div>
```

### Új Megoldás

```tsx
import kiscsibeLogo from "@/assets/kiscsibe_logo.jpeg";

// Ha nincs kép - Kiscsibe logó megjelenik:
<div className="w-full h-full bg-amber-100/50 dark:bg-amber-900/20 flex items-center justify-center">
  <img 
    src={kiscsibeLogo} 
    alt="Kiscsibe" 
    className="w-24 h-24 object-contain opacity-50"
  />
</div>
```

### Változtatások Részletesen

**DailyMenuPanel.tsx:**
- Import logó: `import kiscsibeLogo from "@/assets/kiscsibe_logo.jpeg"`
- Leves placeholder → Kiscsibe logó
- Főétel placeholder → Kiscsibe logó

**UnifiedDailySection.tsx:**
- Import logó: `import kiscsibeLogo from "@/assets/kiscsibe_logo.jpeg"`
- Extra ételek képhelyénél is megjelenjen a logó ha nincs kép

**MenuManagement.tsx (Admin):**
- Import logó
- Listában placeholder kép ahol nincs feltöltve

---

## 2. Footer Módosítás - Személyzet Logó Jobb Oldalt

### Új Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [ADMIN LOGO]     Elérhetőség    Nyitvatartás    [STAFF LOGO]  │
│   Kiscsibe        Budapest...     H-P: 7-16        Kiscsibe    │
│  (5x katt=admin)                                  (5x=staff)   │
│                                                                 │
│               Linkek: Főoldal | Étlap | Rólunk                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│        © 2025 Kiscsibe. Minden jog fenntartva.                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technikai Részletek

**Fájl:** `src/components/Footer.tsx`

**Változtatások:**
1. Új state a staff kattintás számlálóhoz
2. Új `handleStaffLogoClick` függvény
3. Grid layout módosítás: 5 oszlop helyett logók bal és jobb szélre
4. Új staff logó komponens a jobb oldali oszlopban

```tsx
// Új state
const [staffClickCount, setStaffClickCount] = useState(0);
const staffClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Új handler
const handleStaffLogoClick = () => {
  const newCount = staffClickCount + 1;
  setStaffClickCount(newCount);
  
  if (staffClickTimeoutRef.current) {
    clearTimeout(staffClickTimeoutRef.current);
  }
  
  if (newCount >= 5) {
    // Személyzet bejelentkezéshez navigál
    navigate('/auth');
    setStaffClickCount(0);
  } else {
    staffClickTimeoutRef.current = setTimeout(() => {
      setStaffClickCount(0);
    }, 2000);
  }
};
```

**Staff Logó Megjelenése:**
- Ugyanaz a kép mint az admin logó
- Nincs szöveg alatta (diszkrét)
- Kisebb méret (w-16 h-16)
- Halványabb border vagy más stílus

---

## 3. Meglévő Rendszer - Nincs Szükség Módosításra

A személyzeti belépés rendszer **már létezik és működik**:

| Elem | Állapot |
|------|---------|
| `StaffLayout.tsx` | ✅ Létezik - csak rendeléseket mutat |
| `StaffOrders.tsx` | ✅ Létezik - read-only rendelés lista |
| `/staff/orders` route | ✅ Létezik az App.tsx-ben |
| `ProtectedRoute` requireStaff | ✅ Működik |
| `is_staff` RPC | ✅ Supabase-ben definiálva |
| Auth.tsx redirect | ✅ Staff → `/staff/orders` |

A személyzeti fiók **létrehozása** a Supabase admin felületen történik:
1. Új user létrehozása Supabase Auth-ban
2. `user_roles` táblába beszúrás: `{user_id: ..., role: 'staff'}`

---

## Fájl Lista

| Művelet | Fájl |
|---------|------|
| COPY | `user-uploads://kiscsibe_logo-2.jpeg` → `src/assets/kiscsibe_logo.jpeg` (felülírás ha más) |
| MODIFY | `src/components/Footer.tsx` |
| MODIFY | `src/components/DailyMenuPanel.tsx` |
| MODIFY | `src/components/UnifiedDailySection.tsx` |
| MODIFY | `src/pages/admin/MenuManagement.tsx` |

---

## Vizuális Összefoglaló

### Footer Új Kinézet (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────┐                                          ┌──────┐   │
│  │ 🐥   │   Elérhetőség    Nyitvatartás   Linkek   │ 🐥   │   │
│  │ LOGO │   1145 Budapest  H-P: 7-16      Főoldal  │ LOGO │   │
│  │      │   +36 1 234...   Szo-V: Zárva   Étlap    │      │   │
│  │ ADMIN│   email@...                     Rólunk   │STAFF │   │
│  └──────┘                                          └──────┘   │
│                                                                │
│          © 2025 Kiscsibe. Minden jog fenntartva.              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Étel Kártya Placeholder Képpel

```
┌────────────────────────────────┐
│  ┌──────────────────────────┐  │
│  │                          │  │
│  │     🐥 (Kiscsibe logó)   │  │
│  │     (halványan)          │  │
│  │                          │  │
│  └──────────────────────────┘  │
│  LEVES                          │
│  Tyúkhúsleves                   │
│  Friss zöldségekkel             │
└────────────────────────────────┘
```

---

## Megjegyzés a Személyzeti Fiókhoz

A terv **nem** tartalmaz új bejelentkezési flow-t a személyzetnek. Mindkét logó (admin és staff) ugyanarra az `/auth` oldalra navigál. A különbség a **fiók szerepkörében** van:

- **Admin fiók** → bejelentkezés után → `/admin/orders` (teljes admin hozzáférés)
- **Staff fiók** → bejelentkezés után → `/staff/orders` (csak rendelés megtekintés)

Ez a logika **már működik** az `Auth.tsx` fájlban:
```tsx
if (isAdmin) {
  navigate('/admin/orders', { replace: true });
} else if (isStaff) {
  navigate('/staff/orders', { replace: true });
}
```

