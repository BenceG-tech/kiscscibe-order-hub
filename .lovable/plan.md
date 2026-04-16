

# Mai változtatások összefoglalója + Admin kézikönyv generálása

## Mai (ápr. 16.) változtatások

1. **Térkép szekció szöveg** — „Könnyű megközelítés és ingyenes parkolás." szövegre cserélve
2. **GYIK szerkesztő** — Új `/admin/faq` oldal: kérdések hozzáadása, törlése, átrendezése, ami azonnal frissül a főoldalon (SEO JSON-LD-vel)
3. **„Főzelék feltét" kategória** — Új étel-kategória a mesterkönyvtárban, lime színnel a heti nézetben
4. **Duplikáció-megelőzés** — Meglévő duplikált ételek összeolvasztása + figyelmeztetés ha azonos nevű ételt próbálsz menteni
5. **Rugalmas másolás** — 8 hetes visszatekintés, teljes hét vagy egyedi nap másolása bármely célnapra
6. **Nap ürítése** — Egy kattintással törölhető egy adott nap összes tétele (megerősítéssel)

## Admin Kezelői Kézikönyv (PDF)

Egy letölthető PDF dokumentumot generálok magyar nyelven, közérthető stílusban, az alábbi felépítéssel:

### Tartalomjegyzék

1. **Bevezetés** — Hogyan lépj be az admin felületre (rejtett belépés), kijelentkezés
2. **Irányítópult** — Napi statisztikák, aktív rendelések, kapacitás, időjárás, fizetési emlékeztetők, hirdetmény szerkesztő
3. **Rendelések kezelése** — Státuszok (Új → Készül → Kész → Teljesítve), szűrés, részletek, automatikus e-mailek
4. **Étlap kezelés (Mesterkönyvtár)** — Ételek hozzáadása/szerkesztése, kategóriák, képek, allergének, keresés, duplikáció-védelem
5. **Napi ajánlat kezelése** — Heti nézet, étel hozzáadása naphoz, menü-rész jelölés (Leves/Főétel), ár beállítás, másolás (hét/nap), nap ürítése, elfogyott jelölés
6. **Kapacitás** — Napi adagszám beállítás, tiltott napok
7. **Excel Import** — Tömeges ételfeltöltés
8. **Hírlevél** — Heti menü kiküldése
9. **Kép generátor** — Facebook/Instagram posztok és sztorik
10. **Becslés** — Alapanyag-szükséglet előrejelzés
11. **Galéria** — Étel- és étterem fotók kezelése
12. **GYIK szerkesztő** — Kérdések hozzáadása, törlése, átrendezése
13. **Rólunk oldal** — Tartalom szerkesztése
14. **Jogi oldalak** — Impresszum, Adatvédelem, ÁSZF, Sütik
15. **Statisztika** — Bevétel, rendelések, menü teljesítmény, vásárlók
16. **Kuponok** — Kedvezmények létrehozása és kezelése
17. **Partnerek** — Beszállítók nyilvántartása
18. **Számlák** — Bizonylatok, OCR feltöltés, ismétlődő számlák

### Technikai részletek
- Python script `reportlab`-bal generálja a PDF-et
- Magyar nyelv, egyszerű fogalmazás, képernyőkép-hivatkozások nélkül
- Kimenet: `/mnt/documents/Kiscsibe_Admin_Kezikonyv.pdf`

