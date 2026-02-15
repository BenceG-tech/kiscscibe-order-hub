

# Generalt kep hatter gradiens frissites

A `drawCanvas` fuggvenyben a hatter szineket csereljuk le:

- Jelenlegi: `#12171A` alap + enyhe feher gradiens
- Uj: `#1c232f` (vilagosabb kek, bal oldal) -> `#252b38` (sotetebb kek, jobb oldal) linearis gradiens balrol jobbra

## Technikai reszletek

| Fajl | Valtozas |
|------|---------|
| `src/components/admin/DailyOfferImageGenerator.tsx` | `drawCanvas` fuggvenyben a hatter rajzolas: `#12171A` fill + feher gradiens overlay helyett egyetlen linearis gradiens `#1c232f` -> `#252b38` (balrol jobbra) |

A valtozas kizarolag a hatter 3-4 sorat erinti a `drawCanvas` fuggvenyben. Minden mas (szinek, elrendezes, dinamikus magassag, lightbox) valtozatlan marad.

