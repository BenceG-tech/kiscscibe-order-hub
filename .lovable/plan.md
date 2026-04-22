

# Terv — Admin jogosultság, módosítási napló és kézikönyv jegyzetek

## Cél

Három dolgot építünk össze egy rendszerré:

1. **A két megadott email adminisztrátorként tudjon regisztrálni**
   - `info@kiscsibeetterem.hu`
   - `iroda@kiscsibeetterem.hu`

2. **A jelenlegi főadmin megmaradjon főadminnak**
   - `gataibence@gmail.com`
   - Ez külön „tulaj / főadmin” szint lesz, nem csak sima admin.

3. **Minden fontos admin módosítás visszakövethető legyen**
   - ki csinálta,
   - mikor,
   - melyik modulban,
   - mit módosított,
   - mi volt előtte és utána.

Plusz: az **admin kézikönyvbe kerül egy jegyzet / észrevétel rész**, ahova a tulaj vagy asszisztens használat közben le tudja írni, mit kellene javítani vagy hozzáadni.

---

## 1. Admin regisztráció engedélyezése a megadott emailekre

### Új jogosultsági logika

Nem a `profiles.role` mezőre építünk, mert az biztonságilag gyenge. A meglévő biztonságos `user_roles` rendszert használjuk tovább.

Létrejön egy új engedélyezési tábla:

```text
admin_email_allowlist
- email
- role: owner / admin / staff
- label: pl. Tulaj, Asszisztens, Fejlesztő
- is_active
- created_at
```

### Kezdő engedélyezett emailek

| Email | Szerep |
|---|---|
| `gataibence@gmail.com` | `owner` / főadmin |
| `info@kiscsibeetterem.hu` | `admin` |
| `iroda@kiscsibeetterem.hu` | `admin` |

### Hogyan működik majd?

Amikor valaki belép vagy regisztrál:

1. A rendszer megnézi az email címét.
2. Ha szerepel az engedélyezett admin email listában:
   - automatikusan megkapja a megfelelő szerepet a `user_roles` táblában,
   - admin felülethez hozzáfér.
3. Ha nem szerepel a listában:
   - nem lesz admin,
   - nem jut be az admin felületre.

### Auth oldal módosítás

A jelenlegi belépő oldal csak belépést mutat. Ezt kibővítem:

- „Belépés” mód
- „Admin regisztráció” mód
- Regisztrációnál egyértelmű szöveg:
  - csak előre engedélyezett email címmel lehet admin fiókot létrehozni,
  - más email nem kap admin hozzáférést.

---

## 2. Főadmin / owner szerep

### Új szerep

A meglévő szerepkörök mellé bekerül:

```text
owner
```

Ez a főadmin szint.

### Fontos szabály

Az `owner` is adminnak számít, tehát minden jelenlegi admin oldal továbbra is működik neki.

Technikailag:

```text
is_admin = owner vagy admin
```

### Mire lesz jó az owner?

A későbbi érzékenyebb dolgokat csak a főadmin kezelheti:

- engedélyezett admin emailek kezelése,
- audit napló export / részletes megtekintés,
- kézikönyv jegyzetek lezárása / státuszolása,
- esetleges későbbi jogosultságkezelés.

Első körben nem bonyolítjuk túl külön admin kezelőfelülettel, de a rendszer alapja meglesz hozzá.

---

## 3. Globális módosítási napló

### Új adatbázis tábla

Létrejön egy központi napló:

```text
admin_audit_log
- id
- created_at
- actor_user_id
- actor_email
- actor_name
- action: insert / update / delete
- module: documents / menu / daily_offer / invoices / partners / settings / etc.
- entity_table
- entity_id
- entity_label
- before_data
- after_data
- changed_fields
```

### Mit fog naplózni?

Első körben ezekre a fontos admin területekre kerül automatikus naplózás:

#### Dokumentumok
- dokumentum feltöltés
- új verzió feltöltés
- dokumentum törlés
- mappa módosítás
- címke módosítás
- csillagozás / átnevezés / áthelyezés

