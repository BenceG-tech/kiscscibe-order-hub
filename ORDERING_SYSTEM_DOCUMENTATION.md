# Kiscsibe Rendelési Rendszer - Fejlesztői Dokumentáció

## Áttekintés

Ez a dokumentáció részletezi a Kiscsibe étterem rendelési rendszerének kulcsfontosságú biztonsági és funkcionális jellemzőit.

## 🔒 Biztonsági Funkciók

### 1. Múltbeli Rendelések Tiltása

**Hely a kódban:**
- **UI validáció**: `src/pages/Checkout.tsx` (113-152 sorok)
- **Server validáció**: `supabase/functions/submit-order/index.ts` (142-152 sorok)
- **DB trigger**: `validate_order_date()` és `validate_daily_item_date()` funkciók

**Működés:**
```typescript
// Checkout validáció
if (selectedTime < now) {
  toast({ title: "Hiba", description: "Múltbeli időpontra nem lehet rendelni" });
  return;
}

// Edge function validáció 
if (itemDate < today) {
  throw new Error(`Múltbeli dátumra nem lehet rendelni: ${dailyData.date}`);
}
```

### 2. Race-Safe Oversell Védelem

**Hely a kódban:**
- **Atomikus funkció**: `public.update_daily_portions()` SQL funkció
- **Használat**: `supabase/functions/submit-order/index.ts` (170-175 sorok)

**Működés:**
```sql
-- FOR UPDATE lock-kal védett tranzakció
SELECT remaining_portions INTO current_portions
FROM daily_offers 
WHERE id = daily_id 
FOR UPDATE;

-- Csak akkor frissít, ha van elég adag
UPDATE daily_offers 
SET remaining_portions = remaining_portions - quantity_needed
WHERE id = daily_id AND remaining_portions >= quantity_needed;
```

### 3. RLS (Row Level Security) Szabályok

**Rendelések tábla:**
- **Olvasás**: Csak adminok és service role
- **Írás**: Csak service role (edge function-ök)
- **Frissítés**: Csak adminok (státusz módosítás)

**Biztonságos ügyfél hozzáférés:**
```sql
-- Funkció a biztonságos rendelés lekéréshez
CREATE FUNCTION get_customer_order_secure(order_code text, customer_phone text)
```

### 4. Nyitvatartási Órák Validáció

**Hely a kódban:**
- **SQL funkció**: `public.validate_pickup_time()`
- **UI validáció**: `src/pages/Checkout.tsx`

**Nyitvatartás:**
- Hétfő-Péntek: 7:00-15:00
- Szombat: 8:00-14:00
- Vasárnap: Zárva

## 📧 Email Konfiguráció

### Aktuális Beállítások

**Feladó**: `rendeles@kiscsibe-etterem.hu`
**Admin másolat**: `kiscsibeetterem@gmail.com`

**Hely a kódban:**
```typescript
// supabase/functions/submit-order/index.ts (408-415 sorok)
await resend.emails.send({
  from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
  to: [customer.email],
  bcc: ['kiscsibeetterem@gmail.com'], // Admin copy
  subject: `Kiscsibe – rendelés visszaigazolás #${orderCode}`
});
```

### Domain Beállítás

A `rendeles@kiscsibe-etterem.hu` domain-t a Resend-ben ellenőrizni kell:
1. Resend Dashboard → Domains
2. Add Domain: `kiscsibe-etterem.hu`
3. DNS rekordok beállítása

## 🗂️ Kapacitáskezelés

### Jelenlegi Rendszer

**Két párhuzamos rendszer:**
1. **Capacity Slots**: `capacity_slots` tábla (időpont alapú foglalások)
2. **Daily Portions**: `remaining_portions` mező a napi ajánlatokban/menükben

### Egységesítési Javaslat

Mindkét rendszer ugyanazt a célt szolgálja. Javasolt megoldás:
- Tartani a `remaining_portions` rendszert egyszerűsége miatt
- Eltávolítani a `capacity_slots` táblát, vagy átdolgozni tisztán időpont-foglalásra

## 🚫 "Elfogyott" Kezelés

### UI Megjelenítés

**Hely**: `src/components/DailyItemSelector.tsx` (155-157, 246 sorok)

```typescript
<Badge variant={data.remaining_portions > 0 ? "default" : "destructive"}>
  {data.remaining_portions > 0 ? `Maradt: ${data.remaining_portions}` : 'Elfogyott'}
