
# Admin Napi Ajánlatok + Dialógus Javítások

## Azonosított Problémák

### 1. Kategóriák nem láthatók csütörtöknél
**Probléma**: A heti táblázat `ScrollArea` komponens vízszintes görgetésekor a jobb oldali napok (csütörtök, péntek) kategória celláit nehéz elérni.

**Megoldás**: A `WeeklyMenuGrid` ScrollArea komponens javítása, hogy a táblázat megfelelően görgethető legyen, és a kategóriák minden napnál láthatók legyenek.

### 2. Táblázat húzásakor tab váltás történik
**Probléma**: A `DailyMenuManagement.tsx` oldalon a heti táblázat vízszintes görgetése interferál az admin navigációs sávval (`AdminLayout.tsx`). A probléma az, hogy a táblázat ScrollArea és az admin nav tab-ok egyszerre kezelik a touch eseményeket.

**Megoldás**: 
- A `WeeklyMenuGrid` ScrollArea-hoz `touch-action: pan-x` CSS tulajdonság hozzáadása
- A táblázat container `overscroll-behavior: contain` beállítása, hogy megakadályozza a szülő görgetését

### 3. Étel szerkesztő dialógus levágva
**Probléma**: A `MenuItemEditDialog` komponens a képernyőfotón láthatóan nem fér el a képernyőn - sem a teteje, sem az alja nem látható, így a "Mentés" gomb elérhetetlen.

**Ok**: A dialógus `max-h-[90vh]` és `overflow-y-auto` beállításai nem elegendőek, mert a `DialogContent` fix pozícionálása (`top-[50%] translate-y-[-50%]`) miatt a tartalom kilóghat.

**Megoldás**:
- `DialogContent` osztály módosítása, hogy `my-4` margin legyen
- A dialóguson belül `max-h-[calc(100vh-2rem)]` használata
- A belső scroll terület megfelelő padding beállítása a fejléc és a gomb számára

### 4. Főételhez köret ajánlás
**Probléma**: A felhasználó kéri, hogy amikor egy látogató főételt tesz a kosárba, mindig jelenjen meg a köret választó ablak.

**Jelenlegi állapot**: Az `Etlap.tsx` már tartalmazza a logikát - ha nem leves (`menu_role !== 'leves'`), akkor megnyitja a `SidePickerModal`-t. A `SidePickerModal` pedig már tartalmazza a fallback logikát a `SIDE_CATEGORY_IDS` alapján.

**Megállapítás**: Ez már implementálva van az előző módosításokból! A kód megfelelően működik.

---

## Módosítandó Fájlok

### 1. `src/components/ui/dialog.tsx`
A dialógus alapértelmezett stílusainak javítása, hogy minden képernyőméreten elférjen:

```tsx
// Módosítandó sor (39):
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]..."

// Új:
"fixed left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] top-4 sm:top-[50%] sm:translate-y-[-50%] max-h-[calc(100vh-2rem)]..."
```

### 2. `src/components/admin/MenuItemEditDialog.tsx`
A dialógus belső elrendezésének javítása:

```tsx
// Jelenlegi (191. sor):
<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

// Új:
<DialogContent className="max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col">
  <DialogHeader className="flex-shrink-0">...</DialogHeader>
  <div className="flex-1 overflow-y-auto space-y-4 py-2">
    {/* form fields */}
  </div>
  <div className="flex-shrink-0 pt-4 border-t">
    <Button>Mentés</Button>
  </div>
</DialogContent>
```

### 3. `src/components/admin/WeeklyMenuGrid.tsx`
A táblázat görgetés javítása:

```tsx
// Jelenlegi (521. sor):
<ScrollArea className="w-full rounded-lg border">

// Új:
<ScrollArea className="w-full rounded-lg border touch-pan-x" style={{ overscrollBehavior: 'contain' }}>
```

### 4. `src/components/SidePickerModal.tsx`
Ugyanez a dialógus javítás alkalmazása:

```tsx
// Jelenlegi (205. sor):
<DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">

// Új:
<DialogContent className="sm:max-w-md max-h-[calc(100dvh-2rem)] flex flex-col">
```

---

## Technikai Részletek

### Dialog Komponens Javítás

A fő probléma a `DialogContent` fix pozícionálása. A `top-[50%] translate-y-[-50%]` kombináció középre helyezi a dialógust, de ha a tartalom magas, az kilóghat a képernyőből.

**Megoldás stratégia**:
1. Mobilon (`top-4`) fix felső margó, nem középre igazítás
2. Desktopon (`sm:top-[50%] sm:translate-y-[-50%]`) középre igazítás
3. `max-h-[calc(100dvh-2rem)]` limitálja a magasságot
4. A `100dvh` a dynamic viewport height, ami figyelembe veszi a mobil böngésző elemeit

### ScrollArea Touch Handling

A `touch-pan-x` CSS osztály biztosítja, hogy a vízszintes érintéses görgetés a táblázaton belül maradjon és ne triggerellje a szülő elemek görgetését.

Az `overscroll-behavior: contain` megakadályozza, hogy a görgetés "átfolyjon" a szülő elemekre.

---

## Összefoglaló

| Probléma | Megoldás | Fájl |
|----------|----------|------|
| Kategóriák nem láthatók | Touch handling javítás | `WeeklyMenuGrid.tsx` |
| Táblázat húzás tab váltás | overscroll-behavior | `WeeklyMenuGrid.tsx` |
| Dialógus levágva | Responsive max-height + flex layout | `dialog.tsx`, `MenuItemEditDialog.tsx`, `SidePickerModal.tsx` |
| Köret ajánlás | Már implementálva | - |
