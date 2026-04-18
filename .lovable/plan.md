

# Terv — Kézikönyv hierarchikus újrarendezése

## Probléma

Jelenleg a kézikönyv **lapos struktúrájú**: a kártya-grid → accordion lista. Nincs vizuális hierarchia az oldal → al-szekciók → al-al-szekciók között. A „Napi rutin" beletúrva az „Áttekintés" tab-ba, nehéz megtalálni.

## Új struktúra: 3-szintű hierarchia

```
SZINT 1: Fő kategória (kártya-grid)         pl. "Étlap & Menü"
   ↓
SZINT 2: Oldal / al-tab (lista bal oldalon)  pl. "Napi ajánlat"
   ↓
SZINT 3: Funkció / al-al-tab (accordion)     pl. "Tab-ok: Tételek / Áttekintés / Kép és poszt"
```

## 1. Új layout: bal oldali navigáció + jobb oldali tartalom

Kategória kiválasztása után (pl. „Étlap & Menü"):

```
┌─────────────────────────────────────────────────────┐
│ ← Vissza   |  🍽️ Étlap & Menü                       │
├─────────────┬───────────────────────────────────────┤
│ OLDALAK     │  📍 Napi ajánlat oldal                │
│             │                                        │
│ • Étlap     │  ▸ Áttekintés (mit lát itt)           │
│ ▸ Napi      │  ▸ Tételek tab                        │
│   ajánlat ✓ │  ▸ Kép és poszt tab                   │
│ • Hetirács  │  ▸ Pazarlás tab                       │
│ • Allergén  │  ▸ Forecasting tab                    │
│             │                                        │
└─────────────┴───────────────────────────────────────┘
```

- **Bal oldal (~30%)**: az adott kategóriához tartozó **oldalak listája** (sticky)
- **Jobb oldal (~70%)**: a kiválasztott oldal **al-szekciói accordion-ban**
- Kontextus jelölés: az aktuálisan nézett oldal sárga „● itt vagy" pötty + automatikusan kinyitva
- Mobilon: bal oldali lista helyett **dropdown** a tetején

## 2. „Napi rutin" külön kiemelt blokk az elején

A főképernyőn (kártya-grid) **a kártya-grid felett** egy kiemelt sáv:

```
┌─────────────────────────────────────────────────────┐
│  📅 Napi rutin (5 perc)    📆 Heti rutin (20 perc)  │
│  ▸ Megnyitás                ▸ Megnyitás              │
└─────────────────────────────────────────────────────┘
```

- **2 nagy gomb-kártya** felül, vizuálisan elkülönítve a többi kategóriától (más színű border, gradient háttér)
- Kattintásra **dialog/expanded view**: a checklist-szerű teendők
- Így a napi rutin **mindig egy kattintásra van**, nincs eltemetve

Alatta: **„🆕 Mi változott?"** kártya (eddigi piros pötty + szám badge megmarad, de külön sorban a rutin alatt)

Alatta: a **6 fő kategória kártya-grid** (Áttekintés nélkül, mert annak külön lett a rutin)

## 3. Tartalmi újraszervezés (`adminHelpContent.ts`)

Új típus-mező: `pageGroup` minden témán belül, ami megmondja melyik **oldal**-hoz tartozik (nem csak melyik tab-csoporthoz):

```ts
type HelpTopic = {
  id: string;
  title: string;
  tabGroup: 'menu' | 'operations' | ...;  // SZINT 1 — kategória
  pageGroup: string;                       // SZINT 2 — oldal (új!)
  pageRoute?: string;                      // pl. '/admin/daily-menu'
  sections: HelpSection[];                 // SZINT 3 — al-szekciók
};
```

Példa hierarchia az „Étlap & Menü" kategóriához:

| Oldal (pageGroup) | Témák (sections) |
|---|---|
| Étlap kezelés | Mire jó, kategóriák, képek, ár |
| **Napi ajánlat** | Áttekintés, Tételek tab, Kép és poszt tab, Pazarlás tab, Forecasting tab |
| Heti rács | Mire jó, drag&drop, kiosztás |
| Allergének | Auto-hozzárendelés, kézi szerk. |

Hasonlóan minden kategóriához újrarendezem.

## 4. „Áttekintés" tab átalakul

A jelenlegi „Áttekintés" tab tartalma szétoszlik:
- **Napi/heti rutin** → kiemelt felső blokk (lásd 2.)
- **„Mit hol találsz?"** quick-map → minden kategória kártyán a hover-tooltip / leírás bővebb lesz, plusz egy „Teljes áttekintés" link a fő kép alatt ami egy modal-ban mutatja a teljes oldal-térképet

Tehát az „Áttekintés" mint külön tab **eltűnik**, helyette a felépítése maga az áttekintés.

## 5. Breadcrumb navigáció

Minden mélyebb szinten breadcrumb jelzi hol vagy:
```
🏠 Kézikönyv  ›  🍽️ Étlap & Menü  ›  📍 Napi ajánlat
```
A breadcrumb minden eleme kattintható (vissza ugrik az adott szintre).

## Érintett fájlok

| Fájl | Művelet |
|---|---|
| `src/data/adminHelpContent.ts` | `pageGroup` mező hozzáadása minden témához, témák újra-csoportosítása oldalanként, `HELP_PAGE_GROUPS` export (kategória → oldalak térkép) |
| `src/components/admin/AdminHelpPanel.tsx` | 3-szintű navigáció (grid → oldal-lista → accordion), kiemelt napi/heti rutin sáv, breadcrumb, mobil dropdown a bal oldali lista helyett |

## Megvalósítási sorrend

1. `adminHelpContent.ts` átstrukturálása `pageGroup` mezővel
2. `AdminHelpPanel.tsx` 3-szintű navigáció + breadcrumb
3. Napi/heti rutin kiemelt felső blokk + dialog
4. Mobil reszponzív (bal lista → dropdown)

