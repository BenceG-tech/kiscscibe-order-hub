# Rendelés nyomtatás + tablet értesítések javítása

## 1. Nyomtatás gomb az "Új" fázisú rendelésekhez

`src/pages/admin/OrdersManagement.tsx` → `OrderCard` komponens:
- Új `Nyomtatás` gomb a státusz akció sávba, **csak akkor jelenjen meg, ha `order.status === "new"`** (a "Készítés megkezdése" gomb mellé).
- Kattintásra megnyílik egy rejtett, nyomtatásra optimalizált blokk és `window.print()` fut le — vagy egy új ablakban renderelünk egy 80 mm-es konyhai bizonylatot (a meglévő KDS receipt mintát követve, a `kitchen-display-system-kds-v2` memóriával összhangban: 80 mm szélesség, monospace, nagy tételnevek, mennyiség, módosítók `↳`-val, megjegyzés, átvételi idő, rendelésszám barcode-szerű kiemeléssel).
- A printelt tartalom: `#kód`, vendég neve + telefon, átvételi idő, fizetési mód, tételek (qty × név, módosítók, ár), végösszeg, kupon (ha van), megjegyzés.
- Print CSS biztosítja, hogy az admin UI-ból semmi más ne nyomtatódjon (`@media print { body > *:not(.print-receipt) { display: none } }`), a meglévő `print:hidden` mintát követve.

## 2. Tablet értesítések (hang + popup) javítása

### Diagnózis
- **Hang**: iPadOS/Android tabletek Safari/Chrome szigorúan korlátozzák a `AudioContext`-et. A jelenlegi `useGlobalOrderNotifications`:
  - Csak `click`/`keydown`/`touchstart`-ra unlockol, de **csak akkor próbálja inicializálni az AudioContextet**, ha még nincs. Tableten gyakran a `touchstart` után suspended marad — kell egy néma `oscillator.start()` az unlock pillanatában (silent buffer trükk), különben az első tényleges `playNotificationSound()` hangtalan.
  - `audio.play()` az iPadOS-en némán elbukik, ha a tab háttérbe került és visszajött → kell egy `resume()` minden `visibilitychange`-re is.
- **Vizuális értesítés / realtime**: a Realtime channel a tablet "alvása" alatt lezár; a `visibilitychange` újra-subscribe már megvan, de **a "missed orders" lekérdezés hiányzik** — ha a tablet 5 percig aludt, az alatt érkezett rendelésekről soha nem jön notifikáció. Be kell tölteni a `created_at > lastSeenAt` rendeléseket reconnect után, és lejátszani rájuk a hangot/popupot.
- **Service Worker / PWA**: ha a tablet a published app-ot PWA-ként használja, érdemes a `usePushNotifications` hookkal push értesítést is küldeni (már létezik a rendszer), hogy zárt képernyőn is jelezzen.

### Változtatások

**`src/hooks/useGlobalOrderNotifications.tsx`**
- Audio unlock során: létrehoz egy 1-mintás néma `AudioBuffer`-t és `start()`-olja → ez ténylegesen feloldja az `AudioContext`-et iOS-en.
- `visibilitychange` handler: `audioContextRef.current?.resume()` minden visszatéréskor.
- Új `lastSeenAtRef` (init: `new Date().toISOString()`). A subscription `SUBSCRIBED` callbackjében és minden `visibilitychange`-nél (visible) lekérdezi: `orders` ahol `created_at > lastSeenAt AND status = 'new'` → minden hiányzó rendelésre meghívja `handleNewOrder`-t (popup + hang), majd frissíti `lastSeenAt`-et.
- Hozzáad egy fallback `<audio>` elemet base64 WAV-val a DOM-ba (rejtve), és ha az `AudioContext` nem érhető el, ezt játssza le — Android Chromen néha megbízhatóbb.

**Tablet-specifikus UX (`OrderNotificationModal.tsx`)**
- A modal már 2-es border-rel kiemelt, de ellenőrizzük, hogy tableten (768-1024 px) ne tűnjön el a viewport mögé. Vibrációs API hozzáadása: `navigator.vibrate?.([200, 100, 200, 100, 400])` amikor érkezik új rendelés — tableten/mobilon érezhető visszajelzés.

### Tesztelés a `browser` toolokkal
- `view_preview` 820×1180 (iPad) viewport-tal, bejelentkezés admin felhasználóval (`gataibence@gmail.com`).
- `/admin/orders` megnyitása, képernyőkattintással audio unlock.
- Új teszt rendelés leadása másik tabon (`view_preview` 390×844) → ellenőrizzük: hang + popup megjelenik az iPad viewportban.
- Tab elrejtés (másik route navigáció + vissza) → a "missed orders" sweep hoz-e popupot, ha közben jött rendelés.

## Technikai részletek

- A "missed orders" lekérdezés a meglévő RLS-szel (`is_admin_or_staff`) működik, nem kell új migráció.
- Nem nyúlunk a backend `submit-order` / `send-order-status-email` edge functionhöz — csak frontend változás.
- A jelenlegi `audio.play()` a `useRealtimeOrders` hookban érintetlen marad (nem ez a fő útvonal — a globális hook szolgáltatja az értesítést).

## Érintett fájlok

```text
src/pages/admin/OrdersManagement.tsx        # Print gomb + print CSS + receipt komponens
src/components/admin/OrderReceiptPrint.tsx  # ÚJ: nyomtatható 80 mm-es bizonylat
src/hooks/useGlobalOrderNotifications.tsx   # Audio unlock fix + missed-orders sweep + vibráció
src/index.css                                # @media print szabályok (ha nem helyileg oldjuk meg)
.lovable/plan.md                             # munkajegyzet frissítése
src/data/adminChangelog.ts                   # új bejegyzés
```
