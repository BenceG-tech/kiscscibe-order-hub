# Online rendelés határideje: aznap 11:00-ig

## Cél
Aznapi online rendelés csak 11:00-ig (budapesti idő) leadható. 11:00 után a mai nap látszik, de tiltva van, és a vendég tájékoztatást kap, hogy a mai rendelés már csak személyesen a pultnál lehetséges. A holnapi és későbbi napokra továbbra is lehet rendelni.

## Megvalósítás

### 1. Szerveroldali védelem (submit-order edge function)
- A rendelés leadásakor, ha az átvételi nap a mai nap (budapesti idő szerint), a szerver elutasítja, ha már elmúlt 11:00.
- Barátságos magyar hibaüzenet: „A mai napra az online rendelés 11:00-ig volt lehetséges. Kérjük, válasszon későbbi napot, vagy rendeljen személyesen a pultnál."
- Ez a végső biztosíték — a böngészős korlátozás megkerülhető, a szerveres nem.

### 2. Pénztár oldal (Checkout)
- Állandó, diszkrét tájékoztató sor: „Online előrendelés aznap 11:00-ig — utána személyesen a pultnál."
- 11:00 után a mai nap a dátumválasztóban látszik, de szürkén, tiltva, rövid magyarázattal.
- A „Minél hamarabb" (ASAP) opció 11:00 után szintén tiltott.
- Ha a vendég mégis mára próbálna küldeni 11:00 után, a gombnyomás előtt barátságos üzenet jelenik meg és a dátumválasztóra ugrik.

### 3. Beállíthatóság
- A határidő (11:00) a `settings` táblába kerül (`order_cutoff` kulcs), így később kód nélkül módosítható. Alapérték: 11:00.

### 4. Admin értesítés
- Új bejegyzés az admin „Frissítések és újítások" listába.

## Ellenőrzés
- Típusellenőrzés, meglévő tesztek (21/21 + dobozdíj 11/11).
- Új tesztek a cutoff-logikára (10:59 enged, 11:00 tilt, holnapi nap mindig enged).
- Playwright: szimulált 10:30-as és 11:30-as idővel a checkout viselkedése.
- Csak preview, nem publikálok.
