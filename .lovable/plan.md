

# Mobil optimalizalas + Newsletter rendszer

Ket fo feladat van: (1) a foadmin multbeli rendelesek mobilra optimalizalasa, es (2) a newsletter feliratkozasi visszaigazolo e-mail rendszer kiepitese.

---

## 1. Admin multbeli rendelesek mobil optimalizalas

A kepernyokepe alapjan a fo problemak:
- Az osszeg (`448 Ft`, `599 Ft`) jobb oldalon levagodik mobil kepernyomeret eseten
- A rendelesi kod es a vevo neve, datum, telefon, email tul zsufolt egy sorban mobilon
- A badge ("Atveve" / "Lemondva") es a chevron ikon szinten zsufolt
- A controls bar (archivalt mutatasa switch + Osszes archivalasa gomb) szinten tul szeles

### Valtozasok a `PastOrderAdminCard` komponensen:

- **Header at layout**: mobilon a fenti sort ketsorosra valtoztatjuk:
  - Elso sor: rendelesi kod + nev + badge (balra), osszeg (jobbra)
  - Masodik sor: datum + telefon + email (kisebb betumerettel)
  - A chevron ikon es az osszeg a jobb szelre kerul, de nem vagodik le
- **Flex wrap**: `flex-wrap` hozzaadasa a fobb tarolo divekhez, hogy mobilon torjenek
- **Szoveges mezo meretek**: a telefon es email kisebb betumerettel, opcionalis truncate-tel

### Valtozasok a `PastOrdersTab` komponensen:

- **Controls bar**: mobilon vertikalis elrendezesre valtas (`flex-col` mobilon)
- A datumcsoport fejlecek kompaktabbak legyenek mobilon

### Modositando fajl:
- `src/pages/admin/OrdersManagement.tsx` - PastOrderAdminCard es PastOrdersTab mobilra optimalizalasa

---

## 2. Newsletter feliratkozasi visszaigazolo email

### Jelenlegi allapot
A feliratkozas mukodik: az email bekerul a `subscribers` tablaba. De nincs visszaigazolo email.

### Megoldas
Egy uj edge function: `send-welcome-newsletter` amely:
1. Feliratkozaskor a frontend meghivja a visszaigazolo email kuldesere
2. Az email Resend-del kerul kikuldere
3. Tartalom: "Koszonjuk a feliratkozast! Minden hetfon elkuldjuk a heti menut."

### Uj edge function: `supabase/functions/send-welcome-newsletter/index.ts`

Ez a function:
- Kap egy `email` es `name` (opcio) parametert
- Resend API-val kuld egy szep HTML emailt
- A felado: `Kiscsibe Etterem <rendeles@kiscsibe-etterem.hu>` (ugyanaz mint a rendelesi emaileknel)
- Tartalom: koszono uzenet + rovid leiras, hogy mire szamithat (heti menu hetfon)

### Frontend valtozas: `NewsletterSection.tsx`

A sikeres feliratkozas utan meghivja az uj edge function-t:
```text
await supabase.functions.invoke("send-welcome-newsletter", {
  body: { email: result.data }
});
```

### Config frissites: `supabase/config.toml`

```text
[functions.send-welcome-newsletter]
verify_jwt = false
```

---

## Technikai reszletek

### Fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `src/pages/admin/OrdersManagement.tsx` | PastOrderAdminCard mobil layout optimalizalas |
| `src/components/sections/NewsletterSection.tsx` | Visszaigazolo email kuldes feliratkozas utan |
| `supabase/functions/send-welcome-newsletter/index.ts` | Uj edge function a koszono emailhez |
| `supabase/config.toml` | Uj function konfiguracio |

### PastOrderAdminCard mobil layout terv

Jelenlegi (egy sor, tulcsordul):
```text
[icon] [#kod nev] [archivalt badge] ..... [448 Ft] [Atveve] [chevron]
       [datum telefon email]
```

Uj mobil layout (jobb torderssel):
```text
[icon] [#kod nev]                    [448 Ft]
       [datum]  [telefon]            [Atveve badge]
       [email]                       [chevron]
```

A fo valtozas a `button` className-jeben lesz: `flex-col sm:flex-row` a fobbcontainereken belul, es a jobb oldali osszeg fix szelesseggel nem csordulhat tul.

### Welcome Newsletter email tartalma

- Targy: "Koszonjuk a feliratkozast! - Kiscsibe Etterem"
- Tartalom:
  - Udvozlo fejlec
  - "Koszonjuk, hogy feliratkoztal a heti menunkre!"
  - "Minden hetfon megkapod emailben az aktualis heti menunket."
  - Ettermunk adatai (cim, telefon)
  - Leiratkozasi megjegyzes (GDPR)

A heti menu kezi kikuldeset az admin feluleten egy kesobbi feladatkent valositjuk meg, ha szukseg lesz ra.

