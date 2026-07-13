## Amit eddig bizonyítottan látok

- Az `orders` táblában az utolsó rendelés július 2-i; az elmúlt 14 napban nincs friss rendelés.
- Az `order_attempts` táblában sincs friss sikertelen leadási nyom.
- Az `abandoned_carts` üres, tehát a mostani tracking nem kapja el azokat az eseteket, amikor a felhasználó el sem jut a tényleges submit hívásig.
- A `submit-order` edge function logokban nincs friss hívás. Ez alapján a probléma nagy része nem a rendelés mentése közben, hanem még a kliensoldali checkout blokkolásnál történik.
- A múlt heti pénteki napi ajánlat publikálva volt, készlet volt, kapacitás-slot tábla üres, de ez önmagában nem akadály, mert a rendszer fallback slotokat használ.

## Legvalószínűbb gyökérokok

1. **Telefonszám-mező túl szigorú és félrevezető**
   - A mező előtt fixen látszik a `+36`, de ha valaki megszokásból `06...` vagy `+36...` formában írja/pasztázza be a számot, a validáció hibásnak minősítheti.
   - Ez tipikusan pont visszatérő, idősebb vagy telefonról rendelő vendégeknél fordulhat elő.

2. **Az email kötelező, és a böngésző natív validációja még a saját hibakezelés előtt megállíthatja a rendelést**
   - Ha valaki nem ad emailt, vagy hibás emailt ír, a form submit el sem indulhat.
   - Ilyenkor nincs edge function hívás, nincs `order_attempts`, nincs `abandoned_carts` submit nyom.

3. **A napi ajánlat/menü csak időpontra rendelhető, és az időpontlista túl szűk**
   - A napi menünél az ASAP le van tiltva.
   - Az UI csak 10:30–14:30 slotokat generál, miközben a backend 15:00-ig engedne.
   - Pénteken délután egy 30 perces előretekintő szűrő miatt könnyen eltűnhet minden időpont, miközben az étterem még nyitva van.

4. **A checkout tracking túl későn indul**
   - Csak 20 másodperces debounce után vagy sikeres React submiton ír trackinget.
   - Natív formvalidáció, hiányzó email, hibás telefon vagy időpontválasztás esetén sok sikertelen próbálkozás láthatatlan marad.

5. **A pénteki javítások valószínűleg nem védik a publikus/custom domaint, amíg nincs frissen publikálva**
   - A vásárlók a `kiscsibe-etterem.hu` / publikált domaint használják, nem a preview-t.
   - A korábbi stabilizáló módosítások csak akkor segítenek élesben, ha a friss verzió publikálva van.

## Javítási terv

### 1. Checkout blokkolók azonnali lazítása és pontosítása
- A checkout formon kikapcsolom a böngésző natív validációját (`noValidate`), hogy minden hiba a saját kódban fusson át és naplózható legyen.
- Az email mezőt opcionálissá teszem rendelésleadáshoz.
- Ha van email, validáljuk; ha nincs email, a rendelés akkor is leadható.
- A telefon normalizálást úgy javítom, hogy ezek mind elfogadottak legyenek:
  - `30 123 4567`
  - `06301234567`
  - `06 30 123 4567`
  - `+36301234567`
  - `36 30 123 4567`
- A hibaszövegeket vendégbarátabbá teszem, hogy ne csak tiltson, hanem megmondja pontosan mit kell javítani.

### 2. Minden sikertelen kattintás legyen látható az adminban
- Minden `Rendelés leadása` kattintásnál azonnal mentek egy `submit_attempt` sort az `abandoned_carts` táblába, még validáció előtt.
- Ha név/telefon/email/időpont miatt blokkol a checkout, `submit_failed` vagy `validation_blocked` állapottal frissítem a sort és beleteszem a konkrét okot.
- A tracking hook kap publikus anon-key fallbacket, hogy éles buildben se némuljon el, ha az env változó hiányzik.

### 3. Napi ajánlat / menü időpontlogika javítása
- A napi menüknél engedélyezek egy egyszerűbb “mielőbb” rendelési utat az aznapi menüre, ha Budapest szerint még rendelhető időben vagyunk.
- A scheduled slot lista 15:00-ig menjen, ne csak 14:30-ig.
- A frontend időellenőrzés Budapest időzónával dolgozzon, ne a felhasználó eszközének lokális időzónájára támaszkodjon.
- Ha nincs választható slot, ne zsákutca legyen: mutasson alternatívát vagy engedje a mielőbbi leadást, ahol üzletileg biztonságos.

### 4. Backend elfogadás rugalmasabbá tétele
- A `submit-order` edge functionben az emailt opcionálissá teszem.
- Email nélkül nem bukhat a rendelés; a rendelés bekerül, a vendég visszaigazolása pedig a rendelés-visszaigazoló oldalon történik.
- A backend is Budapest-idő szerint validálja az ASAP/napi rendeléseket, hogy ne legyen frontend/backend eltérés.
- A hibaválaszok maradjanak konkrétak, hogy az adminban pontosan látszódjon: telefon, email, időpont, készlet vagy egyéb gond volt.

### 5. Admin láthatóság megerősítése
- A “Sikertelen/Félbehagyott” rendeléseknél külön jelölöm:
  - validáció miatt blokkolt
  - tényleges submit hiba
  - timeout
  - félbehagyott checkout
- Az admin rendeléskezelő tetején legyen feltűnő figyelmeztetés, ha az elmúlt 24 órában volt leadási kísérlet, ami nem lett rendelés.

### 6. Audit riport frissítése
- Frissítem az audit dokumentációt a ténylegesen talált okokkal:
  - miért nem látszottak az érintett vendégek próbálkozásai,
  - milyen mezők/időpontok blokkolhatták őket,
  - mit javítottunk,
  - hogyan ellenőrizhető az adminban.

### 7. Ellenőrzés
- Böngészős próba több tipikus adattal:
  - email nélkül,
  - `06...` telefonszámmal,
  - `+36...` telefonszámmal,
  - napi menüvel,
  - pénteki/késői időpont-szituációval.
- Adatbázis ellenőrzés:
  - sikertelen validáció megjelenik-e `abandoned_carts` alatt,
  - sikeres rendelés bekerül-e `orders` alá,
  - admin látja-e azonnal.

## Fontos élesítési megjegyzés

A javítás után a publikus/custom domainre is publikálni kell, különben a vendégek továbbra is a régi checkout kódot használhatják.