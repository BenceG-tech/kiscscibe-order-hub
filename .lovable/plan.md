

Megnézem az adminHelpContent-et hogy lássam mi van benne és mi hiányzik, valamint az AdminLayout-ot az admin oldalak listájához.
<lov-tool-use id="toolu_vrtx_0174XUg4gNvvKcVVwfSsmRY9" name="code--view" integration-id="code" data="{\"file_path\": \"src/data/adminHelpContent.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01JLHCfyujHnBudNnT4Q53uo" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminLayout.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DwfswKXAHXFduxYbwm2dgn" name="code--view" integration-id="code" data="{\"file_path\": \"src/data/adminHelpContent.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Cvcf8nLqhd6HeM3izbVYg5" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminLayout.tsx\"}">
</lov-tool-use>
<lov-plan>

# Terv — Admin kézikönyv újratervezés

## Hiányzó témák (audit eredménye)

A jelenlegi `adminHelpContent.ts` **nem** tartalmazza:
- **Partnerek** kezelése (beszállítók) — `/admin/partners`
- **Kuponok** részletes magyarázat (csak létrehozás van, használat/követés nincs)
- **Galéria** kezelése — `/admin/gallery`
- **Rólunk oldal** szerkesztése — `/admin/about`
- **GYIK** szerkesztése — `/admin/faq`
- **Jogi oldalak** szerkesztése — `/admin/legal`
- **Hirdetmény popup** szerkesztése (Announcement)
- **Hírlevél** részletes (heti menü email küldés)
- **Pazarlás követés** (waste tracking)
- **Forecasting / becslés** (időjárás-alapú adagbecslés)
- **AI ár-javaslatok** (Statisztika fülön)
- **PWA / push értesítések** beállítása

→ Mindet hozzáadom megfelelő kategóriákba.

## 1. Click-outside bezárás javítása

`AdminHelpPanel.tsx`-ben jelenleg `onInteractOutside={(e) => e.preventDefault()}` blokkolja a bezárást amikor az overlay-re kattintasz. **Eltávolítom** ezt a sort, és helyette:
- A `SheetOverlay`-t **átlátszóvá** teszem (vagy nagyon enyhén sötétre, `bg-black/20` a `bg-black/80` helyett) — egyedi className-mel a `SheetContent`-en keresztül, hogy a felület továbbra is **látható és olvasható** legyen
- Az overlay-re kattintás **bezárja** a panelt (alapértelmezett Radix viselkedés)
- Így megmarad a „közben tudom használni a felületet" érzés (az overlay áttetsző), de egy kattintással kiléphetsz

## 2. Olvashatóság — nagyobb betűk, levegősebb

A jelenlegi panel **túl apró szövegekkel** dolgozik (`text-xs`, `text-sm`). Frissítések:

| Elem | Régi | Új |
|---|---|---|
| Téma cím (accordion trigger) | `text-sm` | `text-base font-semibold` |
| Tartalom blokkok | `text-xs` | `text-sm leading-relaxed` |
| Szekció címek (kategória) | `text-sm` | `text-base font-bold` |
| Belső labelek („Mire való?") | `text-xs` | `text-sm font-semibold` |
| Padding az accordion-en belül | `pb-3` | `pb-4 pt-2` |
| Térköz a témák között | `space-y-1` | `space-y-2` |
| Panel szélessége | `sm:max-w-md` (~448px) | `sm:max-w-lg` (~512px) — több hely a szövegnek |

## 3. Struktúra letisztítása — „Első lépések" átdolgozás

Jelenleg az „Első lépések" zavaró, mert a **napi rutin** keveredik a **funkció-magyarázattal**. Megoldás:

**Új struktúra**:

1. **🎯 Mit hol találsz?** (új, legfelül) — gyors „térkép": minden fő admin oldal 1 mondatban, közvetlen linkkel az oldalra. Pl. „📊 Rendelések — itt látod a beérkező rendeléseket élőben → [Megnyitás]". Ez a leggyorsabb tájékozódás új felhasználónak.

2. **📅 Napi és heti rutin** (átnevezve „Első lépések"-ről) — csak a tennivaló-listák, nem funkció-magyarázat. 2 kártya: „Reggeli rutin (5 perc)" + „Heti rutin (vasárnap, 20 perc)". Checkbox-stílusú lista (vizuálisan teendő-listának néz ki).

3. Utána a **funkció-kategóriák** (Étlap, Képek, Rendelések, stb.) — változatlan, csak nagyobb betűkkel.

## 4. „Erre az oldalra vonatkozik" szekció kiemelése

A kontextus-érzékeny rész jó, de jelenleg szöveg nélkül van. Frissítések:
- Nagyobb cím: „📍 Most ezen az oldalon vagy"
- Az aktuális route-hoz tartozó kategória **automatikusan kinyílik** alatta (nem csak felül lebeg külön)
- Ha nincs kontextus-egyezés, üzenet: „Ezen az oldalon nincs külön súgó — keress a kategóriákban lent."

## 5. Hozzáadandó témák (részletes lista)

Új vagy bővített kategóriák:

**🏢 Partnerek és beszállítók** (új kategória) — `/admin/partners`
- Mire való: beszállítók, telefon, email, jegyzetek, kapcsolódó számlák
- Miért hasznos: nem külön Excelben kell vezetni, számlák automatikusan kapcsolódnak

**🎟️ Kuponok** (bővítés)
- Kupon felhasználás követése (ki, mikor, mennyit)
- Mit lát a vásárló a checkout-ban
- Tipikus stratégiák (új vásárló, törzsvendég, csendes nap)

**📸 Galéria** (új) — `/admin/gallery`
- Ételek és Éttermünk kategóriák
- Képek feltöltése, sorrendezés
- Mit lát a vásárló (fooldali galéria szekció + dedikált oldal)

**ℹ️ Rólunk / GYIK / Jogi / Hirdetmény** (új közös kategória „Tartalom kezelés")
- Markdown szerkesztő használata
- Mikor érdemes módosítani
- Hirdetmény popup beállítása (mikor jelenjen meg, milyen képpel)

**📧 Hírlevél** (bővítés)
- Heti menü email küldés
- Feliratkozók kezelése
- Resend integráció státusz

**♻️ Pazarlás követés** (új) — `/admin/daily-menu`
- Napi pazarlás rögzítése
- Trendek értelmezése
- Költségmegtakarítási potenciál

**🌤️ Forecasting** (új) — `/admin/daily-menu`
- Időjárás-alapú adagbecslés
- 4 hetes átlag számítás
- Mikor érdemes többet/kevesebbet főzni

**💡 AI ár-javaslatok** (új) — `/admin/analytics`
- 90 napos adat alapján
- Mikor fogadd el, mikor utasítsd el

**📱 PWA / Push értesítések** (új)
- Telefonra telepítés
- Push engedélyezés a böngészőben
- Mikor jönnek értesítések

## 6. Bónusz: „Új vagy itt?" üdvözlő gomb

A kézikönyv tetejére egy nagy banner (csak első megnyitáskor látható, localStorage-ban tárolt):
- „👋 Új admin? Indíts a 🎯 'Mit hol találsz?' szekcióval — 2 perc alatt átlátod a rendszert."

## Érintett fájlok

| Fájl | Művelet |
|---|---|
| `src/data/adminHelpContent.ts` | Bővítés ~12 új témával, „Mit hol találsz?" szekció hozzáadás, „Első lépések" átalakítás teendő-listára |
| `src/components/admin/AdminHelpPanel.tsx` | Click-outside engedélyezés, áttetsző overlay, nagyobb betűk, szélesebb panel, kontextus szekció kiemelés, „Új vagy itt?" banner |

## Megvalósítási sorrend
1. Help content bővítés (legnagyobb meló — minden hiányzó téma)
2. Panel UX átdolgozás (overlay, méretek, struktúra)
3. „Mit hol találsz?" gyors-térkép szekció
4. „Új vagy itt?" üdvözlő banner

