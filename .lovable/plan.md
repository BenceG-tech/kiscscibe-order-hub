

# Galeria Preview + Navigacio & Rendelesi UX Fejlesztesek

Ez a terv 4 fo teruletet fed le: (1) Galeria preview a fooldalen + kulon oldal, (2) Navigacios javitasok, (3) Rendelesi folyamat UX fejlesztesek, (4) Kisebb javitasok. A komplexitas miatt fazisokra bontom.

---

## 1. Galeria: Preview a fooldalen + "Mutass tobbet" link

### Jelenlegi allapot
- A `GallerySection` az osszes kepet mutatja a fooldalen
- Van kulon `/gallery` oldal is, de nem erheto el a navigaciobol
- A fooldal tul hosszu mobilon az osszes galeria keppel

### Valtozasok

**a) GallerySection (fooldal) atirasa**
- Csak az elso 4 kep jelenik meg (mobilon 4, desktopon 6)
- Az utolso kep helyere egy "osszes kep" overlay kerul, ami a `/gallery` oldalra navigal
- Alternativ: a kepek utan egy "Teljes galeria megtekintese" gomb/link
- A tab rendszer megmarad mobilon (Etelek / Ettermunk)

**b) Navigacioba "Galeria" link**
- A `navLinks` tombbe uj elem: `{ href: "/gallery", label: "Galeria" }`
- Igy a hamburger menubol es desktop navbol is elerheto

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/sections/GallerySection.tsx` | Kepek korlatozasa 4-6 db-ra + "Tovabb" link |
| `src/components/gallery/FoodGallery.tsx` | Uj `maxImages` prop, ha megadva, levagja a kepeket |
| `src/components/gallery/InteriorGallery.tsx` | Ugyanez |
| `src/components/ModernNavigation.tsx` | "Galeria" hozzaadasa a navLinks-hez |
| `src/components/Footer.tsx` | "Galeria" hozzaadasa a footer navLinks-hez |

---

## 2. Mobil also navigacios sav (Bottom Tab Bar)

### Jelenlegi allapot
- Csak a `StickyMobileCTA` letezik (fix "Rendelj most" gomb)
- Nincs also tab navigacio, a felhasznalonak hamburger menut kell nyitnia

### Valtozasok

**Uj komponens: `MobileBottomNav.tsx`**
- 4 tab: Fooldal (Home icon), Napi Ajanlat (ChefHat), Galeria (Image), Tobb (Menu icon)
- A "Tobb" tab kinyit egy bottom sheet-et a tobbi linkkel (Rolunk, Kapcsolat, Tema valtas)
- A kosar ikon a felso navigacioban marad (mar ott van)
- Aktiv tab kiemelese az aktualis route alapjan
- Ez **lecsereli** a jelenlegi `StickyMobileCTA`-t

**A "Rendelj most" funkcionalitas**
- A "Napi Ajanlat" tab lenyegeben ugyanoda visz (/etlap)
- Ha van tetel a kosarban, a "Napi Ajanlat" tab badge-et kap a kosar osszeggel

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/StickyMobileCTA.tsx` | TORLES vagy atiras `MobileBottomNav`-ra |
| `src/components/MobileBottomNav.tsx` | UJ: 4-tabes also navigacio |
| `src/pages/Index.tsx` | `StickyMobileCTA` csereje `MobileBottomNav`-ra |
| Egyeb oldalak ahol `StickyMobileCTA` hasznalt | Csere |

---

## 3. Rendelesi folyamat javitasok

### 3a) Kosar tartalom megjelenites a Checkout-on
- Jelenleg a Checkout oldalon nincs reszletes kosar nezet (oldalak + modifierek)
- **Javitas**: A Checkout oldal tetejen egy osszecsukott kosar-osszesito, ami mutatja a tetelek nevet, koreteket, modifiereket, db-ot es arat
- Ha a felhasznalo kinyitja, latja a reszleteket es torlohet tetelt

### 3b) Kulonbozo datumu napi etelek figyelmeztetese
- Jelenleg a checkout-nal csunya hiba, ha kulonbozo datumos napi etelek vannak a kosarban
- **Javitas**: Figyelmeztetesjelzo mar a kosar dialogban, nem csak checkout-kor. A CartDialog-ban piros figyelmeztetes jelenik meg, ha tobb kulonbozo datum van, es "Eltavolitas" gomb az utkozohoz

