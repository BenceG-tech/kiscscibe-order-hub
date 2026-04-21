

# Terv — Kiscsibe-stílusú Facebook poszt generátor

## Mit látunk a feltöltött képeken (stílus-elemek)

A 8 valós posztból kinyerhető a **Kiscsibe brand voice**:

1. **Címsor** — 🔥 + CAPS LOCK + emoji végén (🍽️ vagy 🐥 vagy 🚀)
   - „🔥 SZERDA = ÚJABB KISCSIBE NAPI MENÜ! 🍽️"
   - „🔥 ELKÉSZÜLTEK A MAI ÉTELEK! 🍽️"
   - „🚀 HÉTFŐI INDÍTÁS A KISCSIBÉBEN! 🍗🔥"

2. **Hook mondat** — kacsintós, közvetlen
   - „Holnap sem maradsz éhesen… sőt 😏👇"
   - „Na ez most tényleg az a nap, amikor nem érdemes főzni otthon… 😏👇"

3. **Étel-lista** — minden tételhez **ételhez illő egyedi emoji** + rövid jelzős leírás
   - 🍅 Paradicsomos zöldségleves bazsalikommal
   - 🥩 Fokhagymás sertésragu
   - 🍗 Aranybarnára sült töltött csirkecombok
   - 🧀 Szaftos, olvadt sajtos karajszeletek

4. **Záró ajánló** — 👉 + hangulati mondat
   - „👉 Minden frissen készült, illatok már az utcán 😎"
   - „👉 Klasszikusok + egy kis extra csavar, Kiscsibe stílusban 😎"

5. **Praktikus info** — ⏰ idő, 📍 cím, 💥 menü ár
   - „⏰ 11:30-tól várunk!"
   - „💥 Menü: 2.200 Ft"
   - „📍 1141 Budapest, Vezér utca 110."

6. **Záró csattanó** + Hashtag blokk (6-10 tag)
   - „Ne gondolkozz sokat… ebédidőben nálunk a helyed 😎"
   - `#kiscsibe #napiajanlat #szerda #ebedido #hazias #zuglo #finom #magyaros #menu`

## Mit építünk

### 1. Új edge function paramétereszett

`generate-facebook-post` kibővítve **3 új paraméterrel**:

| Paraméter | Értékek | Mit csinál |
|---|---|---|
| `postType` | `holnapi` / `mai_elkeszult` / `heti_indito` | A poszt fajtája — más-más címsor és hangulat |
| `style` | `kiscsibe` (alap) / `egyszeru` (régi) | Új gazdag stílus VS régi rövid |
| `tone` | (marad) `étvágygerjesztő` / `vidám` / `profi` | Finomhangolja a szóhasználatot |

### 2. Erősen módosított AI system prompt

Az új prompt tartalmazza a **stílus-szabályokat példákkal**:

- Pontos szerkezeti váz (címsor → hook → ételek emoji-val → záró ajánló → idő/ár/cím → csattanó → hashtag)
- Ételhez illő emoji választás szabálya (leveshez 🍲, csirkéhez 🍗, sertéshez 🥩, halhoz 🐟, sajthoz 🧀, salátához 🥗, tésztához 🍝, palacsintához/desszerthez 🥞🍰 stb.)
- Caps lock + 🔥 a címsorban
- Magyaros, közvetlen, kicsit pimasz hangnem
- 6-10 hashtag végén (kötelező: `#kiscsibe #napiajanlat #ebedido #zuglo #magyaros`, plusz nap-specifikus pl. `#szerda` és heti theme tag)
- 800-1500 karakter (a régi 300 helyett)

### 3. Tool-calling JSON schema bővítés

A modell strukturált választ ad:
```
{
  title: string,           // 🔥 CÍMSOR…
  hook: string,            // bevezető mondat
  items: [{emoji, text}],  // ételsor egyedi emoji-kkal
  closing: string,         // 👉 záró ajánló
  schedule: string,        // ⏰ + 📍 + 💥 ár
  punchline: string,       // záró csattanó
  hashtags: string[]
}
```

A frontend ebből szépen összerakja az **egész posztot** kész másolható formába (tördelt, üres sorokkal — pont mint a képeken).

### 4. UI változások a `DailyOfferImageGenerator.tsx`-ben

A „Facebook poszt szöveg" Card kibővül:

```
┌─────────────────────────────────────────┐
│ Facebook poszt szöveg                   │
├─────────────────────────────────────────┤
│ Poszt típusa:  [Holnapi]  [Mai kész]   │
│                [Heti indító]            │
│                                         │
│ Hangnem:       [Étvágygerjesztő] ...    │
│                                         │
│ Stílus:        [Kiscsibe stílus ✨]     │
│                [Rövid (régi)]           │
│                                         │
│ [✨ Generálás]                          │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 🔥 SZERDA = ÚJABB KISCSIBE…       │   │
│ │                                   │   │
│ │ Holnap sem maradsz éhesen… 😏👇   │   │
│ │ 🍅 Paradicsomos zöldségleves…     │   │
│ │ 🥩 Fokhagymás sertésragu          │   │
│ │ ...                               │   │
│ └───────────────────────────────────┘   │
│ [#hashtag chips]                        │
│ [📋 Másolás (kész formátumban)]         │
└─────────────────────────────────────────┘
```

A Textarea már a teljes, formázott posztot mutatja (tördeléssel, üres sorokkal) — egy kattintás Másolás → mehet 1:1 Facebook-ra.

### 5. Smart auto-detect

Amikor a felhasználó kiválasztja a dátumot, a komponens **automatikusan ajánlja a poszt típusát**:
- Ha a dátum = ma → „Mai elkészült" előválasztva
- Ha a dátum = holnap → „Holnapi" előválasztva  
- Ha hétfő ÉS dátum = holnap → „Heti indító" előválasztva (heti összesítő hangulat)

## Érintett fájlok

| Fájl | Mit |
|---|---|
| `supabase/functions/generate-facebook-post/index.ts` | Új system prompt, új paraméterek (`postType`, `style`), új JSON schema (title/hook/items/closing/schedule/punchline/hashtags) |
| `src/components/admin/DailyOfferImageGenerator.tsx` | Poszt típus + stílus választók, posztok formázott összerakása az AI strukturált válaszából, kibővített Másolás funkció, auto-detect a dátum alapján |
| `src/data/adminChangelog.ts` | Új bejegyzés: „Kiscsibe-stílusú FB poszt generátor" |

## Megvalósítási sorrend

1. Edge function átírása új prompttal + JSON schema
2. Frontend UI bővítése (poszt típus, stílus, auto-detect)
3. Strukturált válaszból teljes poszt összeállítása + másolás
4. Changelog bejegyzés

