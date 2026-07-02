## Cél
Az admin **Rendelések** listán az átvétel időpontja legyen a kártya legfeltűnőbb eleme, egyértelműen elkülönítve a rendelés leadási időpontjától.

## Módosítás egy helyen: `src/pages/admin/OrdersManagement.tsx` (OrderCard komponens)

**1. Új, kiemelt „Átvétel" blokk a kártya tetején (az essence-bar alatt)**
- Nagy, sárga/primary háttérrel kiemelt sáv, órával és címkével.
- Formátum:
  - **MA 12:30** — ha az átvétel dátuma a mai nap (nagy betűvel, „MA" chip)
  - **HOLNAP 11:00** — ha holnap
  - **júl. 3. (péntek) 11:00** — egyéb napokra
  - **Mielőbb (ASAP)** — ha `pickup_time` üres
- Alatta kis szürke szöveg: `„X perc múlva"` / `„X óra múlva"` / `„X perce elmúlt"` (relatív, csak ha a mai napra vagy közelre esik).
- Új rendelésnél (`status='new'`) pulzáló effekt, ha az átvétel < 30 perc múlva van (hogy azonnal szemet szúrjon).

**2. A leadás időpontja legyen egyértelműen felcímkézve**
- A jelenlegi `Calendar` ikon melletti sor mostantól: **„Leadva: 2026. 07. 02. 11:47"** (a „Leadva:" prefix kerül elé).

**3. Duplikáció megszüntetése az essence-barból**
- A kis órás pickup chip (line 645-650) kikerül, hogy ne legyen kétszer.

**4. Fizetési mód címke pontosítás**
- Amíg itt vagyok: `payment_method === 'pos'` → „Bankkártya", `'card_online'` → „Online kártya", `'cash'` → „Készpénz" (a mostani `'cash'` vs „Kártya" bináris feltétel nem tesz különbséget).

## Amit NEM módosítok
- Nem nyúlok a részletnézethez (1092-es sor környéke már így is jól címkézett).
- Nincs adatbázis-, üzleti logika-, vagy backend-változás.
- Kanban/staff nézet nem érintett — csak az admin rendelések lista.
- A színsémát a meglévő brand tokenekkel oldom meg (nincs hardcoded szín).

## Technikai részletek (nem-technikai olvasó ugorjon)
- Egy segéd `formatPickupBadge(iso: string | null)` a fájlon belül: visszaadja `{ label, sublabel, isUrgent }`-et.
- Új wrapper `<div>` az essence-bar és a régi header között, `bg-primary/15 border border-primary/40 rounded-lg px-3 py-2` osztályokkal.
- Sürgős esetben (< 30 perc + new) `animate-pulse` és `bg-primary/25`.

## Kérdés
Jó a fenti kiemelés, vagy inkább **nagy** sárga sáv legyen a kártya tetején az essence-bar HELYETT (még feltűnőbb, de az essence-info lentebb csúszik)?
