# Étlap kereső hibák javítása (admin)

Megnéztem az adatbázist és a keresőket. Négy konkrét hibát találtam, ezek magyarázzák, miért nem talál meg az asszisztens korábban felvitt ételeket.

## Amit a vizsgálat kimutatott

1. **A részletes étlap-kereső összeomlik gépeléskor.** A szűrő a leírás mezőt is átnézi, de 940 ételből **649-nek nincs leírása** (üres érték). Az első leütésnél hibára fut a kód, így nem jelenik meg találat (üres lista / megakadt oldal). Ez a legvalószínűbb ok arra, amit Krisztián jelzett.
2. **6 aktív étel egyetlen listában sem jelenik meg**, mert nincs kategóriájuk. Az étlap oldal kategóriánként rendezve rajzol ki mindent, a kategória nélküli tételek kimaradnak – keresésre sem jönnek elő.
3. **Ékezet-érzéketlen keresés hiányzik** a részletes étlap-keresőben ("porkolt" nem találja a "Pörköltet"), miközben a többi kereső már kezeli.
4. **A heti rácsban soronként (kategóriánként) keres.** Ha egy étel más kategóriába került (pl. "Tokány / Pörkölt / Ragu" a "Főételek" helyett), a rossz sorban keresve nem található. Emellett 33 duplikált nevű étel van, ami tovább zavaró.

Kiegészítő kockázat: 940 étel van, a lekérdezések alapértelmezett felső korlátja 1000 sor. Néhány héten belül az étlap egy része szó nélkül eltűnik a listákból, ha nincs lapozás.

## Mit csinálok

1. **Kereső-összeomlás javítása** – a leírás hiányát biztonságosan kezeli a szűrő, és ékezet-független keresésre áll át (a meglévő `normalizeText` segédfüggvénnyel), névre és leírásra egyaránt.
2. **Kategória nélküli ételek megjelenítése** – az étlap oldal kap egy „Besorolás nélkül" csoportot, hogy a 6 (és bármely jövőbeli) tétel látszódjon és szerkeszthető legyen.
3. **Globális keresés a heti rácsban** – a cellák keresője az összes ételben keres, nem csak az adott sor kategóriájában; a találat mellett kis címkén látszik, melyik kategóriából jön. Így nem kell tudni, hova lett besorolva.
4. **1000 soros korlát megelőzése** – az admin étel-lekérdezések lapozva töltenek be minden tételt.
5. **Duplikátumok** – készítek egy listát a 33 duplikált névről, de **nem törlök semmit**, csak megmutatom, hogy döntsetek róla.

## Ellenőrzés

- Playwright: admin étlap kereső ("pörkölt", "porkolt", részszavak), heti rács cella-kereső más kategóriás étellel, kategória nélküli tételek megjelenése.
- Konzol- és hálózati napló hibamentessége, adatmódosítás nélkül.

## Technikai részletek

- `src/pages/admin/MenuItemManagement.tsx`: null-safe + `normalizeText` alapú szűrés.
- `src/pages/admin/MenuManagement.tsx`: kategória nélküli tételek külön csoportban (`category_id is null`).
- `src/components/admin/WeeklyMenuGrid.tsx` + `WeeklyGridCell.tsx`: cella-kereső a teljes `menuItems` listán, kategória-címkével; a beszúrás továbbra is az adott sor napjára/szerepére megy.
- Admin `menu_items` lekérdezések: `range()` alapú lapozás 1000-es kötegekben.
- Backend, RLS, rendelési logika nem változik.
