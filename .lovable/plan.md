

# Terv — Kézikönyv tab-ok átláthatóbbá + FB poszt szöveg generátor

## 1. Kézikönyv tab-ok: szöveges sor → ikonos kártya-grid

Jelenleg 7 tab egymás mellett szövegként, nehéz egyből rátalálni. Új megoldás: **2x4 (vagy 2x3+1) ikonos kártya-grid** a panel tetején.

### Kártya-grid layout

Minden tab egy kattintható kártya:
- **Nagy lucide-react ikon** felül (Sparkles, Map, UtensilsCrossed, Activity, Wallet, Megaphone, Settings)
- **Cím** alatta (text-sm font-semibold)
- **1 mondatos leírás** (text-xs muted) — pl. „Étlap, allergének, napi ajánlat"
- **Aktív kártya**: arany keret + enyhe glow + scale-105
- **Aktuális oldalhoz tartozó tab**: kis sárga „itt vagy" pötty a jobb felső sarokban
- **„Mi változott?"** kártya: piros pötty + szám badge ha van új

### Kiválasztás után

Amikor rákattintasz egy kártyára:
- A grid **összecsukódik** egy vékony „← Vissza a menübe" sávra (kompakt, ~40px magas)
- Alatta jelenik meg a kiválasztott tab tartalma (accordion-ok / „Mi változott?" lista)
- A „← Vissza" gombbal visszatérsz a kártya-grid-hez

### Reszponzivitás

- **Mobil**: 2 oszlop (`grid-cols-2`)
- **Desktop**: 4 oszlop (`grid-cols-4`) — mind a 7 tab egyszerre látszik 2 sorban

### Kereső

A kereső a kártya-grid **felett** marad. Ha a kereső aktív (van szöveg), a kártya-grid eltűnik és minden tab tartalma egyszerre szűrve jelenik meg (cross-tab keresés).

## 2. FB poszt szöveg generátor a Facebook kép alá

### Helyzet

A `DailyOfferImageGenerator.tsx`-ben jelenleg generálódik a Facebook post kép (1200×675). A FB poszt szöveg generátor (`generate-facebook-post` edge function) létezik, de valószínűleg külön helyen / külön komponensben van.

### Megvalósítás

A `DailyOfferImageGenerator.tsx`-ben megkeresem a Facebook post kép Card-ját (`Facebook post 1200×675`), és **közvetlenül alá** beillesztek egy új szekciót:

**„📝 Facebook poszt szöveg" kártya:**
- **Hangnem-választó** (Select): barátságos / lelkes / rövid / informatív
- **„Szöveg generálása" gomb** → `generate-facebook-post` edge function hívása (a napi ajánlat tartalmával)
- **Generált szöveg**: `Textarea`-ban szerkeszthető
- **„Másolás" gomb** → clipboard-ra
- Loading state generálás közben

Az IG post / IG story képek alá NEM kerül szöveg generátor (egyszerűsítés okán — FB-t használják leginkább).

### Régi hely tisztítása

Ha létezik külön `FacebookPostGenerator` komponens vagy önálló tab/szekció, **eltávolítom** hogy ne legyen duplikátum. Ha bizonytalan, megjelölöm a kódban hol találtam meg az eredetit.

## Érintett fájlok

| Fájl | Művelet |
|---|---|
| `src/components/admin/AdminHelpPanel.tsx` | `Tabs` komponens lecserélése grid-alapú kártya-navigátorra + state a kiválasztott tab-hoz + „vissza" gomb |
| `src/components/admin/DailyOfferImageGenerator.tsx` | FB szöveg generátor szekció hozzáadása a FB kép Card alá |
| (Esetleg) Régi FB szöveg generátor komponens | Eltávolítás ha duplikátum |

## Megvalósítási sorrend

1. AdminHelpPanel kártya-grid átalakítás
2. FB poszt szöveg generátor integrálás a Kép generátorba
3. Régi FB szöveg gen hely takarítása (ha kell)

