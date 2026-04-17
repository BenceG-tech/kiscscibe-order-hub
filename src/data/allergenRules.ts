// EU allergen codes:
// 1=glutén, 2=rákfélék, 3=tojás, 4=hal, 5=földimogyoró, 6=szója, 7=tej,
// 8=diófélék, 9=zeller, 10=mustár, 11=szezám, 12=kén-dioxid, 13=csillagfürt, 14=puhatestűek

export interface AllergenRule {
  keywords: string[]; // accent-insensitive lowercase
  allergens: string[];
  reason: string;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const ALLERGEN_RULES: AllergenRule[] = [
  {
    keywords: ["rantott", "panirozott", "panirban", "bunda", "milanoi", "bécsi", "becsi", "cordon"],
    allergens: ["1", "3", "7"],
    reason: "Panírozott (liszt + tojás + tej)",
  },
  {
    keywords: ["palacsinta", "gomboc", "galuska", "nokedli", "tarhonya", "knodli"],
    allergens: ["1", "3", "7"],
    reason: "Tojásos tészta tejjel",
  },
  {
    keywords: ["teszta", "spagetti", "penne", "fusilli", "tagliatelle", "lasagne", "bolognai", "carbonara", "spageti"],
    allergens: ["1", "3"],
    reason: "Tojásos tészta",
  },
  {
    keywords: ["pizza"],
    allergens: ["1", "7"],
    reason: "Pizza (tészta + sajt)",
  },
  {
    keywords: ["kruton", "zsemle", "kifli", "kenyer", "toast", "bagett", "bruschetta", "pirito"],
    allergens: ["1"],
    reason: "Kenyérféle",
  },
  {
    keywords: ["sajt", "mozzarella", "parmezan", "feta", "trappista", "ementali", "gorgonzola"],
    allergens: ["7"],
    reason: "Sajt",
  },
  {
    keywords: ["tej", "tejszin", "tejfol", "tejfoles", "vaj", "vajas", "joghurt", "tejfoles", "tejszines", "rahmkartoffel"],
    allergens: ["7"],
    reason: "Tej / tejszín / tejföl",
  },
  {
    keywords: ["tojas", "tukortojas", "rantotta", "omlett", "majones"],
    allergens: ["3"],
    reason: "Tojás",
  },
  {
    keywords: ["majonez"],
    allergens: ["3", "10"],
    reason: "Majonéz (tojás + mustár)",
  },
  {
    keywords: ["mustar"],
    allergens: ["10"],
    reason: "Mustár",
  },
  {
    keywords: ["zeller"],
    allergens: ["9"],
    reason: "Zeller",
  },
  {
    keywords: ["szoja", "tofu", "szojaszosz"],
    allergens: ["6"],
    reason: "Szója",
  },
  {
    keywords: ["szezam"],
    allergens: ["11"],
    reason: "Szezám",
  },
  {
    keywords: ["dio", "mogyoro", "mandula", "pisztacia", "pekan", "kesudio", "marcipan"],
    allergens: ["8"],
    reason: "Diófélék",
  },
  {
    keywords: ["foldimogyoro", "mogyorovaj"],
    allergens: ["5"],
    reason: "Földimogyoró",
  },
  {
    keywords: ["hal", "lazac", "tonhal", "ponty", "harcsa", "tokehal", "fogas", "süllő", "sullo", "pisztrang"],
    allergens: ["4"],
    reason: "Hal",
  },
  {
    keywords: ["garnela", "rak", "rakfar", "shrimp", "scampi"],
    allergens: ["2"],
    reason: "Rákfélék",
  },
  {
    keywords: ["kagylo", "tintahal", "polip", "calamari"],
    allergens: ["14"],
    reason: "Puhatestűek",
  },
  {
    keywords: ["bor", "borecet"],
    allergens: ["12"],
    reason: "Bor (kén-dioxid)",
  },
];

export interface AllergenSuggestion {
  itemId: string;
  itemName: string;
  currentAllergens: string[];
  suggestedAllergens: string[]; // additions only
  reasons: string[];
}

export function suggestAllergensForItem(
  name: string,
  description: string | null,
  currentAllergens: string[] | null,
): { added: string[]; reasons: string[] } {
  const haystack = norm(`${name} ${description ?? ""}`);
  const current = new Set((currentAllergens ?? []).map(String));
  const additions = new Set<string>();
  const reasons: string[] = [];

  for (const rule of ALLERGEN_RULES) {
    const matched = rule.keywords.some((k) => {
      const nk = norm(k);
      // word-boundary-ish match: allow within compound words but require letter boundary
      const re = new RegExp(`(^|[^a-z0-9])${nk}`);
      return re.test(haystack);
    });
    if (!matched) continue;

    let addedAny = false;
    for (const a of rule.allergens) {
      if (!current.has(a) && !additions.has(a)) {
        additions.add(a);
        addedAny = true;
      }
    }
    if (addedAny) reasons.push(rule.reason);
  }

  return { added: Array.from(additions), reasons };
}
