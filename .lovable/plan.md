## Probléma

1. Az AI képgenerátor jelenleg véletlenszerű asztalt választ (slate / dió / tölgy / fenyő) → nem konzisztens.
2. Minden ételhez **ovális** papírtányért használ — főételhez kerek, lapos kell.
3. Levesekhez és szaftos ételekhez (pörkölt, paprikás, gulyás, tokány, sólet, mártásos) szintén ovális tányért tesz — fehér papír **mélytányér** kéne.
4. A 2. képen látható „Edge Function returned a non-2xx status code" akkor jön, amikor a Gemini Flash Image válasz nem tartalmaz képet (text-only response, pl. tartalom-szűrés vagy csak rövid akadás) — most azonnal 500-zal eldobjuk.

## Megoldás

Egyetlen fájl: `supabase/functions/generate-food-image/index.ts`.

### 1. Konzisztens asztal

- `surfaces` tömb törölve. **Mindig** ugyanaz: `dark slate stone table` (a memóriában rögzített brand-stílus).
- A többi variáció (szög, fény, garníroz) marad — ettől nem lesz uniform unalmas, de az asztal és tányér konzisztens.

### 2. Étel-típus felismerés a névből

Egyszerű kulcsszó-heurisztika az `item_name` lowercase + accent-stripped változatán:

- **soup** (leves) → ha tartalmazza: `leves`, `levest`, `consommé`, `húsleves`, `gulyásleves`, `bableves`, `gyümölcsleves`, `raguleves`, `becsinalt`
- **saucy** (mélytányér, de nem leves) → ha tartalmazza: `pörkölt`, `paprikas`, `paprikás`, `tokány`, `tokany`, `ragu`, `sólet`, `solet`, `gulyás` (de nem `gulyásleves` → már soup), `mártás`, `martas`, `becsinált`, `babgulyás`, `lecsó`, `lecso`, `körömpörkölt`
- **main** (alap) → minden más

A meglévő `style` paraméter (`plate` / `box`) tovább működik — ha a hívó kifejezetten kéri, az nyer. Új opcionális `dish_kind` paraméter is támogatott (`soup` / `saucy` / `main`) felülbírálásra.

### 3. Új prompt sablonok

Mind ugyanazon az asztalon, fehér papír edényen:

- **soupPrompt**: `"Served in a simple plain white round disposable paper deep soup bowl (papír mélytányér), broth/soup clearly visible, steam optional. ..."`
- **saucyPrompt**: `"Served in a simple plain white round disposable paper deep plate (papír mélytányér) so the sauce stays contained, generous portion. ..."`
- **mainPrompt**: `"Served on a simple plain white ROUND FLAT disposable paper plate (NOT oval, NOT ceramic, NOT square). ..."`
- **boxPrompt**: marad mint van (kraft doboz vichy papírral) — `style="box"` esetén.

Mindegyikben kiemelve negatívok: `NOT oval, NOT ceramic, NOT studio fine-dining`.

A `style="plate"` fallback most a `dish_kind` szerint a megfelelő (soup/saucy/main) prompt-ot adja vissza — nem mindig az oválisat.

### 4. Retry, ha nincs kép a válaszban

Az AI gateway hívást egy `for (let attempt = 0; attempt < 3; attempt++)` ciklusba tesszük:

- 200 OK + üres `images` mező → retry (max 3 próba), kis prompt-erősítéssel: `"Return an IMAGE, not text. "` előtaggal.
- 429 / 402 → azonnali return a meglévő hibaüzenetekkel (nincs retry).
- Más nem-2xx → 1× retry, utána throw.
- 3 sikertelen próba után: `return new Response({ error: "Az AI most nem tudott képet generálni, próbáld újra." }, { status: 502 })` — így a kliens toast-ja érthető lesz, nem általános „non-2xx".

### 5. Kliens

Nincs változás. A `AIGenerateImageButton` már mutatja a `data.error` szöveget toast-ban, így az új barátságos üzenet automatikusan megjelenik.

## Érintett fájlok

- `supabase/functions/generate-food-image/index.ts` — promptok, dish-kind detektor, retry, konzisztens asztal.

## Nem változik

- Storage upload, `menu_items.image_url` frissítés, RLS, kliens komponensek, batch generátor.
