
# Jövő heti napi ajánlatok feltöltése (2026-05-18 — 2026-05-22)

## Cél

A csatolt Excel (`2026.05.18.-05.22..xlsx`) napi tételeit felviszem a `daily_offers` / `daily_offer_items` / `daily_offer_menus` táblákba **kizárólag a meglévő `menu_items` rekordokra hivatkozva** — új menu_item NEM jön létre.

## Megközelítés

1. **Tétel-egyeztetés**: minden Excel-soron végigfutok és a `menu_items`-re ékezet-érzéketlen + pg_trgm hasonlóság alapján keresem meg a meglévő párját. A találatokat egy egyeztető táblázatban itt a chatben elétárlak elfogadásra (név + DB-beli név + DB-beli ár), mielőtt bármit is mentek.
2. **Egyértelmű találatok**: ahol a hasonlóság ≥ 0.85 és csak 1 találat van, automatikusan elfogadom.
3. **Bizonytalan / hiányzó tételek**: ha nincs legalább 0.6 hasonlóságú találat (pl. `Rétes`, `Gundel palacsinta`, `rántottak` címke, esetleg `Kertés szelet` / `Kolbászos lecsó` / `Tarhonyás hús` ha nincs DB-ben), azokat **kihagyom** és a chatben listázom — új tételt nem hozok létre.
4. **Árak**: Az Excel-ben szereplő árakat **nem** írom be a `menu_items`-be (megőrzöm a meglévő árakat), de a `daily_offer_items`-en megjelenítendő ár a meglévő `menu_items.price_huf` lesz. Ha másképp szeretnéd, szólj.

## Adatszerkezet napi szinten

Minden napra (hétfő–péntek):

```text
daily_offers (date, price_huf=2200, max_portions=50)
└── daily_offer_menus (menu_price_huf=2200, max_portions=30)   ← combo csomag
└── daily_offer_items
      ├── 1 leves   → is_menu_part=true, menu_role='leves'   (a "Menü" sor levese)
      ├── 1 főétel  → is_menu_part=true, menu_role='főétel'  (a "Menü" sor főétele)
      └── többi tétel → is_menu_part=false (Tészta, sütőben, combo, főzelék, főzelék feltét, Desszert, extra rántott, extra köret)
```

**Menü combo párosítás napokra** (ezt fogom használni a `is_menu_part`-hoz):

| Nap | Leves | Főétel (combo) |
|---|---|---|
| H 05-18 | Magyaros sertésragu leves | Milánói spagetti |
| K 05-19 | Tejfölös karfiolleves | Csülökpörkölt |
| Sz 05-20 | Zöldborsóleves | Zöldfűszeres-fokhagymás sertésragu |
| Cs 05-21 | Húsleves | Paradicsomos húsgombóc |
| P 05-22 | Bableves | Tarhonyás hús |

## Tisztázandó kérdések (mielőtt mentek)

1. **Combo ár**: a menü combo ára maradjon **2200 Ft** (memóriában rögzített default), vagy az Excel `Menü` sor leves-árát (1300–1390 Ft) használjam?
2. **Bizonytalan tételek (`Rétes`, `Gundel palacsinta`, `Kertés szelet` stb.)**: ha nincs DB-ben pontos megfelelő, kihagyom, vagy keressek egy "legközelebbi" tételt?
3. **Felülírás**: ha május 18–22-re már létezik `daily_offer`, **töröljem és újra építsem**, vagy hagyjam érintetlenül?

## Lépések megerősítés után

1. Kérdéseidre adott válaszok alapján létrehozom a 5 nap `daily_offers` + `daily_offer_menus` rekordjait egyetlen SQL `INSERT`-tel.
2. A `daily_offer_items`-be beszúrom a párosított `menu_items.id`-kat (kb. 50–55 sor) `is_menu_part` / `menu_role` jelöléssel.
3. Bemutatom a chatben: hány tétel ment fel naponta, melyek lettek kihagyva.
