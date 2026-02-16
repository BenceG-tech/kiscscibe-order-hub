

# AI szamla felismeres hozzaadasa

## Osszefoglalas

Harom resz: (1) uj edge function a szamla adatok kinyeresere, (2) "AI kitoltes" gomb az InvoiceFileUpload komponensben, (3) az InvoiceFormDialog bovitese az AI altal kinyert adatok fogadasara es sargan jelolt mezo-kitoltessel.

## 1. Uj Edge Function: `extract-invoice-data`

**Fajl:** `supabase/functions/extract-invoice-data/index.ts`

- A `generate-food-image` mintat kovetjuk (CORS, LOVABLE_API_KEY, hibakezel es)
- Input: `{ image_url: string }` — a feltoltott kep/PDF signed URL-je
- A Lovable AI Gateway-t hivja: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-2.5-flash` (a szoveges/vizualis ertelmezesre optimalizalt; a `-image` modell kep generalasr a valo, nem kep elemzesre)
- A prompt a user message-ben megy, az image URL-t mint kep tartalmat kuldjuk el (multimodal uzenetkent)
- Tool calling-ot hasznalunk a strukturalt JSON kinyeresere (nem raw JSON-t kerunk a modelltol)
- Tool definition: `extract_invoice_data` fuggveny a kovetkezo parameterekkel:
  - `partner_name`, `partner_tax_id`, `invoice_number`
  - `issue_date` (YYYY-MM-DD), `due_date` (YYYY-MM-DD)
  - `gross_amount` (integer, HUF), `vat_rate` (27, 5, vagy 0)
  - `category` (ingredients, utility, rent, equipment, salary, tax, other)
  - `line_items` (array: description, quantity, unit_price, line_total)
- 429/402 hibak kezelese toast-baratan
- Timeout: a kliens oldalon 30 masodperces AbortController

**Fajl:** `supabase/config.toml`

- Uj szekci o: `[functions.extract-invoice-data]` verify_jwt = false

## 2. InvoiceFileUpload bovitese

**Fajl:** `src/components/admin/InvoiceFileUpload.tsx`

- Uj prop: `onExtracted?: (data: ExtractedInvoiceData) => void`
- Uj state: `extracting: boolean`
- Ha van legalabb egy kep URL a `fileUrls`-ben, megjelenik egy "AI kitoltes" gomb (Wand2 ikon, lucide-react)
- Kattintasra: az elso kep URL-t elkuldi az `extract-invoice-data` edge function-nek
- Loading: "Szamla feldolgozasa..." szoveg animalt pulzalassal
- Siker: meghivja az `onExtracted` callback-et
- Hiba: `toast.error("Nem sikerult szamla adatokat felismerni")`
- 30mp timeout AbortController-rel

## 3. InvoiceFormDialog bovitese

**Fajl:** `src/components/admin/InvoiceFormDialog.tsx`

- Uj state: `aiFilledFields: Set<string>` — az AI altal kitoltott mezok neveit tarolja
- Az `InvoiceFileUpload` komponensnek atadjuk az `onExtracted` callback-et
- A callback logikaja: vegigmegy az AI altal visszaadott mezokon, es **csak az ures** mezoket tolti ki
  - pl. ha `form.partner_name` ures es az AI adott partner_name-et, kitolti es hozzaadja az `aiFilledFields`-hez
  - Ha a mezo mar ki van toltve, nem irja felul
- Az AI altal kitoltott mezok vilagos sarga hatteret kapnak: `bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300`
- Ha a user modositja az AI-kitoltott mezot, torlodik a sarga jeloles (eltavolitjuk az `aiFilledFields`-bol)
- Toast: `toast.success("AI kitoltotte a szamla adatait — kerlek ellenorizd!")`
- A `category` mezo mapping: az AI "ingredients"-et ad vissza -> a form "ingredient"-et var, tehat egy egyszeru mapping szotar kell

## Erintett fajlok

| Fajl | Muvelet |
|------|---------|
| `supabase/functions/extract-invoice-data/index.ts` | **UJ** — edge function |
| `supabase/config.toml` | Modositas — uj function szekci o |
| `src/components/admin/InvoiceFileUpload.tsx` | Modositas — AI gomb + extracting logika |
| `src/components/admin/InvoiceFormDialog.tsx` | Modositas — AI adatok fogadasa + sarga jeloles |

## Technikai reszletek

### Edge function AI hivas

A multimodal kerest igy epitjuk fel:

```text
messages: [
  {
    role: "user",
    content: [
      { type: "image_url", image_url: { url: imageUrl } },
      { type: "text", text: "Extract all data from this Hungarian invoice/receipt image." }
    ]
  }
]
tools: [ { type: "function", function: { name: "extract_invoice_data", ... } } ]
tool_choice: { type: "function", function: { name: "extract_invoice_data" } }
```

A tool calling valaszt igy olvassuk ki:
```text
const toolCall = aiData.choices[0].message.tool_calls[0];
const extracted = JSON.parse(toolCall.function.arguments);
```

### Kategoria mapping

Az AI "ingredients" -> form "ingredient", "utility" -> "utility", stb. Egy egyszeru objektum:
```text
const CATEGORY_MAP: Record<string, string> = {
  ingredients: "ingredient",
  utility: "utility",
  rent: "rent",
  equipment: "equipment",
  salary: "salary",
  tax: "tax",
  other: "other",
};
```

### Sarga jeloles CSS

Az AI altal kitoltott Input/Select mezoket egy wrapper `div`-vel vagy kozvetlenul a `className`-jukra alkalmazott felteteles stilussal jeloljuk:
```text
className={cn("...", aiFilledFields.has("partner_name") && "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300")}
```

