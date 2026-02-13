

# Admin altal szerkesztheto Ertesito / Pop-up Rendszer

## Koncepció

Az admin egy egyszeruen kezelheto feluleten tud beallitani egy felugro ertesitest (announcement popup), ami a latogatok szamara megjelenik a fooldal megnyitasakor. Lehet akcios hir, rendkivuli nyitvatartas, uj etel bejelentes, stb. A latogato egyszer bezarja, es nem jelenik meg ujra (amig az admin nem valtoztatja meg a tartalmat).

---

## Megoldas reszletei

### Adattarolas

A `settings` tabla meglevo mintajat hasznaljuk (nincs uj tabla vagy migracio):
- Kulcs: `announcement`
- Ertek (value_json):

```text
{
  "enabled": true,
  "title": "Husveti nyitvatartas",
  "message": "Aprilis 18-21 kozott zarva tartunk. Boldog husvetot!",
  "type": "info" | "warning" | "promo",
  "ctaText": "Reszletek",        // opcionalis gomb szoveg
  "ctaLink": "/etlap",           // opcionalis gomb link
  "imageUrl": null,               // opcionalis kep
  "updatedAt": "2026-02-13T..."   // mikor frissult utoljara
}
```

### RLS

A `settings` tablanak mar van publikus olvasasi RLS-e egyes kulcsokra (`about_page`, `legal_*`, `capacity_settings`). Uj RLS policy kell az `announcement` kulcsra:
- `Public can read announcement settings` -- SELECT WHERE key = 'announcement'

### Migracio
- 1 uj RLS policy a `settings` tablara

---

## Frontend: AnnouncementPopup komponens

### Mukodes
1. A fooldal betoltesekorekor lekerdezi a `settings` tablabol az `announcement` kulcsot
2. Ha `enabled = true` es van tartalom, megjelenik egy modal/popup
3. A `localStorage`-ben taroljuk: `announcement-dismissed-{updatedAt}` -- igy ha az admin uj ertesitest ir, ismet megjelenik
4. A latogato bezarhatja az X gombbal vagy az "Ertem" gombbal
5. Ha van CTA gomb (ctaText + ctaLink), az is megjelenik

### Design
- Mobilon: teljes szelessegu also panel (drawer-szeru), `bottom-sheet` stilus
- Desktopon: kozepre igazitott modal, max-w-md
- A `type` mezo hatarozza meg a szint:
  - `info`: kek szegely, info ikon
  - `warning`: sarga szegely, figyelmezteto ikon
  - `promo`: arany/primary szegely, ajandek/csillag ikon
- Kep megjelenik ha van (pl. akcios banner)
- Animalt megjelenes (fade-in + slide-up)

### Erintett fajl
| Fajl | Valtozas |
|------|----------|
| Uj: `src/components/AnnouncementPopup.tsx` | A popup komponens, adatlekeres + localStorage logika |
| `src/pages/Index.tsx` | AnnouncementPopup beemelese |

---

## Admin felulet: Ertesito szerkeszto

Uj szekcio az AdminLayout navigacioban VAGY a Dashboard-on egy kartya. A legegyszerubb: a Dashboard-ra kerul egy "Ertesito / Popup" kartya.

### Alternativa: kulon admin oldal
Mivel a Dashboard mar zsufolt, jobb megoldas: bovitsuk az `/admin/about` oldalt egy uj szekcioval az `AboutPageEditor` ele, VAGY csinaljunk egy kulon kicsi panelt a Dashboard-on.

**Valasztott megoldas**: A Dashboard-ra kerul egy osszecsukhato "Ertesito beallitas" kartya, mert:
- Gyorsan elerheto
- Nem kell uj route/oldal
- Egy helyen van a tobbi gyors muvelettel

### Admin UI elemek
- Be/Ki kapcsolo (Switch): ertesito aktivalasa/deaktivalasa
- Tipus valaszto: Info / Figyelmeztetés / Akció (dropdown)
- Cim mezo (Input)
- Uzenet mezo (Textarea)
- CTA gomb szoveg (opcionalis Input)
- CTA gomb link (opcionalis Input)
- Kep feltoltes (opcionalis, menu-images bucket)
- "Mentes" gomb
- Elonezet: egy mini preview a popup kinezeterol

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| Uj: `src/components/admin/AnnouncementEditor.tsx` | Admin szerkeszto komponens |
| `src/pages/admin/Dashboard.tsx` | AnnouncementEditor beemelese a Quick Actions fole |

---

## Technikai osszefoglalas

### Uj fajlok
| Fajl | Leiras |
|------|--------|
| `src/components/AnnouncementPopup.tsx` | Latogatoi popup komponens |
| `src/components/admin/AnnouncementEditor.tsx` | Admin szerkeszto |

### Modositando fajlok
| Fajl | Valtozas |
|------|----------|
| `src/pages/Index.tsx` | AnnouncementPopup import + rendereles |
| `src/pages/admin/Dashboard.tsx` | AnnouncementEditor beemelese |
| Uj migracio | RLS policy: publikus olvasas az `announcement` kulcsra |

### Nem modosul
- Adatbazis sema (a `settings` tabla mar letezik)
- Admin navigacio (nincs uj route)
- Egyeb oldalak
- Meglevo RLS szabalyok

---

## Implementacios sorrend

1. Migracio: RLS policy az `announcement` kulcsra
2. `AnnouncementEditor.tsx`: admin szerkeszto + Dashboard integracio
3. `AnnouncementPopup.tsx`: latogatoi popup + Index.tsx integracio

