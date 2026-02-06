

# Newsletter & Kapcsolati Urlap Backend Bekotes

## Jelenlegi allapot

- **Newsletter**: A feliratkozas `setTimeout`-tal szimulalt, nem ment adatbazisba
- **Kapcsolati urlap**: Szinten `setTimeout`-tal szimulalt, nem kuld emailt
- **Meglevo infrastruktura**: A `subscribers` tabla mar letezik Supabase-ben (email + created_at), RLS engedelyezi az INSERT-et barki szamara. A `RESEND_API_KEY` secret mar konfiguralt.

---

## Valtoztatasok

### 1. Newsletter feliratkozas bekotese (Supabase insert)

**Fajl:** `src/components/sections/NewsletterSection.tsx`

A szimulalt `setTimeout` lecserelese valodi Supabase insert-re:
- Import `supabase` kliens
- `supabase.from('subscribers').insert({ email })` hivas
- Duplikat email kezeles (ha mar letezik, baratsagos uzenet: "Mar feliratkoztal!")
- Zod validacio az email formaatumra (max 255 karakter)
- Sikeres feliratkozas eseten toast uzenetet mutat

### 2. Kapcsolati urlap edge function (`send-contact-email`)

**Uj fajl:** `supabase/functions/send-contact-email/index.ts`

Egy uj edge function ami:
- Fogadja a nevet, emailt, telefont, uzenetet
- Zod-szeru validaciot vegez server-oldalon (max hosszak: nev 100, email 255, telefon 30, uzenet 2000 karakter)
- HTML-escape-eli a felhasznaloi inputot (XSS vedelem az email sablonban)
- Resend-del emailt kuld a `kiscsibeetterem@gmail.com` cimre
- Valasz-emailt kuld a feladonak is (megerosites hogy megkaptuk)
- CORS headerek a web-hivashoz

**Config:** `supabase/config.toml` bovul: `[functions.send-contact-email]` `verify_jwt = false`

### 3. Kapcsolati oldal bekotese

**Fajl:** `src/pages/Contact.tsx`

- A szimulalt `setTimeout` lecserelese az edge function hivasra
- Kliens-oldali validacio hozzaadasa (nev, email kotelezo; max hosszak)
- Hibakezelest (halozati hiba, szerver hiba)
- Loading allapot megtartasa

---

## Technikai reszletek

### Newsletter flow

```text
Felhasznalo megadja emailt
  -> Kliens oldali email validacio (format + max 255 char)
  -> supabase.from('subscribers').insert({ email })
  -> Ha siker: "Sikeres feliratkozas!" toast
  -> Ha duplikat (23505 error code): "Mar feliratkoztal!" toast  
  -> Ha egyeb hiba: "Hiba tortent" toast
```

### Kapcsolati urlap flow

```text
Felhasznalo kitolti az urlapot
  -> Kliens oldali validacio (nev <= 100, email <= 255, telefon <= 30, uzenet <= 2000)
  -> supabase.functions.invoke('send-contact-email', { body: formData })
  -> Edge function:
     1. Server-oldali validacio (hossz limitek + kotelezo mezok)
     2. HTML escape a felhasznaloi inputon
     3. Resend email -> kiscsibeetterem@gmail.com (az urlap tartalmaval)
     4. Resend email -> felado email (megerosites)
  -> Ha siker: "Uzenet elkuldve!" toast
  -> Ha hiba: "Hiba tortent" toast
```

### Email sablon (kapcsolati urlap -> admin)

Subject: `Uj uzenet a weboldalrol - [Nev]`

Tartalom:
- Felado neve, emailje, telefonja
- Az uzenet szovege
- Kuldesi idopont

### Email sablon (megerosites -> felado)

Subject: `Kiscsibe - Megkaptuk uzenet`

Tartalom:
- Koszonjuk az uzenetét
- 24 oran belul valaszolunk
- Kiscsibe elerhetosegek

### HTML Escape (XSS vedelem)

Az edge function-ben minden felhasznaloi input HTML-escape-elve lesz mielott az email sablonba kerul:
- `<` -> `&lt;`
- `>` -> `&gt;`
- `&` -> `&amp;`
- `"` -> `&quot;`
- `'` -> `&#39;`

---

## Erintett fajlok

| Fajl | Tipus | Valtoztatas |
|------|-------|-------------|
| `src/components/sections/NewsletterSection.tsx` | Modositas | setTimeout -> Supabase insert |
| `supabase/functions/send-contact-email/index.ts` | Uj | Edge function emailkuldeshez |
| `supabase/config.toml` | Modositas | Uj function config |
| `src/pages/Contact.tsx` | Modositas | setTimeout -> edge function hivas + validacio |

---

## Biztonsagi szempontok

- Server-oldali input validacio (hossz limitek) az edge function-ben
- HTML escape megakadalyozza az XSS-t az email sablonokban
- A `subscribers` tabla RLS-e mar engedelyezi a publikus INSERT-et
- A contact form edge function `verify_jwt = false` (nem kell bejelentkezes az uzenetkuldesthez)
- A Resend API kulcs mar konfiguralt Supabase secret-kent

