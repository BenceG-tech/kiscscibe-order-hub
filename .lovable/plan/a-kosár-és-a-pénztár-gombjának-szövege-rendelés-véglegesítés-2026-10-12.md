# A kosár és a pénztár gombjának szövege: „Rendelés véglegesítése”

## Mit látsz majd

- A kosár alján a sárga gomb felirata: **Rendelés véglegesítése** (eddig: „Tovább a fizetéshez”).
- A pénztárban a végleges gomb felirata: **Rendelés véglegesítése - 10 330 Ft** (eddig: „Rendelés leadása - 10 330 Ft”).
- A visszajelző szövegek is ugyanezt a kifejezést használják, tehát végig ugyanaz az elnevezés a folyamaton:
  - sikertelen küldésnél a piros kártya: „Nem sikerült véglegesíteni a rendelést”
  - a hibás küldés üzenetének címe: „Hiba a rendelés véglegesítésekor”
  - küldés közben: „Rendelés feldolgozása…” (változatlan)
  - ismétlés gomb: „Próbáld újra - 10 330 Ft” (változatlan)
- A pénztár fejléce már most is „Rendelés véglegesítése”, így a kosár gombja és a céloldal címe megegyezik.
- Az „Összesen: 10 330 Ft” sor, a „Kosár ürítése” gomb, az árak, a kosár tartalma, a kosárba tétel, a rendelés rögzítése, a készlet- és időpontkezelés, valamint a lemondáskori készlet-visszaállítás mind változatlan.

## Hogyan néz ki a folyamat

```text
Étlap → Kosár → [Rendelés véglegesítése] → Pénztár („Rendelés véglegesítése”)
       → [Rendelés véglegesítése - 10 330 Ft] → Rendelés mehet
```

## Technikai részletek

- `src/components/CartDialog.tsx` (115. sor): a gomb szövege „Tovább a fizetéshez” → „Rendelés véglegesítése”. A `handleCheckout` viselkedés és a stílus nem változik.
- `src/pages/Checkout.tsx` (1233. sor): a leadó gomb szövege `Rendelés leadása - ...` → `Rendelés véglegesítése - ...`; a 1208. sor („Nem sikerült leadni a rendelést”) és a 808. sor üzenetcíme („Hiba a rendelés leadásakor”) az új kifejezésre igazodik.
- `src/data/adminHelpContent.ts` (299. és 306. sor): a staff súgó két helyen a „Rendelés leadása” gombbal hivatkozik; átírjuk „Rendelés véglegesítése” gombra, hogy a súgó a tényleges felületet írja le.
- `src/data/adminChangelog.ts`: a korábbi, történeti bejegyzéseket nem írjuk át; egy új bejegyzés jelzi, hogy a gomb elnevezése egységesedett.
- `src/components/sections/HeroSection.tsx` „Rendelés leadása” hivatkozása és a visszaigazoláson az „Új rendelés leadása” gomb szándékosan marad: ott nem egy már összerakott kosár véglegesítéséről van szó.
- Ellenőrzés: típusellenőrzés, célzott lint, majd böngészős teszt 390 px és 1440 px szélességben – a kosár és a pénztár gombjának felirata, a hosszabb szöveg miatti tördelés/szélesedés nélkül, 0 konzolhiba.
- Csak előnézet; nem publikálunk.
