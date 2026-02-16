

# OrderConfirmation javitasok + tisztitas

## Osszefoglalas

Negy modositas: (1) koret/modosito megjelenites a visszaigazolason, (2) nyomtatas gomb + print CSS, (3) dark mode fix (mar megoldva), (4) Hero.tsx torles.

## 1. Koret/modosito megjelenites

**Fajl:** `src/pages/OrderConfirmation.tsx`

- Uj interface: `OrderItemOption` (id, label_snapshot, option_type, price_delta_huf)
- Az `OrderItem` interface bovitese: `options?: OrderItemOption[]`
- A `fetchOrder` fuggvenyben az `order_items` lekerdezes bovitese: `.select('*, order_item_options(*)')` a kapcsolodo opciok lekeresere
- Az itemsData feldolgozasanal az `order_item_options`-t hozzarendeljuk az `options` mezohoz
- A rendelesi tetelek megjelenitesenel minden item ala: ha vannak opciok (es nem `daily_meta` tipusuak), megjelenitjuk oket a megfelelo stilussal

A megjelenites kovetkezi mintaja (a staff/admin oldalakrol):
```text
Toltott kaposzta
  480 Ft x 1 db
  koret: Hasabburgonya (+200 Ft)
```

## 2. Nyomtatas gomb

**Fajl:** `src/pages/OrderConfirmation.tsx`

- Import: `Printer` a lucide-react-bol
- Az akciogombok koze (Uj rendeles + Utvonalterv melle) egy harmadik gomb: "Nyomtatas"
- `onClick={() => window.print()}`
- `variant="outline"` stilussal

**Fajl:** `src/index.css`

- `@media print` blokk hozzaadasa:
  - Navigacio, footer, cookie consent, mobil bottom nav elrejtese (`display: none`)
  - A `print-hide` class-t kapott elemek (gombok szekcio) elrejtese
  - Feher hatter, fekete szoveg
  - A nyomtatando tartalom szelességet 100%-ra allitjuk

**Fajl:** `src/pages/OrderConfirmation.tsx` (tovabbiakban)

- A gombok div-jere `print:hidden` class
- A navigaciora `print:hidden` class (a ModernNavigation mar rendelkezik ilyennel, vagy a wrapper div-re tesszuk)

## 3. Dark mode fix

Az aktualis kodban (319-320. sor) mar megvan a `dark:bg-blue-950/20` es `dark:text-blue-300` — ez a korabbi javitasoknal mar megtortent. Nincs teendo.

## 4. Hero.tsx torles

**Fajl:** `src/components/Hero.tsx` — **TORLES**

- A komponens sehol nincs importalva (ellenorizve: az osszes `import.*Hero` talalat a `heroImage` asset importokra vagy a `HeroSection`-re vonatkozik)
- Biztonsagosan torolheto

## Erintett fajlok

| Fajl | Muvelet |
|------|---------|
| `src/pages/OrderConfirmation.tsx` | Modositas — opciok lekerdezese + megjelenites, nyomtatas gomb, print class-ok |
| `src/index.css` | Modositas — @media print blokk |
| `src/components/Hero.tsx` | **TORLES** |

