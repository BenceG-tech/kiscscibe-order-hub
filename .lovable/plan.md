

# Instagram elrendezes tomorites + Menu ar alapertelmezett ertek

## 1. Instagram kepek: szorosabb elrendezes

A `drawToCanvas` fuggvenyben az a la carte tetelek kozotti sorkozt (jelenleg `42 * scale`) es a menu tetelek kozotti sorkozt (jelenleg `40 * scale`) csokkentjuk, hogy a szoveg nagyobb es olvashatobb lehessen. Az Instagram formatumoknal (1080px szeles) a tartalom jelenleg tul kicsi, mert a nagy sorozes sok helyet foglal.

Valtozasok a `drawToCanvas`-ben:
- A la carte sorozes: `42` -> `34` (base px)
- Menu sorozes: `40` -> `34`
- Menu cim utani hely: `52` -> `42`
- Separator utani hely: `30` -> `22`
- Note sorozes: `28` -> `24`
- Footer elotti hely: `30` -> `20`

A `measureContentHeight` fuggvenyt szinten frissiteni kell ugyanezekkel az ertekekkel, hogy a skalazas konzisztens maradjon.

Ezzel a tartalom kevesebb helyet foglal vertikalisan, igy a `vScale` nagyobb lesz es az egesz kep nagyobb/olvashatobb fontmereteket kap.

## 2. Menu ar: 2200 Ft alapertelmezett, de modosithato

Jelenleg a `menuPrice` fix `2200` a `drawToCanvas`-ben (sor 252). A felhasznalonak nincs lehetosege modositani az admin feluletrol.

Megoldas:
- Uj `menuPrice` state a komponensben, alaperteke `2200`
- A state inicializalasa: ha `dayData.menu_price_huf` letezik es nem nulla, azt hasznalja, egyebkent `2200`
- Egy szam input mezo a nap valaszto kartya alatt: "Menü ár (Ft)" felirattal, `menuPrice` ertekkel
- A `drawToCanvas`-nek atadni ezt az erteket parameter-kent a fix `2200` helyett
- Amikor a `dayData` valtozik, a `menuPrice` frissul: `dayData.menu_price_huf || 2200`

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | 1) Sorozes ertekek csokkentese a `drawToCanvas`-ben es `measureContentHeight`-ban 2) `menuPrice` parameter hozzaadasa a `drawToCanvas`-hez 3) Uj `menuPrice` state + Input mezo az UI-ban 4) `drawAllCanvases` hivasa a `menuPrice` ertekkel |

### drawToCanvas signatura valtozas
```text
drawToCanvas(canvas, data, dateStr, W, H, logoImg, menuPrice)
```

### UI mezo elhelyezese
A "Nap kivalasztasa" kartya aljara kerul egy uj sor:
```text
Menü ár (Ft): [____2200____]
```
Ez egy sima szam input, amit a felhasznalo barrmikor atirhat. A kepek azonnal ujrageneralodnak a valtozaskor.

