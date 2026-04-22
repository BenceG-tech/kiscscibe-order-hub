export interface HelpTopic {
  id: string;
  title: string;
  routes?: string[];
  pageGroup?: string; // SZINT 2 — melyik admin oldal/funkció alá tartozik
  whatItDoes: string;
  howToUse: string[];
  whyItHelps: string;
  commonMistake?: string;
}

export type HelpTabGroup =
  | "menu"
  | "operations"
  | "finance"
  | "marketing"
  | "content";

export interface HelpCategory {
  id: string;
  icon: string;
  title: string;
  tabGroup: HelpTabGroup;
  topics: HelpTopic[];
}

export interface HelpTab {
  id: HelpTabGroup;
  icon: string;
  label: string;
  shortLabel: string;
}

export const HELP_TABS: HelpTab[] = [
  { id: "menu", icon: "🍽️", label: "Étlap & Menü", shortLabel: "Étlap" },
  { id: "operations", icon: "📊", label: "Működés", shortLabel: "Műk." },
  { id: "finance", icon: "💰", label: "Pénzügy", shortLabel: "Pénz" },
  { id: "marketing", icon: "📣", label: "Marketing", shortLabel: "Mark." },
  { id: "content", icon: "⚙️", label: "Tartalom & Egyéb", shortLabel: "Tart." },
];

// SZINT 2 — Oldal-csoportok meta-adatai
export interface HelpPageGroup {
  id: string;
  tabGroup: HelpTabGroup;
  title: string;
  icon: string;
  route?: string;
  description: string;
}

export const HELP_PAGE_GROUPS: HelpPageGroup[] = [
  // Étlap & Menü
  { id: "menu-library", tabGroup: "menu", title: "Étlap kezelés", icon: "🍽️", route: "/admin/menu", description: "Mester étel-könyvtár, fix tételek, AI képek" },
  { id: "daily-offer", tabGroup: "menu", title: "Napi ajánlat", icon: "📅", route: "/admin/daily-menu", description: "Heti menü, kombinációk, készlet" },
  { id: "allergens", tabGroup: "menu", title: "Allergének", icon: "⚠️", route: "/admin/menu", description: "Auto-hozzárendelés, kézi szerk." },
  // Működés
  { id: "orders-kds", tabGroup: "operations", title: "Rendelések / KDS", icon: "📦", route: "/admin/orders", description: "Kanban folyamat, manuális rendelés" },
  { id: "capacity", tabGroup: "operations", title: "Kapacitás", icon: "📅", route: "/admin/daily-menu", description: "Slotok, zárolt napok" },
  { id: "waste-forecast", tabGroup: "operations", title: "Pazarlás & előrejelzés", icon: "♻️", route: "/admin/daily-menu", description: "Pazarlás napló, időjárás-becslés" },
  // Pénzügy
  { id: "invoices", tabGroup: "finance", title: "Számlák", icon: "💰", route: "/admin/invoices", description: "AI OCR, ismétlődő, emlékeztető" },
  { id: "partners", tabGroup: "finance", title: "Partnerek", icon: "🏢", route: "/admin/partners", description: "Beszállítók, számlatörténet" },
  { id: "analytics", tabGroup: "finance", title: "Statisztika", icon: "📈", route: "/admin/analytics", description: "Bevétel, menü, AI ár-javaslatok" },
  // Marketing
  { id: "images-posts", tabGroup: "marketing", title: "Képek és posztok", icon: "📸", route: "/admin/daily-menu", description: "AI képek, FB/IG poszt szöveg" },
  { id: "gallery", tabGroup: "marketing", title: "Galéria", icon: "🖼️", route: "/admin/gallery", description: "Ételek és Éttermünk képek" },
  { id: "newsletter", tabGroup: "marketing", title: "Hírlevél", icon: "📧", route: "/admin/daily-menu", description: "Heti menü email, feliratkozók" },
  { id: "coupons", tabGroup: "marketing", title: "Kuponok", icon: "🎟️", route: "/admin/coupons", description: "Kódok, statisztika, stratégia" },
  // Tartalom & Egyéb
  { id: "about-faq", tabGroup: "content", title: "Rólunk & GYIK", icon: "ℹ️", route: "/admin/about", description: "Rólunk oldal, GYIK, hirdetmény" },
  { id: "legal", tabGroup: "content", title: "Jogi oldalak", icon: "📜", route: "/admin/legal", description: "Impresszum, ÁSZF, Adatvédelem" },
  { id: "documents", tabGroup: "content", title: "Dokumentumok", icon: "📁", route: "/admin/documents", description: "Drive — szerződések, NAV iratok" },
  { id: "activity-log", tabGroup: "content", title: "Módosítási napló", icon: "🧾", route: "/admin/activity", description: "Ki, mikor, mit módosított" },
  { id: "pwa-push", tabGroup: "content", title: "Mobil app & értesítések", icon: "📱", description: "PWA telepítés, push értesítések" },
  { id: "troubleshoot", tabGroup: "content", title: "Mit tegyek ha…", icon: "🆘", description: "Hibakeresés, gyakori problémák" },
];

