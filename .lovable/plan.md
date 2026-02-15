

# Announcement Popup fejlesztesek

## 1. Problema: A popup nem jelenik meg

Az adatbazisban az ertesito `enabled: false` allapotra van mentve. Valoszinuleg az editor nem volt bekapcsolt allapotban a mentes elott, vagy a Switch alapertelmezetten ki volt kapcsolva. Ellenorizni kell, hogy az admin bekapcsolta-e -- de a kodban nincs bug, egyszeruen az `enabled` mezo `false`.

**Megoldas**: A menteskor figyelmeztetes jelenik meg, ha `enabled` ki van kapcsolva: "Figyelem: az ertesito ki van kapcsolva, a latogatok nem fogjak latni." Ez egy kis info szoveg a Mentes gomb felett.

---

## 2. Kep feltoltes hozzaadasa az ertesitohoz

Az `AnnouncementEditor`-ba beepitjuk a mar meglevo `ImageUpload` komponenst, ami a `menu-images` bucket-be tolt fel.

- Uj szekcio a CTA mezok alatt: "Kep (opcionalis)"
- Az `ImageUpload` komponens hasznalata (`bucketName="menu-images"`)
- `onImageUploaded` → `form.imageUrl` beallitasa
- `onImageRemoved` → `form.imageUrl = null`
- Az elonezet is megjeleníti a kepet (ahogy a popup maga is -- az mar implementalva van az `AnnouncementPopup`-ban)

---

## 3. Gomb link dropdown az eloredefinalt oldalakkal

A "Gomb link" `Input` mezot lecsereljuk egy kombinalt mezocsoportra:
- Egy `Select` dropdown az oldal elore definialt utvonalakkal:
  - Etlap → `/etlap`
  - Galeria → `/gallery`
  - Rolunk → `/about`
  - Kapcsolat → `/contact`
  - Penztar → `/checkout`
  - Egyedi link... → szabadon irható Input mezo jelenik meg
- Ha az admin "Egyedi link..."-et valaszt, megjelenik egy `Input` mezo ahova barmit irhat (pl. kulso URL)
- Ha meglevo ertek van ami nem egyezik egy opcio-val sem, automatikusan "Egyedi link" modba kerul

---

## Technikai reszletek

### Modositando fajlok

| Fajl | Valtozas |
|------|----------|
| `src/components/admin/AnnouncementEditor.tsx` | ImageUpload hozzaadasa, link dropdown Select+Input kombo, figyelmeztetes ha kikapcsolt |

### Nem modosul
- `AnnouncementPopup.tsx` -- a popup mar kezel kepet (`imageUrl`) es CTA linket, nem kell modositani
- Adatbazis / storage bucket -- a `menu-images` bucket mar letezik
- Egyeb oldalak

### Uj importok az AnnouncementEditor-ban
- `ImageUpload` komponens (mar letezo)
- `ImageIcon` ikon (lucide)

