

# Hirlevel kikuldesi hiba javitasa

Ket hiba van: (1) az edge function nem mukodik, es (2) az elonezet "0 Ft"-ot mutat menu etelek mellé.

---

## 1. Edge Function hiba: `getClaims is not a function`

### A problema
A `send-weekly-menu` edge function a 176. sorban a `userClient.auth.getClaims(token)` metodust hasznalja, ami NEM LETEZIK a Supabase JS kliensben. Ez okozza a "non-2xx status code" hibat.

### Megoldas
A `getClaims` hivast lecsereljuk `userClient.auth.getUser()`-re, ami a standard modja a bejelentkezett felhasznalo azonositasanak:

```text
// HIBAS (jelenlegi):
const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
const userId = claimsData.claims.sub;

// JAVITOTT:
const { data: { user }, error: userError } = await userClient.auth.getUser();
const userId = user?.id;
```

### Modositando fajl:
- `supabase/functions/send-weekly-menu/index.ts` - 174-184. sorok csereje

---

## 2. Elonezet: "0 Ft" jelenik meg menu etelek mellett

### A problema
A kepernyokepe alapjan lathato, hogy pl. "kelkaposztafozelek - 0 Ft" jelenik meg. Ez azert van, mert ezek az etelek menu reszei (is_menu_part = true), de az elonezet jelenleg az a la carte listahoz sorolja oket, es az egyedi arukat mutatja (ami 0 Ft, mert a menu arban benne van).

### Megoldas
Az elonezetben a menu etelek (is_menu_part = true) NE az a la carte listaban jelenjenek meg egyedi arral. A jelenlegi logika mar kezeli ezt (`menuItems` vs `alacarteItems` filter), DE csak akkor mutatja a menu szekciót, ha van `day.menuPrice`. Ha nincs menu ar beallitva, az etelek az a la carte listaba kerulnek 0 Ft-tal.

Javitas: ha egy etel `isMenuPart = true`, de nincs menu ar, akkor is a menu szekcionak kell megjeleniteni, vagy legalabb el kell rejteni a "0 Ft" arat. A legjobb megoldas: az a la carte listaban a 0 Ft-os etelek ara ne jelenjen meg.

### Modositando fajl:
- `src/components/admin/WeeklyNewsletterPanel.tsx` - a la carte listaban a 0 Ft-os arak elrejtese
- `supabase/functions/send-weekly-menu/index.ts` - email sablonban szinten a 0 Ft-os arak elrejtese

---

## Technikai reszletek

### send-weekly-menu/index.ts valtozasok

1. **Auth javitas** (174-184. sorok):
A `getClaims` teljes blokk csereje:
```text
const { data: { user }, error: userError } = await userClient.auth.getUser();
if (userError || !user) {
  return Response 401 "Ervenytelen token."
}
const userId = user.id;
```

2. **Email sablon javitas** (89-96. sorok):
Az a la carte szekcioban a 0 Ft-os etelek aranak elrejtese:
```text
if item.price > 0:
  "item.name -- item.price Ft"
else:
  "item.name"
```

### WeeklyNewsletterPanel.tsx valtozasok

A 296-299. sorokban az a la carte lista megjelenitese:
```text
// Jelenlegi:
• {item.name} — {item.price} Ft

// Javitott:
• {item.name}{item.price > 0 ? ` — ${item.price} Ft` : ""}
```

### Fajlok osszefoglalasa

| Fajl | Valtozas |
|------|---------|
| `supabase/functions/send-weekly-menu/index.ts` | getClaims -> getUser, 0 Ft elrejtes email sablonban |
| `src/components/admin/WeeklyNewsletterPanel.tsx` | 0 Ft elrejtes az elonezetben |

Az edge function ujradeployolasa automatikusan tortenni fog a menteskor.

