

# Terv — Admin kézikönyv: Tab-ok + „Mi változott?" szekció

## 1. Tab navigáció a kézikönyv tetején

Jelenleg az `AdminHelpPanel` egy hosszú, görgetett accordion lista. Az új struktúra **tab-okkal** lesz tagolva a panel tetején, hogy egy kattintással ugorhass a kívánt fő témára.

### Tab struktúra (top-level)

A jelenlegi `adminHelpContent.ts` kategóriák alapján **6-7 fő tab**:

1. **🆕 Mi változott?** (új — alapértelmezett, ha van új tartalom)
2. **🎯 Áttekintés** — „Mit hol találsz?" gyors-térkép + napi/heti rutin
3. **🍽️ Étlap & Menü** — Étlap kezelés, Napi ajánlat, Allergének
4. **📊 Működés** — Rendelések, KDS, Kapacitás, Pazarlás, Forecasting
5. **💰 Pénzügy** — Számlák, Partnerek, Statisztika, AI ár-javaslatok
6. **📣 Marketing** — Képek, FB poszt, Hírlevél, Kuponok, Galéria
7. **⚙️ Tartalom & Egyéb** — Rólunk/GYIK/Jogi/Hirdetmény, PWA, Beállítások

### Layout

- **Felül**: kereső (megmarad) + horizontálisan görgethető tab-sor (sticky a panel tetején)
- **Alatta**: az aktív tab tartalma (accordion-ok az adott kategóriához tartozó témákkal)
- **Kontextus jelzés**: az aktuális oldalhoz tartozó tab automatikusan ki van jelölve és nyitva, plusz egy kis sárga pötty jelöli a tab-on hogy „itt vagy most"
- **Mobil**: a tab-sor görgethető (`overflow-x-auto`), kompakt szöveg + ikon

### Technikai megvalósítás

- Shadcn `Tabs` komponens használata (`tabs.tsx` már létezik)
- A `HELP_CONTENT` kategóriák egy új `tabGroup` mezőt kapnak (pl. `'menu' | 'operations' | 'finance' | ...`), amivel csoportosítva jelennek meg
- Kereséskor a tab-ok mögé esik a kereső (cross-tab találatok mind láthatók)

## 2. „Mi változott?" szekció

Új első tab a kézikönyvben, ami **az utolsó 7 napban hozzáadott funkciókat** mutatja **ÚJ** badge-dzsel.

### Adatmodell

Új fájl: `src/data/adminChangelog.ts` — strukturált lista:

```ts
type ChangelogEntry = {
  date: string;           // ISO date — pl. "2026-04-17"
  title: string;          // pl. "FB poszt AI szöveg generátor"
  description: string;    // 1-2 mondat
  category: string;       // melyik tab-on található a részletes súgó
  helpTopicId?: string;   // direkt link az érintett súgó-témára
  type: 'new' | 'improved' | 'fixed';  // típus badge
};
```

Kezdeti tartalom (az elmúlt napok valódi változásai):
- FB poszt AI szöveg generátor (új) — Kép és poszt tab
- Tab sorrend a Napi ajánlat oldalon (javítás)
- Kapacitás magyarázó panel (új)
- Admin nav „Több" dropdown (javítás)
- Kosár ürítése egy gombbal (új)
- Allergének automatikus hozzárendelése (új)
- Admin kézikönyv (új)
- Kézikönyv tab-os struktúra + Mi változott? (új)

### Megjelenítés a tab-on

- **Időrendi sorrendben** (legfrissebb fent), dátum szerint csoportosítva
- Minden tétel: **🆕/✨/🔧 ikon + cím + dátum + leírás + „Tovább a súgóhoz →" link**
- **„ÚJ" badge** azokon, amik az **utolsó 7 napban** kerültek be (sárga `bg-primary` badge)
- A tételek `<7 napos` időbélyeggel egy „Friss változások" szekcióba, a régebbiek egy „Korábbi frissítések" összecsukható szekcióba (max 30 napra visszamenőleg jelenik meg)

### Bónusz: badge a fő tab-on is

Ha vannak az utolsó 7 napban változások:
- A „🆕 Mi változott?" tab-on egy kis piros pötty + szám (pl. „3"), mint értesítés
- Eltűnik, ha a felhasználó megnyitotta egyszer (localStorage-ban tároljuk a `lastViewedChangelog` timestamp-et)

## 3. Apró fejlesztések a panel tetején

A jelenlegi „Új vagy itt?" banner és „Most ezen az oldalon vagy" szekció megmarad, de:
- **Tömörebb formában** kerülnek a tab-sor **fölé** (nem lent külön, hogy a tab-sor maradjon a fő navigáció)
- A welcome banner-ben az „Indíts a 🎯 'Mit hol találsz?' szekcióval" link most már a **🎯 Áttekintés tab-ra** vált (nem csak görget)

## Érintett fájlok

| Fájl | Művelet |
|---|---|
| `src/data/adminHelpContent.ts` | `tabGroup` mező hozzáadása minden kategóriához + tab metaadatok export |
| Új: `src/data/adminChangelog.ts` | Changelog tételek + `isWithinDays` segéd |
| `src/components/admin/AdminHelpPanel.tsx` | `Tabs` komponens beépítése, tab szűrés, „Mi változott?" tab tartalom, kontextus → aktív tab váltás, „új változás" badge |

## Megvalósítási sorrend

1. `adminChangelog.ts` létrehozása az aktuális változásokkal
2. `adminHelpContent.ts` kategóriák `tabGroup` mezővel ellátása + tab definíciók
3. `AdminHelpPanel.tsx` átalakítása: Tabs komponens, „Mi változott?" tab tartalom render, kontextus alapján aktív tab kiválasztás, badge logika