export interface QuickMapEntry {
  icon: string;
  title: string;
  route: string;
  description: string;
}

export interface RoutineStep {
  text: string;
}

export interface Routine {
  id: string;
  title: string;
  duration: string;
  when: string;
  steps: RoutineStep[];
}

// Quick map — every admin page in 1 sentence
export const QUICK_MAP: QuickMapEntry[] = [
  { icon: "📊", title: "Irányítópult", route: "/admin", description: "A nap áttekintése — mai rendelések, riasztások, gyors statisztikák." },
  { icon: "📦", title: "Rendelések", route: "/admin/orders", description: "Élő Kanban — beérkező rendelések kezelése (Új → Készül → Kész → Átadva)." },
  { icon: "🍽️", title: "Étlap kezelés", route: "/admin/menu", description: "A 600+ tételes mester étel-könyvtár. Itt szerkeszted az ételeket, árakat, allergéneket." },
  { icon: "📅", title: "Napi ajánlat", route: "/admin/daily-menu", description: "Heti menü összeállítása, kapacitás, kép- és poszt generátor, hírlevél, pazarlás követés." },
  { icon: "📈", title: "Statisztika", route: "/admin/analytics", description: "Bevétel, rendelések, menü teljesítmény, AI árajánlatok." },
  { icon: "🎟️", title: "Kuponok", route: "/admin/coupons", description: "Kedvezménykódok létrehozása és követése." },
  { icon: "💰", title: "Számlák", route: "/admin/invoices", description: "Beszállítói számlák AI felismeréssel, ismétlődő számlák, fizetési emlékeztetők." },
  { icon: "🏢", title: "Partnerek", route: "/admin/partners", description: "Beszállítók adatai — automatikusan kapcsolódnak a számlákhoz." },
  { icon: "📁", title: "Dokumentumok", route: "/admin/documents", description: "Drive-szerű dokumentumtár — szerződések, NAV iratok, verziózva." },
  { icon: "🧾", title: "Napló", route: "/admin/activity", description: "Minden fontos admin módosítás visszakereshető: ki, mikor, mit változtatott." },
  { icon: "📸", title: "Galéria", route: "/admin/gallery", description: "Ételek és Éttermünk képek a publikus galériához." },
  { icon: "ℹ️", title: "Rólunk", route: "/admin/about", description: "A Rólunk oldal tartalma — szöveg, számok, képek." },
  { icon: "❓", title: "GYIK", route: "/admin/faq", description: "Gyakori kérdések szerkesztése a publikus oldalon." },
  { icon: "📜", title: "Jogi oldalak", route: "/admin/legal", description: "Impresszum, ÁSZF, Adatvédelem, Süti — Markdown szerkesztővel." },
];

