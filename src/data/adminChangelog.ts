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
