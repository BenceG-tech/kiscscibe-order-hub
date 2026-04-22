
# Terv — Pénzügyi modul átnézése, egyszerűsítése és számla/partner workflow javítása

## Gyors megállapítások

A jelenlegi pénzügyi rész már sok mindent tud, de pár ponton félreérthető:

1. **A „Bence Gatai” számlák nem kézzel felvitt beszállítói számlák**, hanem automatikus rendelés-bizonylatok (`order_receipt`), amelyek completed rendelésből jöttek létre.
2. Ezek a számlák jelenleg **csak megtekinthetők**, ezért nincs rajtuk törlés gomb a számla szerkesztő ablakban.
3. A rendszerben jelenleg ezek látszanak Bence néven:
   - 3 automatikus rendelés-bizonylat
   - ebből 2 fizetettként, 1 sztornóként szerepel
4. A fényképes számlafeltöltés működése:
   - fotó vagy fájl feltöltés az `invoices` privát storage bucketbe,
   - képnél megjelenik az **AI kitöltés** gomb,
   - az AI kinyeri: partner, adószám, számlaszám, dátumok, bruttó összeg, ÁFA, kategória,
   - a kitöltött mezők sárgás jelölést kapnak,
   - jelenleg viszont az AI által kinyert tételsorok **nem kerülnek automatikusan a tételek táblába**, ezt érdemes javítani.
5. A számlák és partnerek össze vannak kötve, de nem elég erősen:
   - partner kiválasztható számlánál,
   - partner adatlapján látszanak kapcsolt számlák,
   - viszont nincs elég gyors művelet: partnerhez kapcsolás, duplikált partner javítás, teszt számla kizárás, gyors státusz kezelés.
6. Fontos technikai észrevétel: az audit log táblák és függvények megvannak, de a jelenlegi adatbázis állapot szerint **nincsenek bekötve audit triggerek**. Ez azt jelenti, hogy a „ki mikor mit módosított” pénzügyi naplózást külön javítani kell.

---

## 1. Teszt számlák és teszt rendelések kezelése

Nem simán vakon törölném az automatikus rendelés-bizonylatokat, mert ezek rendelésből keletkeztek. Biztonságosabb és átláthatóbb megoldás:

### Új működés

A számláknál legyen egy külön jelölés:

```text
Teszt / belső próba
```

A tesztként jelölt számla:

- alapból nem számít bele az összesítőkbe,
- nem számít bele ÁFA exportba,
- nem számít bele bevétel/költség eredménybe,
- külön szűrővel visszanézhető,
- audit naplóban látszik, ki jelölte tesztnek.

### Bence Gatai rekordok

A mostani Bence Gatai automatikus bizonylatokra első körben ezt alkalmaznám:

```text
Tesztként jelölés + pénzügyi összesítőkből kizárás
```

Ha később valóban végleges törlés kell, azt csak owner/főadmin műveletként érdemes engedni.

### UI

Számla listán:

```text
Bence Gatai
Rendelés-bizonylat · Teszt
Nem számít bele a pénzügyi összesítőkbe
```

Szűrő:

```text
[ ] Teszt rekordok mutatása
```

---

## 2. Számlák oldal egyszerűsítése

A jelenlegi számla lista működik, de gyorsabban értelmezhetővé tenném.

### Új felső áttekintés

A számlák tetejére kerülne egy érthetőbb pénzügyi blokk:

```text
Ez a hónap
- Bejövő költség
- Bevételek
- Fizetésre vár
- Lejárt
- Eredmény
```

Plusz gyors chipek:

```text
Ma fizetendő
Lejárt
Fizetésre vár
Nincs partnerhez kötve
AI-val kitöltött
Teszt rekordok
```

### Lista kártyák javítása

Minden számlán jobban látszódjon:

- típus: bejövő / kimenő / rendelés-bizonylat,
- partnerhez van-e kötve,
- van-e csatolt fájl,
- AI-val lett-e kitöltve,
- fizetési határidő állapot,
- teszt-e,
- ki hozta létre / mikor módosult.

Példa:

```text
Metro Kft.                         -45 230 Ft
Bejövő számla · Alapanyag · Partnerhez kötve
Számlaszám: M-2026/0012 · Határidő: ápr. 25.
Fájl: 1 kép · AI kitöltve · iroda@... módosította
```

---

## 3. Számla műveletek a listából

A listaelemeken legyen 3 pontos gyorsmenü, hogy ne kelljen mindent megnyitni.

### Új gyors műveletek

