## Terv

### 1. Mobil alsó menü sáv minden aloldalon

Jelenleg a `MobileBottomNav` csak a főoldalon (`Index.tsx`) van betöltve. Hozzáadom az összes nyilvános aloldalhoz, hogy mobilon mindig elérhető legyen:

- `src/pages/Etlap.tsx`
- `src/pages/Gallery.tsx`
- `src/pages/About.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/OrderConfirmation.tsx`
- `src/pages/Menu.tsx`
- `src/pages/legal/*` (Impresszum, PrivacyPolicy, TermsAndConditions, CookiePolicy)
- `src/pages/NotFound.tsx`

Mindenhol a `</main>` és `<Footer />` után beillesztem a `<MobileBottomNav />` komponenst + egy `h-20 md:h-0` helykitöltőt, hogy a sáv ne takarja az utolsó tartalmat. Admin/staff oldalakra NEM kerül.

### 2. Étel-képek megjelenése (Étlap oldal)

A probléma: az `src/pages/Etlap.tsx` (399. sor) és az `UnifiedDailySection.tsx` képek `aspect-video` (16:9) + `object-cover` beállítással jelennek meg, ami mobilon erősen rávág a képre (a tetejét és alját levágja, mert az AI-generált képek 1:1-ben készülnek).

**Javítás:**
- Az Étlap oldali "További napi ételek" kártyák képkereténél `aspect-video` → `aspect-[4/3]` (kevésbé agresszív vágás), és mobilon teljes kép láthatóságához `object-cover` marad, de az arány közelebb áll az eredeti AI képhez.
- Az `UnifiedDailySection.tsx`-ben a kis 28×28 / 36×36 négyzetes kép már jó (1:1), nem nyúlok hozzá.
- A `DailyMenuPanel.tsx` fő képét (16:9 leves+főétel kártya) is felülvizsgálom — ha mobilon szintén nagyon vág, ott is 4:3-ra állítom.

### Technikai részletek

- Új `MobileBottomNav` importok + JSX a felsorolt page fájlokban.
- Tailwind class módosítás: `aspect-video` → `aspect-[4/3]` az érintett kép-konténereken.
- Nincs backend/logikai változás.
