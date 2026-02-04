
# Új Logó Placeholder Implementálás - Átlátszó Háttérrel

## Összefoglaló

A feltöltött Kiscsibe logó (`IMG_6172.PNG`) kerül használatra minden olyan helyen, ahol az ételképek hiányoznak. A lényeg: a kerek sárga logó körüli területnek átlátszónak (see-through) kell lennie, így a háttérgradiens látszik mögötte.

---

## 1. Új Logó Mentése

**Művelet**: A feltöltött PNG fájl másolása a projekt assets mappájába

| Forrás | Cél |
|--------|-----|
| `user-uploads://IMG_6172.PNG` | `src/assets/kiscsibe_logo_round.png` |

**Megjegyzés**: A PNG formátum támogatja az átlátszóságot (alpha channel). A feltöltött kép valószínűleg már tartalmaz transzparens hátteret a kör körül - ez látszani fog a gradient háttér fölött.

---

## 2. Érintett Fájlok

| Fájl | Változás |
|------|----------|
| `src/components/DailyMenuPanel.tsx` | Import csere → új logó |
| `src/components/UnifiedDailySection.tsx` | Import csere → új logó |
| `src/pages/Etlap.tsx` | Import csere → új logó |
| `src/components/Footer.tsx` | Opcionálisan frissíteni a footer logókat is |
| `src/pages/admin/MenuManagement.tsx` | Admin oldal placeholder frissítés |

---

## 3. Import Módosítások

**Minden érintett fájlban:**

```tsx
// Régi:
import kiscsibeLogo from "@/assets/kiscsibe_logo.jpeg";

// Új:
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
```

---

## 4. Placeholder Megjelenés Optimalizálás

A kerek logó jobban fog kinézni nagyobb méretben, kitöltve a 16:9-es aspect ratio konténert:

**Jelenlegi stílus:**
```tsx
<div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center">
  <img src={kiscsibeLogo} className="w-32 h-32 md:w-40 md:h-40 object-contain opacity-70 drop-shadow-lg" />
</div>
```

**Frissített stílus** (nagyobb logó, jobb kitöltés):
```tsx
<div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center">
  <img 
    src={kiscsibeLogo} 
    alt="Kiscsibe" 
    className="h-[85%] w-auto object-contain drop-shadow-xl" 
  />
</div>
```

**Változások:**
- `h-[85%]` - A logó majdnem kitölti a konténer magasságát
- `w-auto` - Szélesség automatikusan követi az arányt
- `opacity-70` **eltávolítva** - A sárga logó teljes erővel látszik
- `drop-shadow-xl` - Erősebb árnyék a kiemeléshez

---

## 5. Vizuális Eredmény

```text
┌────────────────────────────────────────┐
│                                        │
│    ┌─ Gradient háttér ─────────────┐   │
│    │                               │   │
│    │       ╭───────────────╮       │   │
│    │       │   KISCSIBE    │       │   │
│    │       │    🐤 logó    │       │   │  ← A kerek logó körüli
│    │       │  (sárga kör)  │       │   │    terület átlátszó
│    │       ╰───────────────╯       │   │
│    │                               │   │
│    └───────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

A gradient háttér (amber tónus) **átlátszik** a kerek sárga logó körüli sarkokon, mert a PNG átlátszó háttérrel rendelkezik.

---

## 6. Footer Logó (Opcionális)

A footer logóit is frissíthetjük az új kerek logóra:

```tsx
// Admin és Staff logók a footer-ben
<div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
  <img src={kiscsibeLogo} className="w-full h-full object-cover" />
</div>
```

Az `overflow-hidden` és `rounded-full` miatt a footer logók is rendben lesznek - a kerek PNG szépen beleilleszkedik a kerek konténerbe.

---

## 7. Implementációs Sorrend

1. **PNG másolás**: `user-uploads://IMG_6172.PNG` → `src/assets/kiscsibe_logo_round.png`
2. **DailyMenuPanel.tsx**: Import frissítés + stílus optimalizálás
3. **UnifiedDailySection.tsx**: Import frissítés + stílus optimalizálás  
4. **Etlap.tsx**: Import frissítés + stílus optimalizálás
5. **Footer.tsx**: Import frissítés (opcionális)
6. **MenuManagement.tsx**: Admin oldal frissítés

---

## 8. Teljes Fájl Lista

| Művelet | Fájl |
|---------|------|
| COPY | `user-uploads://IMG_6172.PNG` → `src/assets/kiscsibe_logo_round.png` |
| MODIFY | `src/components/DailyMenuPanel.tsx` |
| MODIFY | `src/components/UnifiedDailySection.tsx` |
| MODIFY | `src/pages/Etlap.tsx` |
| MODIFY | `src/components/Footer.tsx` |
| MODIFY | `src/pages/admin/MenuManagement.tsx` |

---

## Összegzés

A változtatás eredményeként:
- A kerek sárga Kiscsibe logó jelenik meg placeholder képként
- A logó körüli terület átlátszó, így a gradient háttér látható
- A logó nagy méretű, szinte kitölti a konténert
- Konzisztens megjelenés az összes oldalon (főoldal, /etlap, admin)
