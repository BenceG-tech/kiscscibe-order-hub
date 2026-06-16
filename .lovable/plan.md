# Tablet értesítések ellenőrzése + tulajdonosi útmutató

## 1. Mit teszek (technikai rész röviden)

A `useGlobalOrderNotifications` hook már tartalmazza a tablet-fixeket (audio unlock néma bufferrel, missed-orders sweep, vibráció, 60 mp-es safety sweep). Nem írok új kódot — csak **end-to-end tesztet** futtatok a `browser` toolokkal:

- iPad viewport (820×1180) → `/admin/orders` megnyitása, képernyőkattintás (audio unlock), majd új teszt rendelés leadása másik tabon → ellenőrzöm: jön-e popup + hang.
- Android tablet viewport (1024×768) → ugyanaz.
- Console logok átnézése (`[Notifications]` prefix) a sweep és subscribe státuszokhoz.
- Ha bármi nem stimmel, javítom (pl. extra resume hívás, sweep idő).

## 2. Tulajdonosi útmutató (nem technikai, étterembe kinyomtatható)

### A) Egyszeri beállítás a tableten (induláskor)

1. **Nyisd meg** a böngészőben: `kiscscibe-order-hub.lovable.app/admin/orders` (vagy a saját domain).
2. **Jelentkezz be** admin fiókkal (`gataibence@gmail.com`).
3. **Koppints egyszer a képernyőre** — ez engedélyezi a hangjelzést. (iPad/iPhone csak így enged hangot lejátszani.)
4. **Állítsd a tablet hangerejét maximumra**, kapcsold ki a néma módot.
5. **Tartsd nyitva a böngésző fület.** Ha bezárod, nem jön értesítés.
6. **Tablet ne aludjon el:** Beállítások → Képernyő → Auto-lock → **Soha**.
7. *(Opcionális)* iPaden: Megosztás → **„Hozzáadás a kezdőképernyőhöz"** — így alkalmazásként indul, kevésbé alszik el.

### B) Mi történik amikor jön egy rendelés?

- **Hangjelzés**: kétszer megszólal egy emelkedő csengőhang (kb. 1,5 mp).
- **Rezgés**: Android tableten/telefonon a készülék is rezeg.
- **Felugró ablak**: középen megjelenik a rendelés száma + összeg + átvételi idő. Itt két gomb:
  - **„Megnyitás"** → átvisz a rendelés részleteihez
  - **„Bezárás"** → eltünteti a popupot (a rendelés továbbra is ott marad az „Új" oszlopban)

### C) Mit kell tenni a rendeléssel? (4 fázis)

A `/admin/orders` oldalon minden rendelés egy kártya. A státusz alapján más-más gomb van rajta:

| Fázis | Mit látsz | Mit nyomj | Mi történik |
|---|---|---|---|
| 1. **Új** | Sárga kártya | **„Nyomtatás"** → kinyomtat egy konyhai bizonylatot 80mm-es printerre. **„Készítés megkezdése"** | A vendég emailt kap: „Megkezdtük a rendelésed elkészítését" |
| 2. **Készítés alatt** | Kék kártya | **„Elkészült"** | A vendég emailt kap: „A rendelésed átvehető" |
| 3. **Elkészült** | Zöld kártya | **„Átadva"** | A vendég emailt kap: „Köszönjük, jó étvágyat" + értékelő linket kap |
| 4. **Átadva** | Szürke kártya | (nincs teendő) | Lezárt rendelés |

➡️ **Minden gombnyomás automatikusan emailt küld a vendégnek** — nem kell külön értesíteni.

### D) Nyomtatás (új funkció)

- Az **„Új"** státuszú kártyán megjelenik egy **„Nyomtatás"** gomb.
- Megnyomásra felugrik a böngésző nyomtatási ablaka egy 80 mm-es konyhai bizonylattal (rendelésszám, vendég, tételek, megjegyzés).
- Válaszd ki a konyhai termoprintert → **Nyomtatás**.
- *(Tipp: állítsd be a böngészőben alapértelmezett printerként, hogy egy kattintás legyen.)*

### E) Ha mégse jön hang/popup

1. Frissítsd az oldalt (pull-to-refresh vagy F5).
2. Koppints újra a képernyőre (audio újra-engedélyezés).
3. Ellenőrizd a tablet hangerőt és néma kapcsolót.
4. Ha 1 perce nyitva volt a tab és aludt: a rendszer 60 másodpercenként magától ellenőrzi az új rendeléseket — várj fél percet.

### F) Mit NEM kell csinálni

- ❌ Ne zárd be a böngésző fület munkaidő alatt.
- ❌ Ne navigálj el az `/admin/orders` oldalról hosszú időre (más admin oldalon is jön értesítés, de biztosabb itt maradni).
- ❌ Ne kapcsold ki a wifi-t — Realtime kapcsolat kell.

---

## Tesztelési lépések (amit én futtatok)

1. iPad viewport megnyitása → admin login → console log ellenőrzés (`Audio unlocked`).
2. Új rendelés szimulálása másik tabról.
3. Popup + hang + vibráció megjelenés ellenőrzése.
4. Tab elrejtés 5 mp-re, vissza → sweep lefut-e.
5. Android tablet viewporton ugyanez.

Ha bármi hibázik, kis frontend-fixet csinálok (nem érintve backend logikát).
