

Több külön feladat, nézzük meg pár fájlt először, aztán tervet adok.

Megnézem: AdminLayout (Dokumentumok visszahelyezés), ReviewsSection (publikus review-k forrása), CartDialog (törlés gomb), allergének tárolása a menu_items táblában, és van-e már bármi „kézikönyv" jellegű komponens.

Párhuzamosan olvasom be őket:
- src/components/sections/ReviewsSection.tsx
- src/components/CartDialog.tsx  
- src/pages/admin/AdminLayout.tsx (csak a dropdown rész)
- supabase types (allergens mező)

Nincs szükség kérdésre — a kérések egyértelműek. Csak a kézikönyv struktúrájáról adok pár kreatív javaslatot.

---

# Terv — 5 fejlesztés

## 1. Dokumentumok tab vissza a fő nav-ba (dropdown-on kívül)

`AdminLayout.tsx`-ben átmozgatom a **Dokumentumok** menüpontot a „Több" dropdown-ból a fő látható tabok közé (a Számlák után). Logikus, mert dokumentumokat gyakran kell megnyitni.

## 2. Főoldali review-k: csak 4-5 csillagos + automatikus, friss

A `ReviewsSection` jelenleg vagy fix tartalom, vagy DB-ből húzza. A megoldás:

- Megvizsgálom van-e már `reviews` tábla. Ha van → query: `rating >= 4 ORDER BY created_at DESC LIMIT 6`
- Ha nincs DB review (csak hardcoded), akkor most átállítom DB-alapra: új tábla `reviews` (id, name, rating, comment, created_at, is_approved) + RLS (publikus read csak `is_approved=true AND rating>=4`)
- Admin oldalon új minimál szekció: review-k jóváhagyása/elrejtése (a fő céloknak: Google Reviews API integráció későbbre)
- **Fontos**: a memóriában van „minden publikus review forced 5 stars" szabály — ezt felülírjuk, mert most a user explicit kéri a 4-5 csillagosokat. Frissítem a memóriát is.

## 3. Kosár — „Összes törlése" gomb

