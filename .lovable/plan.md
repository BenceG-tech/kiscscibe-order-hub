

# Cookie Consent banner prioritasa az Announcement Popup felett

## Problema

A kepernyokepon lathato, hogy mobilon a Cookie Consent banner es az Announcement Popup (Drawer) egyszerre jelenik meg. A Drawer (vaul) portalkent renderelodik a DOM vegere, ezert vizualisan a cookie banner fole kerul, annak ellenere, hogy a cookie banner z-[60], a Drawer pedig z-50. Igy a felhasznalo nem tud eloszor a cookie bannerre kattintani.

## Megoldas

Az AnnouncementPopup komponensben figyelni kell, hogy a cookie consent mar el van-e fogadva. Ha meg nincs, a popup NEM jelenik meg — megvarja, amig a felhasznalo elfogadja a sutiket. Igy a cookie banner mindig elsobbseget elvez.

## Technikai reszletek

**Modositott fajl:** `src/components/AnnouncementPopup.tsx`

- A `useEffect`-ben (ami az `open` allapotot allitja) ellenorizni kell a `localStorage.getItem("cookie-consent")` erteket
- Ha nincs meg elfogadva, nem nyilik meg a popup
- Egy `setInterval` vagy `storage` event figyeli, mikor fogadja el a felhasznalo — utana megjelenithetjuk a popupot
- Alternativ: a `CookieConsent` komponensben egy `window.dispatchEvent(new Event("cookie-consent-accepted"))` esemeny, amit az AnnouncementPopup figyel

**Elony:** Nem kell z-index-eket bolygani, a logikai sorrend helyes: eloszor cookie consent, utana az ertesites.

