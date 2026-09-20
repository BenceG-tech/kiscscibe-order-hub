# Kiscsibe favicon csere

## Cél
A Google/kereső találati listában és a böngésző fülön a Lovable-szív helyett a Kiscsibe logó jelenjen meg faviconként.

## Jelenlegi állapot
- `public/favicon.ico`: a Lovable alapértelmezett szív ikonja.
- `index.html`: nincs `<link rel="icon">` tag, csak `<link rel="manifest">`.
- `src/assets/kiscsibe_logo_round.png`: rendelkezésre áll a sárga kör alakú Kiscsibe logó.

## Teendők
1. A `kiscsibe_logo_round.png`-ből 64×64 pixeles, átlátszó hátterű, középre igazított PNG favicon készítése `public/favicon.png` néven.
2. `public/favicon.ico` törlése, hogy a böngésző ne a régi ikont kérdezze le.
3. `index.html` `<head>`-be beszúrni:
   ```html
   <link rel="icon" href="/favicon.png" type="image/png">
   ```
4. Build + Playwright ellenőrzés: a favicon link jelen van, nincs 404 a `/favicon.png`-ra, konzolhiba nincs.

## Hatókör
- Csak a favicon és a hozzá tartozó HTML link módosul.
- Egyéb funkció, adatbázis, RLS vagy üzleti logika nem változik.
