
# Osszetett fejlesztes: Tobbszoros torles, ikon nevek, szamla-fejlesztesek, elfogyott jeloles, changelog

Ez a terv tobb kisebb fejlesztest fog ossze egyetlen nagy frissitesbe.

---

## 1. Multbeli rendelesek tobbszoros kivalasztasa es torles

A "Multbeli" tabon jelenleg egyenkent kell torolni a rendeleseket. Uj funkcio: checkbox-ok a rendelesekknel, es egy "Kivalasztottak torlese" gomb.

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/pages/admin/OrdersManagement.tsx` | - `PastOrdersTab`-ba uj allapot: `selectedIds: Set<string>` - Minden `PastOrderAdminCard` kap egy checkbox-ot a bal oldalon - "Osszes kivalasztasa" / "Kivalasztottak torlese (X db)" gombok a vezerlosavoban - AlertDialog megerosites a tobbszoros torlesnel - `deleteMultiple` fuggveny ami vegigmegy a kivalasztott ID-kon |

---

## 2. Ikon nevek magyarul + ikon elonezet a Rolunk szerkesztoben

Jelenleg a kepernyon lathato: "CalendarDays", "Star", "Heart" stb. angol ikon nevekkel. Ezek helyett magyar cimkek jelenjenek meg, es az ikon is latszodjon a neve mellett.

### Megvalositas
A `ICON_OPTIONS` tombot atalakitjuk egy tetellistava: `{ value: "CalendarDays", label: "Naptar", icon: CalendarDays }` formaban. A `<select>` elemet lecsereljuk egy szebb Radix `Select` komponensre, ahol az ikon is latszik minden opcio mellett.

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/components/admin/AboutPageEditor.tsx` | - ICON_OPTIONS atalakitasa: value + magyar label + lucide komponens - HTML select helyett Radix Select az ikonvalaszsztohoz - Minden opcio elejen az ikon megjelenitese (pl. `<Heart /> Sziv`) - A kivalasztott ikon is latszik a SelectTrigger-ben |

Magyar forditas tabla:
- CalendarDays = "Naptar"
- Users = "Vendegek"
- ChefHat = "Szakacs sapka"
- Star = "Csillag"
- Heart = "Sziv"
- Clock = "Ora"
- Leaf = "Level"
- Award = "Dij"
- Coffee = "Kave"
- Utensils = "Evoezkozok"
- MapPin = "Helyszin"
- ThumbsUp = "Tetszik"

---

## 3. Szamla rendszer tovabbfejlesztesek

### 3a. Lejart szamlak automatikus jelolese
Jelenleg a "pending" + lejart `due_date` szamlakat csak a Dashboard alert mutatja. De magat a szamlat nem allitja "overdue"-ra. Uj: a szamla listaban vizualisan megkulonboztetjuk a lejart szamlakat (piros due_date szoveg), es egy "Figyelem: X lejart szamla!" banner jelenik meg a szamla oldal tetejen is.

### 3b. Szamla reszletek jobb megjelenitese a listaban
- Due date megjelenitese a listaban (ha van)
- Ha lejart: piros betuszin es "Lejart X napja" felirat

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/components/admin/InvoiceListItem.tsx` | - Due date megjelenitese - Lejart jelzes piros szinnel es "X napja lejart" szoveggel |
| `src/pages/admin/Invoices.tsx` | - Lejart szamlak figyelmezteto banner a lista felett |

---

## 4. Napi ajanlat "Elfogyott" jeloles (admin/staff)

Az admin es staff feluleten lehessen manualissan megjelolni egy napi ajanlat etelt "elfogyott"-nak. Ez a frontenden is megjelenik es nem engedi megrendelni.

### Megvalositas
A `daily_offers` tablan mar van `remaining_portions` mezo. Ha ezt 0-ra allitjuk, az etel elfogyottnak szamit.

Uj UI elem: az admin Weekly Grid-ben es a staff feluleten egy "Elfogyott" gomb/toggle az egyes napi etelek mellett. A frontenden (Etlap.tsx) ha `remaining_portions === 0`, az etel szurkeve valik es "Elfogyott" badge jelenik meg, a "Kosarba" gomb letiltva.

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/components/admin/WeeklyMenuGrid.tsx` | - "Elfogyott" toggle gomb a napi ajanlat soroknal |
| `src/components/staff/StaffOrders.tsx` vagy uj komponens | - Staff feluleten is "Elfogyott" jelolesi lehetoseg |
| `src/pages/Etlap.tsx` | - Elfogyott etelek szurke kartya + "Elfogyott" badge + letiltott gomb |
| `src/components/sections/AlwaysAvailableSection.tsx` | - Fix teteleknels nincs elfogyott (nem relevans) |
| `src/components/DailyOffersPanel.tsx` vagy `UnifiedDailySection.tsx` | - Frontenden elfogyott jeloles |

