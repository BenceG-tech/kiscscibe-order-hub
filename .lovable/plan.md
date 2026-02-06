

# Jogi Oldalak Admin Szerkeszto

## Attekintes

A 4 jogi oldal (Impresszum, Adatvedelmi Tajekoztato, ASZF, Suti Szabalyzat) tartalmat az admin feluleten szerkeszthetove tesszuk. A tartalom a meglevo `settings` tablaban tarolodik JSON formatumban, es a jogi oldalak dinamikusan toltik be onnan.

## Megoldas

A `settings` tabla mar letezik (`key` + `value_json` oszlopokkal) es admin-only RLS-sel van vedve. Minden jogi oldalhoz egy-egy settings rekordot hozunk letre (pl. `legal_impresszum`, `legal_privacy`, stb.), ahol a `value_json` tartalmazza a szekciokat strukturalt JSON-kent.

### Adatstruktura

Minden jogi oldal tartalma szekciokkent tarolodik:

```text
settings.key = "legal_impresszum"
settings.value_json = {
  "heroTitle": "Impresszum",
  "heroSubtitle": "Jogi informaciok",
  "lastUpdated": "2026. februar 6.",
  "sections": [
    {
      "id": "uzemelteto",
      "title": "Uzemelteto adatai",
      "content": "<HTML tartalom>"
    },
    {
      "id": "kapcsolat",
      "title": "Kapcsolattartasi adatok",
      "content": "<HTML tartalom>"
    }
  ]
}
```

### Adminisztracios felulet

Uj admin oldal: `/admin/legal` - "Jogi oldalak" tab az admin navigacioban.

Funkciok:
- 4 jogi oldal kozotti valtas tabokkal (Impresszum, Adatvedelem, ASZF, Cookie)
- Minden oldalhoz: hero cim/alcim szerkesztes
- Szekcionkent: cim szerkesztes + tartalom szerkesztes (textarea, HTML-kent)
- Szekciok hozzaadasa / torlese / atsortolasa
- "Utolso frissites" datum automatikus vagy kezi beallitasa
- Azonnali elo elonezet link az oldalhoz
- Mentes gomb (upsert a settings tablaba)

### Kepernyoterv (Desktop)

```text
+--------------------------------------------------+
| Admin Header                                     |
+--------------------------------------------------+
| Rendelesek | Etlap | Napi | Galeria | [Jogi]     |
+--------------------------------------------------+
| Jogi oldalak kezelese                            |
| Szerkessze a weboldal jogi tartalmait            |
+--------------------------------------------------+
| [Impresszum] [Adatvedelem] [ASZF] [Cookie]      |
+--------------------------------------------------+
| Hero cim:    [___________________________]       |
| Hero alcim:  [___________________________]       |
| Frissites:   [___________________________]       |
+--------------------------------------------------+
| Szekciok:                                        |
| +----------------------------------------------+ |
| | Szekci cim: [Uzemelteto adatai           ]   | |
| | Tartalom:                                    | |
| | [                                          ] | |
| | [  <textarea nagy>                         ] | |
| | [                                          ] | |
| | [Torles] [Mozgatas fel/le]                   | |
| +----------------------------------------------+ |
| +----------------------------------------------+ |
| | Szekci cim: [Kapcsolat                   ]   | |
| | ...                                          | |
| +----------------------------------------------+ |
| [+ Uj szekci hozzaadasa]                        |
+--------------------------------------------------+
| [Mentes]                    [Megtekintes ->]     |
+--------------------------------------------------+
```

### Kepernyoterv (Mobile)

```text
+------------------------+
| Admin Header           |
+------------------------+
| Tabs: scroll-x         |
+------------------------+
| Jogi oldalak           |
+------------------------+
| [Impresszum] [Adatv..] |
| [ASZF] [Cookie]        |
+------------------------+
| Hero cim: [________]  |
| Alcim:    [________]  |
| Frissites:[________]  |
+------------------------+
| Szekci 1               |
| Cim: [______________]  |
| Tartalom:              |
| [                    ]  |
| [  textarea          ]  |
| [                    ]  |
| [Torles] [Fel] [Le]    |
+------------------------+
| Szekci 2               |
| ...                     |
+------------------------+
| [+ Uj szekci]          |
+------------------------+
| [Mentes] [Megtekintes] |
+------------------------+
```

