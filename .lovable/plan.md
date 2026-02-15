

# Napi ajanlat kep -- gradiens, logo, betutipus frissites

## 3 valtozas

### 1. Gradiens forditasa
Jelenlegi: `#1c232f` (bal) -> `#252b38` (jobb)
Uj: `#252b38` (bal) -> `#1c232f` (jobb)

### 2. Kiscsibe logo hozzaadasa
A kerek logo (`kiscsibe_logo_round.png`) betoltese es elhelyezese a kep jobb also sarkaban, halvany (0.4-0.5 opacity) vizjelkent, kb 80x80px meretben.

A logo betolteset a `drawCanvas` fuggvenyen belul egy `Image()` objektummal oldjuk meg -- a canvas rajzolast a logo `onload` esemenyere mozditjuk, hogy a logo biztosan megjelenjen.

### 3. Etelek es arak sima betutipussal
Az etelnevek es arak jelenlegi `Sofia, Georgia, serif` betutipusat lecsereljuk `Arial, Helvetica, sans-serif`-re, hogy konnyebben olvashatoak legyenek.

Erintett sorok:
- A la carte etelek neve es ara (28px)
- Menu etelnevek (26px)
- Note szoveg (20px)

A cimsor ("Napi ajanlat..."), a "Menu" cim, a menu ar, a footer es a branding tovabbra is Sofia marad -- csak az etelek es arak valtoznak.

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | 1) Gradiens colorStop-ok felcserelese (2 sor) 2) Logo betoltese Image()-gel es kirajzolasa a jobb also sarokba drawImage-gel 3) Etel/ar fontok `Sofia` -> `Arial, Helvetica, sans-serif` |

### Logo betoltes technikai megoldas
A `drawCanvas` fuggveny elejen letrehozunk egy `new Image()` objektumot a `/assets/kiscsibe_logo_round.png` utvonallal. A teljes rajzolasi logika az `img.onload` callback-be kerul, a logo kirajzolasa `ctx.globalAlpha = 0.45` + `ctx.drawImage(img, W - PAD - 70, H - 90, 70, 70)` pozicioba. Ha a logo nem toltodik be (`onerror`), a rajzolas logo nelkul fut le.

