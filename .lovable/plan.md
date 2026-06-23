## Probléma

1. **Az értesítő sáv elcsúszik mobilon** — az `AdminUpdatesBanner` egy sorba próbálja zsúfolni a címet, dátumot, "1/N" számlálót, két nyilat, "Megtekintve" gombot és X-et. 402px-es kijelzőn ez kifut, a gombok átfednek a szöveggel.

2. **Nem található a rendelésellenőrző** — a `SystemHealthCheck` jelenleg csak az **Irányítópult** oldalon, a Riasztások alatt egy kártyaként jelenik meg, cím vagy kiemelés nélkül. A felhasználó a Rendelések oldalon kereste, és ott egyáltalán nincs.

## Javaslat

### 1) `AdminUpdatesBanner` mobil layout javítás
- Két sorra bontás mobilon: felül a badge + cím + dátum, alatta a leírás, és **külön alsó akciósor** a navigációval ("‹ 1/3 ›") és a gombokkal ("Megtekintve", X).
- Desktopon (sm+) marad az egysoros elrendezés, de `flex-wrap`-pel, hogy ne csússzon el.
- A "Megtekintve" gomb mobilon csak ikon (✓), tooltippel; desktopon szöveges.

### 2) Rendszerellenőrző láthatóvá tétele
- **Irányítópult**: a `SystemHealthCheck` kapjon egy saját szekciócímet ("Rendszerellenőrzés" + InfoTip), és kerüljön közvetlenül a Gyors műveletek fölé, vastag keretes kiemelt kártyában — így nem vész el a Riasztások és statisztika között.
- **Rendelések kezelése oldal**: a fejlécbe (a `OrdersManagement` tetejére, a tabs mellé) kerüljön egy **"Rendszerellenőrzés"** gomb (Stethoscope ikonnal), amely megnyit egy Dialógust, és ott futtatja ugyanazt a `SystemHealthCheck`-et. Így a rendelésekkel dolgozva is egy kattintással elérhető.
- A `SystemHealthCheck` komponens kapjon opcionális `compact` propot, hogy dialógusban is jól mutasson.

## Érintett fájlok

- `src/components/admin/AdminUpdatesBanner.tsx` — mobil reszponzív átszervezés
- `src/components/admin/SystemHealthCheck.tsx` — opcionális `compact` prop, cím
- `src/pages/admin/Dashboard.tsx` — szekciócím + áthelyezés
- `src/pages/admin/OrdersManagement.tsx` — fejléc gomb + Dialog wrapper
- `src/data/adminChangelog.ts` — új bejegyzés a javításokról

## Nincs benne

- Backend / RLS / edge function változtatás (a `system-health-check` függvény marad ahogy van).
- Az értesítő tartalmának vagy logikájának módosítása (csak a layout javul).
