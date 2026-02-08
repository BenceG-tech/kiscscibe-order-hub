

# Rendelesi Ertesitesek es Valos Ideju Frissitesek Javitasa

A jelenlegi rendszer harom fo problemat tartalmaz:

1. **A valos ideju (realtime) ertesitesek nem mukodnek** - Az `orders` tabla nincs hozzaadva a Supabase `supabase_realtime` publikaciohoz, ezert egyetlen realtime subscription sem kap esemenyt. Ez az oka annak, hogy az adminisztratornakstaff-nak frissitenie kell az oldalt az uj rendeleset latasahoz, es nincs hang vagy felugro ablak sem.

2. **Az ugyfel email cime nincs mentve a rendelesen** - A `orders` tabla nem tartalmaz `email` oszlopot. Az email csak a submit-order edge function-ben hasznalodik a visszaigazolo email kulderekor, de utana nem erheto el. Ahhoz, hogy statuszvaltozaskor emailt kuldhessunk, tarolnunk kell az email cimet.

3. **Nincs statuszvaltozas-email rendszer** - Jelenleg nincs edge function, ami statuszvaltozaskor emailt kuldene az ugyfelenek.

---

## 1. Adatbazis modositasok

### 1a. Orders tabla: email oszlop hozzaadasa

Uj `email` oszlop a `orders` tablahoz, ami az ugyfel email cimet tarolja:

```sql
ALTER TABLE public.orders ADD COLUMN email text;
```

Az oszlop nullable, mert a meglevo rendelesek nem tartalmaznak email cimet.

### 1b. Realtime publikacio beallitasa

Az `orders` tablat hozza kell adni a Supabase realtime publikaciohoz:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

Ez a **legkritikusabb javitas** - enelkul a rendszer soha nem kuld realtime esemenyeket, igy az admin/staff oldalon sem latszanak az uj rendelesek automatikusan, es a hang/popup ertesitesek sem mukodnek.

---

## 2. Submit-order edge function modositasa

A meglevo `supabase/functions/submit-order/index.ts` fajlban a rendeles letrehozasakor az email cimet is menteni kell az `orders` tablaba:

```typescript
// Az INSERT-be bekerül az email mező:
.insert({
  code: orderCode,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,  // ÚJ
  total_huf: calculatedTotal,
  ...
})
```

---

## 3. Uj edge function: send-order-status-email

Uj edge function letrehozasa, ami statuszvaltozaskor emailt kuld az ugyfelenek. Harom statuszra kuld emailt:

| Statusz | Email tartalma |
|---------|---------------|
| `preparing` | "A rendelesed elfogadtuk es mar keszitjuk!" |
| `ready` | "A rendelesedet elkeszitettuk, atveheted!" |
| `completed` | "Koszonjuk, hogy nalunk rendelt! Remeljuk izlett!" |

Az edge function a kovetkezo adatokat kapja:
- `order_id`: a rendeles azonositoja
- `new_status`: az uj statusz

A function a Supabase service role key-t hasznalja a rendeles adatainak lekeresehez (beleertve az email cimet es a rendeles reszleteit), majd a Resend API-val kuldi az emailt.

---

## 4. Frontend modositasok - Statuszvaltozas email triggerelesee

A ket helyen, ahol a rendelesi statuszt frissitik (staff es admin), meg kell hivni az uj edge function-t a statuszvaltozas utan:

### 4a. StaffOrders.tsx (`handleStatusChange`)

A statuszfrissites utan meghivjuk az uj edge function-t:

```typescript
// Sikeres status update után:
supabase.functions.invoke('send-order-status-email', {
  body: { order_id: orderId, new_status: newStatus }
});
```

### 4b. OrdersManagement.tsx (`updateOrderStatus`)

Ugyanez az admin feluleten is:

```typescript
// Sikeres status update után:
supabase.functions.invoke('send-order-status-email', {
  body: { order_id: orderId, new_status: newStatus }
});
```

Az email kuldest fire-and-forget modon hivjuk meg (nem varjuk meg a valaszt), hogy ne lassitsa a felhasznaloi elmenyt.

---

## Osszefoglalas

| Feladat | Fajl | Tipus |
|---------|------|-------|
| Email oszlop hozzaadasa | SQL migracio | Adatbazis |
| Realtime publikacio | SQL migracio | Adatbazis |
| Email mentes rendeleskor | `supabase/functions/submit-order/index.ts` | Edge function |
| Statusz-email edge function | `supabase/functions/send-order-status-email/index.ts` | Uj edge function |
| Edge function config | `supabase/config.toml` | Konfiguracio |
| Staff statuszvaltozas email | `src/pages/staff/StaffOrders.tsx` | Frontend |
| Admin statuszvaltozas email | `src/pages/admin/OrdersManagement.tsx` | Frontend |

### Varos eredmenyek

Implementacio utan:

1. **Valos ideju ertesitesek mukodni fognak** - Az admin es staff oldalon azonnal megjelennek az uj rendelesek, hallhato hangjelzes es felugro ablak
2. **Az ugyfel 4 emailt kap** a rendelesi folyamat soran:
   - Rendeles letrehozasakor (mar mukodik)
   - Rendeles elfogadasakor ("Keszitjuk!")
   - Rendeles elkeszultekor ("Atveheto!")
   - Rendeles atvetelekor ("Koszonjuk!")

