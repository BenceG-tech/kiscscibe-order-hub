

# Napi ajanlat kep -- vizualis ujratervezes a referencia kep alapjan

## Problemak a jelenlegi verzioban

1. **Szovegek egymasra csusznak** -- a footer szoveg fix pozicioban van (`H - 60`), de ha sok etel van, a dinamikus `y` valtozo tullepi ezt es egymasba csusznak
2. **Arany keret nem kell** -- a referencia kepen nincs arany keret, csak sima sotet hatter
3. **Rossz szinek** -- jelenlegi `#d4a843` arany helyett `#efbe13` sarga kell; hatter `#12171A` enyhe feher gradienssel balrol jobbra
4. **Etelek arai** -- a referencia kepen feher szoveggel vannak az arak is, nem arannyal. Csak a cim es a menu szekio sarga

## Valtozasok a `drawCanvas` fuggvenyben

### Hatter
- Keret torles (nincs arany border, nincs inner border)
- Hatter: `#12171A` alap, enyhe feher/vilagos gradiens balrol jobbra (linear gradient 0,0 -> W,0, `rgba(255,255,255,0.03)` -> `rgba(255,255,255,0)`)

### Szinek
- `GOLD` -> `#efbe13` (brand sarga)
- Cim: sarga (`#efbe13`)
- Etelnevek es arak: feher (`#ffffff`), nem sarga
- Menu szekio cim: sarga
- Menu ar: sarga
- Footer disclaimer: halvany sarga donten

### Fejlec
- Ugyanaz az elrendezes: `"Napi ajanlat 0M.DD. napnev 11:30-tol"` -- sarga, nagy (40px Sofia)
- Alatta sarga elvalaszto vonal

### Etelek
- Nev: feher, bal oldalon
- Ar: feher (nem sarga!), jobb oldalon, `X.XXX.-` formatum (pont a vegen, nem `,-`)

### Arformatum frissites
- A referencia kepen `1.350.-` lathato (pont a vegen), nem `1.350,-`
- A `formatPrice` fuggveny modositasa: `,-` helyett `.-`

### Menu szekio
- "Menu" cim sargaval, kurziv/diszites stilusban
- Etelnevek feherrel
- `Helyben: 2.200,- Ft` sargaval, nagyobb betumerettel
- `(+ 200,- Ft a 2 doboz elvitelre)` sargaval

### Dinamikus elrendezes (overlap fix)
- A footer szoveget NEM fix poziciora tesszuk, hanem a dinamikus `y` valtozo utan
- Eloszor kirajzoljuk az eteleket es a menu szekciot, majd a maradek helyre a footer szoveget
- Ha keves a hely, kisebb betumerettel rajzoljuk a footert
- A canvas magassagat dinamikusan szamoljuk a tartalom alapjan (minimum 675px, de novekedhet ha sok az etel)

### Lablec szoveg
Ket sor, kisebb donten sarga betukkel:
```
A feltuntetett arak koret nelkul ertendok! Elviteles doboz: 150,- Ft/etel. Eteleink ara a koretet nem tartalmazza.
Levesbol, fozelebekbol es a koretekbol fel adag is kerheto, fel adagnal 70%-os arat szamlazunk.
```

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | `drawCanvas` fuggveny teljes ujrairasa: uj szinek, keret nelkul, dinamikus magassag, feher etelarok, `#efbe13` sarga, `#12171A` hatter |

### Fontos valtozasok reszletezve

1. **`formatPrice`**: `,-` -> `.-` a referencia kephez igazodva
2. **Keret torles**: Lines 190-202 torlese (gold border + inner border)
3. **Hatter**: Vertikalis gradient helyett `#12171A` alap + enyhe horizontalis feher gradient
4. **Szinek**: `GOLD = "#efbe13"`, etelek arai `WHITE` nem `GOLD`
5. **Footer**: `y` alapu pozicionalas fix `H - 60` helyett, + 20px padding az etelektol
6. **Canvas magassag**: dinamikusan szamolva a tartalom alapjan, `aspectRatio` frissitese a JSX-ben

