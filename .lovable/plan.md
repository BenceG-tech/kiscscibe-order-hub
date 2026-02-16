
# PromoSection hamis ar eltavolitasa

## Osszefoglalas

A `PromoSection.tsx` komponensben levo hamis "eredeti ar" athuzott megjelenitest toroljuk. Jelenleg a valos arhoz +500 Ft-ot ad hozza es azt athuzva mutatja, ami megtetveszto arfeltuntetes.

## Valtoztatások

**Fajl:** `src/components/sections/PromoSection.tsx`

1. Toroljuk az `originalPrice` valtozot (51. sor) es a `displayOriginal` valtozot (53. sor)
2. Desktop layout (89. sor): toroljuk az athuzott ar sort (`<p className="... line-through">{displayOriginal} Ft</p>`)
3. Mobil layout (136. sor): toroljuk az athuzott ar sort (`<p className="... line-through">{displayOriginal} Ft</p>`)

**Eredmeny:** Csak a valos menuarat mutatjuk ("2.200 Ft"), hamis kedvezmeny nelkul.
