
# Audit + Master PDF csomag

## 1. rész — Teljes körű audit (kb. 25 perc)

### A. Publikus oldal (vevői szemszögből, browser teszteléssel)
Végigmegyek a következő útvonalakon `1223×854` desktop és `390×844` mobil viewporton:

- `/` (főoldal) — hero, USP, napi ajánlat, AlwaysAvailableTeaser, promo, gallery, reviews, FAQ, map, newsletter, footer
- `/etlap` — napi menü navigáció, kombó választás, fix tételek (`#mindig-elerheto` anchor), allergén ikonok, kosárba rakás
- `/galeria` — Ételek / Éttermünk kategóriák, lightbox swipe
- `/rolunk`, `/kapcsolat` — kontakt form elküldés (teszt email)
- Jogi oldalak — Impresszum, Adatvédelmi, ÁSZF, Süti
- `/auth` — bejelentkezés, jelszó nélküli flow
- Bottom nav (mobil), sticky CTA, cookie banner, announcement popup

### B. Rendelés end-to-end (valódi teszt rendelés)
1. Kosár összeállítása (1 napi menü kombó + 1 fix tétel + 1 á la carte napi tétel modifierrel)
2. Kupon kód validálás teszt
3. Checkout: telefon `+36` prefix, név, email, pickup time (nyitvatartás/kapacitás validáció)
4. Megrendelés leadás → `submit-order` edge function
5. Visszaigazoló email megérkezése (`rendeles@kiscsibe-etterem.hu` → user + BCC admin)
6. `OrderConfirmation` oldal nyomtatás-előnézet
7. Admin oldalon realtime értesítés + hangjelzés + audio toast
8. Státusz váltások: new → preparing → ready → completed. Minden lépésnél email kiküldés ellenőrzése (`send-order-status-email` logok)
9. KDS nyomtatási nézet (`80mm/76mm`) ellenőrzése
10. Auto-generated invoice (`create_invoice_on_order_complete` trigger) → `/admin/invoices` listában megjelenés
11. Végül: teszt rendelés sztornózása vagy törlése (audit log)

### C. Admin szemszög — minden modul (`/admin/*`)
- **Dashboard** — DashboardAlerts, RecentOrdersFeed, stat kártyák
- **Orders / OrdersManagement** — szűrők, exportok (CSV), kupon megjelenítés, törlés
- **Daily Menu / MenuSchedule / DailyMenu** — WeeklyMenuGrid, gyors árszerkesztés, sold-out toggle, kombó validáció
- **Menu / MenuItemManagement** — étlap CRUD, allergén auto-assign, kép upload, AI képgenerátor (egyedi + batch)
- **FixItems** — mindig elérhető tételek
- **Gallery** — multi upload, kategóriák
- **Capacity** — időslot-ok, sablonok, blackout napok, heat coloring
- **Coupons** — % és fix kedvezmény, felhasználási limit
- **Invoices / Partners** — bejövő/kimenő, AI OCR feltöltés, ÁFA összesítő export, partner CRUD
- **Analytics** — bevétel, rendelések, étlap, ügyfél, AI árazási javaslatok
- **Waste tracking** — napi naplózás
- **About / Legal / Faq / Announcement editorok** — élő frissítés
- **Activity** — audit log
- **Documents** — Kiscsibe Drive (mappák, verziók, tagek)
- **Staff layout** — `/staff` Kanban, daily summary, print
- **Hidden access** — 5 kattintásos admin trigger ellenőrzés

### D. Backend egészség
- Supabase advisor lefuttatása (RLS, security issues)
- Edge function logok átvizsgálása (utolsó 24 óra hibák)
- Postgres logok hibákra
- Cron jobok állapota (recurring invoices, reports)

### E. Audit kimenet
Egy `AUDIT_REPORT.md` fájl, ami listázza:
- ✅ Mi működik tökéletesen
- ⚠️ Apró kozmetikai problémák
- 🔴 Funkcionális bugok (ha vannak)
- 💡 Egyszerűsítési / UX javaslatok (pl. felesleges lépések, redundáns kattintások)
- 🚀 Hiányzó funkciók (pl. SMS értesítés, online fizetés, többnyelvűség, vendég-loyalty pontrendszer, asztalfoglalás)

A talált bugokat **nem javítom ki ebben a körben** — csak felsorolom. Külön körben javítjuk, amit kérsz.

---

## 2. rész — Master PDF csomag (whitelabel + Kiscsibe case study)

