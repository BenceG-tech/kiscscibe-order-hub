
# Terv — Számla fájlfeltöltés után automatikus adatkinyerés képből és digitális PDF-ből

## Mi a gond most?

Jelenleg a számla csatolásnál a fájl feltöltése megtörténik, de az adatkinyerés nem indul el automatikusan.

A jelenlegi működés alapján:

- a **fotó készítése** és a **képfájl feltöltése** technikailag támogatott,
- az AI kitöltés csak akkor jelenik meg, ha a csatolt fájl képként felismerhető,
- a **PDF / digitális számla felismerés nincs rendesen implementálva**,
- feltöltés után nincs elég egyértelmű állapotjelzés arról, hogy:
  - feltöltés folyamatban,
  - adatkinyerés indul,
  - adatkinyerés kész,
  - mit töltött ki az AI,
  - mit hagyott üresen bizonytalanság miatt.

Ezt javítjuk.

---

## Új cél

A számlafeltöltés úgy működjön, ahogy egy admin várná:

```text
Fájl kiválasztása / Fotó készítése
→ fájl feltöltése
→ AI adatkinyerés automatikusan elindul
→ látható feldolgozási állapot
→ AI csak a biztos mezőket tölti ki
→ bizonytalan mezők üresen maradnak
→ admin manuálisan ellenőrzi és menti
```

---

## 1. Automatikus AI feldolgozás feltöltés után

A `Fájl kiválasztása` vagy `Fotó készítése` után ne kelljen külön keresni az AI gombot.

Új működés:

1. Admin kiválaszt egy fájlt.
2. A rendszer feltölti az `invoices` bucketbe.
3. Sikeres feltöltés után automatikusan elindítja az adatkinyerést az első feldolgozható fájlra.
4. Közben egy jól látható státusz jelenik meg.

Példa státusz:

```text
1. Fájl feltöltése...
2. Számla adatainak felismerése...
3. AI ellenőrzés kész — kérlek nézd át mentés előtt.
```

A manuális `AI kitöltés újra` gomb megmarad, ha az admin újra akarja próbálni.

---

## 2. Képfájlok támogatása

Támogatott képfájlok:

```text
.jpg
.jpeg
.png
.webp
.heic / heif, ha a böngésző és eszköz támogatja
```

Képnél a rendszer ugyanúgy dolgozik, mint a fotónál:

- feltöltött kép URL-je átmegy az edge functionbe,
- Lovable AI képként elemzi,
- strukturált adatokat ad vissza.

Képnél ez működjön akkor is, ha nem telefonos kamera készült, hanem például:

- letöltött számlakép,
- emailből mentett kép,
- beszállítótól kapott JPG/PNG.

---

## 3. Digitális PDF számla felismerése

A PDF-eknél kétféle eset van, ezért kétlépcsős megoldást építünk.

### A) Digitális / szöveges PDF

Ez a leggyakoribb online számla.

Példa:

- Számlázz.hu PDF
- Billingo PDF
- NAV Online Számla PDF
- emailben kapott beszállítói PDF

Új működés:

1. A frontend beolvassa a PDF szövegét.
2. A kinyert szöveg megy az `extract-invoice-data` edge functionbe.
3. Az edge function ugyanazzal az AI adatkinyerő logikával feldolgozza.
4. A mezők kitöltődnek, ha elég biztosak.

Ehhez valószínűleg beépítünk egy PDF-olvasó könyvtárat:

```text
pdfjs-dist
```

### B) Szkennelt / képes PDF

Ha a PDF-ben nincs kinyerhető szöveg, akkor:

1. a rendszer megpróbálja az első oldalt képpé renderelni,
2. azt elküldi képalapú AI felismerésre,
3. ha így sem biztos, akkor nem találgat, hanem figyelmeztet.

Üzenet például:

```text
Ez a PDF valószínűleg szkennelt kép. Megpróbáltam képként felismerni, de néhány adat bizonytalan maradt. Kérlek ellenőrizd vagy töltsd ki kézzel.
```

---

## 4. Edge function bővítése: kép és szöveg mód

A jelenlegi edge function csak ezt várja:

```text
image_url
```

Bővítem, hogy több bemenetet kezeljen:

```text
image_url
document_text
file_name
file_type
```

### Új működés az edge functionben

```text
Ha image_url van:
  képalapú számlafelismerés

Ha document_text van:
  digitális PDF szöveges számlafelismerés

Ha mindkettő van:
  először szöveg, majd ha kevés adat jött ki, kép fallback
```

A prompt is módosul:

- magyar számla / nyugta adatok felismerése,
- digitális számla szövegből is,
- csak biztos adatokat adjon vissza,
- bizonytalan adatot hagyjon üresen,
- minden mezőhöz opcionális biztossági jelzés.

---

## 5. Nem találgatunk: bizonytalan mezők maradjanak üresek

A mostani AI hajlamos lehet „best effort” módon tippelni. Ezt megváltoztatjuk.

Új szabály:

```text
Ha egy mező nem egyértelmű, ne töltse ki.
```

Példák:

- ha nem biztos a fizetési határidőben → `due_date` üres,
- ha nem biztos az adószámban → `partner_tax_id` üres,
- ha több összeg is van és nem egyértelmű a végösszeg → `gross_amount` üres,
- ha a számlaszám nem biztos → `invoice_number` üres.

Az AI összefoglalóban látszódjon:

```text
Kitöltve: Partner, Számlaszám, Bruttó összeg
Kézi ellenőrzés kell: Fizetési határidő, Adószám
```

