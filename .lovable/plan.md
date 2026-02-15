

# Napi ajanlat kep generalor javitasok

## Valtozasok

### 1. Menu ar mindig 2200 Ft
A `drawCanvas` fuggvenyben a `data.menu_price_huf || 2200` logika helyett fix 2200-at hasznalunk, mert az adatbazisban regebbi napi ajanlatok meg 1800-cal lehetnek eltarolva. A sor: `const menuPrice = 2200;` -- igy garantalt hogy mindig 2200 jelenik meg.

### 2. Kep nagyitasa (lightbox)
A canvas eloezet kattinthato lesz. Egy Radix Dialog-ba csomagoljuk, ami teljes meretu nezett mutat a keprol (`canvas.toDataURL()`-bol generalt `<img>`). Igy az admin ra tud kattintani es nagyban latja.

### 3. Nagyobb datum a kepen
A fejlec atalakitasa a referenciahoz igazodva:
- Egyetlen sor: `"Napi ajanlat 02.09. hetfo 11:30-tol"` -- nagy, 38-40px meretben
- A datum ugyanolyan nagy mint a "Napi ajanlat" szoveg, nem kulon kisebb meretu

### 4. Kek gradiens hatter a referenciakepehez hasonloan
A jelenlegi `#1a1a2e -> #16213e` helyett a csatolt kep sotetebb, feketesebb hattera:
- Felso sav: sotetszurke/fekete keret
- Kozepso resz: sotetkek-fekete gradiens
- Also sav: sotetszurke/fekete keret
A referenciakep hattere inkabb `#1c1c1c -> #2a2a3e -> #1c1c1c` jelleggel fut.

### 5. Lablec szoveg a masodik csatolt keprol
A kep aljara kerul (arany donten szoveggel, kisebb betumerettel):
```
A feltuntetett arak koret nelkul ertendok! Elviteles doboz: 150,- Ft/etel. Eteleink ara a koretet nem tartalmazza.
Levesbol, fozelebekbol es a koretekbol fel adag is kerheto, fel adagnal 70%-os arat szamlazunk.
```

---

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | - `menuPrice` fix 2200 - drawCanvas: uj fejlec formatum (egy sor, nagyobb datum) - uj kek/fekete gradiens hatter - lablec disclaimer szoveg - canvas eloezet Dialog-ba csomagolva kattintasra nagyithato |

### Canvas rajzolas uj logikaja
1. **Hatter**: sotetkek-fekete gradiens arany kerettel (felso + also sav)
2. **Fejlec**: `"Napi ajanlat MM.DD. napnev 11:30-tol"` -- 38px Sofia font, arany szin, arany also vonal
3. **Etelek**: feher nev bal oldalon, arany ar jobb oldalon (valtozatlan)
4. **Lablec disclaimer**: 2 soros arany donten szoveg, 14-15px
5. **Menu szekio**: "Menu" cim kurzivval, etelnevek, `Helyben: 2.200,- Ft` + `(+ 200,- Ft a 2 doboz elvitelre)` -- valtozatlan kivetel fix ar

### Lightbox
- `Dialog` (Radix) komponens
- Kattintas a canvasra -> `showPreview = true` allapot
- A dialog tartalma: `<img src={canvasDataUrl}>` teljes szelessegben
- A `canvasDataUrl`-t a `drawCanvas` vegem allitjuk be (`canvas.toDataURL()`)

