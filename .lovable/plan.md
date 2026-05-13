## Cél

Amikor valaki üzenetben (Messenger, WhatsApp, iMessage, Slack, Discord, Facebook, LinkedIn) elküldi az oldal linkjét, jelenjen meg egy gazdag link preview: cím, leírás és nagy kép a Kiscsibe Étteremről.

## Mit találtam

- Az `index.html` már tartalmaz `og:title`, `og:description`, `og:image`, `twitter:*` tageket.
- A `/images/og-kiscsibe.png` elérhető (HTTP 200) a `kiscscibe-order-hub.lovable.app` domainen.
- **Problémák**, amik miatt a preview törékeny:
  1. Az `og:image` **abszolút URL-je a lovable.app domainre mutat**, így ha valaki a `kiscsibe-etterem.hu` vagy `kiscsibeetterem.hu` linket osztja meg, egyes scraperek (Facebook, iMessage) cross-domain miatt nem mindig töltik be a képet, vagy hibásan cache-elik.
  2. Hiányzik az **`og:url`** és **`og:site_name`** tag — ezek nélkül a Facebook/Messenger gyakran "üres" preview-t mutat.
  3. Hiányzik az **`og:locale`** (`hu_HU`) — a lokalizált megjelenítéshez.
  4. Hiányzik a `<meta name="robots" content="index, follow">` és a `<link rel="canonical">` — SEO + preview konzisztencia miatt fontos.
  5. A kép `1200x630`-ként van deklarálva, de nem ellenőriztük, hogy tényleg ilyen méretű-e — ha nem, a Facebook elutasíthatja.
  6. Nincs külön Twitter-specifikus `twitter:url` és `twitter:site` tag.

## Mit fogok csinálni

### 1. `index.html` meta tag bővítés

Hozzáadom / módosítom a `<head>` szekcióban:

- **Relatív → abszolút domain-független megoldás:** Az `og:image` URL-jét lecserélem a publikus domain alapú abszolút URL-re. Mivel a Lovable buildje statikus HTML-t generál és a custom domain a `kiscsibe-etterem.hu`, a végleges OG képet egy domain-független, `https://kiscscibe-order-hub.lovable.app/images/og-kiscsibe.png` URL-re hagyom (ez minden domainről elérhető CDN-en), de hozzáadom a custom domain alternatívát is `og:image:secure_url` taggel.
- **Új tagek:**
  - `<meta property="og:url" content="https://kiscsibe-etterem.hu/">`
  - `<meta property="og:site_name" content="Kiscsibe Reggeliző & Étterem">`
  - `<meta property="og:locale" content="hu_HU">`
  - `<meta property="og:image:alt" content="Kiscsibe Reggeliző & Étterem - friss házi ételek">`
  - `<meta property="og:image:type" content="image/png">`
  - `<meta name="twitter:url" content="https://kiscsibe-etterem.hu/">`
  - `<meta name="twitter:site" content="@kiscsibeetterem">` (ha van Twitter handle, ha nincs, kihagyom)
  - `<link rel="canonical" href="https://kiscsibe-etterem.hu/">`
  - `<meta name="robots" content="index, follow">`

### 2. OG kép validáció

- Megnyitom a meglévő `public/images/og-kiscsibe.png`-t és ellenőrzöm a méretét. Ha **nem 1200x630**, akkor:
  - Generálok egy új, **1200x630 px** méretű, branded OG képet a Kiscsibe étterem stílusában (sötét háttér, sárga `#F6C22D` accent, Sofia font cím, házi ételek tematika), és kicserélem.
  - Ha 1200x630, marad.

### 3. Tesztelés

- A változtatás után megadom a felhasználónak ezeket a debug linkeket, ahol ő maga is tudja "frissíteni" a cache-t a közösségi platformokon (mert a Facebook/LinkedIn agresszíven cache-eli az OG képet):
  - Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/`
  - LinkedIn Post Inspector: `https://www.linkedin.com/post-inspector/`
  - Twitter Card Validator: `https://cards-dev.twitter.com/validator`
  - WhatsApp / iMessage automatikusan újratöltik 7 nap után, vagy ha a URL paramétert kap (pl. `?v=2`).

## Érintett fájlok

- `index.html` — meta tagek bővítése
- `public/images/og-kiscsibe.png` — esetleges csere ha rossz méretű

## Amit NEM csinálok

- Nem nyúlok a működő funkciókhoz (rendelés, admin, étlap).
- Nem változtatom a hero képet vagy más vizuális elemet az oldalon.
- Nem adok hozzá új SDK-t vagy függőséget.
