# Fehér képernyő tartós javítása az előnézetben

## Mi történt
- Frissítés (deploy) után a böngészőben nyitva maradt lap a régi verzió fájljait keresi, amelyek már nem léteznek.
- Erre már van automatikus újratöltés, de 60 másodperces védelem miatt, ha rövid időn belül többször történik, feladja — és fehér képernyő marad.
- A helyi verzió hibátlanul betölt (ellenőrizve), tehát nem kódhiba, hanem régi gyorsítótár + gyenge helyreállítás.

## Terv
1. **Helyreállítás megerősítése** (`src/main.tsx`):
   - A 60 mp-es védelem helyett: maximum 3 újratöltési kísérlet, növekvő szünettel; a számláló sikeres betöltés után törlődik.
   - Ha minden kísérlet kimerül: ne fehér képernyő maradjon, hanem egy egyszerű, Kiscsibe-arculatú üzenet („Az oldal frissült — koppints az újratöltéshez") egy kézi Frissítés gombbal.
2. **Szélesebb hibafelismerés**: a helyreállítás reagáljon a gyakori elavult-fájl hibákra (pl. „error loading dynamically imported module", MIME-type / 404-es modulbetöltés) is.
3. **Ellenőrzés**: szimulált elavult-fájl hibával böngészőben tesztelni, hogy az újratöltés és a tartalék-üzenet működik; típusellenőrzés + a meglévő 21 teszt futtatása.
4. Preview-only, publish nélkül.

## SMS Krisztiánnak (rövid összefoglaló)
„A rendelés azért nem ment, mert a 'Minél előbb' opció csak 10:30–16:00 között elérhető, de nyitás előtt is kiválasztható maradt — javítva, most automatikusan időpontfoglalásra vált. A fehér képernyőt az okozta, hogy a böngésző frissítés után a régi verzió fájljait kereste — egy oldalfrissítés megoldja, és javítom, hogy magától helyreálljon."
