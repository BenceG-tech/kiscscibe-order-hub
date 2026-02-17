

# Nyomtatasi meret javitasa es ertesitesi rendszer megbizhatosaga

## 1. problema: Tul hosszu nyomtatas

A jelenlegi `handlePrint` fuggveny egy teljes A4-es oldalt nyit meg `max-width: 300px`-szel, de a bongeszok alapertelmezetten A4 meretben nyomtatnak. Igy a kis tartalom egy hatalmas feher lapon jelenik meg.

### Megoldas
A nyomtatasi HTML-be `@page` CSS szabalyt adunk, ami 80mm szeles (standard POS/blokknyomtato meret) es automatikus magassagu papirt allit be. Igy a nyomtatas pont akkora lesz, amekkora a tartalom.

**Fajl: `src/components/staff/KanbanOrderCard.tsx`**
- `@page { size: 80mm auto; margin: 2mm; }` hozzaadasa a print CSS-hez
- `@media print` blokk, ami eltunteti a felesleges margokat
- `body` meretet `width: 76mm`-re allitjuk a `max-width: 300px` helyett
- `window.print()` idas elorelathato kesleltetese (`setTimeout 300ms`), hogy a DOM renderelodjon

### Eredmeny
A blokk pontosan akkora lesz, amekkora a rendelesi adatok -- termikus/blokknyomtatoval is hasznalhato.

---

## 2. problema: Hang es popup ertesites nem mukodik mas keszuleken

Tobb okot azonositottam:

### A) AudioContext feloldas nem megbizhato mobilon
Az `{ once: true }` listener egyszer fut le, de ha a felhasznalo eloszor olyan oldalon kattint ahol az `enabled` meg `false` (pl. betoltes kozben), az audio soha nem oldodik fel. Emellett iOS Safari kulonosen szigoru: a `resume()` hivast kozvetlenul a user gesture-ben kell megtenni.

**Megoldas:**
- `{ once: true }` eltavolitasa -- helyette a handler ellenorzi `audioUnlocked`-ot es maga all le
- A `playNotificationSound`-ban ellenorizzuk es probaljuk `resume()`-olni a contextet, de ha nem sikerul, fallback `new Audio()` hasznalata (egyes bongeszokon jobban mukodik)

### B) Realtime subscription megszakad hatterben
Mobilon a bongeszo felfuggeszti a WebSocket kapcsolatot ha a tab hatterbe kerul. Amikor visszater a felhasznalo, a csatorna lehet hogy mar nem aktiv.

**Megoldas:**
- `visibilitychange` event figyelese: ha a tab ujra lathatova valik, ellenorizzuk a csatorna allapotat es ujra feliratkozunk ha szukseges
- Ez biztositja hogy a felhasznalo mindig megkapja az ertesiteseket visszaterve

### C) initializedRef soha nem resetelodik
Ha `enabled` `false`-rol `true`-ra valt (pl. a roles loading befejezodik), az `initializedRef.current` mar `true`, igy a kezdeti rendelesek nem toltodnek be.

**Megoldas:**
- `enabled` valtozasakor reseteljuk az `initializedRef`-et ha `false`-ra valt

---

## Technikai reszletek

### Erintett fajlok

1. **`src/components/staff/KanbanOrderCard.tsx`** - `handlePrint` fuggveny: @page CSS es meretezesi javitasok

2. **`src/hooks/useGlobalOrderNotifications.tsx`** - Harom javitas:
   - Audio unlock listener megbizhatosaga (once eltavolitasa)
   - `visibilitychange` esemeny figyelese a subscription ujracsatlakozasahoz
   - `initializedRef` reset logika

