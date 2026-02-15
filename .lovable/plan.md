

# Kep generator elrendezes finomhangolas -- mind a 3 formatum

## Problema
A `drawToCanvas` fuggveny fix `scale = W / 1200` erteket hasznal, ami nem veszi figyelembe a canvas magassagat. Emiatt:
- **Facebook (1200x675)**: a tartalom ~800px magas 8 etelnel, de a canvas csak 675px -- az also resz (menu ar, footer) lecsusznak
- **Insta Post (1080x1080)**: a tartalom a tetejere tomorodik, alul sok ures hely marad
- **Insta Story (1080x1920)**: a tartalom nagyon kicsi a hatalmas canvas-hez kepest

## Megoldas: ket lepcsos skalazas

A jelenlegi egydimenios `scale = W / 1200` helyett a rajzolo fuggveny:

1. Eloszor kiszamolja a tartalom teljes magassagat az alap (1200px-es) meretekkel
2. Utana kiszamol egy `vScale` (vertikalis skala) erteket: `availableHeight / contentHeight`
3. A vegso skala: `min(hScale, vScale)` -- igy a tartalom mindig beleferr a canvas-be
4. Az Instagram story eseten a tartalom kozepre igazodik a magas canvas-ben (ez mar megvan, de a jobb skalazassal szebben fog kinezni)

### Reszletek

**Facebook post (1200x675)**:
- Sok etelnel a fontmeretek es a sorozes automatikusan kisebb lesz, hogy minden beferjen
- A footer mindig lathato marad

**Instagram post (1080x1080)**:
- A negyzetes formatum elegendo helyet ad, a tartalom szepen kozepen jelenik meg
- A fontmeretek aranyosan nagyobbak lesznek mint most

**Instagram story (1080x1920)**:
- A tartalom kozepen marad vertikalisan
- Nagyobb fontmeretek, mert sok a hely

### Egyeb finomitasok
- A `contentHeight` szamitas pontositasa (az aktualis elem szamtol fugg)
- Az `yOffset` szamitas javitasa a kulonbozo formatumokhoz
- A logo pozicio a valodi tartalomhoz igazodik, nem fix `H - 90px`

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | A `drawToCanvas` fuggvenyben: 1) Elso menet: tartalom magassag szamitas fix 1.0 skalaval 2) `finalScale = min(W/1200, (H - margin) / contentHeight)` 3) Masodik menet: rajzolas `finalScale`-lel 4) Logo pozicio: tartalom alajahoz igazitva, nem canvas aljahoz |

### Pelda skalak

| Formatum | W | H | hScale | Becsult contentH | vScale | finalScale |
|----------|---|---|--------|-----------------|--------|------------|
| Facebook | 1200 | 675 | 1.0 | ~750 | ~0.85 | ~0.85 |
| Insta Post | 1080 | 1080 | 0.9 | ~750 | ~1.3 | 0.9 |
| Insta Story | 1080 | 1920 | 0.9 | ~750 | ~2.3 | 0.9 |

Igy a Facebook post automatikusan kisebb betukkel irja ki az eteleket ha sok van, mig az Insta formatumok kihasznaljak a teret.