---

## 5. Changelog: feb 12-15 valtoztatasok osszefoglalasa

Ez nem kod-valtozas, hanem egy osszefoglalo a tulajnak. A terv implementalasakor egy changelog szekciokent is megjelenik, de most itt irasom ossze:

### Februar 12 (csutortok)
- **Rendelesi rendszer javitasok**: A staff Kanban-tablan az orderkartya fejlesztese (uj megjelenesek, kontakt infok, opcio-megjelenites)
- **Multbeli rendelesek**: Datumok szerint csoportositott, kibonthato kartyas megjelenes a staff es admin feluleten

### Februar 13 (pentek)
- **Bizonylat rendszer (1-2. fazis)**: Teljes CRUD, szamla rogzites (bejovo/kimeno), fajl-feltoltes (foto + PDF), automatikus bizonylat-generalas rendelesekbol (order_receipt trigger), Excel export konyvelonek
- **Szamla rendszer UI**: InvoiceListItem, InvoiceFormDialog, InvoiceFilters, InvoiceSummaryCards (koltseg/bevetel/eredmeny kartyak), InvoiceFileUpload

### Februar 14 (szombat)
- **Bizonylat rendszer (3. fazis)**: Dashboard penzugyi osszesito kartyak (havi bevetel/koltseg/eredmeny), lejart szamlak figyelmeztetese a Dashboard-on, gyors statusz-valtas a szamla listaban, thumbnail elonezet csatolt kepeknel, "Fizeteresre var" (pending) gomb, order_receipt bizonylatok readonly mod, havi gyorsszurok (Ez a honap / Elozo honap), lejart szamlak badge az admin navigacioban

### Februar 15 (vasarnap)
- **Admin tooltip rendszer**: Minden admin oldalra InfoTip (i) ikonok kerultek, rovid magyar nyelvü magyarazatokkal: Dashboard, Rendelesek, Etlap, Napi ajanlatok, Szamlak, Galeria, Statisztika, Kuponok, Jogi oldalak, Rolunk, Ertesitok
- **Fix tetelek kezelese**: Uj `is_always_available` mezo a menu_items tablan, admin feluleten "Fix tetel" checkbox, szurogomb es badge, Etlap oldalon uj "Mindig elerheto" szekcio kategoria szerinti csoportositassal, fooldali kiemelt fix tetelek (max 6)

---

## Modositando fajlok osszesitese

| Fajl | Valtozas |
|------|--------|
| `src/pages/admin/OrdersManagement.tsx` | Tobbszoros kivalasztas + torles a Multbeli tabon |
| `src/components/admin/AboutPageEditor.tsx` | Ikon nevek magyarul + ikon elonezet |
| `src/components/admin/InvoiceListItem.tsx` | Due date + lejart jelzes |
| `src/pages/admin/Invoices.tsx` | Lejart figyelmeztetes banner |
| `src/components/admin/WeeklyMenuGrid.tsx` | Elfogyott toggle |
| `src/pages/Etlap.tsx` | Elfogyott jelzes frontenden |
| `src/components/DailyOffersPanel.tsx` | Elfogyott jelzes a napi ajanlat panelen |

### Uj fajl (opcionalis)
Nem szukseges uj fajl, minden letezo fajlba integralhato.

---

## Nem tartalmazza ez a terv
- PDF szamla generalas (4. fazis)
- OCR (fotobol adat kinyeres)
- Ismetlodo koltsegek automatizalasa
