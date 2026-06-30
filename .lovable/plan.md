## Probléma

A publikálási banner (sárga „Egész hét publikálása" / zöld „Hét publikálva") csak a desktop nézetben jelenik meg. Mobilon a `WeeklyMenuGrid.tsx` 665. soránál `if (isMobile) return <WeeklyGridMobile … />` korán kilép, mielőtt eljutna a bannerig. Ráadásul a `WeeklyGridMobile` komponens egyáltalán nem kap publikálási adatot, így napi „Látható / Nem látható" gomb sincs mobilon.

A desktop bannert is csak akkor látja az ember, ha a heti rács fejléce látható — fix sticky tetejű sáv nélkül scroll közben elveszik.

## Megoldás

### 1. Publikálási banner mobilra (`WeeklyMenuGrid.tsx`)

A mobil ágban (665–728), közvetlenül a `WeeklyGridMobile` fölé beillesztem ugyanazt a banner blokkot, ami desktopon van:
- Sárga sáv „X nap piszkozatban — egész hét publikálása" gombbal, ha van piszkozat.
- Zöld sáv „Hét publikálva — a vendégek látják", ha minden napra publikálva van.
- A banner sticky pozícióban (`sticky top-14 z-30`) legyen, hogy scroll közben is látszódjon.

A desktop banner ugyanígy kapja a `sticky top-14` osztályt, hogy görgetéskor se vesszen el.

### 2. Napi publikálás gombok mobilra (`WeeklyGridMobile.tsx`)

Hozzáadok egy új propot: `publishData: Record<string, { offerId: string; isPublished: boolean }>` és `onTogglePublish: (date: string, value: boolean) => void`.

Minden napi szekció (nap-fejléc) jobb oldalára egy kis badge gomb kerül:
- Zöld „Látható" / sárga „Nem látható" — egy kattintásra váltható, akárcsak desktopon.

A `WeeklyMenuGrid.tsx` átadja ezeket a propokat és a meglévő `publishMutation`-t kötjük be.

## Érintett fájlok

- `src/components/admin/WeeklyMenuGrid.tsx` — banner megjelenítése a mobil ágban + sticky pozíció desktopon, propok átadása.
- `src/components/admin/WeeklyGridMobile.tsx` — új propok, napi publish badge minden nap-fejlécbe.

Nincs DB- vagy backend-változás.
