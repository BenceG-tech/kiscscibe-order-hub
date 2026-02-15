
# Checkout UX javitasok

## Osszefoglalas

Harom UX javitas a `src/pages/Checkout.tsx` fajlban: progress indikator, inline form validacio debounce-szal, es fizetesi mod magyarazatok.

## Valtoztatások

### 1. Progress indikator (oldal tetejere)

A fejlec ("Rendeles veglegesitese") fole kerul egy 3 lepesu vizualis indikator:

- Lepesek: **Kosar** (1) → **Adatok** (2) → **Osszesito** (3)
- Nincs tenyeleges lepesvaltas/wizard logika - a progress strip vizualisan mutatja a checkout folyamat lepeseit, ahol az "Adatok" az aktualis lepes (kiemelt primary szinnel), a "Kosar" zold pipaval jelolve (kesz), az "Osszesito" pedig halvany (kovetkezo)
- Mobilon ikonok + rovid szoveg, desktopon teljes szoveg
- Megvalositas: egyedi komponens a Checkout.tsx-en belul, Tailwind-del stilusozva, `Check` ikon a lucide-react-bol

```text
  [✓ Kosár] ——— [● Adatok] ——— [○ Összesítő]
```

### 2. Inline form validacio

**Uj state-ek:**
- `fieldErrors: { name?: string; phone?: string; email?: string }` (alapertelmezett: `{}`)
- `touched: { name?: boolean; phone?: boolean; email?: boolean }` (alapertelmezett: `{}`)

**Validacios szabalyok (debounce 300ms, `useEffect` + `setTimeout`):**

| Mezo | Szabaly | Hibauzenet |
|------|---------|------------|
| Nev | min 2, max 100 karakter | "A nev legalabb 2 karakter legyen" / "A nev legfeljebb 100 karakter lehet" |
| Telefon | `+36` prefix utan pontosan 9 szamjegy (szokozok nelkul szamolva) | "Kerjuk, adj meg egy ervenyes telefonszamot" |
| Email | standard email regex | "Kerjuk, adj meg egy ervenyes email cimet" |

**Mukodes:**
- Csak az `onBlur` utan (touched) indul a validacio, utana gepeles kozben is frissul (300ms debounce)
- Hibauzenet az adott mezo ALATT jelenik meg piros szovegkent (`text-sm text-destructive`)
- A submit gomb `disabled` lesz ha barmelyik mezonen hiba van vagy ures a kotelezo mezo
- A `handleSubmit` elejen is fut a validacio (biztonsagi halo)

### 3. Fizetesi mod magyarazat

A jelenlegi RadioGroup elemekhez kis magyarazo szoveg kerul:

```text
◉ Készpénz átvételkor
  Fizetés átvételkor a helyszínen

○ Bankkártya átvételkor
  Bankkártyás fizetés átvételkor
```

Megvalositas: `<p className="text-xs text-muted-foreground ml-6">` az egyes radio Label-ek ala.

## Technikai reszletek

| Elem | Megoldas |
|------|---------|
| Progress indikator | Inline komponens, `Check` ikon, Tailwind `flex items-center` layout |
| Debounce validacio | `useEffect` + `setTimeout`/`clearTimeout` (300ms) a `formData` + `touched` fuggvenyeben |
| Telefon regex | `/^\d{9}$/` a szokozok eltavolitasa utan (a `+36` prefix kulon kezelt) |
| Email regex | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Submit disable | Bovitett `disabled` feltetel: meglevo feltetelek + `Object.values(fieldErrors).some(Boolean)` + kotelezo mezok uresseg ellenorzese |
| Erintett fajl | Kizarolag `src/pages/Checkout.tsx` |