`CartDialog.tsx`-ben a fejlécbe (X gomb mellé vagy az „Összesen" sor fölé) hozzáadok egy **„Kosár ürítése"** gombot (kuka ikon + szöveg, `variant="ghost"`, piros hover). Confirm dialoggal kérdezi meg: „Biztosan kiüríted az egész kosarat?"

## 4. Allergének automatikus hozzárendelése

Megvizsgálom hány étel van és milyen allergén-mező létezik. Aztán **egy migration script + admin gomb**:

**Biztos hozzárendelések (egyértelmű név → allergén):**
| Étel név tartalma | Allergén |
|---|---|
| rántott, panírozott, palacsinta, tészta, gnocchi, galuska, nokedli, kifli, zsemle, kenyér | **1 (glutén)** |
| tejszín, tej, sajt, túró, tejföl, vaj, csokoládé | **7 (tej)** |
| tojás, rántott (panírozás miatt), majonéz, palacsinta | **3 (tojás)** |
| hal, lazac, tonhal, ponty, harcsa | **4 (hal)** |
| garnéla, rák, kagyló | **2 (rákfélék)** |
| dió, mogyoró, mandula, pisztácia | **8 (diófélék)** |
| szezám, szezámmag | **11** |
| szója, szójaszósz, tofu | **6 (szója)** |
| mustár | **10** |
| zeller | **9** |

**Megvalósítás**: egy új admin-csak gomb a Beállítások vagy Étlap kezelés tab-ban: **„Allergének automatikus hozzárendelése"** → futtat egy script-et ami a fenti szabályokkal végigmegy az összes `menu_items`-en és **csak hozzáad** allergéneket (nem ír felül semmit, csak ha üres vagy hiányzik). Visszajelez: „X tételhez Y allergént adtam hozzá. Kérlek ellenőrizd!" Az admin egyenként szerkeszthet utána.

Ezt **nem futtatom le automatikusan** — gombnyomásra fut, hogy a tulaj eldönthesse mikor.

## 5. Admin kézikönyv — innovatív megoldás

**A koncepció**: nem egy különálló oldal, hanem egy **úszó, oldalt nyitható panel** (jobb oldali drawer/sheet) ami **bármelyik admin oldalon elérhető** és **közben tudja használni a felületet** (nem blokkolja).

### Felépítés

**Lebegő gomb** (jobb alsó sarok, minden admin oldalon):
- Kis kerek arany gomb `?` ikonnal (mint egy intercom widget)
- Tooltip: „Súgó és kézikönyv"

**Kattintásra megnyílik egy `Sheet` oldalsó panel** (jobb oldal, kb. 420px széles):
- A főtartalom (admin felület) marad balra, használható közben
- A panel scrollozható, kereshető
- Bezárható X-szel

### Struktúra a panelen

1. **Felül kereső**: „Mit keresel? (pl. kupon, allergén, kapacitás)"
2. **Kontextus-érzékeny súgó**: az aktuális oldalra vonatkozó témák jelennek meg ELŐSZÖR
   - Pl. ha `/admin/daily-menu`-n vagy → „Napi ajánlat", „Kép generátor", „Hírlevél" témák kiemelten
3. **Kategorizált témák** (összecsukható accordion):
   - 🚀 **Első lépések** (mit csinálj minden reggel, mit hetente)
   - 🍽️ **Étlap és menü kezelés**
   - 📸 **Képek és Facebook posztok**
   - 📊 **Rendelések és KDS**
   - 💰 **Számlák és pénzügy**
   - 📈 **Statisztika értelmezése**
   - 🎟️ **Kuponok és kedvezmények**
   - 📅 **Kapacitás és nyitvatartás**
   - 📁 **Dokumentumok**
   - ⚙️ **Beállítások**
   - 🆘 **Mit tegyek ha…** (tipikus problémák)

4. **Minden téma alatt**:
   - **Mire való?** — 1-2 mondat
   - **Hogyan használd?** — lépésről lépésre
   - **Miért hasznos?** — üzleti előny
   - **Tipikus hiba** — amit el kell kerülni
   - Opcionálisan: kis videó vagy GIF placeholder a jövőre

5. **Alul**: „Nem találtad? Írj nekünk → bence@…" link

### Technikai megvalósítás

- Új komponens: `src/components/admin/AdminHelpPanel.tsx` (Sheet alapú)
- Új komponens: `src/components/admin/HelpFloatingButton.tsx` (a lebegő gomb)
- Új fájl: `src/data/adminHelpContent.ts` (a teljes kézikönyv struktúrált JSON-ban — ezt később admin szerkeszthetővé tesszük, most kódban)
- Mindkettő beillesztve `AdminLayout.tsx`-be (egyszer, alul, hogy minden admin oldalon megjelenjen)
- Kontextus-felismerés `useLocation()` hook-kal

### Kreatív bónusz ötletek (megemlítem, döntsd el)
- **„Mit változott az utolsó frissítés óta?"** — a kézikönyv tetején egy ÚJ badge azokra a funkciókra amik az elmúlt 7 napban kerültek be
- **„Kávé melletti olvasnivaló"** mód — egy hosszabb, sztori-szerű útmutató, amit hétvégén el lehet olvasni
- **Onboarding tour** — új admin user (pl. asszisztens) első bejelentkezésekor automatikusan végigvezeti a felületen 8-10 buborékkal („Itt látod a mai rendeléseket", „Itt vannak a heti menük"…)

---

## Érintett fájlok

| Fájl | Művelet |
|---|---|
| `src/pages/admin/AdminLayout.tsx` | Dokumentumok átmozgatása + HelpFloatingButton beillesztése |
| `src/components/sections/ReviewsSection.tsx` | DB-alapú, csak 4-5 csillag, friss |
| Új migration | `reviews` tábla (ha nincs) + RLS + 4-5 csillag szűrő |
| `src/components/CartDialog.tsx` | „Kosár ürítése" gomb + confirm |
| Új: `src/components/admin/AllergenAutoAssign.tsx` | Allergén auto-hozzárendelés gomb (Étlap kezelés tab-ba) |
| Új: `src/components/admin/AdminHelpPanel.tsx` | Súgó panel (Sheet) |
| Új: `src/components/admin/HelpFloatingButton.tsx` | Lebegő ? gomb |
| Új: `src/data/adminHelpContent.ts` | Kézikönyv tartalom |
| `mem://business/reputation-management` | Frissítés: 4-5 csillag, nem csak 5 |

## Megvalósítási sorrend
1. Dokumentumok tab + Kosár ürítése (gyors)
2. Allergén auto-hozzárendelés (gomb + script)
3. Review-k 4-5 csillag + friss (DB ellenőrzés után)
4. Admin kézikönyv (legnagyobb meló)

