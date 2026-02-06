

# Jogi & GDPR Megfelelesi Csomag

## Attekintes

A Kiscsibe weboldal jelenleg nem rendelkezik semmilyen jogi oldallal, cookie consent bannerrel, vagy GDPR-megfelelessel. Ez kritikus hianyossag, mivel a webhely szemelyes adatokat gyujt (nev, email, telefon, rendelesi adatok). A terv 5 fo elemet tartalmaz:

1. Impresszum oldal
2. Adatvedelmi Tajekoztato (Privacy Policy) oldal
3. ASZF (Altalanos Szerzodesi Feltetelek) oldal
4. Cookie (Suti) Szabalyzat oldal
5. Cookie Consent Banner komponens
6. Footer es routing frissitesek

---

## Uj oldalak

### 1. Impresszum (`/impresszum`)

Tartalom:
- Uzleti nev, cim (1145 Budapest, Vezer utca 12.)
- Cegjegyzekszam, adoszam (placeholder - a felhasznalonak kell kitoltenie)
- Kapcsolattartasi adatok (telefon, email)
- Tarhelyszolgaltato adatai (placeholder)
- Adatvedelmi tisztviselo (ha alkalmazhato)

### 2. Adatvedelmi Tajekoztato (`/adatvedelem`)

Tartalom (GDPR Art. 13 alapjan):
- Milyen adatokat gyujtunk (nev, email, telefon, rendelesi adatok)
- Adatkezeles celja (rendelesi visszaigazolas, kapcsolattartas)
- Jogalapok (szerzodes teljesitese, hozzajarulas)
- Adatok tarolasi ideje
- Erintetti jogok (hozzaferes, toroltes, hordozhatosag)
- Cookie/suti hasznalat osszefoglalasa
- Kapcsolat az adatvedelmi kerdesekkel

### 3. ASZF (`/aszf`)

Tartalom:
- Az online rendeles feltételei
- Fizetesi es atveli feltetelek
- Lemondas / visszaterittes szabalyok
- Felelossegi kerdesek
- Panaszkezeles

### 4. Cookie Szabalyzat (`/cookie-szabalyzat`)

Tartalom:
- Milyen cookie-kat / localStorage-ot hasznalunk
- Szukseges sutik (auth token, session)
- Opcionalis sutik (ha vannak)
- Hogyan lehet kezelni a sutiket

---

## Cookie Consent Banner

Egy uj `CookieConsent` komponens, amely:
- Az oldal aljan jelenik meg, fix pozicioban
- Ket gomb: "Elfogadom" es "Tovabbi informaciok" (link a cookie szabalyzathoz)
- A valasztas localStorage-ban tarolodik (`cookie-consent-accepted`)
- Csak egyszer jelenik meg (amig el nem fogadja a felhasznalo)
- Nem blokkoloja a lap hasznalatanak (mivel csak szukseges sutiket hasznal az oldal)

---

## Footer bovites

A jelenlegi footerben a "Gyors linkek" blokkhoz hozzaadjuk a jogi linkeket:
- Impresszum
- Adatvedelmi Tajekoztato
- ASZF
- Cookie Szabalyzat

---

## HTML lang attributum javitas

Az `index.html` fajlban a `<html lang="en">` modosul `<html lang="hu">`-ra, mivel az oldal magyar nyelvu.

---

## Technikai Reszletek

### Uj fajlok

| Fajl | Tipus |
|------|-------|
| `src/pages/legal/Impresszum.tsx` | Jogi oldal |
| `src/pages/legal/PrivacyPolicy.tsx` | Jogi oldal |
| `src/pages/legal/TermsAndConditions.tsx` | Jogi oldal |
| `src/pages/legal/CookiePolicy.tsx` | Jogi oldal |
| `src/components/CookieConsent.tsx` | Cookie banner |

### Modositando fajlok

| Fajl | Valtoztatas |
|------|-------------|
| `src/App.tsx` | 4 uj route + CookieConsent import |
| `src/components/Footer.tsx` | Jogi linkek hozzaadasa |
| `index.html` | `lang="en"` -> `lang="hu"` |
| `public/robots.txt` | Admin/staff utak blokolasa |

### Oldal design minta

Minden jogi oldal ugyanazt a layoutot koveti (konzisztens az About.tsx es Contact.tsx oldalakkal):
- `ModernNavigation` felul
- Hero szekci (hero-desktop.png keppel, gradienssel, cimmel)
- Feher/card hatteru tartalom szekci, max-w-4xl, prose-szeru tipografia
- `Footer` alul

### Route-ok

```text
/impresszum        -> Impresszum
/adatvedelem       -> Adatvedelmi Tajekoztato
/aszf              -> ASZF
/cookie-szabalyzat -> Cookie Szabalyzat
```

### Cookie Consent mukodese

```text
1. Oldal betolteskor: ellenorizni localStorage('cookie-consent')
2. Ha nincs consent -> banner megjelenitese
3. "Elfogadom" kattintas -> localStorage.setItem('cookie-consent', 'accepted')
4. Banner eltunese animacioval
5. Kovetkezo betolteskor: banner nem jelenik meg
```

### Robots.txt bovites

```text
User-agent: *
Disallow: /admin/
Disallow: /staff/
Disallow: /auth
Disallow: /checkout
Disallow: /order-confirmation
```

---

## Fontos megjegyzes

A jogi oldalak szovege **placeholder/sablon** szoveget fog tartalmazni. A vegso jogi szoveget **jogasznak kell atnezni es jovahagynia** a valos uzleti adatokkal (cegjegyzekszam, adoszam, tarhelyszolgaltato stb.). A placeholderek `[PLACEHOLDER]` jelzéssel lesznek megjelolve a szovegben.

