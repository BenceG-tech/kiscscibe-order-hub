# Krisztian észrevételeinek javítása

## Mit látok jelenleg

1. **„Nem megy végig a rendelési folyamata"** — a backend működik (S82942, Z82817 ma bejött), de a `Checkout` „Véglegesítés" gombja **némán letiltódik**, ha pl. a telefon nem pontosan 9 számjegy, vagy nincs időpont kiválasztva. A felhasználó nem látja, miért szürke a gomb. A hibajelzések csak a böngésző konzolba mennek (lásd `useEffect` 149–166. sor).
2. **„Nem lehet a rendelési fázisokat visszajelölni"** — `ActiveOrderCard` (OrdersManagement.tsx 642–678) csak előre vezet: `new → preparing → ready → completed`. Visszalépés nincs.
3. **„Nem jó az admin felület, ahova beérkezik a rendelés"** — kompaktság / áttekinthetőség hiány: a státusz-akciók kis gombok, a fő infók (tételek, átvétel, telefon) szétszórtak, és nincs egy „lényeg" sáv az új rendeléseken.

## Mit fogok csinálni

### 1. Checkout: a felhasználó mindig tudja, miért nem megy tovább
- A „Rendelés véglegesítése" gomb **nem lesz letiltva** validációs okból — kattintásra futtatjuk a validációt és **piros toast + inline hibaüzenet** mutatja a pontos okot („Hiányzó email", „Telefonszám 9 számjegyű legyen", „Válassz időpontot", stb.).
- A `+36` prefixes telefon-ellenőrzés engedékenyebb: 8–9 számjegyet és vezető 0-t is elfogad, normalizálva küldjük.
- Az időpont kiválasztó fölött piros mező jelzi, ha nincs választott slot, amikor „Időpont foglalása" van bekapcsolva.
- A submit-button szövege a state szerint változik („Rendelés feldolgozása…" spinner-rel).

### 2. Admin: státusz oda-vissza kapcsolható
- Az `ActiveOrderCard` minden státusznál kap egy **„↶ Vissza"** kiegészítő gombot:
  - `preparing` → vissza `new`
  - `ready` → vissza `preparing`
  - `completed` → vissza `ready` (a „Múltbeli" fülről is)
  - `cancelled` → újraaktiválás `new` (a „Múltbeli" fülről is)
- A státusz-email automatika **nem** fut le visszaléptetésnél (hogy a vendég ne kapjon zavaros mailt) — `updateOrderStatus`-ba `silent` paraméter.
- Egy kis admin-audit log bejegyzés készül minden visszaléptetésnél (`admin_audit_log` táblába, ami már létezik).

### 3. Admin: tisztább, gyorsabb rendelés-kártya
- Új rendelés (`new`) kártya **pulzáló kék keretet** kap, hogy ránézésre észrevehető legyen.
- Egy „lényeg" sáv a kártya tetején: `#kód · név · telefon · átvétel ideje · összeg` (mobilon is jól olvasható).
- A státusz-akció gombok nagyobbak (h-10), egymás mellett: balra a „**Vissza**", jobbra a fő „**Tovább**".
- Mobilon a kártya alján sticky akció-sáv (csak `new`/`preparing` állapotnál), hogy egy kattintásra elérhető legyen a továbblépés.
- A „Múltbeli" tab kollapszált kártyáira is kerül egy 3-pontos menüből elérhető „Visszaaktiválás" akció.

## Érintett fájlok

- `src/pages/Checkout.tsx` — submit-button mindig kattintható + inline + toast hibák, telefon normalizálás.
- `src/pages/admin/OrdersManagement.tsx` — `updateOrderStatus(orderId, status, opts?)` + `ActiveOrderCard`-ban „Vissza" gombok + új lényeg-sáv + pulzáló új-rendelés keret + sticky mobil akció + `PastOrderAdminCard`-ban „Visszaaktiválás".
- `src/data/adminChangelog.ts` — új bejegyzés a javításokról.

## Amit NEM változtatok

- Nem nyúlok az `submit-order` edge funkcióhoz, a DB-hez, a rendelés-számításhoz, készlethez, kuponhoz.
- Nem változik az értesítő hang / globális realtime / OrderNotificationModal.
- A márka színek és tipográfia érintetlen.