```text
Megnyitás / szerkesztés
Fizetve jelölés
Fizetésre vár
Partnerhez kapcsolás
Tesztként jelölés
Duplikálás
Csatolmány megnyitása
Törlés / sztornózás
```

### Törlés szabály

- kézzel felvitt számlát admin törölhet,
- rendelésből automatikusan létrejött bizonylatnál inkább:
  - sztornózás,
  - tesztként jelölés,
  - pénzügyből kizárás,
- owner/főadmin kapna külön „végleges törlés” opciót, ha tényleg szükséges.

---

## 4. Partner-számla kapcsolat erősítése

Most van partner választó, de a rendszer még engedi, hogy ugyanaz a beszállító szövegként szerepeljen partnerkapcsolat nélkül.

### Javítások

1. Számla mentéskor, ha van egyező partner név/adószám alapján:
   - ajánlja fel az összekötést.
2. Ha nincs partner:
   - egy gombbal lehessen partnerként menteni.
3. Partner adatlapján:
   - kapcsolt számlák,
   - összes költés,
   - nyitott tartozás,
   - utolsó számla dátuma,
   - átlagos fizetési határidő.
4. Partner listán:
   - „van nyitott számla” jelzés,
   - „lejárt tartozás” jelzés,
   - összes számlaérték.

### Példa

```text
Tóth és Tóth Sütő Kft.
3 számla · 42 120 Ft összesen · 1 fizetésre vár
```

---

## 5. AI számlafelismerés javítása

A jelenlegi fényképes feltöltés jó alap, de lehet sokkal felhasználóbarátabb.

### Jelenlegi folyamat

```text
Fotó készítése / fájl kiválasztása
→ feltöltés privát storage-ba
→ AI kitöltés
→ mezők automatikus kitöltése
→ admin ellenőrzi
→ mentés
```

### Javítandó pontok

#### 1. Tételsorok automatikus betöltése

Az edge function már kér tételsorokat, de a frontend jelenleg nem tölti be őket a számla tétel táblába.

Ezt javítanám:

```text
AI felismeri:
- Liszt 10 kg
- Tej 12 l
- Tojás 30 db

A számla tételek automatikusan megjelennek szerkeszthető sorokként.
```

#### 2. AI ellenőrző panel

AI kitöltés után ne csak mezők változzanak, hanem legyen egy összefoglaló:

```text
AI felismerés eredménye
Biztosság: közepes
Partner: Tóth és Tóth Sütő Kft.
Összeg: 6 543 Ft
ÁFA: 27%
Tételek: 4 db

Kérlek ellenőrizd mentés előtt.
```

#### 3. PDF támogatás tisztázása

Most a gomb főleg képre épül. Ha PDF-et töltenek fel, azt külön kell kezelni.

Javaslat:

- képnél: jelenlegi AI kép OCR,
- PDF-nél: vagy első oldal feldolgozása, vagy külön üzenet:
  - „PDF felismerés következő fejlesztésben”
- UI-ban egyértelmű jelzés:
  - „AI kitöltés jelenleg fotózott számláknál működik legjobban.”

#### 4. Jobb hibaüzenetek

Most általános hiba van. Legyenek konkrétabbak:

```text
Nem találtam számla képet.
A kép túl homályos.
Nem olvasható az összeg.
AI kredit elfogyott.
Próbáld újra közelebbi fotóval.
```

#### 5. Mobil fotózás útmutató

A fotó gomb fölé/tooltipbe:

```text
Tipp: fotózd felülről, jó fényben, teljes számla látszódjon.
```

---

## 6. Tooltipek és segítség minden fontos pénzügyi ponton

A felhasználóbarátság miatt a pénzügyi modulban egységes tooltipeket tennék:

### Számlák oldal

- Bejövő számla
- Kimenő számla
- Rendelés-bizonylat
- Fizetésre vár
- Lejárt
- Sztornó
- Teszt rekord
- ÁFA export
- Havi export
- Negyedéves export

### Számla szerkesztő

- Partner kiválasztása
- Partner kézi megadás
- Adószám
- Számlaszám
- Kiállítás dátuma
- Fizetési határidő
- Bruttó összeg
- ÁFA kulcs
- Speciális ÁFA
- AI kitöltés
- Csatolt fájlok
- Fizetve mentés

### Partnerek

- Aktív / archivált partner
- Fizetési feltétel
- Kapcsolt számlák
- Partner archiválás vs törlés

---

## 7. Pénzügyi naplózás javítása

Mivel az audit log struktúra már megvan, de a triggerek nincsenek aktívan bekötve, ezt javítani kell.

