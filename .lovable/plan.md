## Mit találtam

Kazi Cintia 4× próbálta leadni ugyanazt a rendelést (2026-07-02 11:46–11:47 Budapest, 7280 Ft, 5 tétel), mind "Rendelés mentési hiba" üzenettel. A vásárló nem tudott sikeresen rendelni.

## Gyökér-ok (KRITIKUS bug)

A `Checkout.tsx` a fizetési módhoz a `"card"` értéket küldi a `submit-order` edge functionnek ("Bankkártya átvételkor" opciónál), viszont a `orders_payment_method_check` DB constraint csak a `'cash' | 'pos' | 'card_online'` értékeket engedi.

Emiatt minden olyan vendég, aki a "Bankkártya átvételkor" opciót választja, `Rendelés mentési hiba` üzenetet kap az `orders` INSERT-nél elszáll. Cintia is ezt választotta. (Ez ugyanaz a jelenség, ami miatt Erika rendelését is manuálisan `card_online`-nal kellett berögzíteni.)

**Nem újkeletű probléma** – ez régóta él, minden bankkártyás átvételi próbálkozás elbukik. Nézd meg a régebbi "Sikertelen" listát: valószínűleg még több ilyen áldozat lesz.

## Terv

**1. Frontend fix (`src/pages/Checkout.tsx`)**
- A "Bankkártya átvételkor" opció értéke `"card"` → `"pos"` (a `pos` szemantikailag helyes: POS-terminál helyszíni fizetés; a `card_online` az online kártyafizetést jelentené, ami nálunk nincs).
- Type-t (`"cash" | "card"` → `"cash" | "pos"`) is átírom mindenhol a fájlban.
- A submit-order body-ban tehát `payment_method: "pos"` megy.

**2. Manuális helyreállítás – Cintia rendelése**
- 4 próbálkozásból 1 valódi rendelést csinálok (dedupláció, mint Erikánál).
- `orders` INSERT: `payment_method='pos'`, `total_huf=7280`, `status='new'`, `pickup_time=NULL` (asap – így küldte).
- `order_items` INSERT (5 sor a snapshotból).
- A 4 sikertelen `order_attempts` bejegyzést törlöm.

**3. Régebbi áldozatok kimutatása**
- Egyszeri `SELECT` a `order_attempts` táblából, ahol `error_message='Rendelés mentési hiba'` és `customer_phone` egyedi → lista neked, hogy visszahívhasd őket. **Nem** rögzítek automatikusan; egyenként te döntesz.

**4. Védőháló a submit-orderben (`supabase/functions/submit-order/index.ts`)**
- Bemenet-normalizálás: ha `payment_method === 'card'` → átmapelem `'pos'`-ra (backward compat régi klienseknek / cache-elt bundle-nek).
- Így ha marad egy régi tab a vendégnél, akkor sem bukik el.

**5. Changelog + memory**
- `src/data/adminChangelog.ts`: új bejegyzés (2026-07-02) a `card` → `pos` mapping fixről és Cintia helyreállításáról.
- Röviden megemlítem az admin help szövegekben is, ha releváns.

## Amit NEM módosítok
- DB constraint (`orders_payment_method_check`) — a jelenlegi 3 érték helyes, nem tágítom.
- Semmilyen más business logika, UI struktúra.
- Az edge function timezone / rollback logikát, amit az előző körben már fixáltunk.

## Kérdés jóváhagyás előtt
Megfelel a `"card"` → `"pos"` mapping (POS-terminál átvételkor)? Vagy inkább `"card_online"`-t akarod, esetleg a DB constraintbe engedjük be a `"card"` értéket is?
