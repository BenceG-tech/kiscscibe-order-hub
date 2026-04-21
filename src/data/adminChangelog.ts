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
