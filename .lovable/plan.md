

# Velemenyek Szekcio - Mobil Javitas

## Problema

A jelenlegi horizontalis karusszel mobilon nem mukodik jol:
- A velemeny szoveg kilog a kartya jobbszelel ("A rantotta tejs...")
- A kartyak tul szelesek es nem fernek el rendesen
- Feleslegesen bonyolult interakcio (gorgetes oldalra)

## Megoldas

A horizontalis karusszelt **teljes szelessegu, fuggolges velemeny kartyakra** csereljuk mobilon. Harom kompakt, egymasan allo kartya, aminek a szovege **nem log ki** es teljesen olvashato.

### Design elvek:
- Nincs horizontalis scroll - egyszeruen egymas ala kerulnek a kartyak
- Kisebb padding es fontmeretek mobilon a kompaktsagert
- A velemeny szoveg **max 2-3 soros** modon megjelenik - nem vagja le
- Az avatar, nev es csillagok **egy sorban** a helytakarekossagert
- A kartyak kozott kicsi gap (`gap-3`)

### Kartya mobilon:
```text
+------------------------------------------+
| [KJ] Kovacs Janos ✓  ★★★★★   2 hete     |
| "Fantasztikus reggelik es kedves          |
|  kiszolgalas! A rantotta tejszines..."    |
+------------------------------------------+
```

A kartya elemei:
- Felso sor: Avatar (kisebb, `w-8 h-8`), nev, verified badge, csillagok es datum - mind egy sorban
- Also resz: Velemeny szoveg teljes szelessegben, `text-sm`, `line-clamp-3` (max 3 sor)
- Padding: `p-4` (kompakt de olvasható)

## Technikai reszletek

### Modositando fajl

| Fajl | Valtozas |
|------|---------|
| `src/components/sections/ReviewsSection.tsx` | Mobil: fuggoleges kartya lista a karusszel helyett, kompaktabb kartya design |

### Reszletes valtozasok

**1. Mobil review kartya (ReviewCard) - kisebb, kompaktabb mobilon:**
- Avatar: `w-8 h-8` mobilon (jelenleg `w-10 h-10`)
- A header reszt atalakitjuk: nev + csillagok + datum egy sorba fer
- Velemeny szoveg: `text-sm` + `line-clamp-3` mobilon (soha nem log ki)
- CardContent padding: `p-4` mobilon (jelenleg `p-5`)
- Az idezojel dekoracio kisebb mobilon (`text-4xl` az `text-6xl` helyett)

**2. Mobil kontener (140-147. sorok) - karusszel lecserelese:**
```text
JELENLEGI:
  <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory ...">
    <div className="min-w-[80vw] snap-start ...">
      <ReviewCard />
    </div>
  </div>

JAVITOTT:
  <div className="md:hidden flex flex-col gap-3">
    {reviews.slice(0, 3).map(...)}
      <ReviewCard />
    )}
  </div>
```

Egyszeruen `flex flex-col gap-3` - harom kartya egymas ala, teljes szelessegben, semmi kilogas.

**3. Desktop nezet** - valtozatlan marad (3 oszlopos grid).

Ez a legegyszerubb es legmegbizhatobb megoldas mobilon - nincs scroll, nincs kilogas, minden kartya pontosan elfér a kepernyon.
