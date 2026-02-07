

# Cookie Consent Banner Javitas

## A problema

A kepernykepen jol lathato: a cookie banner es a "Rendelj most" sticky gomb **egymasra csusznak** mobilon. Mindketto `fixed bottom-0 z-50`, ezert a cookie szoveg le van vagva es az "Elfogadom" gomb el van takarva. A felhasznalo nem tudja elfogadni a sutiket.

## Javitasok

### 1. Pozicionalas: banner a sticky CTA fole kerul mobilon

A cookie consent banner mobilon kap egy `bottom-[72px]` erteket (a StickyMobileCTA magassaga ~68-72px), igy a banner a CTA folott jelenik meg, nem rajta. Desktopon marad a `bottom-0`.

### 2. Z-index emeles

A cookie consent z-indexet `z-[60]`-ra emeljuk, hogy biztosan minden mas elem folott legyen (a StickyMobileCTA `z-50`).

### 3. Kompaktabb mobil megjelenes

- Cookie ikon megjelenik mobilon is (kicsi, 5x5 meretu)
- Szoveg es gomb kompaktabb elrendezesben: a gomb a szoveg ala kerul mobilon, teljes szelessegben
- Kisebb padding mobilon (`p-3` helyett `p-4`)
- Lekerekites finomitasa

### 4. Safe area tamogatas

iOS eszkozokon a `pb-safe` biztositja, hogy a banner nem log be a home indicator ala (desktopra ez nem vonatkozik, mert ott `bottom-0`).

## Technikai reszletek

### Modositando fajl

| Fajl | Valtozas |
|------|---------|
| `src/components/CookieConsent.tsx` | Pozicio, z-index, responsive layout javitas |

### CookieConsent.tsx konkret valtozasok

**Kulso wrapper:**
- `bottom-0` -> `bottom-[72px] md:bottom-0` (mobilon a sticky CTA folott)
- `z-50` -> `z-[60]` (biztosan a CTA folott)
- `p-4` -> `p-3 md:p-4` (kompaktabb mobilon)

**Belso kartya:**
- `p-4 md:p-6` -> `p-3 md:p-5` (kicsit kompaktabb)
- `flex-col sm:flex-row` marad, de a gomb mobilon teljes szelessegu lesz

**Cookie ikon:**
- `hidden sm:block` -> mindig lathato, de mobilon kisebb (`h-5 w-5` vs `h-7 w-7`)

**Elfogadom gomb:**
- Mobilon `w-full` hogy jobban megtalalhato legyen
- Desktopon marad `shrink-0`

