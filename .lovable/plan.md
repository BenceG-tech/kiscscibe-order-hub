

# Koret valaszto, telefonszam, visszaigazolas es Ertekeink javitasok

## 1. Koret valaszto: Csak a napi kinlalatot mutassa + "Nem kerek koretet" opcio

### Problema
A `SidePickerModal` jelenleg az osszes aktiv koretet lekerdezi 3 kategoriabol (Koretek, Extra koretek, Hagyomanyos koretek) -- ez 20+ tetel. A felhasznalo egy vegtelen listat lat, ahelyett hogy csak az aznapi kinalatbol valaszthatna.

### Megoldas
- A `SidePickerModal` kap egy uj opcionalis propot: `dailyDate` es `dailyOfferId`
- Ha megadva, eloszor a `daily_offer_items` tablabol kerdezi le az adott napra feltoletott koreteket (ahol `is_menu_part = false` es a kategoria koret kategoria)
- Ha nincsenek napi koretek, fallback a jelenlegi altalanos lekerdezesre
- Mindig megjelenik egy "Nem kerek koretet" gomb a lista aljaan (vagy tetejen), ami ures tomb-el hivja az `onSideSelected`-et

### Admin oldali beallitas
- Az admin mar most is a `daily_offer_items` tablan keresztul tolthet fel napi tételeket -- a koreteket is ide kell felvenni a napi ajanlat mellé. Nincs kulon admin UI valtozas szukseges, a meglevo rendszer tamogatja.

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/SidePickerModal.tsx` | Uj `dailyDate`/`dailyOfferId` prop, napi koretek lekerdezese, "Nem kerek koretet" gomb |
| `src/pages/Etlap.tsx` | `dailyOfferId` atadasa a `SidePickerModal`-nak |

---

## 2. Telefonszam: +36 fix prefix

### Problema
A telefonszam mezo ures, a felhasznalonak kell begernie a +36-ot is.

### Megoldas
- A `formData.phone` alapertelmezett erteke "+36 " legyen
- A mezo ele vizualisan egy "+36" prefix jelenik meg (InputGroup-szeru megoldas), es a tényleges input mezo csak a szamot varja (20 123 4567)
- Alternativ egyszerubb megoldas: a phone mezo default erteke "+36 " es a felhasznalo csak a szamot irja utana
- A legegyszerubb: az Input ele egy fix "+36" felirat kerul, es a phone erteke automatikusan "+36"-tal kezdodik

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/pages/Checkout.tsx` | Phone input atiras: fix "+36" prefix + input mezo a maradek szamhoz |

---

## 3. Rendeles visszaigazolas: etterem adatok az email aljara

### Problema
A rendelés-visszaigazolo email aljaan csak "Kiscsibe Etterem" all, nincs cim, nyitvatartás, vagy egyeb hasznos info.

### Megoldas
- Az `submit-order` edge function email sablonjaba (emailHtml) kerul egy footer szekció:
  - Kiscsibe Etterem
  - Cim (az etterem tenyleges cime)
  - Nyitvatartás roviden
  - Facebook link
- Ugyanez az `OrderConfirmation.tsx` oldalon is megjelenik egy info kartya formajaban

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `supabase/functions/submit-order/index.ts` | Email sablon footer bovitese etterem adatokkal |
| `src/pages/OrderConfirmation.tsx` | Etterem info kartya hozzaadasa (cim, nyitvatartas) |

---

## 4. "Ertekeink" szekció: dinamikus, adminbol szerkesztheto

### Problema
A fooldal `USPSection` komponense hardkodolt 4 erteket mutat (Hazias izek, Gyors kiszolgalas, Nagy adagok, Kedvezo arak). Az admin a Rolunk oldalon mar szerkesztheti az "Ertekeinket" a `settings` tablan keresztul (`about_page` kulcs, `values` mezo), de ez NEM jelenik meg a fooldalan -- csak a `/about` oldalon.

### Megoldas
- A `USPSection` komponens lekerdezi a `settings` tablabol az `about_page` kulcs `values` mezojet
- Ha talal adatot, azt jeleníti meg; ha nem, a jelenlegi hardkodolt ertekek maradnak fallback-kent
- Az ikon mapping a meglevo `ICON_MAP`-bol jon (ugyanaz mint az About oldalon)

### Erintett fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/sections/USPSection.tsx` | `useQuery` hozzaadasa a `settings` tablabol, dinamikus ertekek megjelenitese |

---

## Technikai osszefoglalas

### Modositando fajlok
| Fajl | Valtozas |
|------|----------|
| `src/components/SidePickerModal.tsx` | Napi koretek, "Nem kerek" opcio |
| `src/pages/Etlap.tsx` | dailyOfferId atadasa |
| `src/pages/Checkout.tsx` | +36 prefix |
| `supabase/functions/submit-order/index.ts` | Email footer |
| `src/pages/OrderConfirmation.tsx` | Etterem info kartya |
| `src/components/sections/USPSection.tsx` | Dinamikus ertekek |

### Nem modosul
- Adatbazis sema (nincs migracio)
- Admin feluletek
- Staff/KDS oldalak
- Cart/kosár logika
- Meglevo RLS szabalyok

