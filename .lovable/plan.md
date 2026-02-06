

# Jogi Oldalak Szerkeszto - Felhasznalobaratabb Admin Felulet

## Problema

Jelenleg az admin szerkesztoben nyers HTML kod latszik a textarea-ban (pl. `<p><strong>Cegnev:</strong>...</p>`). Ez osszezavarja a tulajdonost, aki nem ert a HTML-hez. O csak a szoveget szeretne kenyelmesen kitolteni/szerkeszteni.

## Megoldas

A nyers HTML textarea-t lecsereljuk egy egyszeru, **Markdown-szeru plain text** szerkesztore. Az admin sima szoveget ir, es a rendszer automatikusan generalja belole a HTML-t a publikus oldalon.

### Amit az admin lat (ELOTTE vs UTANA)

**Elotte (jelenlegi allapot):**
```text
Tartalom (HTML):
<p><strong>Cegnev:</strong> Kiscsibe Reggelizo & Etterem Kft.</p>
<p><strong>Szekhely:</strong> 1145 Budapest, Vezer utca 12.</p>
<p><strong>Cegjegyzekszam:</strong> [PLACEHOLDER]</p>
```

**Utana (uj megoldas):**
```text
Tartalom:
**Cegnev:** Kiscsibe Reggelizo & Etterem Kft.
**Szekhely:** 1145 Budapest, Vezer utca 12.
**Cegjegyzekszam:** [Toltse ki]
```

### Tamogatott formatazas

Az admin egyszeru jelzeseket hasznalhat a formatazashoz (amelyek a textarea felett tippkent megjelennek):

| Amit az admin ir | Ami megjelenik az oldalon |
|---|---|
| `**felkover szoveg**` | **felkover szoveg** |
| `- listaelem` | felsorolas pont |
| Ures sor | uj bekezdes |
| `[szoveg](https://link.hu)` | kattinthato link |

### Formatazasi segitseg

A textarea felett egy kis segitseg/tipp sav jelenik meg, ami peldakat mutat:
- "**felkover**" = felkover
- "- elem" = felsorolas
- Ures sor = uj bekezdes
- "[szoveg](link)" = hivatkozas

Ez segit az adminnak anelkul, hogy HTML-t kellene ismernie.

---

## Technikai reszletek

### Uj fajl

| Fajl | Leiras |
|---|---|
| `src/lib/simpleMarkdown.ts` | Egyszeru markdown-to-HTML konverter fuggveny |

### Modositando fajlok

| Fajl | Valtoztatas |
|---|---|
| `src/components/admin/LegalPageEditor.tsx` | Textarea label "Tartalom (HTML)" -> "Tartalom", formatazasi tippek hozzaadasa, alapertelmezett tartalmak atirasa plain text-re |
| `src/pages/legal/Impresszum.tsx` | `dangerouslySetInnerHTML` elott markdown->HTML konverzio |
| `src/pages/legal/PrivacyPolicy.tsx` | Ugyanaz |
| `src/pages/legal/TermsAndConditions.tsx` | Ugyanaz |
| `src/pages/legal/CookiePolicy.tsx` | Ugyanaz |
| `src/hooks/useLegalContent.ts` | A hook automatikusan konvertalja a tarolt markdown-ot HTML-re, igy a jogi oldalak nem valtoznak |

### Markdown konverter (`simpleMarkdown.ts`)

Egy egyszeru, sajat konverter fuggveny (nem kell kulso konyvtar):

Szabalyok:
1. `**szoveg**` -> `<strong>szoveg</strong>`
2. `- elem` (sor elejen) -> `<li>elem</li>`, csoportositva `<ul>`-be
3. Ures sor -> uj `<p>` bekezdes
4. `[szoveg](url)` -> `<a href="url">szoveg</a>`
5. Sima sor -> `<p>` tagbe kerul
6. Ha a tartalom mar HTML tag-eket tartalmaz (`<p>`, `<strong>`, stb.) -> ugy adja vissza ahogy van (visszafele kompatibilitas a regi tartalommal)

### Visszafele kompatibilitas

A konverter felismeri, ha a tartalom mar HTML formatumu (tartalmaz `<p>`, `<ul>`, `<table>` tageket). Ebben az esetben valtozatlanul hagyja - igy a mar elmentett HTML tartalom tovabbra is jol jelenik meg, es az admin fokozatosan cserelheti le markdown-ra ahogy szerkeszti az oldalakat.

### Alapertelmezett tartalom atiras

A `DEFAULT_CONTENT` objektum a `LegalPageEditor.tsx`-ben atirodik HTML-rol plain text/markdown formatumra. Pelda:

Impresszum "Uzemelteto adatai" szekci:
```text
**Cegnev:** Kiscsibe Reggelizo & Etterem Kft.
**Szekhely:** 1145 Budapest, Vezer utca 12.
**Cegjegyzekszam:** [Toltse ki a cegjegyzekszamot]
**Adoszam:** [Toltse ki az adoszamot]
**Nyilvantarto birosag:** [Toltse ki - pl. Fovarosi Torvenyszek Cegbirosaga]
```

### Felhasznaloi elmeny

1. Admin megnyitja a Jogi szerkesztot
2. Betolti az alapertelmezett tartalmat (ami most mar tiszta szoveg, nem HTML)
3. Kitolti a `[Toltse ki]` mezoket a valos adatokkal
4. Formaz szoveget egyszeru jelzesekkel: `**felkover**`, `- lista`, ures sor
5. A textarea felett lathato tippek segitik
6. Mentes utan a publikus oldalon szepen formatazva jelenik meg

