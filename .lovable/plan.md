

# 3 formatum kep generalas + logo fix

## Jelenlegi helyzet
- A logo kod mar benne van (sor 354-369), de a `public/assets/kiscsibe_logo_round.png` fajl letezeset ellenorizni kell
- A menu ar mar 2200-ra van allitva (sor 317)
- Jelenleg csak 1 kepet general (1200x675 landscape)

## Valtozasok

### 1. Rajzolas refaktoralas -- kozos `drawToCanvas` fuggveny
A jelenlegi `drawCanvas` fuggvenyt atalakitjuk, hogy parameterkent kapja a meretet es a canvas elemet. Igy haromszor hivhato kulonbozo meretekkel:

| Formatum | Meret | Hasznalat |
|----------|-------|-----------|
| Facebook post | 1200 x 675 | Fektetett, jelenlegi |
| Instagram post | 1080 x 1080 | Negyzetes |
| Instagram story | 1080 x 1920 | Allo |

A rajzolas logikaja azonos marad (gradiens hatter, sarga cim, feher etelek, logo vizjel), de:
- A font meretek es padding aranyosan skalazodjak a canvas merethez
- Instagram story-nal a tartalom kozepre igazodik vertikalisan (tobb hely fent/lent)
- Instagram post-nal kompaktabb elrendezes a negyzetes formatumhoz

### 2. 3 rejtett canvas + 3 data URL
- 3 `useRef<HTMLCanvasElement>` (facebook, instaPost, instaStory)
- 3 `canvasDataUrl` state (facebookDataUrl, instaPostDataUrl, instaStoryDataUrl)
- Mindharom automatikusan ujrarajzolodik amikor a `dayData` valtozik

### 3. UI: Tab-ok vagy egymás alatti kartyak
3 kulon kartya a 3 keppel, mindegyiknel:
- Kep elonezet (kattintasra lightbox)
- Letoltes gomb
- Formatum badge (Facebook / Insta Post / Insta Story)

### 4. Logo megjelenes biztositasa
A logo betoltese `new Image()` + `onload` callback-kel tortenik (mar igy van). Ellenorizzuk hogy a `public/assets/kiscsibe_logo_round.png` fajl letezik -- ha nem, a felhasznalo altal feltoltott logot (`user-uploads://Gemini_Generated_Image_wi4t2nwi4t.png`) masoljuk oda.

### 5. Menu ar
A menu ar mar 2200 Ft-ra van allitva a kodban (sor 317: `const menuPrice = 2200`). Ez nem valtozik.

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | `drawCanvas` refaktor 3 merethez; 3 canvas ref + data URL; 3 letoltes gomb; lightbox bovites; UI kartyak a 3 formatumhoz |

### Meretaranyos skalazas logika
A kozos rajzolo fuggveny parameterek:
```text
drawToCanvas(canvas, data, dateStr, width, height, logoImg)
```
- PAD: aranyosan skalazva (50 az 1200px-esnel, ~45 az 1080px-esnel)
- Font meretek: aranyosan skalazva a szelesseghez
- Instagram story: a tartalom a kep kozepen, nagy felso/also margoval
- Instagram post: kompaktabb, de ugyanaz az elrendezes

### Letoltes fajlnevek
- `napi_ajanlat_facebook_YYYY-MM-DD.png`
- `napi_ajanlat_insta_post_YYYY-MM-DD.png`
- `napi_ajanlat_insta_story_YYYY-MM-DD.png`

