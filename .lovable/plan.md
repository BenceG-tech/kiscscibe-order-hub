

# Bizonylat-kezelő Rendszer -- 3. Fazis: Hasznossag, Atlathato, Ertek

Az 1-2. fazis megvan (CRUD, feltoltes, torles, export, auto-bevetel trigger). Most a rendszer napi hasznalhatosagat, atlathatasagat es erteket noveljuk.

---

## 1. Dashboard penzugyi osszesito kartyak

A fo iranyitopultra (`Dashboard.tsx`) kerul egy "Penzugyi attekintes" szekcio, ami egy pillantasra megmutatja a havi helyzetet.

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Uj szekcio: havi bevetel, koltseg, eredmeny kartyak + lejart szamlak figyelmeztetese |

- 3 kartya: "Havi bevétel", "Havi költség", "Eredmény" (a DashboardStatCard-ot hasznaljuk)
- Ha van lejart (overdue) vagy fizetetlen szamla, piros alert jelenik meg a DashboardAlerts-ben
- Adatok: az invoices tablabol az aktualis honap szurt adatai (egyetlen query)

---

## 2. Lejart szamlak figyelmeztetese a Dashboard-on

A `DashboardAlerts.tsx`-be uj ellenorzes: ha van `status = 'pending'` es `due_date < today`, piros alert jelenik meg: "3 lejart szamla, osszesen 234.500 Ft!"

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/components/admin/DashboardAlerts.tsx` | Uj ellenorzes: lejart fizetesi hatarideju szamlak |

---

## 3. Bizonylat lista fejlesztesek

### 3a. Fajl elonezet es megnyitas

Jelenleg a csatolt fajlok csak "Fajl 1", "Fajl 2" felirattal jelennek meg. Fejlesztes:
- Kepek: kicsi thumbnail elonezet a lista soron belul
- PDF: kattintasra uj lapon megnyilik
- A fajlokat a `InvoiceListItem`-ben is megjelenitjuk (kis ikon + kattinthato)

### 3b. Gyors statusz valtas

A listaban kozvetlenul lehessen statuszt valtani (pl. "Fuggobe" → "Fizetve") anelkul hogy megnyitnak a szerkeszto dialogust. Egy kis dropdown a statusz badge-re kattintva.

### 3c. Rendeles-bizonylatok megkulonboztetese

Az `order_receipt` tipusu bizonylatok mas szinnel / badge-dzsel jelenjenek meg a listaban, es a szerkeszto dialogban readonly modban nyiljanak meg (mivel automatikusan generalodjak).

### Valtozasok
| Fajl | Leiras |
|------|--------|
| `src/components/admin/InvoiceListItem.tsx` | Thumbnail elonezet, kattinthato fajlok, gyors statusz dropdown, order_receipt jeloles |
| `src/components/admin/InvoiceFormDialog.tsx` | Readonly mod order_receipt tipusnal |
| `src/components/admin/InvoiceFileUpload.tsx` | Kep thumbnail elonezet a feltoltott fajloknal |

---

## 4. "Fuggobe" (Pending) mentes gomb

Jelenleg a dialog-ban csak "Piszkozat" es "Fizetve" gomb van. A "Fuggobe" (pending) statusz fontos a bejovo szamlaknalz mert a tulaj latja melyik szamlat kell meg kifizetnie.

### Valtozas
| Fajl | Leiras |
|------|--------|
| `src/components/admin/InvoiceFormDialog.tsx` | 3. gomb: "Mentes fizetesre varonak" (pending) |

---

## 5. Szamlak szama badge az admin nav-ban

Ahogy a rendeleseknel latjuk az uj rendelesek szamat, a szamlak menupont mellett is jelenjen meg egy badge, ha van lejart (overdue) szamla.

### Valtozas
| Fajl | Leiras |
|------|--------|
| `src/pages/admin/AdminLayout.tsx` | Lejart szamlak szama badge a "Szamlak" menupont mellett |
| `src/pages/admin/Invoices.tsx` | Vagy: a szamot a szulo komponens adja at, vagy kulon hook |

Megvalositas: egy egyszeru `useOverdueInvoiceCount` hook ami figyeli a lejart szamlak szamat.

---

## 6. Havi szuro gyorsgombok

A szurokhoz ket gyorsgomb: "Ez a honap" es "Elozo honap" — igy a konyveloi export soran nem kell datumot allitgatni.

### Valtozas
| Fajl | Leiras |
|------|--------|
| `src/components/admin/InvoiceFilters.tsx` | "Ez a honap" / "Elozo honap" gyorsgombok a datum szurok melle |

---

## Uj fajlok

| Fajl | Leiras |
|------|--------|
| `src/hooks/useOverdueInvoices.ts` | Hook: lejart szamlak szamat es osszegeit figyeli (a dashboard-hoz es a nav badge-hez) |

## Modositando fajlok osszesitese

| Fajl | Valtozas |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Havi penzugyi osszesito kartyak |
| `src/components/admin/DashboardAlerts.tsx` | Lejart szamlak alert |
| `src/components/admin/InvoiceListItem.tsx` | Thumbnail, gyors statusz, order_receipt jeloles |
| `src/components/admin/InvoiceFormDialog.tsx` | Pending gomb, readonly mod order_receipt-nel |
| `src/components/admin/InvoiceFileUpload.tsx` | Kep thumbnail |
| `src/components/admin/InvoiceFilters.tsx` | Havi gyorsgombok |
| `src/pages/admin/AdminLayout.tsx` | Lejart szamlak badge |

---

## Nem tartalmazza a 3. fazis

- Rendeles-bizonylat nyomtathato PDF generalas → 4. fazis
- Ismetlodo koltsegek automatizalasa → 4. fazis
- Csatolt fajlok ZIP export a konyvelonek → 4. fazis
- OCR (fotobol adat kinyeres) → kesobb
- Partner-nyilvantartas kulon oldal → kesobb

