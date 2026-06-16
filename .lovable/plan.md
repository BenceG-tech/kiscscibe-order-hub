## Mit találtam

Elindítottam egy ügyfél-szimulációt mobil nézetben (402px). Hozzáadtam a Bundáskenyeret a kosárhoz, bementem a fizetéshez, kitöltöttem az adatokat — de amikor a **„Időpont foglalása"** opcióra kattintottam, az egész Checkout oldal **összeomlott** ezzel a hibával:

```
NotFoundError: Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node.
(Select component, Checkout.tsx)
```

Ez egy **rendelést blokkoló kritikus bug**: ha az ügyfél előre szeretne időpontot foglalni (és a „Minél hamarabb" sokszor „Zárva" badge-et mutat), egyáltalán nem tud rendelést leadni.

### Gyökérok

`src/pages/Checkout.tsx` 862-914. sorok:

1. A `<SelectContent>` belsejében egy üres állapot esetén `<div className="p-3...">` van renderelve, nem `<SelectItem>` — a Radix Select ezt nem támogatja és törléskor `removeChild` hibát dob.
2. A `value={`${formData.pickup_date}|${formData.pickup_time}`}` érvénytelen `"|"`-ra értékelődik kiválasztás előtt — Radixban a Select értéknek `undefined`-nek kell lennie, ha nincs választva.

## Mit fogok csinálni

### 1. Bug javítása `src/pages/Checkout.tsx`

- A „nincs elérhető időpont" üzenetet **kiveszem a `<SelectContent>`-ből** és a Select **alá/helyére** renderelem normál `<p>`-ként.
- A Select `value` propot csak akkor adom meg, ha mind `pickup_date`, mind `pickup_time` ki van töltve — különben `undefined`.
- Ha `timeSlots.length === 0`, egyáltalán nem rendereljem a Selectet, helyette egy informatív üres állapotot mutatok („Nincs szabad időpont, válasszon másik napot").

### 2. End-to-end teszt folytatása (ügyfél oldal)

A javítás után újra végigmegyek a folyamaton browser tooll:
- Kosárba teszek 1 napi ajánlat ételt
- Checkoutban kitöltöm: név, telefon (+36 30 123 4567), email, „Időpont foglalása" → kiválasztok egy slot-ot
- Készpénz fizetés → **Rendelés leadása**
- Ellenőrzöm az `Összesítő` képernyőt (megerősítő kód, részletek)
- DB-ben `supabase--read_query`-vel megnézem, hogy a rendelés tényleg bekerült-e (orders + order_items)
- Ellenőrzöm az `email_send_log`-ot (visszaigazoló email)

### 3. Admin oldali végigtesztelés

- Belépek admin nézetbe → **`/admin/orders`**
- Ellenőrzöm, hogy az új rendelés megjelenik (realtime), helyes adatokkal, és pulzáló kék border van
- Végigmegyek minden fázison: **új → készül → kész → kész szállítva** és visszafelé is (Vissza gomb)
- Ellenőrzöm a fülek (Aktív / Múlt) tartalmát
- KDS (kitchen display) printer view ellenőrzése, ha elérhető
- A „Visszaaktiválás" gomb tesztje a múlt rendelésnél
- Ellenőrzöm az `admin_audit_log`-ot (státusz változások nyomon követhetők-e)

### 4. Jelentés

A teszt végén szöveges összefoglalót adok arról, hogy minden fázis működik-e, és listázom a talált további problémákat (ha vannak). Csak akkor módosítok további kódot, ha újabb blokkoló hibát találok — egyébként összegyűjtöm őket egy listába és megkérdezem, melyiket javítsam.

## Érintett fájlok

- `src/pages/Checkout.tsx` — Select bug javítása (kb. 10-15 sor)
- (csak ha újabb bugot találok: további fájlok, de erről előtte értesítelek)

Nem módosítom: backend logikát, edge function-öket, DB sémát, business logikát.
