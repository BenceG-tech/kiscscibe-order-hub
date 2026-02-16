# 🐥 Kiscsibe Order Hub — Executive Summary

**Időszak:** 2025. február 12–16.  
**Készítette:** Fejlesztői csapat  
**Dátum:** 2025. február 16.

---

## 📋 Áttekintés

Az elmúlt egy hétben **13 commit** keretében közel **4 500 sor** új kódot szállítottunk le, **13 adatbázis-migrációval**. A fejlesztések fókusza: rendeléskezelés megerősítése, pénzügyi modul kiépítése, valamint az étlap-kezelés automatizálása. Az összes funkció élesben elérhető és tesztelve van.

---

## 🏆 Top 10 fejlesztés

| # | Funkció | Mit old meg | Üzleti érték |
|---|---------|------------|---------------|
| 1 | **Rendelési kapacitás-kezelés** | Időszakonkénti rendelési limit beállítása, sablonok mentése, tiltott napok kezelése | Nem vállal túl a konyha, kiszámítható terhelés |
| 2 | **Kuponrendszer** | Százalékos és fix összegű kedvezmények, felhasználási limit, minimum rendelési érték | Promóciók és törzsvásárlói akciók indítása |
| 3 | **Számlakezelő modul** | Bejövő/kimenő számlák rögzítése, tételes bontás, fájlfeltöltés, Excel export | Áttekinthető pénzügyek, könyvelőnek kész adat |
| 4 | **AI számlafelismerés** | Fotóból automatikusan kitölti a számla adatait (partner, összeg, ÁFA, tételek) | Percek helyett másodpercek alatt rögzített számla |
| 5 | **Hulladékkövetés** | Napi tervezett vs. eladott vs. kidobott adagok naplózása | Csökkentett pazarlás, jobb tervezés |
| 6 | **„Mindig elérhető" tételek** | Étlap-tételek jelölése, amelyek minden nap rendelhetők | Törzsételek mindig láthatók, kevesebb admin munka |
| 7 | **Elfogyott jelzés** | Valós idejű „elfogyott" státusz napi ajánlat tételekre | Vendég nem rendel olyat, ami már nincs |
| 8 | **Popup hirdetések** | Konfigurálható felugró üzenetek az oldalon (szöveg, link, időzítés) | Akciók és hírek azonnali kommunikálása |
| 9 | **Napi menü optimalizáció** | Egyetlen adatbázis-hívás (`get_daily_data`) tölti be az összes napi adatot | Gyorsabb oldalbetöltés, kevesebb szerverhívás |
| 10 | **Kupon megjelenítés rendeléseknél** | Admin felületen látható a felhasznált kuponkód és kedvezmény összege | Átlátható, melyik rendeléshez milyen kedvezmény tartozik |

---

## 📊 Számszerűsített eredmények

| Mutató | Érték |
|--------|-------|
| Commitok száma | 13 |
| Új adatbázis-tábla | 6 |
| Adatbázis-migráció | 13 |
| Új Edge Function | 2 |
| Új UI-komponens | ~15 |
| Érintett fájlok | ~40 |
| Új kódsorok (becsült) | ~4 500 |

---

## 💰 Fejlesztési érték

| Szint | Becsült óraszám | Óradíj (Ft) | Összesen (Ft) |
|-------|-----------------|-------------|---------------|
| Mid-level fejlesztő | 60–69 óra | 8 000–15 000 | 480 000 – 1 035 000 |
| Senior fejlesztő | 50–60 óra | 15 000–25 000 | 750 000 – 1 500 000 |
| **Reális piaci sáv** | | | **900 000 – 1 250 000 Ft** |

> A becslés tartalmazza: tervezés, implementáció, tesztelés, adatbázis-tervezés, AI-integráció és deployment.

---

*Kiscsibe Order Hub — Professzionális rendeléskezelés, egyszerűen.* 🐥