### Bekötendő táblák

```text
invoices
invoice_items
recurring_invoices
partners
documents
document_activity
daily_offers
daily_offer_items
menu_items
settings
```

Pénzügyi fókuszban első körben:

```text
invoices
invoice_items
recurring_invoices
partners
```

### Mit lássunk?

```text
Ma 10:42 — iroda@kiscsibeetterem.hu fizetve jelölte: Metro Kft. / M-2026-0012
Tegnap 15:20 — info@kiscsibeetterem.hu új partnert hozott létre: Globál Pack Kft.
Tegnap 13:05 — gataibence@gmail.com tesztként jelölte: Bence Gatai / Y43630
```

---

## 8. Gyors fejlesztések, amik sokat javítanak

### Rövid távon beépíthető funkciók

1. **Tesztként jelölés**
   - Bence tesztek és későbbi próbaadatok kulturált kezelése.

2. **Partner nélküli számlák szűrő**
   - gyorsan látszik, mit kell rendbe tenni.

3. **AI-val kitöltött számlák jelzése**
   - könnyebb ellenőrizni.

4. **AI tételsorok automatikus betöltése**
   - kevesebb kézi munka.

5. **Lista 3 pontos gyorsmenü**
   - státusz, partnerkapcsolás, teszt jelölés.

6. **Fizetési határidő alapján gyors szűrők**
   - „ma esedékes”, „lejárt”, „7 napon belül”.

7. **Partner adatlap pénzügyi összefoglaló**
   - mennyit költöttünk nála, van-e tartozás.

8. **Changelog + kézikönyv frissítés**
   - a pénzügyi modul használata legyen leírva érthetően.

---

## 9. Érintett fájlok

```text
src/pages/admin/Invoices.tsx
src/components/admin/InvoiceFilters.tsx
src/components/admin/InvoiceListItem.tsx
src/components/admin/InvoiceFormDialog.tsx
src/components/admin/InvoiceFileUpload.tsx
src/components/admin/InvoiceSummaryCards.tsx
src/components/admin/PartnerSelector.tsx
src/pages/admin/Partners.tsx
src/components/admin/PartnerDetailDialog.tsx
src/hooks/useInvoices.ts
src/hooks/usePartners.ts
src/data/adminHelpContent.ts
src/data/adminChangelog.ts
supabase/functions/extract-invoice-data/index.ts
supabase/migrations/...
```

---

## 10. Adatbázis módosítások

### Számlákhoz új mezők

```text
invoices.is_test boolean default false
invoices.exclude_from_reports boolean default false
invoices.ai_extracted boolean default false
invoices.ai_confidence text nullable
invoices.ai_reviewed_at timestamp nullable
invoices.ai_reviewed_by uuid nullable
```

### Partner kapcsolat javítás

Meglévő `partner_id` mezőt használjuk tovább, nem kell új partner kapcsolat tábla.

### Audit triggerek

A meglévő `audit_log_trigger()` függvényt ténylegesen bekötjük a pénzügyi táblákra.

---

## 11. Megvalósítási sorrend

1. **Adatbázis**
   - `is_test`, `exclude_from_reports`, AI mezők hozzáadása számlákhoz.
   - audit triggerek bekötése pénzügyi táblákra.

2. **Bence teszt rekordok kezelése**
   - Bence Gatai automatikus bizonylatok tesztként jelölhetők legyenek.
   - Alapból ne számítsanak bele pénzügyi összesítőkbe, ha tesztek.

3. **Számla lista és szűrők**
   - teszt rekord szűrő,
   - partner nélküli szűrő,
   - lejárt / ma esedékes / 7 napon belül chipek,
   - 3 pontos gyorsmenü.

4. **Számla szerkesztő**
   - tooltipek bővítése,
   - tesztként jelölés kapcsoló,
   - partnerhez kapcsolás egyértelműsítése,
   - AI kitöltés ellenőrző panel.

5. **AI adatkinyerés**
   - tételsorok automatikus betöltése,
   - jobb hibaüzenetek,
   - PDF/fotó működés egyértelmű jelzése.

6. **Partner oldal**
   - pénzügyi összefoglaló partnerenként,
   - nyitott/leárt számlák jelzése,
   - partnerhez nem kötött számlák összekapcsolási lehetősége.

7. **Kézikönyv és changelog**
   - pénzügyi modul magyarázat,
   - AI számlafelismerés használati útmutató,
   - teszt számlák kezelése,
   - „Mi változott?” új bejegyzés.

