export type ChangelogType = "new" | "improved" | "fixed";

export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  type: ChangelogType;
  tabGroup?: string; // which help tab this relates to
  helpTopicId?: string; // optional jump target
}

// Newest first
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-07-13",
    title: "KRITIKUS javítás: napi teljes menük (leves+főétel csomag) rendelése nem működött",
    description:
      "Sürgős audit után kiderült, hogy a napi TELJES menüt (leves + főétel csomag) tartalmazó rendelések MINDEGYIKE csendben elutasításra került hónapok óta. Az ok: a készletkezelő adatbázis-függvény nem ismerte fel a napi teljes menük tábláját (`daily_offer_menus`), és 'Invalid table name' hibával eldobta a rendelést, mielőtt bármi mentődött volna. Ez magyarázza a nagy értékű (20-30 000 Ft-os) elveszett rendeléseket, mert éppen a törzsvendégek rendeltek komplett menüt. Ezzel együtt javítottuk: (1) DUPLA KATTINTÁS: a rendelés gomb most `useRef`-alapú zárral még a React újrarajzolás ELŐTT blokkol, tehát dupla kattintás / lassú hálózat esetén sem futhat le kétszer a submit. (2) HÁLÓZATI HIBA RETRY: ha kimarad az internet vagy a szerver timeoutol, piros dobozban egyértelmű üzenet jelenik meg és a gomb ismét aktív — a rendszer 15 percen belül ugyanazt a rendelési szándékot ismeri fel és nem hoz létre duplikátumot (idempotency bucket). (3) NYITVATARTÁS EGYSÉGESÍTVE: minden réteg (frontend, backend, DB trigger) most a valós nyitvatartást tudja — H-P 07:00-16:00 nyitva, ebéd átvétele 10:30-tól, 15:30 után aznapi rendelés már nem fogadható, csak holnaptól. (4) ASAP RENDELÉS VÉDELEM: mielőbbi-átvételes rendelés is validálódik (eddig csendben átment hétvégén / záráskor).",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-07-13",
    title: "Rendelésleadási audit: telefon, email és időpont blokkolások javítása",
    description:
      "A rendelési útvonalon több olyan kliensoldali blokkolót találtunk, ami miatt a vendég rendelése el sem jutott a szerverig, ezért az étterem sem rendelést, sem sikertelen próbálkozást nem látott. Javítás: az email már nem kötelező, a telefonszám elfogadja a 06 / +36 / 36 / szóközös formátumokat, a böngésző natív email-validációja nem állítja meg némán a formot, minden rendelés gomb-kattintás azonnal naplózódik, a validációs blokkolások is megjelennek a Félbehagyott/Sikertelen nézetben, az időpontlista 15:00-ig enged, és az ellenőrzések Budapest-idő szerint futnak.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-07-02",
    title: "Nagy rendelés-audit: duplikátum-védelem, kupon-verseny, realtime flap javítás",
    description:
      "Teljes körű auditot csináltunk a rendelés életútján (leadás → mentés → megjelenítés). A megtalált 15+ kockázatból az alábbiakat most javítottuk: 1) DUPLIKÁTUM-VÉDELEM: ha a vendég kétszer kattint, vagy a hálózat pillanatnyi timeout után újrapróbálja, a szerver 5 percen belül ugyanazt a kosarat egyetlen rendelésként rögzíti (idempotency_key). 2) EMAIL TIMEOUT: a Resend visszaigazoló emailt már nem várjuk meg a válasz előtt — így ha az email szolgáltatás belassul, a rendelés nem hasal el 'Rendelés mentési hiba' üzenettel. 3) KUPON-VERSENY: két egyidejű rendelés ugyanazzal a kuponnal többé nem tudja átlépni a max_uses limitet (atomikus SQL számláló). 4) ORDER ROLLBACK: ha a rendelés-tételek mentése elakad, a szerver automatikusan törli a fejrekordot is — nincs több 'üres rendelés' a listán. 5) 5 PERCES GRACE: a szerveroldali pickup_time ellenőrzés 5 perc türelmet ad a feldolgozási késésnek, hogy a vendég 10:30-as rendelése ne csússzon el 'múltbeli' hibaüzenetbe. 6) REALTIME FLAP-VÉDELEM: az admin értesítés csatorna másodpercenként bomlott le újra és újra (SUBSCRIBED → CLOSED loop) — most 3× gyors bezárás után 60s cooldown-ba megy, és közben a 30s-os polling fallback biztosítja, hogy egyetlen új rendelés se maradjon észrevétlen. 7) A konzolt már nem szemeteli a Notifications hook — csak fejlesztői módban logol.",
    type: "fixed",
    tabGroup: "orders",
  },

  {
    date: "2026-07-02",
    title: "KRITIKUS javítás: bankkártyás átvételi fizetés minden esetben elszállt",
    description:
      "Kiderült, hogy amikor a vendég a 'Bankkártya átvételkor' opciót választotta, a rendelés MINDIG 'Rendelés mentési hiba' üzenettel elutasításra került. Az ok: a frontend a 'card' értéket küldte, de az adatbázis csak a 'cash', 'pos' és 'card_online' értékeket engedélyezte, így az orders INSERT azonnal elhasalt egy check-constraint miatt. Ez már régóta élt — minden bankkártyás átvételi próbálkozás áldozat lett. Javítás: a Checkout mostantól 'pos' (POS-terminál helyszíni fizetés) értékkel küld, és a szerver oldalon védőháló is van a régi ('card') klienseknek. Egy érintett rendelést (Kazi Cintia, 7280 Ft, 4× próbálkozás) kézzel berögzítettünk az Új rendelések közé, és a Sikertelen listáról töröltük a duplikátumokat.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-07-02",
    title: "Rendelési stabilitás: időzóna és rollback javítások",
    description:
      "Több rejtett hibát is kijavítottunk, ami miatt egy rendelés némán elakadhatott. 1) A régi formátumú átvételi időpont (ISO) mostantól szintén Európa/Budapest időben olvasódik, tehát 10:30 nem csúszik 08:30-ra. 2) A napi tétel 'múltbeli dátum' ellenőrzése is Budapest időben történik — éjfél körül nem dobja el a másnapi rendelést. 3) Ha valamiért nincs előre létrehozott idősáv, a szerver most csak a valódi 10:30–15:00 ablakban hoz létre újat (nem 7:00–16:00 között) — így nem foglal el kapacitást olyan időpontra, amit a végleges ellenőrzés úgyis elutasítana. 4) Ha bármelyik lépés a végleges rendelés-mentés előtt hibára fut, a szerver automatikusan visszaadja a lefoglalt idősávot és a levont adagszámot — így nincs 'szellemfoglalás', ami feleslegesen fogyasztaná a készletet. 5) A rendeléskód (pl. B12345) ütközés esetén automatikusan újragenerálódik és újrapróbálja a mentést. Az admin rendszerellenőrzésbe került egy új 'Szellemfoglalások' teszt is, ami egy gombnyomásra helyrerakja a számlálókat.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-07-02",
    title: "Javítva: 10:30-as rendelések elutasítása időzóna hiba miatt",
    description:
      "Kiderült, hogy pontosan 10:30-ra időzített rendelések bizonyos esetekben 'Rendelés mentési hiba' üzenettel elutasításra kerültek. Az ok: a rendszer az átvételi időpontot UTC időzónában értékelte (Budapesthez képest -2 óra), így a 10:30 → 08:30-ként jelent meg, ami kívül esett a 10:30–15:00 ablakon. A szerveroldali ellenőrzés (validate_pickup_time) mostantól kifejezetten Európa/Budapest időzónában dolgozik. Egy érintett rendelést (Dr. Örkényi Erika, 4740 Ft) kézzel berögzítettünk az Új rendelések közé.",
    type: "fixed",
    tabGroup: "orders",
  },

  {

    date: "2026-06-30",
    title: "Adag mérete (dkg vagy db) megadható az ételekhez",
    description:
      "Az ételszerkesztőben az Ár alatt új mező: 'Adag mérete'. Megadhatsz egy számot és kiválaszthatod, hogy az dkg, db, g vagy ml. Üresen hagyható, és csak akkor jelenik meg a vendégek felé, ha ki van töltve. A vendég oldalon a napi ajánlatnál, a fix tételeknél és a reggelinél is kis szürke címkeként látszik az étel neve mellett (pl. '25 dkg' vagy '2 db'), így a vásárló pontosan tudja, mekkora porciót kap.",
    type: "new",
    tabGroup: "menu",
  },
  {
    date: "2026-06-30",
    title: "Sokkal egyértelműbb publikálás a heti ajánlatoknál",
    description:
      "Volt egy gyakori félreértés: ha a heti ajánlatok 'piszkozat' állapotban maradtak, a vendégek nem látták az étlapon. Mostantól a heti rács tetején egy nagy, sárga figyelmeztető sáv jelenik meg, ha bármelyik nap piszkozatban van — rajta egy nagy 'Egész hét publikálása most' gombbal. Ha minden nap publikálva van, egy zöld 'Hét publikálva — a vendégek látják' sáv jelenik meg. Minden napra a 'Publikálva ✓ / Piszkozat' helyett most 'Látható / Nem látható' jelzés van, színes badge-dzsel, hogy egyértelmű legyen mit lát a vendég.",
    type: "improved",
    tabGroup: "daily",
  },
  {

    date: "2026-06-23",
    title: "Átvételi időpontok csak ebédidőben (10:30-tól)",
    description:
      "Az átvételi időpont választó mostantól csak 10:30 és 14:30 között kínál fel időpontokat, 30 percenként. Hétvégén zárva. Ezzel megelőzhető, hogy reggeli időpontra (pl. 07:00 vagy 08:00) érkezzen rendelés. A változás szerver oldalon is védve van (validate_pickup_time), és a korábban legenerált, de még senki által nem foglalt 10:30 előtti idősávok el lettek távolítva.",
    type: "improved",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Rendelések lista automatikus frissítése + manuális frissítés gomb",
    description:
      "Előfordult, hogy az 'Új rendelések' fülön nem jelent meg azonnal egy frissen leadott rendelés (pl. ha a böngésző fül a háttérben volt és a realtime kapcsolat megszakadt). Mostantól a lista 30 másodpercenként automatikusan frissül a háttérben, és a fejlécbe került egy 'Frissítés' gomb is, amivel azonnal újratölthető a teljes lista.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Egyklikkes javítás és részletes hibaleírás a rendszerellenőrzésnél",
    description:
      "A Rendszer önellenőrzés minden hiba / figyelmeztetés mellé tett egy 'Javítás' gombot, ami automatikusan rendbe teszi a problémát (pl. mai napi ajánlat létrehozása sablonból, idősávok feltöltése, ragadt rendelések lemondása, kifogyott tételek visszaállítása). A 'Részletek' gomb felugró ablakban mutatja, mit ellenőriz a rendszer, mik a lehetséges okok és hogyan tudod manuálisan megoldani. Van egy 'Hibák javítása' gomb is a fejlécben, ami egyszerre próbálja az összes javítható hibát orvosolni.",
    type: "new",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Rendszerellenőrző gomb a Rendelések oldalon + javított értesítő sáv",
    description:
      "Mostantól a Rendelések kezelése oldal fejlécében is elérhető a 'Rendszerellenőrzés' gomb — egy kattintással ellenőrizheted a rendelési rendszer állapotát anélkül, hogy visszamennél az Irányítópultra. Az admin értesítő sáv mobilon átszervezve: a cím, a lapozó és a gombok már nem csúsznak egymásra.",
    type: "improved",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Piszkozat / publikálás munkafolyamat a heti menüknél",
    description:
      "Az új napi ajánlatok mostantól piszkozatként jönnek létre — nem jelennek meg a vendégek előtt, amíg nem nyomod meg a 'Publikálás' gombot. A heti nézetben napi szintű 'Piszkozat ↔ Publikálva' kapcsoló, valamint egy 'Hét publikálása' gomb is van a fejlécben. Korábbi ajánlatok automatikusan publikáltak maradnak.",
    type: "new",
    tabGroup: "weekly",
  },
  {
    date: "2026-06-23",
    title: "Előnézet a menü másolásnál",
    description:
      "A 'Másolás' dialógusban a forrás hét / nap kiválasztása után rögtön látod, milyen levesek, főételek és à la carte tételek vannak benne, mielőtt rákattintanál a másolásra. Cél napnál azt is mutatja, mi van már most ott.",
    type: "improved",
    tabGroup: "weekly",
  },
  {
    date: "2026-06-23",
    title: "Rendszer önellenőrző gomb az Irányítópulton",
    description:
      "Új gomb az admin főoldalon: egy kattintásra végigellenőrzi, hogy minden rendben van-e a rendelési rendszerben (mai napi ajánlat, idősávok, edge function, e-mail, adatbázis írási jog). Zöld/sárga/piros állapotjelzőkkel mutatja, ha valami nem stimmel.",
    type: "new",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Sikertelen és félbehagyott rendelések követése",
    description:
      "A Rendelések oldalon két új fül: Sikertelen (akik megpróbáltak rendelni, de hibára futottak) és Félbehagyott (akik elkezdték, de nem fejezték be). Telefonszámra kattintva azonnal vissza lehet hívni a vendéget.",
    type: "new",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Rendelés leadás stabilizálás",
    description:
      "Javítva: ha a vendég a napi ajánlatot egy másik napra próbálta rendelni, a rendszer automatikusan a helyes dátumra igazítja (nem hiúsul meg a leadás). Ha a napi ajánlat ára nincs beállítva, az adatbázis nem dob hibát. A Checkout most már mindig a napi tétel dátumára küldi a rendelést.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-06-23",
    title: "Frissítések banner az admin tetején",
    description:
      "Az admin felület tetején új sárga banner mutatja a friss módosításokat és újdonságokat (az elmúlt 7 napban). Kattintásra elrejthető egyenként vagy egyben.",
    type: "new",
    tabGroup: "overview",
  },
  {
    date: "2026-06-16",
    title: "Nyomtatás gomb az új rendeléseknél",
    description:
      "Az Új fázisban lévő rendelések most külön Nyomtatás gombot kaptak: egy kattintásra megnyílik egy 80 mm-es konyhai bizonylat (rendelésszám, vendég, átvétel, tételek, módosítók, kupon, végösszeg, megjegyzés) és automatikusan elindul a nyomtatás.",
    type: "new",
    tabGroup: "orders",
  },
  {
    date: "2026-06-16",
    title: "Tablet értesítések megbízhatóbbak",
    description:
      "iPad/Android tableteken most már megbízhatóan hangot ad és vibrál az új rendelés értesítő. Ha a tablet aludt vagy elveszett a kapcsolat, az ébredés után automatikusan lekérdezi a kimaradt rendeléseket és értesít róluk. 60 másodpercenként háttér-ellenőrzés is fut biztonsági szempontból.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-06-16",
    title: "Rendelési fázisok visszaléptetése",
    description:
      "Az admin felületen most már minden rendelésnél elérhető a Vissza gomb: véletlenül átállított Készítés/Kész/Átvéve állapot egy kattintással visszahelyezhető. A vendég ilyenkor NEM kap automata e-mailt. A múltbeli rendelések is visszaaktiválhatók a Visszaaktiválás gombbal.",
    type: "new",
    tabGroup: "orders",
  },
  {
    date: "2026-06-16",
    title: "Tisztább új-rendelés kártya",
    description:
      "Az új rendelések most kék keretes kiemelést kapnak, a tetején egy lényeg-sávban azonnal látszik a kód, név, telefon, átvétel és összeg. A fő státusz-akció gombok nagyobbak és könnyebben elérhetők mobilon.",
    type: "improved",
    tabGroup: "orders",
  },
  {
    date: "2026-06-16",
    title: "Checkout: érthető hibajelzések",
    description:
      "Ha a vendég nem tud továbblépni a rendelésnél (hibás telefonszám, hiányzó adat, választatlan időpont), most piros toast üzenet pontosan megmondja, miért. A Rendelés leadása gomb nem szürkül le néma módon, és a telefonszám-validáció elfogadja a vezető 0-t és a szóközöket.",
    type: "fixed",
    tabGroup: "orders",
  },
  {
    date: "2026-06-15",
    title: "Vélemények szerkesztő admin felület",
    description:
      "Új /admin/vélemények oldal: a főoldalon megjelenő vendég-vélemények tetszőlegesen szerkeszthetők, új vélemény vehető fel, sorrend állítható, aktív/inaktív kapcsolóval rejthető. A publikus oldalon továbbra is minden vélemény 5 csillagos.",
    type: "new",
    tabGroup: "content",
  },
  {
    date: "2026-06-15",
    title: "Mobil alsó menü minden aloldalon",
    description:
      "Az alsó sticky navigáció (Főoldal / Étlap / Galéria / Több) mostantól minden publikus aloldalon elérhető — Étlap, Galéria, Rólunk, Kapcsolat és a jogi oldalakon is. Nincs többé visszanavigálás a főoldalra a menüsor miatt.",
    type: "improved",
    tabGroup: "content",
  },
  {
    date: "2026-06-15",
    title: "Ételképek megjelenítésének javítása az Étlap oldalon",
    description:
      "A napi ételek kártyáin a képek már nem vannak túlzottan ráközelítve. A négyzet alakú AI képek 1:1 arányban jelennek meg (további napi ételek), a fő napi menü képe pedig mobilon 1:1, asztali nézetben 4:3 arányú — sokkal kevésbé vágódik le az étel.",
    type: "fixed",
    tabGroup: "menu",
  },
  {
    date: "2026-06-15",
    title: "Akciós szekció átláthatóbb lett",
    description:
      "Az akciós szekcióban már nincs félrevezető áthúzott ár. 16:00-tól ketyeg a visszaszámláló a következő nyitvatartási napra, így a vendég pontosan látja meddig rendelhet.",
    type: "improved",
    tabGroup: "marketing",
  },
  {
    date: "2026-04-22",
    title: "PDF és képfájl alapú számlafelismerés",
    description:
      "A számlák feltöltése után automatikusan elindul az AI adatkinyerés. Digitális PDF-ekből, szkennelt PDF-ekből és képekből is próbál adatot kinyerni, a bizonytalan mezőket pedig üresen hagyja kézi ellenőrzésre.",
    type: "new",
    tabGroup: "finance",
    helpTopicId: "invoice-ocr",
  },
  {
    date: "2026-04-22",
    title: "Pénzügyi modul gyorsabb és átláthatóbb lett",
    description:
      "A számlák tesztként jelölhetők és kizárhatók a riportokból, új gyors szűrők és 3 pontos műveletek kerültek a listába, az AI számlafelismerés tételsorokat is betölt, a partnereknél pedig pénzügyi összefoglaló látszik.",
    type: "improved",
    tabGroup: "finance",
    helpTopicId: "invoice-ocr",
  },
  {
    date: "2026-04-22",
    title: "Dokumentumtár gyors műveletek",
    description:
      "A Dokumentumok rész összetettebb és felhasználóbarátabb lett: mappázás, címkézés, csillagozás közvetlenül a 3 pontos menüből, feltöltés előtti mappa/címke választás, tömeges címke műveletek és rendezés.",
    type: "improved",
    tabGroup: "content",
    helpTopicId: "doc-vault",
  },
  {
    date: "2026-04-22",
    title: "Admin módosítási napló és kézikönyv jegyzetek",
    description:
      "Új Napló oldal készült: látható, ki mikor mit módosított a dokumentumokban, étlapon, napi ajánlatban, számlákban és partnereknél. A kézikönyv elején új jegyzet blokk is van, ahol használat közben lehet észrevételt írni.",
    type: "new",
    tabGroup: "content",
    helpTopicId: "activity-log",
  },
  {
    date: "2026-04-22",
    title: "Engedélyezett admin regisztráció",
    description:
      "A főadmin mellett az előre engedélyezett Kiscsibe email címek admin jogosultságot kaphatnak regisztráció/bejelentkezés után, biztonságosan a user_roles rendszerben.",
    type: "new",
    tabGroup: "content",
  },
  {
    date: "2026-04-21",
    title: "Kiscsibe-stílusú FB poszt AI generátor",
    description:
      "Új, gazdag FB poszt generátor — pont olyan posztokat ír, mint amit a tulaj szokott (🔥 nagybetűs címsor, ételhez illő egyedi emoji-k, kacsintós hook, záró csattanó, hashtag blokk). 3 poszt típus: holnapi előzetes / mai elkészült / heti indító. Auto-detect a dátum alapján.",
    type: "new",
    tabGroup: "marketing",
    helpTopicId: "image-generator",
  },
  {
    date: "2026-04-18",
    title: "Kézikönyv tab-okkal és „Mi változott?\" szekció",
    description:
      "Az admin kézikönyv mostantól tab-okra van bontva (Áttekintés, Étlap, Működés, stb.) — egy kattintással ugorhatsz a témára. Új „Mi változott?\" tab mutatja a friss frissítéseket.",
    type: "new",
    tabGroup: "overview",
  },
  {
    date: "2026-04-17",
    title: "Admin kézikönyv újratervezés",
    description:
      "Áttetsző overlay (közben látod a felületet), nagyobb betűk, „Mit hol találsz?\" gyors-térkép, napi/heti rutin checklist. Click-outside bezárás.",
    type: "improved",
    tabGroup: "overview",
  },
  {
    date: "2026-04-17",
    title: "Allergének automatikus hozzárendelése",
    description:
      "Az Étlap kezelésnél egy gombbal javaslatot kapsz a hiányzó allergénekre az ételnevek alapján.",
    type: "new",
    tabGroup: "menu",
    helpTopicId: "master-library",
  },
  {
    date: "2026-04-17",
    title: "Kosár ürítése egy gombbal",
    description:
      "A kosár ablakban már nem kell minden tételt egyesével 0-ra állítani — egy „Kosár ürítése\" gombbal kitörölheted az egészet.",
    type: "new",
    tabGroup: "operations",
  },
  {
    date: "2026-04-16",
    title: "Dokumentumok visszakerült a fő nav-ba",
    description:
      "A Dokumentumok admin tab már nem a „Több\" dropdown alatt van — közvetlenül elérhető a navigációból.",
    type: "fixed",
    tabGroup: "overview",
  },
  {
    date: "2026-04-15",
    title: "FB poszt AI szöveg generátor",
    description:
      "A napi ajánlathoz egy kattintással generálható Facebook/Instagram poszt szöveg — több hangnem és formátum (FB, IG poszt, IG story).",
    type: "new",
    tabGroup: "marketing",
    helpTopicId: "image-generator",
  },
  {
    date: "2026-04-14",
    title: "Kapacitás magyarázó panel",
    description:
      "Új súgó panel a Kapacitás fülön — látod hogy mit jelentenek a slot-ok és hogyan érdemes beállítani.",
    type: "new",
    tabGroup: "operations",
    helpTopicId: "capacity-slots",
  },
  {
    date: "2026-04-13",
    title: "Tab sorrend a Napi ajánlat oldalon",
    description:
      "A Napi ajánlat tab-jai logikusabb sorrendbe kerültek (összeállítás → kapacitás → kép/poszt → hírlevél → pazarlás).",
    type: "fixed",
    tabGroup: "menu",
  },
];

export function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return now - d <= days * 24 * 60 * 60 * 1000;
}

export function newEntriesCount(days = 7): number {
  return CHANGELOG.filter((e) => isWithinDays(e.date, days)).length;
}

const LAST_VIEWED_KEY = "kiscsibe_changelog_last_viewed";

export function getUnseenCount(days = 7): number {
  const lastViewed = localStorage.getItem(LAST_VIEWED_KEY);
  const lastTs = lastViewed ? new Date(lastViewed).getTime() : 0;
  return CHANGELOG.filter(
    (e) => isWithinDays(e.date, days) && new Date(e.date).getTime() > lastTs,
  ).length;
}

export function markChangelogViewed() {
  localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
}
