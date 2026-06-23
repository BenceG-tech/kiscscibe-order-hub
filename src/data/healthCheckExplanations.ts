export interface HealthCheckExplanation {
  what: string;
  causes: string[];
  manualSteps: string[];
  link?: { label: string; href: string };
  fixable?: boolean;
  fixLabel?: string;
}

export const HEALTH_CHECK_EXPLANATIONS: Record<string, HealthCheckExplanation> = {
  daily_offer: {
    what: "Ellenőrzi, hogy a mai napra van-e beállítva napi ajánlat (leves + főétel) és vannak-e hozzá tételek.",
    causes: [
      "Még nem hoztad létre a mai napi ajánlatot.",
      "Létrehoztad, de még nem adtál hozzá tételeket.",
      "Hétvége van, ilyenkor zárva vagyunk – nincs napi ajánlat.",
    ],
    manualSteps: [
      "Nyisd meg az Admin → Heti menü oldalt.",
      "Válaszd ki a mai napot.",
      "Adj hozzá legalább 1 levest és 1 főételt, állíts be árat.",
      "Mentés után automatikusan megjelenik a publikus oldalon.",
    ],
    link: { label: "Heti menü kezelése", href: "/admin/menu-schedule" },
    fixable: true,
    fixLabel: "Másolás legutóbbi sablonból",
  },
  capacity: {
    what: "Megnézi, hogy a mai napra elegendő átvételi időpont (idősáv) van-e létrehozva (min. 4 db).",
    causes: [
      "A kapacitás-sablon még nem futott le a mai napra.",
      "Manuálisan törölve lettek idősávok.",
    ],
    manualSteps: [
      "Nyisd meg az Admin → Kapacitás oldalt.",
      "Válaszd ki a mai napot és állíts be 10:30–14:30 közötti idősávokat 30 percenként.",
      "Mentsd el – a vásárlók ezek közül választhatnak átvételi időpontot.",
    ],
    link: { label: "Kapacitás kezelése", href: "/admin/capacity" },
    fixable: true,
    fixLabel: "Alap idősávok létrehozása",
  },
  submit_order: {
    what: "Ellenőrzi, hogy a rendelés-leadó szolgáltatás (edge function) elérhető és válaszol.",
    causes: [
      "Átmeneti hálózati hiba a Supabase felé.",
      "Az edge function nem lett deploy-olva vagy hibás.",
    ],
    manualSteps: [
      "Futtasd újra az ellenőrzést pár másodperc múlva.",
      "Ha tartós, nézd meg az edge function logokat a Supabase dashboardban.",
    ],
    fixable: true,
    fixLabel: "Újra ellenőrzés",
  },
  db_write: {
    what: "Megpróbál beszúrni és törölni egy próbabejegyzést az adatbázisba, hogy biztosan írható.",
    causes: [
      "Adatbázis nem elérhető.",
      "Jogosultsági (RLS) probléma.",
    ],
    manualSteps: [
      "Futtasd újra az ellenőrzést.",
      "Ha továbbra is hibás, nézd meg a Supabase státuszát: https://status.supabase.com",
    ],
    fixable: true,
    fixLabel: "Újra ellenőrzés",
  },
  email: {
    what: "Megnézi, hogy a Resend e-mail szolgáltatás API kulcsa be van-e állítva és válaszol-e.",
    causes: [
      "A RESEND_API_KEY nincs beállítva a Supabase secrets-ben.",
      "A kulcs lejárt vagy érvénytelen.",
      "A Resend szolgáltatás átmenetileg nem elérhető.",
    ],
    manualSteps: [
      "Nyisd meg a Supabase Edge Functions secrets oldalt.",
      "Ellenőrizd, hogy a RESEND_API_KEY létezik és érvényes.",
      "Új kulcsot a https://resend.com/api-keys oldalon tudsz létrehozni.",
    ],
    fixable: false,
  },
  stuck: {
    what: "Megnézi, hogy van-e olyan rendelés, amelyik > 30 perce 'új' állapotban ragadt.",
    causes: [
      "Az adminok elfelejtették elfogadni vagy elutasítani a rendelést.",
      "Az értesítés nem jutott el a személyzethez.",
    ],
    manualSteps: [
      "Nyisd meg az Admin → Rendelések oldalt.",
      "Keresd meg az érintett rendelést a 'Részletek' szövegben látható kód alapján.",
      "Fogadd el (Előkészítés alatt) vagy utasítsd el (Lemondva).",
    ],
    link: { label: "Rendelések", href: "/admin/orders" },
    fixable: true,
    fixLabel: "Régiek lemondása",
  },
  sold_out: {
    what: "Ellenőrzi, hogy nem kapcsolt-e ki minden mai tétel ('kifogyott' állapotba).",
    causes: [
      "Manuálisan minden tételt kifogyottnak jelöltél.",
      "Tévedésből kapcsoltad ki a tételeket.",
    ],
    manualSteps: [
      "Nyisd meg a Heti menü oldalt a mai napra.",
      "Kapcsold vissza azokat a tételeket, amik valójában elérhetők.",
    ],
    link: { label: "Heti menü", href: "/admin/menu-schedule" },
    fixable: true,
    fixLabel: "Mindent elérhetővé tesz",
  },
};
