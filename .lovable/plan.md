## 1. Mobil: Gyors bevitel és Excel import a heti ajánlatnál

Jelenleg a `WeeklyGridMobile` csak a heti rácsot mutatja — a `QuickEntryBar` és `WeeklyExcelImport` csak desktopon jelenik meg. Mobilra is kiterjesztjük, érintőbarát formában.

**Excel import (mobil):**
- Új gomb a mobil fejlécben (a meglévő Export gomb mellé, ikon-only `Upload`).
- Megnyit egy bottom sheet-et (`Sheet` komponens, `side="bottom"`), benne a meglévő `WeeklyExcelImport` UI — sablon letöltés + fájl feltöltés + előnézet + import.
- Ugyanaz a logika és validáció mint desktopon, csak nagyobb gombok, vertikális elrendezés, scrollozható preview.

**Gyors bevitel (mobil):**
- Lebegő FAB (jobb alsó sarok, sticky, a bottom navigation fölött, `bottom-20 right-4`) `Plus` ikonnal.
- Kattintásra bottom sheet nyílik:
  - Nap választó chip-sor (H/K/Sze/Cs/P) — alapból a jelenleg nyitott nap.
  - Keresőmező (autofókusz) — élő kereső a `useMasterFoodLibrary` listán, ékezetfüggetlen.
  - Találati lista nagy érintőkártyákkal (kép + név + ár + kategória badge).
  - Kategória automatikusan kitalálva (`categoryMatcher`), a felhasználónak nem kell választania.
  - Tap a kártyán → hozzáadás, toast visszajelzés, kereső kiürül, sheet nyitva marad (lehet többet hozzáadni).
- Új étel létrehozás: ha nincs találat, „Új étel létrehozása '{search}' néven" gomb (ugyanúgy mint desktop).

## 2. Űrlap-állapot megőrzés (számla + partner bevitel)

**Probléma:** Ha az asszisztens véletlenül bezárja a `InvoiceFormDialog` vagy `PartnerFormDialog` ablakot (overlay-re tap, Esc, telefonhívás, browser back), elveszik az addig bevitt adat és előlről kell kezdeni.

**Megoldás: piszkozat auto-mentés `localStorage`-ba.**

Új hook: `src/hooks/useDraftPersistence.ts`
- Generikus: `useDraftPersistence<T>(key, form, options)`.
- Debounced (500ms) write minden form-változásnál.
- Mount-kor: ha van mentett piszkozat **és** nincs `editingId` (új rekord), megjelenít egy bannert az ablak tetején: „Mentetlen piszkozat található — Folytatás | Elvetés".
- Sikeres submit után automatikusan törli a piszkozatot.
- TTL: 7 nap után lejár.

**Beépítés a számla űrlapba (`InvoiceFormDialog.tsx`):**
- Kulcs: `invoice-draft-new` (új) vagy `invoice-draft-{id}` (szerkesztés esetén — opcionális).
- Mentett mezők: az összes form state (partner, dátumok, tételek, áfa, fájl metadata — a feltöltött fájlt nem, csak a nevét/figyelmeztetést).
- Ablak bezárás védelme: ha van piszkozat (dirty form), `onOpenChange`-ben confirm dialógus: „Bezárod? A piszkozat megmarad és bármikor folytathatod."
- Kívülre kattintás letiltva új bevitelnél: `<DialogContent onPointerDownOutside={e => isDirty && e.preventDefault()}>` — csak az X gombbal vagy Mégse-vel lehet bezárni, így nem zárul be véletlenül.

**Beépítés a partner űrlapba (`PartnerFormDialog.tsx`):**
- Ugyanaz a logika, kulcs: `partner-draft-new`.
- Kisebb form, de ugyanúgy bosszantó újrakezdeni — ugyanazt a hookot használja.

**Bónusz: globális mentés indikátor**
- Az űrlap fejlécében kis szöveg: „Piszkozat mentve {időpont}" (mint Google Docs).
- Megnyugtatja a felhasználót hogy nem vész el semmi.

## Technikai részletek

```text
Új/módosítandó fájlok:
  src/components/admin/WeeklyGridMobile.tsx       (Excel + FAB gombok hozzáadása)
  src/components/admin/MobileQuickEntrySheet.tsx  (új — mobil quick entry)
  src/components/admin/MobileExcelImportSheet.tsx (új — wrapper sheet)
  src/components/admin/WeeklyMenuGrid.tsx         (mobil sheet-ek átadása)
  src/hooks/useDraftPersistence.ts                (új — generikus draft hook)
  src/components/admin/InvoiceFormDialog.tsx      (draft + outside-click védelem)
  src/components/admin/PartnerFormDialog.tsx      (draft + outside-click védelem)
```

- A meglévő `QuickEntryBar` és `WeeklyExcelImport` logikája újrahasznosul (shared belső függvények kiemelve, ha kell), nincs duplikálás.
- A bottom sheet a meglévő shadcn `Sheet` komponensre épül, követve a `mem://tech/dialog-accessibility-standard` szabályait (max-h, flex-col, scrollable body).
- A draft hook nem ír gyakran (debounced), és csak akkor olvas mount-kor, ha az űrlap valóban új rekord.
- Funkcionálisan semmi nem változik — csak hozzáférés és kényelem javul (megfelel a `preserve-functionality` szabálynak).