</Badge>

// Gomb
{data.remaining_portions <= 0 ? 'Elfogyott' : 'Kosárba'}
```

### Automatic Stock Check

A kosár tartalma automatikusan újra-ellenőrzésre kerül a rendelés leadás előtt az edge function-ben.

## 🔄 Admin Státusz Folyamat

### Státusz Állapotok

1. **new** → Új rendelés
2. **preparing** → Készítés alatt  
3. **ready** → Átvehető
4. **completed** → Elvitt
5. **cancelled** → Lemondva

### Státusz Frissítés

**Hely**: `src/pages/admin/OrdersManagement.tsx`

```typescript
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
};
```

## 🛠️ Troubleshooting

### Gyakori Problémák

1. **"Egyedi elem mentés nem működik"**
   - **Megoldás**: Ellenőrizd, hogy minden kötelező mező ki van-e töltve (név, kategória, ár)
   - **Hely**: `src/components/admin/EnhancedItemSelection.tsx` (76-84 sorok)

2. **Email nem érkezik meg**
   - **Ellenőrizd**: Resend API key beállítva van-e a Supabase secrets-ben
   - **Ellenőrizd**: Domain verificálva van-e a Resend-ben

3. **Múltbeli rendelés hiba**
   - **Ok**: Többszintű védelem (UI + Server + DB trigger)
   - **Megoldás**: Normális működés, nem hiba

### Rollback Lépések

**Migration visszavonás:**
```sql
-- Távolítsd el a triggereket
DROP TRIGGER IF EXISTS validate_order_date_trigger ON orders;
DROP TRIGGER IF EXISTS validate_daily_offer_date_trigger ON daily_offers;

-- Távolítsd el a constraint-eket
ALTER TABLE daily_offers DROP CONSTRAINT IF EXISTS check_daily_offers_remaining_portions_non_negative;
```

**Edge Function rollback:**
Ha az új funkcionalitás hibát okoz, visszaállítható a korábbi verzió a Git commitokból.

## 🔧 Környezeti Változók

### Szükséges Secrets (Supabase Edge Functions)

```bash
SUPABASE_URL=https://gvtsbnivuysunnjrpndk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[admin_key]
RESEND_API_KEY=[resend_api_key]
```

### Beállítás

1. Supabase Dashboard → Project Settings → Edge Functions
2. Add secret: `RESEND_API_KEY`
3. Másold be a Resend API kulcsot

## ⚡ Performance

### Indexek

```sql
-- Optimalizációs indexek
CREATE INDEX idx_daily_offers_date ON daily_offers(date);
CREATE INDEX idx_daily_menus_date ON daily_menus(date);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
```

### Query Optimalizálás

A rendszer automatikusan használja a server-side árakat a kliens által küldött árak helyett, megakadályozva az ár manipulációt.

## 📱 Jövőbeli Fejlesztések

### 1. Real-time Értesítések

WebSocket kapcsolat implementálása:
- Admin-ok azonnal látják az új rendeléseket
- Vásárlók valós időben látják a készletfrissítéseket

### 2. Cutoff Time Rendszer

Konfigurálható határidő a rendelésekre (pl. 15:00 után már másnapi menüre lehet csak rendelni).

### 3. Fejlettebb Kapacitáskezelés

- 15 perces időslot-ok
- Külön kapacitás kategóriánként
- Automatikus kapacitás-optimalizáció

---

## 📞 Kapcsolat

**Fejlesztői kérdések:** Használd a Git commit history-t és a kód kommenteket további részletekért.

**Üzemeltetési problémák:** Ellenőrizd a Supabase logs-ot és az edge function response-okat.