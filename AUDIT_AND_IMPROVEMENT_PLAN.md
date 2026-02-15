# AUDIT AND IMPROVEMENT PLAN — Kiscsibe Order Hub

Utolsó frissítés: 2026-02-15

## Összefoglaló

| # | Probléma | Prioritás | Státusz |
|---|----------|-----------|---------|
| 1.2 | Capacity slot race condition | KRITIKUS | ✅ Javítva |
| 2.4 | Modifier/side árak nem szerver-validáltak | KÖZEPES | ✅ Javítva |
| 1.1 | Capacity + portions nincs tranzakcióban | MAGAS | Nyitott |
| 1.3 | Nincs rollback részleges hiba esetén | MAGAS | Nyitott |
| 4.1 | Elfogyott tételek checkboxai aktívak | KÖZEPES | ✅ Javítva |
| 2.1 | ASAP rendelések bypass-olják az üzleti órákat | KÖZEPES | Nyitott |
| 5.2 | Nincs cutoff time rendszer | KÖZEPES | Nyitott |
| 3.1 | Rendelés státusz workflow lassú | KÖZEPES | Nyitott |
| 3.2 | Csendes hibák modifier/side mentésnél | KÖZEPES | Nyitott |

## Javított problémák részletei

### 1.2 Capacity Slot Race Condition (KRITIKUS → ✅ Javítva)
Új `update_capacity_slot` RPC funkció `FOR UPDATE` row lock-kal, azonos minta mint az `update_daily_portions`.

### 2.4 Modifier/Side Ár Validáció (KÖZEPES → ✅ Javítva)  
A submit-order edge function most már lekéri a modifier és side árakat az adatbázisból ahelyett hogy a kliens által küldött árakat használná.

### 4.1 Elfogyott Tételek UI (KÖZEPES → ✅ Javítva)
A DailyItemSelector checkboxok, "Mind" gomb és a teljes kártya letiltva/szürkítve ha `remaining_portions <= 0`.

## Még nyitott problémák

### 1.1 + 1.3 Tranzakció és rollback (MAGAS)
A portion decrement, capacity update és order insert nem atomi. Megoldás: egyetlen DB funkció ami mindent kezel.

### 2.1 ASAP rendelések (KÖZEPES)
Az ASAP rendelések (pickup_time = NULL) bypass-olják a `validate_order_date` trigger-t. Megoldás: ellenőrzés a trigger-ben `created_at` alapján.

### 5.2 Cutoff Time (KÖZEPES)
Nincs mechanizmus arra, hogy pl. 14:00 után ne lehessen aznapi menüre rendelni. Megoldás: `cutoff_time` mező vagy globális setting.

### 3.1 Státusz Workflow (KÖZEPES)  
Gyors-akció gombok már implementálva vannak az ActiveOrderCard-ban. Billentyűparancsok és batch státusz-módosítás még nyitott.