#### Étlap
- étel létrehozása
- étel módosítása
- ár módosítása
- allergén módosítása
- kép módosítása
- aktív / inaktív állapot változtatása
- fix tétel kapcsoló

#### Napi / heti ajánlat
- napi ajánlat létrehozása
- napi ajánlat módosítása
- napi ajánlat törlése
- tételek hozzáadása / törlése
- leves / főétel menürész jelölés
- elfogyott kapcsoló
- menü ár / adag módosítás

#### Számlázás
- bizonylat létrehozása
- bizonylat módosítása
- fizetési státusz módosítása
- határidő módosítása
- tételsor módosítása
- ismétlődő számla módosítása

#### Partnerek
- partner létrehozása
- partner módosítása
- partner archiválása / aktiválása
- fizetési feltételek módosítása

#### Egyéb admin tartalom
- galéria képek
- kuponok
- kapacitás
- hirdetmények / beállítások
- rólunk / GYIK / jogi tartalmak

### Miért adatbázis-szinten?

Nem csak gombnyomásnál naplózunk frontendből, hanem adatbázis triggerrel is.

Ez azért jobb, mert:

- nem marad ki módosítás akkor sem, ha más komponensből történik,
- számlák, partnerek, dokumentumok, menü elemek egységesen követhetők,
- később is visszanézhető lesz, hogy pontosan mi változott.

---

## 4. Új admin oldal: „Módosítási napló”

Létrejön egy új admin oldal:

```text
/admin/activity
```

A navigációba bekerül:

```text
Napló
```

### Oldal felépítése

Felül gyors szűrők:

- keresés
- modul szerint:
  - Dokumentumok
  - Étlap
  - Napi ajánlat
  - Számlák
  - Partnerek
  - Tartalom
- felhasználó szerint
- dátum szerint
- művelet szerint:
  - létrehozás
  - módosítás
  - törlés

### Lista nézet

Példa sorok:

```text
Ma 09:42 — iroda@kiscsibeetterem.hu módosította a Napi ajánlatot
Tegnap 14:10 — info@kiscsibeetterem.hu feltöltött egy dokumentumot
2026.04.18 11:03 — gataibence@gmail.com módosított egy partner adatlapot
```

### Részletező nézet

Egy naplóbejegyzésre kattintva látszik:

```text
Ki: iroda@kiscsibeetterem.hu
Mikor: 2026.04.22 09:42
Modul: Napi ajánlat
Művelet: módosítás
Érintett elem: 2026.04.23 napi menü

Változott mezők:
- price_huf: 2200 → 2400
- remaining_portions: 50 → 45
```

Nem cél, hogy túl technikai legyen, de a fontos változások érthetően látszódjanak.

---

## 5. Dokumentumtár naplózásának javítása

A dokumentumtárban már van külön `document_activity`, de ezt egységesítem a globális naplóval.

### Megmarad

A dokumentum részleteinél továbbra is látszik:

- feltöltő,
- feltöltés ideje,
- verziók.

### Bővül

Minden dokumentum művelet bekerül a globális `admin_audit_log` naplóba is.

Így nem két külön logika lesz, hanem:

- dokumentumon belül gyors előzmények,
- globális naplóban teljes admin aktivitás.

---

## 6. Kézikönyv jegyzet / észrevétel rész

Az admin kézikönyv főoldalára bekerül egy kiemelt kártya:

```text
Jegyzetek / észrevételek
Írd le, ha valami nem egyértelmű, hibás, vagy hiányzik.
```

### Új adatbázis tábla

```text
admin_notes
- id
- title
- body
- page_route
- context_label
- status: open / in_progress / done / rejected
- priority: low / normal / high
- created_by
- created_by_email
- created_by_name
- resolved_by
- resolved_at
- created_at
- updated_at
```

### Mire jó?

A tulaj vagy asszisztens használat közben tud írni például ilyet:

```text
Oldal: Napi ajánlat
Megjegyzés:
Nem egyértelmű, hogy a Kép és poszt fülön melyik gomb generálja csak a Facebook szöveget.
```

Vagy:

