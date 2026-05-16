## Cél

A főoldalon a napi ajánlat után jelenjen meg egy **figyelemfelkeltő, kattintható CTA banner**, ami jelzi, hogy a napi menün kívül is vannak állandóan elérhető tételek (italok, savanyúságok, reggeli stb.), és átvisz az étlap megfelelő részére.

## Mit cserélünk

Jelenlegi `src/pages/Index.tsx`-ben:

```tsx
<section className="py-8">
  <AlwaysAvailableSection featuredOnly maxItems={6} title="Mindig elérhető kedvenceink" />
</section>
```

Ez kiírja a kiemelt fix tételeket képpel, árral — a user szerint **ne legyen kiírva**, csak egy kattintható elem.

## Mit építünk

Új komponens: `src/components/sections/AlwaysAvailableTeaser.tsx`

Egy kompakt, prémium érzetű CTA kártya/banner a következőkkel:
- **Bal oldal**: kis ikon (Package / Coffee) + cím "Mindig elérhető kedvenceink" + alszöveg "Italok, reggeli, savanyúságok és további fix tételek bármikor"
- **Jobb oldal**: chevron/arrow ikon
- **Mini preview**: 3–4 darab fix tétel apró kerek thumbnail képe egymásra csúsztatva (avatar stack stílusban) + "+N további" badge — vizuális utalás, hogy van mit nézni, de nincs kiírva
- A teljes kártya egy `<Link to="/etlap#mindig-elerheto">` (vagy `/etlap` + scroll), `hover:scale-[1.01]`, brand gold accent, kerek (`rounded-2xl`), brand színekkel.

Data: ugyanaz a query mint `AlwaysAvailableSection` (max 4 kiemelt képpel + összdarabszám), csak thumbnail strip-ként rendereljük.

## Integráció

`src/pages/Index.tsx`:
- A jelenlegi `AlwaysAvailableSection`-t tartalmazó `<section>`-t cseréljük az új `<AlwaysAvailableTeaser />`-re.
- A `bg-primary/5` váltakozó háttér-ritmus marad.

## Étlap oldal

Ellenőrizzük, hogy az `/etlap` oldalon van-e `id="mindig-elerheto"` horgony a fix tételek szekciójánál; ha nincs, hozzáadjuk, hogy a kattintás odagörgessen. (Tisztán UI, nincs backend változás.)

## Mit NEM változtatunk

- Az `AlwaysAvailableSection` komponens marad, máshol (pl. `/etlap`) tovább használjuk.
- Semmilyen backend / query logika / RLS / DB nem módosul.
- A `BreakfastSection` és a többi főoldal szekció érintetlen.

## Érintett fájlok

- ÚJ: `src/components/sections/AlwaysAvailableTeaser.tsx`
- MÓD: `src/pages/Index.tsx` (1 szekció csere)
- MÓD (ha kell): `src/pages/Etlap.tsx` (anchor id hozzáadás)
