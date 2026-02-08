
# Admin heti menu hirlevel kikuldese

A newsletter feliratkozas es az udvozlo email mar mukodik (tesztelve, 200 OK valasz). Most az admin feluleten keszitunk egy "Hirlevel" tabot, ahol a foadmin atlathaja a feliratkozokat, megtekintheti a heti menu elozeteset, es egy gombbal kikuldeti az osszes feliratkozonak.

---

## 1. Uj Edge Function: `send-weekly-menu`

Egy uj Supabase Edge Function, amely:
- Lekerdezi az aktualis het napi ajanlat adatait a databasbol (hetfo-pentek)
- Lekerdezi az osszes feliratkozo email cimet a `subscribers` tablabol
- Generalja a szep HTML emailt a heti menuvel (nap, etelek, arak, menu jeloles)
- Elkaldi az emailt a Resend API-val az osszes feliratkozonak
- A felado: `Kiscsibe Etterem <rendeles@kiscsibe-etterem.hu>` (a verifikalt domain)

Az edge function service_role kulccsal fer hozza az adatbazishoz, hogy lathassa a feliratkozokat es a napi ajanlat adatokat.

### Email tartalom terve:

```text
Targy: "Heti menu - Kiscsibe Etterem (februar 10-14.)"

Tartalom:
- Udvozlo fejlec a Kiscsibe branddel
- Minden napra (hetfo-pentek):
  - Nap neve es datum
  - Napi menu ar (ha van)
  - Felsorolt etelek kategoriank szerint
  - Menu etelek megjelolve (leves + foetel)
- Etterem elerhertosegei
- Leiratkozasi lehetoseg (GDPR)
```

---

## 2. Admin felulet bovitese - Hirlevel tab

A `DailyMenuManagement.tsx` oldalra (Napi ajanlatok admin oldal) egy uj "Hirlevel" tabot adunk hozza.

### Tab tartalma:
- **Feliratkozok szama**: aktualis feliratkozok szamanak megjelenitese
- **Heti menu elonezet**: az aktualis het napi ajanlat adatainak megjelenitese tablazatos formaban, ugy ahogy az emailben is megjelenne
- **Kikuldesi statusz**: mikor volt legutobb kikuldve (a `settings` tablaban tarolva `newsletter_last_sent` kulcson)
- **"Heti menu kikuldese" gomb**: megnyomasa utan megerosites, majd az edge function meghivasa
- Betoltes es sikeres/sikertelen allapotok kezelese

### Uj komponens: `src/components/admin/WeeklyNewsletterPanel.tsx`

Ez a komponens:
- Lekerdezi a feliratkozok szamat
- Lekerdezi az aktualis het napi ajanlat adatait
- Megjelenitl az elonezetet
- Kezeli a kikuldest es az allapotokat

---

## 3. Konfiguracio

### `supabase/config.toml`
Uj function regisztracio:
```text
[functions.send-weekly-menu]
verify_jwt = false
```

### `settings` tabla hasznalata
A legutobbi kikuldesi idopontot a meglevo `settings` tablaban taroljuk `newsletter_last_sent` kulcson, JSON formaban: `{"sent_at": "2026-02-10T10:30:00Z", "week": "2026-02-10", "count": 42}`. Ez nem igenyel uj tablat vagy migraciot.

---

## Technikai reszletek

### Edge Function logika (send-weekly-menu)

```text
1. CORS fejlecek kezelese
2. Admin jogosultsag ellenorzes (Authorization header -> JWT dekodolas -> is_admin RPC)
3. Aktualis het hetfo-pentek datumainak generalasa
4. daily_offers + daily_offer_items + menu_items lekerdezese service_role-lal
5. subscribers tablabol osszes email lekerdezese
6. HTML email generalasa a heti menu adatokbol
7. Resend batch kuldese (max 100/batch)
8. Eredmeny visszaadasa (hany email sikeres, hibak)
9. settings tablaba mentes: newsletter_last_sent
```

### WeeklyNewsletterPanel komponens

```text
- useQuery: subscribers count, heti menu adat, settings (newsletter_last_sent)
- Megjelenitett elemek:
  - Feliratkozok szama card
  - Legutobbi kikuldesi idopont
  - Heti menu elonezet (napokra bontva, kategoriak es etelek felsorolva)
  - "Heti menu kikuldese" gomb AlertDialog megerositessel
- supabase.functions.invoke("send-weekly-menu") a gomb megnyomasakor
```

### Email HTML sablon

A heti menu email tartalma napokra bontva jelenik meg, hasonlo stilussal mint az udvozlo email (arany-barna szinsema, Kiscsibe branding). Minden napnal:
- Napi menu ar felkoverrel
- Menu etelek (leves + foetel) kulonleges jellel
- A la carte etelek normalisan felsorolva
- Kategoriak szerint csoportositva

### Fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `supabase/functions/send-weekly-menu/index.ts` | Uj edge function - heti menu kuldese feliratkozoknak |
| `src/components/admin/WeeklyNewsletterPanel.tsx` | Uj komponens - hirlevel admin panel |
| `src/pages/admin/DailyMenuManagement.tsx` | Uj "Hirlevel" tab hozzaadasa |
| `supabase/config.toml` | Uj function konfiguracio |

### Biztonsag

- Az edge function ellenorzi, hogy a hivast admin felhasznalo teszi (JWT ellenorzes)
- A subscribers tabla csak service_role-lal olvasható (meglevo RLS)
- Az email HTML-ben nincs felhasznaloi input (XSS vedelem)
- Batch kuldesi limit a Resend API-hoz igazitva

### Kesleltetes kezelese

Ha sok feliratkozo van (100+), a Resend API batch kuldesevel dolgozunk, 100 email/batch limittel. A felhasznalo latja a kuldesi folyamatot (betoltes allapot) es a vegeredmenyt (hany email kuldve).