```text
Oldal: Számlák
Megjegyzés:
Jó lenne, ha külön jelölni lehetne a készpénzes beszállítói számlákat.
```

### Kézikönyvben megjelenés

A kézikönyv elején:

- „Új jegyzet” gomb
- „Nyitott jegyzetek” lista
- státusz badge:
  - Nyitott
  - Folyamatban
  - Kész
- aktuális oldal automatikus kitöltése:
  - ha a felhasználó épp a `/admin/daily-menu` oldalon van, a jegyzet automatikusan „Napi ajánlat” kontextust kap.

### Főadminnak hasznos extra

A főadmin később látja:

- ki írta,
- melyik oldalon,
- mikor,
- milyen státuszban van,
- mi lett javítva.

---

## 7. Kézikönyv bővítése az új funkciókkal

Az admin kézikönyvbe bekerül két új téma:

### „Módosítási napló”

Leírja:

- hol található,
- hogyan kell szűrni,
- mire jó,
- mit jelent az előtte / utána nézet.

### „Jegyzetek és észrevételek”

Leírja:

- mikor érdemes jegyzetet írni,
- hogyan kell megadni a problémát,
- hogyan látja ezt később a főadmin.

A „Mi változott?” részbe is bekerül új bejegyzésként:

```text
ÚJ — Admin módosítási napló
ÚJ — Kézikönyv jegyzetek
ÚJ — Engedélyezett admin regisztráció
```

---

## 8. Biztonsági szabályok

### Admin hozzáférés

- Csak az engedélyezett email listán szereplők kaphatnak admin role-t automatikusan.
- Role továbbra is a `user_roles` táblában lesz.
- Nem localStorage-ból, nem frontendből, nem `profiles.role` alapján döntünk.

### Audit napló

- Adminok olvashatják.
- Nem törölhető normál adminból.
- Append-only jellegű: a napló célja, hogy utólag visszakövethető maradjon.

### Jegyzetek

- Adminok létrehozhatnak jegyzetet.
- Adminok láthatják a jegyzeteket.
- Főadmin később külön kezelheti / lezárhatja őket.

---

## 9. Érintett fájlok és területek

### Adatbázis

Új / módosított elemek:

```text
admin_email_allowlist
admin_audit_log
admin_notes
owner role az app_role enumba
claim_admin_access / ensure_admin_access RPC
audit trigger function
audit triggerek a fontos admin táblákra
RLS policy-k
```

### Frontend

Érintett fő fájlok:

```text
src/contexts/AuthContext.tsx
src/pages/Auth.tsx
src/App.tsx
src/pages/admin/AdminLayout.tsx
src/components/admin/AdminHelpPanel.tsx
src/data/adminHelpContent.ts
src/data/adminChangelog.ts
```

Új fájlok:

```text
src/pages/admin/Activity.tsx
src/hooks/useAdminAuditLog.ts
src/hooks/useAdminNotes.ts
src/components/admin/activity/ActivityLogList.tsx
src/components/admin/activity/ActivityLogDetailDialog.tsx
src/components/admin/help/AdminNotesPanel.tsx
```

---

## Megvalósítási sorrend

1. **Jogosultsági alap**
   - `owner` role hozzáadása
   - admin email allowlist tábla
   - három email felvétele
   - automatikus role kiosztás belépés / regisztráció után

2. **Auth oldal**
   - admin regisztráció mód hozzáadása
   - belépés után role frissítés / ellenőrzés

3. **Audit adatbázis**
   - `admin_audit_log` tábla
   - audit trigger function
   - triggerek dokumentumokra, menüre, napi ajánlatra, számlákra, partnerekre és fő admin tartalmakra

4. **Módosítási napló oldal**
   - `/admin/activity`
   - lista, szűrők, részletező dialog
   - admin navigációba „Napló” menüpont

5. **Kézikönyv jegyzetek**
   - `admin_notes` tábla
   - kézikönyv elejére jegyzet blokk
   - új jegyzet dialog
   - nyitott jegyzetek listája

6. **Kézikönyv és changelog frissítés**
   - új kézikönyv témák
   - „Mi változott?” bejegyzések