---

## 6. Jobb felhasználói visszajelzés a feltöltőben

A csatolt fájlok résznél legyen egyértelmű folyamatjelzés.

### Feltöltés közben

```text
Fájl feltöltése...
```

### AI feldolgozás közben

```text
Adatkinyerés folyamatban...
Ez eltarthat pár másodpercig.
```

### Siker esetén

```text
AI felismerés kész.
6 mezőt kitöltöttem, 2 mező kézi ellenőrzést igényel.
```

### Részleges siker esetén

```text
Részleges felismerés.
A bizonytalan adatokat üresen hagytam.
```

### Hiba esetén

```text
Nem sikerült adatot kinyerni ebből a fájlból.
Próbálj jobb minőségű képet, vagy töltsd ki kézzel.
```

---

## 7. AI összefoglaló panel javítása

A mostani egyszerű AI panelt bővítjük.

Új panel:

```text
AI felismerés eredménye

Állapot: Kész / Részleges / Sikertelen
Forrás: PDF szöveg / Kép / Szkennelt PDF képként
Biztosság: magas / közepes / alacsony

Kitöltött mezők:
✓ Partner neve
✓ Számla száma
✓ Kiállítás dátuma
✓ Bruttó összeg

Kézi kitöltés javasolt:
! Fizetési határidő
! Adószám
! Tételsorok
```

Ez sokkal érthetőbb lesz, mint az, hogy „Fájl 1” megjelenik, de semmi nem történik.

---

## 8. Fájl lista használhatóbbá tétele

A csatolt fájlok listájában ne csak „Fájl 1” legyen.

Legyen látható:

```text
szamla-metro-2026.pdf
PDF · feltöltve · AI feldolgozva

vagy

IMG_1234.jpg
Kép · feltöltve · AI feldolgozás kész
```

Ehhez a feltöltött fájlokról eltárolunk ideiglenes UI metaadatot:

- eredeti fájlnév,
- fájltípus,
- feldolgozás állapota,
- AI eredmény állapota.

A számlába továbbra is a `file_urls` kerül mentésre, tehát nem kell nagy adatbázis-átalakítás első körben.

---

## 9. PDF / kép elfogadási szöveg javítása

A feltöltő alatt a mostani szöveg félrevezető, mert azt sugallja, hogy csak fotón működik.

Új szöveg:

```text
Tölthetsz fel fotót, képfájlt vagy digitális PDF számlát is.
Az AI automatikusan megpróbálja kinyerni az adatokat.
A bizonytalan mezőket üresen hagyja, ezeket kézzel tudod kitölteni.
```

Fotó tipp külön:

```text
Fotónál: jó fényben, felülről, teljes számla látszódjon.
```

---

## 10. Tételsorok kezelése PDF-ből is

Ha az AI felismeri a tételsorokat PDF-ből vagy képből, akkor ugyanúgy bekerülnek a szerkeszthető tételsor táblába:

```text
Liszt 10 kg
Tej 12 l
Tojás 30 db
```

Ha a tételsorok bizonytalanok, akkor nem töltjük be őket automatikusan, hanem az AI panel jelzi:

```text
Tételsorok nem voltak elég biztosan felismerhetők.
```

---

## 11. Changelog és kézikönyv frissítés

Az admin kézikönyv pénzügyi részébe bekerül:

- fotózott számla felismerése,
- feltöltött képfájl felismerése,
- digitális PDF számla felismerése,
- mikor marad üresen egy mező,
- mit jelent a részleges AI felismerés.

A „Mi változott?” részbe új bejegyzés:

```text
ÚJ — PDF és képfájl alapú számlafelismerés
A számlák feltöltése után automatikusan elindul az AI adatkinyerés. Digitális PDF-ekből és képekből is próbál adatot kinyerni, a bizonytalan mezőket pedig üresen hagyja.
```

---

## Érintett fájlok

```text
src/components/admin/InvoiceFileUpload.tsx
src/components/admin/InvoiceFormDialog.tsx
supabase/functions/extract-invoice-data/index.ts
src/data/adminHelpContent.ts
src/data/adminChangelog.ts
package.json
package-lock.json
```

Lehetséges új segédfájl:

```text
src/lib/pdfInvoiceExtract.ts
```

---

## Megvalósítási sorrend

1. **Feltöltő UI javítása**
   - fájlnév, típus, feldolgozási állapot,
   - automatikus AI indítás feltöltés után,
   - manuális „AI újrapróbálás” gomb.

2. **PDF szövegkinyerés**
   - `pdfjs-dist` beépítése,
   - digitális PDF szövegének kinyerése,
   - szkennelt PDF fallback képként.

3. **Edge function bővítés**
   - `image_url` mellett `document_text` támogatás,
   - új prompt: bizonytalan mezők maradjanak üresek,
   - strukturáltabb válasz: kitöltött / bizonytalan mezők.

4. **InvoiceFormDialog kitöltési logika**
   - csak a biztos mezők kerüljenek be,
   - ne írja felül a már kézzel kitöltött mezőt,
   - AI összefoglaló panel bővítése.

5. **Tételsorok és státuszok**
   - biztos tételsorok automatikus betöltése,
   - bizonytalan tételeknél kézi ellenőrzési jelzés.

6. **Kézikönyv + changelog**
   - pénzügyi AI felismerés leírása,
   - PDF támogatás dokumentálása,
   - új „Mi változott?” bejegyzés.
