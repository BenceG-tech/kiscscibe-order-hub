export interface HelpTopic {
  id: string;
  title: string;
  routes?: string[]; // routes where this topic is contextually relevant
  whatItDoes: string;
  howToUse: string[];
  whyItHelps: string;
  commonMistake?: string;
}

export interface HelpCategory {
  id: string;
  icon: string; // emoji
  title: string;
  topics: HelpTopic[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "first-steps",
    icon: "🚀",
    title: "Első lépések",
    topics: [
      {
        id: "morning-routine",
        title: "Reggeli rutin (7:00 körül)",
        whatItDoes: "A nap kezdetén ellenőrzöd a mai napot, megnyitod a KDS-t, és átnézed a rendeléseket.",
        howToUse: [
          "Nyisd meg az Irányítópultot — láthatod a mai rendeléseket, várható forgalmat, riasztásokat.",
          "Lépj a Rendelések fülre — itt kanban-szerűen mozognak a rendelések (Új → Készül → Kész → Átadva).",
          "Ha új rendelés érkezik, hangjelzés és piros badge jelez.",
          "Ellenőrizd a Napi ajánlatot — megfelelő-e a leves/főétel páros, van-e elég adag.",
        ],
        whyItHelps: "Egy 5 perces reggeli ellenőrzés megelőzi a délutáni káoszt — minden a helyén van, mire jönnek a vendégek.",
      },
      {
        id: "weekly-routine",
        title: "Heti rutin (vasárnap este vagy hétfő reggel)",
        whatItDoes: "A heti menü összeállítása és a kapacitás beállítása az egész következő hétre.",
        howToUse: [
          "Napi ajánlat → válaszd ki a hétfőt és állítsd be az 5 napot.",
          "Hírlevél fülön küldj heti menü emailt a feliratkozóknak.",
          "Számlák → ellenőrizd a lejárt és közelgő határidejű számlákat.",
          "Statisztika → nézd át a múlt hetet (legjobb tételek, bevétel).",
        ],
        whyItHelps: "Egy jól előkészített hét = nyugodt napok és elégedett vendégek.",
      },
    ],
  },
  {
    id: "menu",
    icon: "🍽️",
    title: "Étlap és menü",
    topics: [
      {
        id: "master-library",
        title: "Mester étel-könyvtár",
        routes: ["/admin/menu"],
        whatItDoes: "A 600+ ételt tartalmazó központi könyvtár, amiből bármikor választhatsz a napi ajánlatokhoz.",
        howToUse: [
          "Étlap kezelés fülön láthatod az összes tételt kategóriák szerint.",
          "Új tétel: 'Új étel' gomb. Add meg a nevet, kategóriát, árat, opcionálisan képet és allergéneket.",
          "Excel import: tömegesen tölthetsz fel új tételeket — utolsó tab a Napi ajánlat oldalon.",
          "Allergének automatikus hozzárendelése: a Beállítások-ban a gombbal javaslatot kapsz a hiányzó allergénekre.",
        ],
        whyItHelps: "Nem kell minden héten újraírni az ételeket — egyszer felvitt, többször használt.",
        commonMistake: "Ne hozz létre duplikált neveket (pl. 'Sült csirke' és 'Sült Csirke'). A kereső ékezet- és kisbetű-független.",
      },
      {
        id: "daily-menu-combo",
        title: "Napi menü kombináció (leves + főétel)",
        routes: ["/admin/daily-menu"],
        whatItDoes: "Ha egy napra pontosan 1 levest és 1 főételt jelölsz 'menü részeként', a rendszer automatikusan létrehoz egy kombinált menü ajánlatot.",
        howToUse: [
          "Napi ajánlat → válassz napot.",
          "Adj hozzá tételeket: a kis MA gombbal jelölheted, melyik leves (L) és melyik főétel (F).",
          "Mentés után automatikusan megjelenik a kombo ár (alapértelmezetten 2200 Ft).",
        ],
        whyItHelps: "Egy kattintással kínálsz vásárlóknak ár-érték arányosabb csomagot — több bevétel, kevesebb kosárba-pakolgatás.",
      },
    ],
  },
  {
    id: "images",
    icon: "📸",
    title: "Képek és Facebook posztok",
    topics: [
      {
        id: "image-generator",
        title: "AI kép és poszt generátor",
        routes: ["/admin/daily-menu"],
        whatItDoes: "Egy kattintással készít professzionális AI ételképet és Facebook poszt szöveget a napi ajánlathoz.",
        howToUse: [
          "Napi ajánlat → 'Kép és poszt' fül.",
          "Válaszd ki a napot, a formátumot (FB / IG poszt / IG story) és a hangnemet.",
          "Generálás után a kép alatt megjelenik a szöveg — szerkesztheted vagy újragenerálhatod.",
          "'Másolás' gombokkal vágólapra másolod, és FB-re/IG-re felteszed.",
        ],
        whyItHelps: "Napi 30+ percet spórolsz, és minden poszt egységes, professzionális megjelenésű.",
        commonMistake: "Mindig nézd át a generált szöveget — az AI néha elír allergiát vagy hozzávalót.",
      },
      {
        id: "ai-food-images",
        title: "AI ételképek a master könyvtárba",
        routes: ["/admin/menu"],
        whatItDoes: "Az ételekhez szép AI képeket generálhatsz tömegesen, amik a vásárlói felületen megjelennek.",
        howToUse: [
          "Étlap kezelés → válaszd ki a tételeket (kép nélküli sor jól látható).",
          "'AI képek generálása' gomb — sorban legenerálódnak (pár másodperc / kép).",
        ],
        whyItHelps: "Egy étkép +30% konverzió a kosárba helyezésnél — a vásárló a szemével eszik először.",
      },
    ],
  },
  {
    id: "orders",
    icon: "📊",
    title: "Rendelések és KDS",
    topics: [
      {
        id: "kds-flow",
        title: "Kanban rendelési folyamat",
        routes: ["/admin/orders", "/staff/orders"],
        whatItDoes: "A rendelések 4 oszlopban mozognak: Új → Készül → Kész → Átadva.",
        howToUse: [
          "Új rendelés érkezésekor hangjelzés szól és piros badge jelez.",
          "Kattints a rendelésre a státusz váltásához (Nyilak).",
          "A 'Nyomtatás' ikonnal termikus nyomtatóra küldheted a kártyát (80mm).",
          "Vásárló minden státuszváltásnál automatikus emailt kap.",
        ],
        whyItHelps: "A konyha mindig tudja mi a következő tennivaló — nincs elveszett rendelés.",
      },
      {
        id: "manual-orders",
        title: "Manuális rendelés felvétele",
        routes: ["/admin/orders"],
        whatItDoes: "Ha telefonon vagy személyesen rendelnek, te is fel tudod venni a rendelést a felületen.",
        howToUse: [
          "Rendelések → 'Új rendelés' gomb.",
          "Add meg a vendég nevét, telefonszámát, és válaszd ki a tételeket.",
          "A rendelés automatikusan bekerül a KDS-be.",
        ],
        whyItHelps: "Egy felület — minden rendelés, akár online akár offline.",
      },
    ],
  },
  {
    id: "invoices",
    icon: "💰",
    title: "Számlák és pénzügy",
    topics: [
      {
        id: "invoice-ocr",
        title: "Számla feltöltés AI felismeréssel",
        routes: ["/admin/invoices"],
        whatItDoes: "Beszállítói számlák PDF/kép feltöltésekor az AI (Gemini) automatikusan kiolvassa az összegeket, dátumot, ÁFA-t.",
        howToUse: [
          "Számlák → 'Új számla' → Tölts fel PDF vagy fotót.",
          "Az AI 5-10 mp alatt kitölti a mezőket — te csak ellenőrzöd.",
          "Mentés után megjelenik a listában, és a határidő közeledtekor figyelmeztet.",
        ],
        whyItHelps: "Egy számla felvitele 30 mp-ből 5 mp-be csökken. A könyvelés is hálás lesz.",
      },
      {
        id: "recurring-invoices",
        title: "Ismétlődő számlák (rezsi, bérleti díj)",
        routes: ["/admin/invoices"],
        whatItDoes: "Havonta automatikusan létrehozódnak a rendszeres kiadások (bérleti díj, internet, stb.).",
        howToUse: [
          "Számlák → Ismétlődő fül → 'Új ismétlődő'.",
          "Add meg a partnert, összeget, és a hónap napját (pl. minden hó 5-én).",
          "A rendszer minden hónapban automatikusan létrehozza.",
        ],
        whyItHelps: "Soha többé nem felejtesz el bevinni rezsit — ami automatikus, az nem hibázik.",
      },
    ],
  },
  {
    id: "analytics",
    icon: "📈",
    title: "Statisztika értelmezése",
    topics: [
      {
        id: "revenue-tab",
        title: "Bevétel fül",
        routes: ["/admin/analytics"],
        whatItDoes: "Napi/heti/havi bevétel grafikon, összehasonlítva az előző időszakkal.",
        howToUse: [
          "Statisztika → Bevétel fül.",
          "Felül válassz időszakot (utolsó 7/30/90 nap).",
          "Nézd a trendet: ha esik 15%+, azonnali akció kell.",
        ],
        whyItHelps: "Számokra alapuló döntések — nem érzésre.",
      },
      {
        id: "menu-performance",
        title: "Menü teljesítmény",
        routes: ["/admin/analytics"],
        whatItDoes: "Megmutatja melyik tétel a TOP 10 és melyik a 'gyenge' (kevesen rendelik).",
        howToUse: [
          "Statisztika → Menü teljesítmény fül.",
          "TOP tételeket gyakrabban kínáld — több bevétel.",
          "Gyenge tételeket vagy árazd újra, vagy cseréld le.",
        ],
        whyItHelps: "A 80/20 szabály: a tételeid 20%-a hozza a bevétel 80%-át. Ezeket meg kell ismerni.",
      },
    ],
  },
  {
    id: "coupons",
    icon: "🎟️",
    title: "Kuponok és kedvezmények",
    topics: [
      {
        id: "create-coupon",
        title: "Új kupon létrehozása",
        routes: ["/admin/coupons"],
        whatItDoes: "Egyedi kuponkód, ami a checkout-ban használható (pl. 'NYAR10' = 10% kedvezmény).",
        howToUse: [
          "Kuponok → 'Új kupon'.",
          "Add meg a kódot, a típust (% vagy fix Ft), értéket, érvényességi időt és max. felhasználást.",
          "Megosztható social-on, emailben, vagy törzsvendégeknek.",
        ],
        whyItHelps: "Célzott akciók — pl. csendes napokra: 'KEDD15' → 15% kedvezmény keddenként.",
      },
    ],
  },
  {
    id: "capacity",
    icon: "📅",
    title: "Kapacitás és nyitvatartás",
    topics: [
      {
        id: "capacity-slots",
        title: "Kapacitás slotok",
        routes: ["/admin/daily-menu"],
        whatItDoes: "Beállíthatod, hogy egy nap egy adott időpontban hány rendelést fogadtok el.",
        howToUse: [
          "Napi ajánlat → Kapacitás fül → válassz napot.",
          "'Alapértelmezett' gomb → létrehozza a tipikus slotokat.",
          "Igazítsd a számokat (pl. ebédidőben több, kora délután kevesebb).",
          "Mentés sablonként → egész hétre alkalmazható.",
        ],
        whyItHelps: "Ne legyen túlfoglalás — a konyha bírja az ütemet.",
      },
      {
        id: "blackout-dates",
        title: "Zárolt napok (ünnepek, leltár)",
        routes: ["/admin/daily-menu"],
        whatItDoes: "Zárt napokon a vásárló nem tud rendelést leadni.",
        howToUse: [
          "Kapacitás → Zárolások szekció → 'Új zárolt nap'.",
          "Add meg a dátumot és okot (pl. 'Augusztus 20').",
        ],
        whyItHelps: "Megelőzi a félreértést — a vendég sem rendel olyan napra, amikor zárva vagytok.",
      },
    ],
  },
  {
    id: "documents",
    icon: "📁",
    title: "Dokumentumok (Kiscsibe Drive)",
    topics: [
      {
        id: "doc-vault",
        title: "Dokumentum tár",
        routes: ["/admin/documents"],
        whatItDoes: "A Drive-szerű felület — szerződések, NAV iratok, képek, bármi tárolható, verziózva.",
        howToUse: [
          "Mappákba szervezheted a dokumentumokat.",
          "Címkékkel keresheted (pl. 'NAV', 'szerződés', 'foto').",
          "Új verzió feltöltésekor a régi megmarad — bármikor visszaállítható.",
        ],
        whyItHelps: "Egy helyen minden papír — sose vesz el szerződés vagy számla.",
      },
    ],
  },
  {
    id: "troubleshoot",
    icon: "🆘",
    title: "Mit tegyek ha…",
    topics: [
      {
        id: "missing-order",
        title: "…nem érkezett meg egy rendelés a KDS-be",
        whatItDoes: "Néha hálózati hiba miatt nem frissül a Realtime kapcsolat.",
        howToUse: [
          "Frissítsd az oldalt (Ctrl+R / Cmd+R).",
          "Ha még nem jelent meg, nézd meg a Statisztika → Rendelések fülön visszamenőleg.",
        ],
        whyItHelps: "99%-ban az oldal frissítése megoldja.",
      },
      {
        id: "wrong-allergen",
        title: "…egy ételhez rossz allergén jelent meg",
        whatItDoes: "Az AI vagy az auto-hozzárendelés tévedhet.",
        howToUse: [
          "Étlap kezelés → kattints a tételre.",
          "Allergének mezőben pipáld ki/be a megfelelőt.",
          "Mentés.",
        ],
        whyItHelps: "EU szabály: az allergének pontossága törvényi kötelezettség.",
      },
      {
        id: "wrong-image",
        title: "…az AI generált kép nem tetszik",
        whatItDoes: "Nem minden kép sikerül elsőre — generálható újra.",
        howToUse: [
          "A Kép generátor fülön nyomd meg az 'Újragenerálás' gombot.",
          "Vagy tölts fel saját képet — bármikor felülírja az AI-t.",
        ],
        whyItHelps: "A vásárló a képet látja először — érdemes a legjobbat választani.",
      },
    ],
  },
];
