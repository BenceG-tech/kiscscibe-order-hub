## Cél

Pótolni a május 18–22-i heti ajánlatból kihagyott 11 tételt: új `menu_items` rekordok létrehozása az Excel pontos név + ár alapján, majd hozzákapcsolás a megfelelő napi ajánlathoz `daily_offer_items`-ként.

(A „Zöldfűszeres-fokhagymás sertésragu" már be lett illesztve az előző importnál, így a 12-ből csak 11 marad.)

## Új menu_items (11 db)

Mindegyik: `is_active = true`, `is_temporary = true`, allergének és kép üresek (admin később pótolja).

| Új menu_item név | Ár (Ft) | Kategória |
|---|---|---|
| Sajtos bundában rántott csirkemell szeletek | 2450 | Rántott ételek |
| Mediterrán csirkés penne sült paprikával | 2450 | Tészta ételek |
| Rozmaringos sült karaj hagymás pecsenyelével | 2350 | Főételek |
| Stefánia gombóc | 1290 | Főzelék feltét |
| Menzás piskóta csokoládé öntettel | 1350 | Desszertek |
| Zöldfűszeres fetasajttal töltött rántott szelet | 2450 | Rántott ételek |
| Omlós csirkemell paradicsomos-tejszínes szószban | 2450 | Csirkés-zöldséges ételek |
| Mézes-teriyaki csirkecomb pirított zöldségekkel | 2350 | Csirkés-zöldséges ételek |
| Kertész szelet | 2350 | Főételek |
| Sült tarjaszeletek lecsós-gombás feltéttel | 2350 | Főételek |
| Fokhagymás-tejszínes sertésszelet | 2350 | Főételek |

## Daily offer hozzárendelés

Mindegyik `is_menu_part = false` (nem combo-rész), csak választható extra a napi kínálatban.

- **Kedd 05-19**: Sajtos bundában rántott csirkemell szeletek
- **Szerda 05-20**: Mediterrán csirkés penne, Rozmaringos sült karaj, Stefánia gombóc, Menzás piskóta, Zöldfűszeres fetasajttal töltött rántott szelet
- **Csütörtök 05-21**: Omlós csirkemell paradicsomos-tejszínes szószban, Mézes-teriyaki csirkecomb, Kertész szelet
- **Péntek 05-22**: Sült tarjaszeletek lecsós-gombás feltéttel, Fokhagymás-tejszínes sertésszelet

## Végrehajtás

Egyetlen migration:
1. `INSERT INTO menu_items (...) VALUES (...) RETURNING id` — 11 új tétel
2. `INSERT INTO daily_offer_items (daily_offer_id, item_id, is_menu_part, portions_needed)` — 11 új sor, a megfelelő `daily_offers.id`-hez (a dátum alapján kiválasztva)

A meglévő combo (leves + főétel 2200 Ft) érintetlen marad.