// Daily / weekly routines (todo-style)
export const ROUTINES: Routine[] = [
  {
    id: "morning",
    title: "Reggeli rutin",
    duration: "5 perc",
    when: "Minden nap, ~7:00 körül",
    steps: [
      { text: "Nyisd meg az Irányítópultot — nézd meg a mai rendeléseket és riasztásokat." },
      { text: "Lépj a Rendelések fülre — ellenőrizd hogy a Realtime kapcsolat működik (nincs piros jelzés)." },
      { text: "Napi ajánlat → ellenőrizd hogy a mai menü helyes (leves + főétel páros, adagszám)." },
      { text: "Ha új rendelés érkezik, hangjelzés és piros badge jelez." },
    ],
  },
  {
    id: "weekly",
    title: "Heti rutin",
    duration: "20 perc",
    when: "Vasárnap este vagy hétfő reggel",
    steps: [
      { text: "Napi ajánlat → állítsd be a teljes hét menüjét (5 nap)." },
      { text: "Hírlevél fülön küldj heti menü emailt a feliratkozóknak." },
      { text: "Számlák → ellenőrizd a lejárt és közelgő határidejű számlákat." },
      { text: "Statisztika → nézd át a múlt hetet (TOP tételek, bevétel, gyenge napok)." },
      { text: "Kapacitás → ha ünnep van, vegyél fel zárolt napot." },
    ],
  },
];

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "menu",
    tabGroup: "menu",
    icon: "🍽️",
    title: "Étlap és menü",
    topics: [
      {
        id: "master-library",
        pageGroup: "menu-library",
        title: "Mester étel-könyvtár",
        routes: ["/admin/menu"],
        whatItDoes: "A 600+ ételt tartalmazó központi könyvtár, amiből bármikor választhatsz a napi ajánlatokhoz.",
        howToUse: [
          "Étlap kezelés fülön láthatod az összes tételt kategóriák szerint.",
          "Új tétel: 'Új étel' gomb. Add meg a nevet, kategóriát, árat, opcionálisan képet és allergéneket.",
          "Excel import: tömegesen tölthetsz fel új tételeket — utolsó tab a Napi ajánlat oldalon.",
          "Allergének automatikus hozzárendelése: az oldal tetején lévő gombbal javaslatot kapsz a hiányzó allergénekre.",
        ],
        whyItHelps: "Nem kell minden héten újraírni az ételeket — egyszer felvitt, többször használt.",
        commonMistake: "Ne hozz létre duplikált neveket (pl. 'Sült csirke' és 'Sült Csirke'). A kereső ékezet- és kisbetű-független.",
      },
      {
        id: "daily-menu-combo",
        pageGroup: "daily-offer",
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
      {
        id: "fix-items",
        pageGroup: "menu-library",
        title: "Fix tételek (italok, savanyúság)",
        routes: ["/admin/menu"],
        whatItDoes: "Mindig elérhető tételek (pl. üdítők, savanyúság), amik nem függenek a napi ajánlattól.",
        howToUse: [
          "Étlap kezelés → tétel szerkesztésénél kapcsold be a 'Mindig elérhető' kapcsolót.",
          "Ezek a tételek a publikus felületen külön szekcióban jelennek meg.",
        ],
        whyItHelps: "A vásárló bármikor hozzá tudja venni a kosárhoz, függetlenül attól mi a napi főétel.",
      },
      {
        id: "sold-out",
        pageGroup: "daily-offer",
        title: "Készlet kifogyás (sold out)",
        routes: ["/admin/daily-menu", "/admin/orders"],
        whatItDoes: "Ha egy tételből elfogyott, manuálisan jelölheted, hogy ne lehessen rendelni belőle.",
        howToUse: [
          "Napi ajánlat → tételnél kattints a 'Elfogyott' kapcsolóra.",
          "A vásárló oldalán azonnal megjelenik a 'Elfogyott' badge és nem rendelhető.",
          "Ha újra van készleten, kapcsold ki — visszakerül.",
        ],
        whyItHelps: "Megelőzi a csalódott vendégeket — nem rendelnek olyat amit nem tudsz teljesíteni.",
      },
    ],
  },
  {
    id: "images",
    tabGroup: "marketing",
    icon: "📸",
    title: "Képek, posztok és galéria",
    topics: [
      {
        id: "image-generator",
        pageGroup: "images-posts",
        title: "AI kép és poszt generátor (Facebook/Instagram)",
        routes: ["/admin/daily-menu"],
        whatItDoes: "Egy kattintással készít professzionális AI ételképet és Facebook/Instagram poszt szöveget a napi ajánlathoz.",
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
        pageGroup: "images-posts",
        title: "AI ételképek a master könyvtárba",
        routes: ["/admin/menu"],
        whatItDoes: "Az ételekhez szép AI képeket generálhatsz tömegesen, amik a vásárlói felületen megjelennek.",
        howToUse: [
          "Étlap kezelés → válaszd ki a tételeket (kép nélküli sor jól látható).",
          "'AI képek generálása' gomb — sorban legenerálódnak (pár másodperc / kép).",
        ],
        whyItHelps: "Egy étkép +30% konverzió a kosárba helyezésnél — a vásárló a szemével eszik először.",
      },
      {
        id: "gallery-management",
        pageGroup: "gallery",
        title: "Galéria (Ételek és Éttermünk)",
        routes: ["/admin/gallery"],
        whatItDoes: "A publikus oldalon megjelenő képgaléria kezelése — két kategóriában: Ételek és Éttermünk (belső terek).",
        howToUse: [
          "Galéria → válaszd ki a kategóriát (Ételek vagy Éttermünk).",
          "'Új kép feltöltése' gomb. Húzd be a fájlt vagy válaszd ki.",
          "Add meg az alt-szöveget (SEO és akadálymentesítés miatt fontos).",
          "Sorrendet a sorszám mezővel állítod — kisebb szám = előrébb.",
          "Aktív/inaktív kapcsolóval rejtheted vagy visszahozhatod a képet.",
        ],
        whyItHelps: "A galéria a fooldal és a dedikált Galéria oldal egyik fő bizalmi elem — friss, étvágygerjesztő képek = több rendelés.",
        commonMistake: "Ne tölts fel kis felbontású (mobil) képet — törekedj minimum 1200px szélességre.",
      },
    ],
  },
  {
    id: "orders",
    tabGroup: "operations",
    icon: "📦",
    title: "Rendelések és KDS",
    topics: [
      {
        id: "kds-flow",
        pageGroup: "orders-kds",
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
        pageGroup: "orders-kds",
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
    tabGroup: "finance",
    icon: "💰",
    title: "Számlák és pénzügy",
    topics: [
      {
        id: "invoice-ocr",
        pageGroup: "invoices",
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
        pageGroup: "invoices",
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
      {
        id: "payment-reminders",
        pageGroup: "invoices",
        title: "Fizetési emlékeztetők",
        routes: ["/admin/invoices"],
        whatItDoes: "A rendszer figyel a határidőkre és előre szól ha fizetni kell.",
        howToUse: [
          "Számlák oldal tetején látható a 'Lejárt' és 'Közelgő' szekció.",
          "Kattints a számlára → 'Fizetve' jelölés a fizetés napjával.",
        ],
        whyItHelps: "Nincs késedelmi kamat, és a beszállítóval is jó marad a viszony.",
      },
    ],
  },
  {
    id: "partners",
    tabGroup: "finance",
    icon: "🏢",
    title: "Partnerek és beszállítók",
    topics: [
      {
        id: "partner-management",
        pageGroup: "partners",
        title: "Partner adatok kezelése",
        routes: ["/admin/partners"],
        whatItDoes: "A beszállítók (Metro, Auchan, helyi termelő, stb.) adatait egy helyen tárolja: kapcsolat, adószám, bankszámla, jegyzetek.",
        howToUse: [
          "Partnerek → 'Új partner' gomb.",
          "Add meg a nevet, rövid nevet, kategóriát (élelmiszer, szolgáltatás, stb.).",
          "Tölts fel kapcsolati adatokat (telefon, email, kontakt személy).",
          "Pénzügyi adatok: adószám, EU adószám, bankszámla — ezek automatikusan átkerülnek számla felvételkor.",
        ],
        whyItHelps: "Nem kell külön Excelben vezetni a beszállítókat. Számla felvételnél kiválasztod a partnert és minden adat automatikusan kitöltődik.",
      },
      {
        id: "partner-invoices",
        pageGroup: "partners",
        title: "Partner számláinak nyomon követése",
        routes: ["/admin/partners"],
        whatItDoes: "Minden partnernél láthatod, hogy mennyi számlát adtál ki, mi a havi/éves költés.",
        howToUse: [
          "Partnerek → kattints egy partnerre.",
          "A részletek dialógusban látod a kapcsolódó számlákat és összköltést.",
        ],
        whyItHelps: "Eldöntheted melyik beszállító éri meg leginkább, hol érdemes árat egyeztetni.",
      },
    ],
  },
  {
    id: "analytics",
    tabGroup: "finance",
    icon: "📈",
    title: "Statisztika és AI elemzések",
    topics: [
      {
        id: "revenue-tab",
        pageGroup: "analytics",
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
        pageGroup: "analytics",
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
      {
        id: "ai-pricing",
        pageGroup: "analytics",
        title: "AI ár-javaslatok",
        routes: ["/admin/analytics"],
        whatItDoes: "A rendszer 90 napos rendelési adatok alapján AI-val (Gemini) javaslatot tesz, hogy melyik tételnél emelhetnél árat vagy hol kéne csökkenteni.",
        howToUse: [
          "Statisztika → Menü teljesítmény → 'AI árajánlatok' kártya.",
          "Olvasd el az indoklást — miért javasolja az AI az emelést/csökkentést.",
          "Te döntesz: elfogadod, módosítod, vagy elutasítod.",
        ],
        whyItHelps: "Nem kell hetente számolgatnod — az AI észreveszi a mintázatokat amiket te talán nem.",
        commonMistake: "Ne fogadj el vakon minden javaslatot — a vendégkör hűsége is számít, néha érdemes lassabban emelni.",
      },
      {
        id: "customers-tab",
        pageGroup: "analytics",
        title: "Vásárlók",
        routes: ["/admin/analytics"],
        whatItDoes: "Visszatérő vendégek aránya, törzsvendégek, új vendégek számának változása.",
        howToUse: [
          "Statisztika → Vásárlók fül.",
          "TOP törzsvendégek listája — érdemes őket megjutalmazni (kuponnal).",
        ],
        whyItHelps: "Egy törzsvendég 5x annyit ér mint egy egyszeri — az ő megtartásuk a legfontosabb.",
      },
    ],
  },
  {
    id: "coupons",
    tabGroup: "marketing",
    icon: "🎟️",
    title: "Kuponok és kedvezmények",
    topics: [
      {
        id: "create-coupon",
        pageGroup: "coupons",
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
      {
        id: "coupon-usage",
        pageGroup: "coupons",
        title: "Kupon felhasználás követése",
        routes: ["/admin/coupons"],
        whatItDoes: "Látod hogy melyik kupont hányszor használták és összesen mekkora kedvezmény ment ki.",
        howToUse: [
          "Kuponok listájában minden kupon mellett látszik a felhasználások száma.",
          "A KDS rendelés kártyán is zöld badge jelzi, ha a vendég kupont használt.",
        ],
        whyItHelps: "Eldöntheted melyik kampány működik, melyik nem — adatalapú marketing.",
      },
      {
        id: "coupon-strategies",
        pageGroup: "coupons",
        title: "Mikor és milyen kupont adj?",
        whatItDoes: "Stratégiai tippek a kuponhasználathoz.",
        howToUse: [
          "Új vásárló: 10% első rendelésre (pl. ELSO10) — alacsony belépési küszöb.",
          "Csendes nap: keddre/szerdára 15% — kapacitás kihasználás.",
          "Törzsvendég: névre szóló kupon emailben — lojalitás építés.",
          "Ünnep: rövid ideig 20% (pl. húsvét) — sürgető üzenet.",
        ],
        whyItHelps: "A kupon nem veszteség, hanem befektetés a forgalomba és lojalitásba.",
      },
    ],
  },
  {
    id: "capacity",
    tabGroup: "operations",
    icon: "📅",
    title: "Kapacitás és nyitvatartás",
    topics: [
      {
        id: "capacity-slots",
        pageGroup: "capacity",
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
        pageGroup: "capacity",
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
    id: "operations",
    tabGroup: "operations",
    icon: "♻️",
    title: "Pazarlás és előrejelzés",
    topics: [
      {
        id: "waste-tracking",
        pageGroup: "waste-forecast",
        title: "Pazarlás követés",
        routes: ["/admin/daily-menu"],
        whatItDoes: "A nap végén rögzítheted, hány adag maradt el (pazarlás), és a rendszer trendet épít belőle.",
        howToUse: [
          "Napi ajánlat → Pazarlás fül.",
          "Tétel név, tervezett adag, eladott adag, pazarolt adag — kitöltés.",
          "Mentés után a Statisztikában grafikon mutatja a havi pazarlási trendet.",
        ],
        whyItHelps: "Egy 10% pazarlás csökkentés = több 10 ezer Ft havi megtakarítás. A trend mutatja melyik ételből főzz kevesebbet.",
      },
      {
        id: "weather-forecast",
        pageGroup: "waste-forecast",
        title: "Időjárás-alapú adagbecslés",
        routes: ["/admin/daily-menu"],
        whatItDoes: "A rendszer a következő napok időjárását (Open-Meteo) és az elmúlt 4 hét rendelési átlagát kombinálva javaslatot ad, hány adagot főzz.",
        howToUse: [
          "Napi ajánlat → Időjárás kártya a fő nézetben.",
          "Esős napon kevesebb rendelés várható — ennek megfelelően csökkents az adagot.",
          "Hideg napon a leves többet fogy — emelj rajta.",
        ],
        whyItHelps: "Kevesebb pazarlás + biztos hogy nem fogy ki — egyszerre két előny.",
      },
    ],
  },
  {
    id: "content",
    tabGroup: "content",
    icon: "✍️",
    title: "Tartalom kezelés (Rólunk, GYIK, Jogi, Hirdetmény)",
    topics: [
      {
        id: "about-editor",
        pageGroup: "about-faq",
        title: "Rólunk oldal szerkesztése",
        routes: ["/admin/about"],
        whatItDoes: "A publikus 'Rólunk' oldal teljes tartalma szerkeszthető — szöveg, statisztikák (pl. 'Évek száma: 5'), képek.",
        howToUse: [
          "Rólunk admin oldal → szakaszok szerint szerkeszted.",
          "Mentés után azonnal megjelenik a publikus oldalon.",
        ],
        whyItHelps: "Nem kell fejlesztőt hívni minden szöveg-változtatáshoz.",
      },
      {
        id: "faq-editor",
        pageGroup: "about-faq",
        title: "GYIK kezelése",
        routes: ["/admin/faq"],
        whatItDoes: "A publikus oldalon megjelenő gyakori kérdések és válaszok szerkesztése.",
        howToUse: [
          "GYIK admin → 'Új kérdés'.",
          "Sorrend a sorszám mezővel. Aktív/inaktív kapcsolóval rejtheted.",
        ],
        whyItHelps: "A vendégek maguk megtalálják a választ — kevesebb telefonhívás, több rendelés.",
      },
      {
        id: "legal-pages",
        pageGroup: "legal",
        title: "Jogi oldalak (Impresszum, ÁSZF, Adatvédelem, Süti)",
        routes: ["/admin/legal"],
        whatItDoes: "A 4 kötelező jogi oldal Markdown szerkesztővel kezelhető.",
        howToUse: [
          "Jogi oldalak → válaszd ki melyiket szerkeszted.",
          "Markdown: # cím, ## alcím, **félkövér**, [link](url) — egyszerű formázás.",
          "Mentés → azonnal frissül a publikus oldal.",
        ],
        whyItHelps: "Jogi változás (pl. új ÁSZF) esetén perceken belül frissíthető — nem kell fejlesztő.",
        commonMistake: "Ne töröld a teljes oldalt — ha nem vagy biztos, kérj jogi tanácsot a változtatás előtt.",
      },
      {
        id: "announcement",
        pageGroup: "about-faq",
        title: "Hirdetmény popup",
        routes: ["/admin/about"],
        whatItDoes: "A főoldalra belépő vendégeknek megjelenő popup (pl. 'Ünnepi nyitvatartás', 'Új menü').",
        howToUse: [
          "Hirdetmény szerkesztő → cím, leírás, opcionális kép és CTA gomb (link).",
          "Aktív/inaktív kapcsoló — kikapcsoláskor nem jelenik meg.",
          "A popup csak a süti elfogadás után jelenik meg, és csak egyszer/munkamenet.",
        ],
        whyItHelps: "Direkt üzenet a vendégeknek — ünnepek, változások, új ajánlatok kommunikálása.",
      },
    ],
  },
  {
    id: "marketing",
    tabGroup: "marketing",
    icon: "📧",
    title: "Hírlevél és marketing",
    topics: [
      {
        id: "weekly-newsletter",
        pageGroup: "newsletter",
        title: "Heti menü hírlevél",
        routes: ["/admin/daily-menu"],
        whatItDoes: "A feliratkozóknak kiküldhető a heti menü email formájában — szépen formázva, képekkel.",
        howToUse: [
          "Napi ajánlat → Hírlevél fül.",
          "Ellenőrizd a heti menüt (előnézet).",
          "'Küldés' gomb → minden feliratkozónak kimegy emailben (Resend integráció).",
        ],
        whyItHelps: "Emlékezteted a vendégeket hogy nyitva vagytok — közvetlen csatorna a postaládájukba.",
        commonMistake: "Hetente egyszer küldj — ne többször, mert leiratkoznak.",
      },
      {
        id: "subscribers",
        pageGroup: "newsletter",
        title: "Feliratkozók kezelése",
        whatItDoes: "A feliratkozók a checkout-ban vagy a fooldalon iratkoznak fel — listájuk megtekinthető.",
        howToUse: [
          "Hírlevél fülön látható a feliratkozók száma és emailcímek.",
        ],
        whyItHelps: "GDPR-kompatibilis — csak az iratkozik fel aki valóban szeretné.",
      },
    ],
  },
  {
    id: "documents",
    tabGroup: "content",
    icon: "📁",
    title: "Dokumentumok (Kiscsibe Drive)",
    topics: [
      {
        id: "doc-vault",
        pageGroup: "documents",
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
    id: "pwa",
    tabGroup: "content",
    icon: "📱",
    title: "Mobil alkalmazás (PWA) és értesítések",
    topics: [
      {
        id: "pwa-install",
        pageGroup: "pwa-push",
        title: "Telefonra telepítés",
        whatItDoes: "Az admin felület telepíthető a telefonra mint egy app (PWA).",
        howToUse: [
          "iPhone (Safari): Megosztás → 'Hozzáadás a kezdőképernyőhöz'.",
          "Android (Chrome): menü → 'App telepítése' vagy 'Hozzáadás a kezdőképernyőhöz'.",
          "Megnyitás után úgy működik mint egy natív alkalmazás (offline cache, ikon).",
        ],
        whyItHelps: "Gyorsabb hozzáférés — egy érintés és bent vagy az admin felületen.",
      },
      {
        id: "push-notifications",
        pageGroup: "pwa-push",
        title: "Push értesítések",
        whatItDoes: "Új rendelés érkezésekor a telefonod is értesít, akár ha be sincs nyitva a böngésző.",
        howToUse: [
          "Első bejelentkezéskor a böngésző kérdez: 'Engedélyezed az értesítéseket?' → Igen.",
          "Ha véletlen elutasítottad, böngésző beállításokban újra engedélyezheted.",
        ],
        whyItHelps: "Nem kell folyamatosan figyelned a felületet — szól ha történik valami.",
      },
    ],
  },
  {
    id: "troubleshoot",
    tabGroup: "content",
    icon: "🆘",
    title: "Mit tegyek ha…",
    topics: [
      {
        id: "missing-order",
        pageGroup: "troubleshoot",
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
        pageGroup: "troubleshoot",
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
        pageGroup: "troubleshoot",
        title: "…az AI generált kép nem tetszik",
        whatItDoes: "Nem minden kép sikerül elsőre — generálható újra.",
        howToUse: [
          "A Kép generátor fülön nyomd meg az 'Újragenerálás' gombot.",
          "Vagy tölts fel saját képet — bármikor felülírja az AI-t.",
        ],
        whyItHelps: "A vásárló a képet látja először — érdemes a legjobbat választani.",
      },
      {
        id: "no-notifications",
        pageGroup: "troubleshoot",
        title: "…nem kapok push értesítést",
        whatItDoes: "Lehet hogy a böngésző blokkolja vagy nem engedélyezted.",
        howToUse: [
          "Böngésző címsor mellett kattints a lakat ikonra → Értesítések → Engedélyezés.",
          "Frissítsd az oldalt.",
        ],
        whyItHelps: "Beállítás után minden új rendelésről azonnal tudsz.",
      },
    ],
  },
];
