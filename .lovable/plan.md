
# Dialog gorgetesi es Mentes gomb javitas

## A problema
Az "Uj etel hozzaadasa" dialog a `MenuManagement.tsx` fajlban (248. sor) nem hasznalja a projekt szabvanyos dialog-elrendezes mintat: nincs `flex flex-col`, nincs `overflow-hidden`, es a tartalom nem gorgetheto. Kisebb kepernyokon a "Mentes" gomb a viewport ala kerul es nem erheto el.

## Megoldas
Alkalmazzuk ugyanazt a szabvanyos mintazatot, amit a `MenuItemEditDialog.tsx` mar hasznal:

1. **DialogContent**: `max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden` hozzaadasa
2. **Urlap tartalom**: `flex-1 overflow-y-auto` wrapper a form elemek kore
3. **Mentes gomb szekcioval**: `flex-shrink-0 border-t pt-4` -- mindig latszik, nem gorget el

## Technikai reszletek

### Modositando fajl
- `src/pages/admin/MenuManagement.tsx` -- 248-350. sorok

### Valtozasok

**248. sor** -- DialogContent osztalyok bovitese:
```text
// Jelenlegi:
<DialogContent className="sm:max-w-lg">

// Javitott:
<DialogContent className="sm:max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
```

**255. sor** -- Urlap tartalom gorgetheto wrapperbe:
```text
// Jelenlegi:
<div className="space-y-4">

// Javitott:
<div className="flex-1 overflow-y-auto space-y-4 pr-1">
```

**341-349. sor** -- Mentes/Megse gombok kiemelese a gorgetheto reszbol:
A gombok at lesznek helyezve a gorgetheto `div`-en KIVULRE, egy `flex-shrink-0 border-t pt-4` wrapper-be, igy mindig lathatok maradnak.

### Eredmeny
- A dialog tartalma gorgetheto lesz, ha tul hosszu
- A "Mentes" es "Megse" gombok mindig lathatok lesznek alul
- Desktop es mobil eszkozon egyarant mukodik
- Megfelel a projekt szabvanyos dialog mintazatanak (memory: `tech/dialog-accessibility-standard`)
