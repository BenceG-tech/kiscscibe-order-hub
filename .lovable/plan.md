
# KDS Felulet Javitasa - Professzionalis es Felhasznalobarati Staff Nezet

## Azonositott Problemak

Az alabbi problemakat talaltan a jelenlegi KDS feluleten:

1. **Gombok nem kattinthatoak** - Az "Elfogadom" es egyeb akciogombok `disabled` allapotban ragadhatnak, ha a `setUpdatingId(null)` nem fut le hiba eseten. Emellett az `updating` flag globalisan mukodik, igy egyetlen rendeles frissitese kozben az osszes kartya gombja letiltodik.
2. **Szines status tabok nem kattinthatoak** - A `StatusSummaryBar` pusztan megjelenitesre szolgalo `div` elemeket hasznal, nincs rajtuk click esemenykezeles.
3. **Kijelentkezes gomb** - Mobilon tul kicsi (9x9), nehezen kattinthato, es nincs vizualis visszajelzes.
4. **Veletlen lemondas kockazata** - Nincs megerosito dialogs a "Lemondas" gombra kattintaskor.
5. **Mobil nezetben rossz UX** - Mind a 3 oszlop egymas ala kerul, nagy gorgetesi igeny. Nincs lehetoseg az oszlopok kozott gyorsan navigalni.
6. **Rendelesi opcikk nem lathatoak** - A `order_item_options` tablabol (pl. koret valasztas, extra feltetek) nincsenek betoltve, igy a staff nem latja a teljes rendelest.
7. **Nincs ures allapot jelzes** - Ha nincs egyetlen rendeles sem, csak ures oszlopok lathatoak uzenet nelkul az egesz oldalon.

## Javitasok terve

### 1. Kattinthato status tabok (StatusSummaryBar)

A status szamlalo chipeket interaktivva tesszuk. Mobilon ra kattintva a megfelelo szekciohoz gorget automatikusan (smooth scroll), igy a szemelyzet gyorsan elerhet barmely oszlopot.

- Minden chip `button` elemme valik `div` helyett
- `onClick` esemeny: mobilon smooth scroll a megfelelo Kanban oszlophoz
- Vizualis feedback: `cursor-pointer`, hover effekt, `active:scale-95`
- Scroll target: Minden `KanbanColumn`-nak kap egy `id` attributumot (`column-new`, `column-preparing`, `column-ready`)

### 2. Gombok mukodese - Bugfix

- **`updatingId` fix**: A `handleStatusChange` fuggvenyt ugy javitjuk, hogy `finally` blokban MINDIG torolje az `updatingId`-t, nem csak sikeres eset utan. Igy soha nem ragad be disabled allapotban.
- **Optimistikus UI**: A gombot azonnal lathatoan letiltjuk (spinner ikonnal), de csak az adott kartya gombja legyen disabled, ne az osszes. Ez mar igy van implementalva (`updatingId === order.id`), de a `finally` block hianyzik.

### 3. Kijelentkezes gomb javitasa

- Mobilon is legyen lathato "Kilépés" felirat (vagy legalabb nagyobb kattintasi felulet)
- A gomb kapjon megerosito dialogust: "Biztosan ki szeretnel lepni?"
- Nagyobb merettel es jobb viualis visszajelzessel

### 4. Lemondas megerosito dialog

- Az "X" (lemondas) gombra kattintva egy `AlertDialog` jelenik meg: "Biztosan le szeretned mondani a #XXXX szamu rendelest?"
- Ket gomb: "Igen, lemondas" (piros) es "Megse" (szurke)
- Ez megakadalyozza a veletlen lemondast

### 5. Mobil navigacio javitasa

- A `StatusSummaryBar` sticky lesz (ragad a tetejere gorgeteskor)
- Minden oszlopnak `id`-t adunk, a chipekre kattintva oda gorget
- Vizualis separator az oszlopok kozott mobilon

### 6. Rendelesi opciok megjelenitiese

- Az `order_item_options` tablat is lekerjuk minden rendeleshez
- A kartyakon megjelennek a kivalasztott opciok (pl. "Koret: Rizs", "Extra: Sajt") kisebb betumerettel az adott tetel alatt
- Ez biztositja, hogy a konyhaban a teljes informacio lathato

### 7. Ures allapot es altalanos UX

- Ha egyetlen rendeles sincs (ujak, aktiv, kesz), egy barat uzenet jelenik meg: "Jelenleg nincs aktiv rendeles. Varjuk az uj rendeleseket!"
- Frissites gomb, ha a szemelyzet manualis ujratolitest szeretne

---

## Technikai Reszletek

### Modositando fajlok

| Fajl | Valtoztatas |
|------|-------------|
| `src/components/staff/StatusSummaryBar.tsx` | `div` -> `button`, onClick scroll, sticky pozicio, hover/active effektek |
| `src/components/staff/KanbanColumn.tsx` | `id` attributum hozzaadasa a scroll targethez |
| `src/components/staff/KanbanOrderCard.tsx` | Lemondas megerosito dialog, opcio megjeleniites, gomb vizualis javitas |
| `src/pages/staff/StaffOrders.tsx` | `handleStatusChange` finally block fix, order_item_options lekerdezes, ures allapot uzenet, scroll logika |
| `src/pages/staff/StaffLayout.tsx` | Kijelentkezes megerosito dialog, gomb meret javitas |

### StatusSummaryBar ujratervezes

A jelenlegi implementacioban a chipek `div` elemek. Az uj implementacioban:
- `button` elemekre csereljuk
- Kapnak egy `onClick` handlert ami `scrollIntoView({ behavior: 'smooth' })` -t hiv
- Sticky pozicio: `sticky top-[calc(env(safe-area-inset-top,0)+112px)] z-30`
- Vizualis hover: `hover:brightness-110 active:scale-95 cursor-pointer`

### handleStatusChange javitas

```text
JELENLEGI (hibas):
  setUpdatingId(orderId)
  ... update ...
  if (error) { toast error }
  else { toast success }
  setUpdatingId(null)  // <-- ha error dob exceptiont, ez nem fut le

JAVITOTT:
  setUpdatingId(orderId)
  try {
    ... update ...
    if (error) { toast error }
    else { toast success }
  } finally {
    setUpdatingId(null)  // <-- MINDIG lefut
  }
```

### Order item options lekerdezes

A `fetchOrders` fuggvenyben az order_items lekerdezese utan az order_item_options-t is lekerjuk:

```text
1. Lekerjuk az ordert
2. Lekerjuk az order_items-t (mar meglevo)
3. Minden order_item-hez lekerjuk az order_item_options-t
4. Az opciokat az item objekbe agyazzuk (item.options = [...])
```

### Lemondas megerosito dialog

A `KanbanOrderCard`-ban az "X" gomb helyett egy `AlertDialog` nyilik:
- Import: `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger`
- A dialog szovege: "Biztosan le akarod mondani a #{code} rendelest? Ez a muvelet nem vonhato vissza."
- "Lemondas" gomb: piros, meghivja `onStatusChange(orderId, "cancelled")`
- "Megse" gomb: bezarja a dialogust

### Kijelentkezes megerosito

A `StaffLayout`-ban a "Kijelentkezes" gomb korul egy `AlertDialog`:
- "Biztosan ki szeretnel jelentkezni?"
- "Igen" es "Megse" gombok
- Mobilon a gomb 44x44px minimalis merettel rendelkezik (WCAG tapability)
