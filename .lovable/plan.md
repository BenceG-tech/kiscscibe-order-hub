

# FB Kep Generalas: Het-navigacio hozzaadasa

## Problema

A jelenlegi FB kep generalas oldal (`DailyOfferImageGenerator`) mindig csak az aktualis het hetfojetol pentekig mutat napokat. Pentek delutan mar nincs ertelme -- a kovetkezo hetet kell elore elkesziteni, de arra nincs lehetoseg navigalni.

## Megoldas

Het-valaszto navigacio hozzaadasa elozo/kovetkezo het gombokkal, hogy az admin barmely het napjaira tudjon FB kepet generalni.

### Valtozasok a `DailyOfferImageGenerator.tsx`-ben

1. **Uj state: `weekOffset`** (szam, 0 = aktualis het, 1 = jovo het, -1 = elozo het)
2. **`getWeekDates(offset)` bovitese**: az offset alapjan szamolja a hetet
3. **Elozo/Kovetkezo het gombok**: ket nyil gomb a nap-valaszto felett, kozepen az aktualis het datuma (pl. "Feb. 16 - Feb. 20.")
4. **"Mai het" gomb**: gyors visszaugras az aktualis hetre
5. **Alapertelmezett kivalasztott nap**: ha jovo hetre navigalunk, automatikusan a hetfo legyen kivalasztva

### UI terv

```text
     [<]   Febr. 16. - Febr. 20.   [>]   [Mai het]
     
     H, febr. 16.  K, febr. 17.  Sze, febr. 18.  ...
```

### Erintett fajlok

| Fajl | Valtozas |
|------|----------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | weekOffset state, het-navigacio gombok, getWeekDates bovitese |

### Nem modosul
- Adatbazis
- Canvas rajzolas logika
- Feltoltes/torles logika
- Egyeb oldalak