Mindkét PDF a Python `reportlab` skillel készül `/mnt/documents/` alá. Whitelabel design: sötét navy alap, egy cserélhető arany accent (`{{BRAND_ACCENT}}`), `{{LOGO}}` és `{{BRAND_NAME}}` placeholderek a generáló scriptben, hogy más éttermek brandjére könnyen átszínezhető legyen. Minden oldalon visual QA (kép-export + inspekció).

### PDF #1 — `RestaurantOS_SalesDeck.pdf` (~12 oldal)
1. Címlap — "RestaurantOS — Komplett digitális kifőzde-rendszer"
2. A probléma — miért szenvednek a kifőzdék (papír, telefon, Excel, elveszett rendelések, túlrendelés, ÁFA káosz)
3. A megoldás — egy platform, amit a vendég, a konyha és a tulaj egyaránt szeret
4. Vevői élmény — screenshotok a főoldalról, étlapról, checkoutról
5. Konyhai élmény — Kanban, KDS print, hangjelzés, realtime
6. Tulajdonosi élmény — analytics, AI árazás, ÁFA export, kapacitáskezelés
7. AI funkciók — képgenerálás, számla OCR, árazási javaslatok, időjárás-alapú forecast
8. Email + jogi megfelelőség — automatikus visszaigazolás, GDPR, ÁSZF, cookie consent, EU allergének
9. Mobil-first — PWA, push, bottom nav
10. Bevezetési idő — 1-2 hét, brand átszínezés 1 nap
11. Árajánlat-sáv — egyszeri setup + havi licenc + extra modulok (placeholder árakkal, hogy te töltsd ki)
12. CTA + kapcsolat

### PDF #2 — `RestaurantOS_FeatureCatalog.pdf` (~32 oldal)
Modulonként 1-2 oldal részletes leírással. Minden modulnál: mit tud, kinek szól, üzleti érték, képernyőkép-hely (placeholder box).

**Tartalomjegyzék:**
1. Architektúra áttekintés (technológiai stack, Supabase, edge functions, RLS)
2. Szerepkörök (owner / admin / staff / customer)
3. Étlap-kezelés (Master Library 500+ tétel, kategóriák, modifier, allergének)
4. Napi ajánlat & kombó rendszer (soup + main, auto-sync, fix items)
5. Kapacitáskezelés (időslot, sablon, blackout, heat map)
6. Rendelés-leadás (kosár, kupon, telefon validáció, nyitvatartás)
7. Rendelés-kezelés (Kanban, státusz, realtime, hang, KDS print)
8. Email automatizáció (4 trigger pont, brandelt template)
9. Számlázás (bejövő/kimenő, AI OCR Gemini, ÁFA, partner, recurring, order receipt trigger)
10. Analytics (revenue, orders, customers, menu)
11. AI Business Intelligence (pricing suggestions)
12. Kuponok és kedvezmények
13. Hulladékkövetés
14. Forecasting (időjárás + 4 hetes átlag)
15. Loyalty program (5/10/20 rendelés után)
16. PWA & push értesítések
17. Gallery & Branding
18. Tartalomszerkesztő (About / Legal / FAQ / Announcement, Markdown editor)
19. Dokumentumtár (Kiscsibe Drive)
20. Audit log
21. Multi-format image generator (FB/IG post/story)
22. Biztonság & GDPR (RLS, audit, cookie consent, EU allergének)
23. Whitelabel & testreszabás (brand színek, logó, font, tartomány)
24. Onboarding & support csomag
25. **Esettanulmány: Kiscsibe Étterem** (1-2 oldal — eredeti brand színek, mit hozott a rendszer, számok ha vannak)

### Whitelabel script
A PDF generátor `restaurantos_pdf.py` script egy `BRAND` dict-ből dolgozik:
```python
BRAND = {
  "name": "RestaurantOS",          # cserélhető
  "tagline": "...",
  "primary": "#F6C22D",            # arany accent
  "bg": "#0F172A",                  # sötét navy
  "text_on_dark": "#FFF8E6",
  "logo_path": "/mnt/documents/logo.png",  # opcionális
}
```
Egy paranccsal újragenerálható bármely partner brandjével.

---

## Mit kapsz a végén
1. `AUDIT_REPORT.md` — találatok listája
2. `RestaurantOS_SalesDeck.pdf` — eladásra
3. `RestaurantOS_FeatureCatalog.pdf` — onboardingra / részletes prezentációra
4. `restaurantos_pdf.py` — generátor script, amivel új partner brandjére 1 perc alatt át tudod színezni mindkét PDF-et

**Nem módosítok semmilyen alkalmazás-kódot ebben a körben.** Ha az audit során talált bugok közül bármelyiket javítanám akarod, külön kérésre megcsinálom.