### 3c) Kosar osszeg a Sticky CTA-n / also navigacion
- Ha vannak tetelek a kosarban, a "Napi Ajanlat" tab vagy egy kulon kosar tab mutatja: "(3 200 Ft)"

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/pages/Checkout.tsx` | Kosar osszesito szekci hozzaadasa a form ele |
| `src/components/CartDialog.tsx` | Datum-konfliktus figyelmeztetes |
| `src/components/MobileBottomNav.tsx` | Kosar osszeg badge |

---

## 4. Kisebb javitasok

### 4a) /etlap navigacios link atnevezese
- A nav linkben "Napi Ajanlat" mar helyes (nem "Etlap"), ez mar igy van. OK.

### 4b) Kontakt form -- mar mukodik!
- A `send-contact-email` edge function Resend API-val kuld emailt. Ez NEM fake -- tenylegesen kuld emailt a `kiscsibeetterem@gmail.com`-ra es visszaigazolast a felhasznalonak.
- A fake telefonszam (+36 1 234 5678) csak az email sablon lableceben van -- ezt javitjuk: eltavolitjuk a telefonszamot az email sablonbol.

### 4c) Fake telefonszam eltavolitasa
- A `send-contact-email/index.ts` email sablonjabol torolni a "+36 1 234 5678" sort
- A fooldal/navigacio/footer mar nem tartalmaz telefonszamot (korabban eltavolitva)

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `supabase/functions/send-contact-email/index.ts` | Fake telefonszam torlese az email sablonbol |

---

## Mi NEM varolsul ebben a fazisban (kesobbi fejlesztes)

- **Quick re-order** ("Rendeld ujra a multkorit"): Kulon feluletet es adatbazis lekerdezest igenyel a korabbi rendelesek alapjan. Kovetkezo fazis.
- **Checkout progress bar** (3 lepes): A jelenlegi 1 oldalas checkout jol mukodik ebben a meretben. Ha a rendelesi folyamat bovul, akkor erdemes bontani.
- **Becslult varakozasi ido**: Nincs adat az atlagos elkeszitesi idorol. Ehhez elobb az "order completion time" trackinget kell implementalni.
- **Autofill korabbi rendelesekbol**: Szukseges egy email/phone alapu lekerdezese a korabbi orders-nek, ami RLS policy modositast igenyel.
- **Aktiv szekci kiemelese scrollnal**: Ez kozepesen komplex (Intersection Observer az osszes section-re + nav allapot szinkron). Onallo fejlesztes.
- **Hover cart preview** (kosar kartya hover-re): Desktop-on a CartDialog mar megnyilik click-re, hoverrel valo megnyitas konfliktusos lehet UX szempontbol.

---

## Technikai reszletek

### Uj fajlok
| Fajl | Leiras |
|------|--------|
| `src/components/MobileBottomNav.tsx` | Also tab navigacio mobilra (Home, Napi Ajanlat, Galeria, Tobb) |

### Modositando fajlok (osszesites)
| Fajl | Valtozas |
|------|----------|
| `src/components/sections/GallerySection.tsx` | Max 4-6 kep + "Teljes galeria" link |
| `src/components/gallery/FoodGallery.tsx` | `maxImages` prop hozzaadasa |
| `src/components/gallery/InteriorGallery.tsx` | `maxImages` prop hozzaadasa |
| `src/components/gallery/GalleryGrid.tsx` | `maxImages` tamogatas + "Mutass tobbet" overlay |
| `src/components/ModernNavigation.tsx` | "Galeria" nav link |
| `src/components/Footer.tsx` | "Galeria" footer link |
| `src/components/StickyMobileCTA.tsx` | Lecsereles MobileBottomNav-ra vagy torles |
| `src/pages/Index.tsx` | StickyMobileCTA csere |
| `src/pages/Checkout.tsx` | Kosar osszesito szekci |
| `src/components/CartDialog.tsx` | Datum-konfliktus jelzes |
| `supabase/functions/send-contact-email/index.ts` | Fake telefon torlese |

### Nem modosul
- Adatbazis schema (nincs migracio)
- Rendelesi logika (submit-order edge function)
- Admin/staff oldalak
- Checkout fizetes logika
- Meglevo galeria kepek lekerdezese

