

# Javitasok: USP, Reviews es Napi Menu adagszam eltavolitasa

## Azonositott problemak

A kepernyokepek es a bongeszo ellenorzes alapjan harom fo problema van:

### 1. USP Szekcio (Ertekeink) - Horizontalis scroll nem mukodik jol mobilon
A kartyak egyenkent jelennek meg a horizontalis scrollban, es tul nagy fuggoleges helyet foglalnak el. Egy kartya (pl. "Gyors kiszolgalas") szinte az egesz kepernyon vegighuzodik, a leiras szoveg pedig levag. Ez rosszabb felhasznaloi elmeny mint a korabbi grid megoldas.

**Javitas**: A horizontalis scrollt lecsereljuk **2x2 kompakt grid**-re mobilon. Ez 4 kartya egyetlen kompakt blokkban - sokkal helytakarekosabb es attekinthetobb. A kartyak kisebb padding-et es meretet kapnak mobilon.

### 2. Reviews Szekcio (Velemenyek) - Karusszel tul nagy ures terekkel
A horizontalis karusszel mobilon tul szeles kartyakat (`min-w-[85vw]`) hasznal, es a header (4.7 ertekeles resz) es a kartya kozott nagy az ures ter. A velemeny szoveg kilog a kartya szelein.

**Javitas**: A horizontalis scrollt lecsereljuk **egyetlen kiemelt velemeny kartya**ra mobilon, ami egyszerre egy velemenyt mutat kompaktan, az ertekeles header kozvetlenul felette. Alternativ megoldas: a kartyak szelesseget csokkentjuk es a margokat javitjuk, hogy a szoveg ne logjon ki.

### 3. Napi Menu - "Elerheto adagok" szam eltavolitasa
A `DailyMenuPanel` komponens jelenleg mutatja a hatralevo adagok szamat a vasarloknak ("Elerheto adagok: 30"). Ezt el kell tavolitani a vasarloi feluletrol - az admin feluleten maradhat.

---

## Technikai reszletek

### Modositando fajlok

| Fajl | Valtozas |
|------|---------|
| `src/components/sections/USPSection.tsx` | Mobilon 2x2 grid a horizontalis scroll helyett |
| `src/components/sections/ReviewsSection.tsx` | Kompaktabb mobil megjelenes, javitott karusszel |
| `src/components/DailyMenuPanel.tsx` | "Elerheto adagok" resz eltavolitasa a CTA szekciobol |

### USPSection.tsx valtozasok

A jelenlegi mobil resz (42-61. sorok) - horizontalis snap-scroll:
```text
JELENLEGI (hibas):
  <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory ...">
    kartyak min-w-[260px] snap-center ...
  </div>

JAVITOTT:
  <div className="md:hidden grid grid-cols-2 gap-3">
    kartyak kisebb padding-gel (p-4), kisebb ikon (w-10 h-10),
    kisebb cim (text-base), kisebb leiras (text-xs)
  </div>
```

A 2x2 grid mobilon 4 kompakt kartyat mutat egymas mellett, sokkal kevesebb fuggoleges helyet igenyel es nincs scrollozasi problema.

### ReviewsSection.tsx valtozasok

A jelenlegi mobil resz (140-147. sorok) - horizontalis snap-scroll:
```text
JELENLEGI (hibas):
  <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory ...">
    kartyak min-w-[85vw] snap-center ...
  </div>
  
  Nagy gap a header es a kartyak kozott

JAVITOTT:
  <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory ... gap-3">
    kartyak min-w-[80vw] snap-start (nem snap-center)
    A header mb csokkentese (mb-6 -> mb-4)
  </div>
  
  A kartyak snap-start-ra valtoznak, igy az elso kartya a bal szelen indul
  es nincs felesleges ures ter a kartyak elott.
```

### DailyMenuPanel.tsx valtozasok

Az "Elerheto adagok" resz eltavolitasa (177-186. sorok):
```text
JELENLEGI:
  {/* Availability badge */}
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-primary/20 rounded-full ...">
      <ChefHat />
    </div>
    <div>
      <p>"Elerheto adagok"</p>
      <p>{menuData.menu_remaining_portions}</p>
    </div>
  </div>

JAVITOTT:
  Teljesen eltavolitva. A CTA szekcio csak a "Menu kosarba" gombot tartalmazza,
  kozepre igazitva, teljes szelessegben.
```

A CTA resz egyszerubb lesz: csak a gomb marad, kozepre igazitva, ami tisztabb es konverziora fokuszaltabb megjelenest ad.

