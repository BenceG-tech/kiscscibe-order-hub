
# Kosar es rendeles javitasok

## Osszefoglalas

Harom hiba javitasa: (1) kosar dialog gorgethetoseg, (2) napi menu duplikacio megakadalyozasa, (3) CORS konfiguracio bovitese a rendeles leadashoz.

## 1. Kosar dialog gorgethetoseg

**Fajl:** `src/components/CartDialog.tsx`

- A kosar tetelek listaja (`space-y-4` div) nem gorgethet, igy sok tetelnel a "Tovabb a fizeteshez" gomb kilog a kepernyorol
- Megoldas: a tetelek listajat `overflow-y-auto` es `max-h-[50vh]` stilussal latjuk el, hogy goergetheto legyen
- Az osszesito/gomb resz (`border-t pt-4`) a lista alatt marad, mindig lathato

## 2. Napi menu duplikacio javitasa

**Fajl:** `src/contexts/CartContext.tsx`

- Az `addCompleteMenu` fuggvenyben az ID jelenleg: `complete_menu_${menu.id}_${Date.now()}`
- A `Date.now()` miatt minden kattintas egyedi ID-t general, igy a reducer `findIndex`-e soha nem talalja meg a meglevo tetelt
- Megoldas: az ID-bol eltavolitjuk a `Date.now()` reszt: `complete_menu_${menu.id}_${menu.soup.id}_${menu.main.id}`
- Igy ugyanazt a menut tobbszor megnyomva a darabszam no, nem jon letre uj sor

## 3. CORS konfiguracio bovitese

**Fajl:** `supabase/functions/_shared/cors.ts`

- A jelenlegi CORS ellenorzes: `origin.endsWith(".lovable.app")`
- A preview kornyezet viszont `.lovableproject.com` domainrol fut (lasd console logokban: `98ed56c3-...lovableproject.com`)
- Emiatt a `submit-order` edge function elutasitja a kerest es "Failed to fetch" hibauzenet jelenik meg
- Megoldas: a CORS `isAllowed` feltetelben hozzaadjuk: `|| origin.endsWith(".lovableproject.com")`
- Az edge function ujratelepitese is szukseges a valtozas utan

## Erintett fajlok

| Fajl | Muvelet |
|------|---------|
| `src/components/CartDialog.tsx` | Modositas — gorgethetoseg + fix gomb |
| `src/contexts/CartContext.tsx` | Modositas — `Date.now()` torles az ID-bol |
| `supabase/functions/_shared/cors.ts` | Modositas — `.lovableproject.com` hozzaadasa |

## Technikai reszletek

**CartDialog.tsx valtozas:**
- A tetelek `div`-je: `className="space-y-4 overflow-y-auto max-h-[50vh] pr-1"` (pr-1 a scrollbar hely)
- Az osszesito `div` kint marad a gorgetett teruletbol

**CartContext.tsx valtozas (283. sor):**
- Regi: `id: \`complete_menu_\${menu.id}_\${Date.now()}\``
- Uj: `id: \`complete_menu_\${menu.id}_\${menu.soup.id}_\${menu.main.id}\``

**CORS valtozas (16. sor):**
- Regi: `origin.endsWith(".lovable.app")`
- Uj: `origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com")`