## Erintett fajlok

### Uj fajlok

| Fajl | Leiras |
|------|--------|
| `src/pages/admin/LegalPages.tsx` | Admin oldal komponens (route wrapper) |
| `src/components/admin/LegalPageEditor.tsx` | Fo szerkeszto komponens tabokkal |

### Modositando fajlok

| Fajl | Valtoztatas |
|------|-------------|
| `src/pages/admin/AdminLayout.tsx` | Uj "Jogi" nav tab hozzaadasa (Scale/FileText ikon) |
| `src/App.tsx` | Uj admin route: `/admin/legal` |
| `src/pages/legal/Impresszum.tsx` | Dinamikus tartalom betoltes a `settings` tablabol |
| `src/pages/legal/PrivacyPolicy.tsx` | Dinamikus tartalom betoltes a `settings` tablabol |
| `src/pages/legal/TermsAndConditions.tsx` | Dinamikus tartalom betoltes a `settings` tablabol |
| `src/pages/legal/CookiePolicy.tsx` | Dinamikus tartalom betoltes a `settings` tablabol |

### Nincs adatbazis migracio szukseges

A `settings` tabla mar letezik es alkalmas a tartalom tarolasara. Az RLS policyk mar helyen vannak (admin-only read/write). A jogi oldalak kezdo tartalma az elso admin szerkesztessel kerul be a tablaba; addig a jelenlegi hardcoded tartalom jelenik meg fallback-kent.

## Technikai reszletek

### Settings tabla hasznalat

4 uj settings rekord (automatikusan letrehozva elso menteskor):

| key | Tartalom |
|-----|----------|
| `legal_impresszum` | Impresszum oldal tartalma |
| `legal_privacy` | Adatvedelmi Tajekoztato tartalma |
| `legal_terms` | ASZF tartalma |
| `legal_cookies` | Cookie Szabalyzat tartalma |

### Admin szerkeszto komponens (`LegalPageEditor.tsx`)

Funkciok:
- `useQuery` a `settings` tabla olvasasara (4 kulcs lekerese)
- Tabokkal valtas az oldalak kozott
- Minden szekci Card-ban: cim input + tartalom textarea (nagy, resizable)
- Szekciok hozzaadasa/torlese/atsortolasa gombokkal
- `useMutation` upsert-tel a `settings` tablaba mentesk
- Toast visszajelzes mentes utan
- "Megtekintes" link ami uj tabon nyitja meg a jogi oldalt
- Loading es saving allapotok kezelese
- Responsive: mobile-on a tabok horizontalisan scrollozhatok, a textarea teljes szelessegu

### Jogi oldalak modositasa

A 4 jogi oldal kapni fog egy kozos React hook-ot (`useLegalContent`) ami:
1. Lekeri a megfelelo `settings` rekordot (pl. `legal_impresszum`)
2. Ha letezik adat: a JSON-bol epitik fel a szekciokat dinamikusan
3. Ha nincs adat (ures DB): a jelenlegi hardcoded tartalom jelenik meg (fallback)
4. Loading allapotban skeleton loader

### HTML rendereles

A szekciok tartalma HTML formatumban tarolodik a textarea-ban es `dangerouslySetInnerHTML`-lel jelenik meg a publikus oldalakon. Ez lehetove teszi tablazatok, listak, linkek hasznalatát a jogi szovegekben. A biztonsag nem problema, mert:
- Csak admin irhatja a tartalmat (RLS)
- Nem felhasznaloi input, hanem megbizott admin altal irt tartalom

### Felhasznaloi elmeny

1. Admin bejelentkezik -> Admin panel -> "Jogi" tab
2. Valaszt egy oldalt (pl. Impresszum)
3. Szerkeszti a hero cimet, szekciok cimet/tartalmat
4. "Mentes" gombbal ment
5. "Megtekintes" gombbal ellenorzi az elo oldalt
6. A publikus oldalon azonnal megjelenik az uj tartalom

### Elso hasznalat

Az elso admin latasogataskor a szerkeszto ures lesz. A "Feltoltes az alapertelmezett tartalommal" gomb lehetove teszi, hogy az aktualis hardcoded tartalom automatikusan betoltodjon a szerkesztobe - igy az admin nem indul ures lappal, hanem a meglevo tartalmat modosithatja.

