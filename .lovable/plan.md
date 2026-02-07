
# KDS Gombok Vegleges Javitasa - Bombabiztos Megoldas

## Problema

A gombok a KDS feluleten nem mukodnek megbizhatoan. Az eddigi javitasok (trigger fix, RLS policy, try/finally) szuksegesek voltak, de a frontend kod nem ellenorzi megfeloen, hogy a frissites valoban megtortent-e.

## Gyokerok

A Supabase `.update()` hivas `.select()` nelkul nem ad vissza adatot. Ha a frissites csendben meghiusul (pl. session problema, token lejarat), az `error` mezo `null`, de a valtozas nem tortenik meg. A kod ilyenkor "sikeres" uzenetet mutat, de a kartya nem mozdul.

## Javitasok

### 1. Bombabiztos handleStatusChange (StaffOrders.tsx)

- `.update().select()` hasznalata: visszakapjuk a frissitett sort, es ellenorizzuk, hogy valoban frissult-e
- Ha `data` ures (0 sor frissult): "Nincs jogosultsag" hibauzenet
- Ha `error` nem null: a pontos Supabase hibauzenet megjelenik a toast-ban
- `console.error` logolalas minden hiba eseten a debugolashoz
- A `try/finally` megmarad, hogy a gomb soha ne ragadjon be

### 2. Gomb vizualis javitas (KanbanOrderCard.tsx)

- A fo akciogomb (`Elfogadom`, `Kesz!`, `Atveve`) nagyobb es jobban megkulonboztetheto lesz
- Tapasztalatosabb `touch-manipulation` CSS osztaly a mobilos kattinthato tappable merethez
- A `z-10` biztositja, hogy semmi nem takarja el a gombokat (z-index)
- A gomb `relative` pozicioval elkeruli az atfedes problemakat

### 3. Konzol logolalas

Minden gombnyomas reszletesen logolasra kerul a bongeszo konzolba:
- `[KDS] Updating order X55288: new -> preparing`
- `[KDS] Update successful for X55288`
- `[KDS] ERROR updating X55288: {error details}`
- `[KDS] WARNING: 0 rows affected for X55288 - possible RLS/permission issue`

Ez lehetove teszi, hogy a kovetkezo alkalommal pontosan lassuk, mi tortenik.

---

## Technikai Reszletek

### StaffOrders.tsx modositasok

A `handleStatusChange` fuggvenyt az alabbi modon javitjuk:

```text
handleStatusChange(orderId, newStatus):
  setUpdatingId(orderId)
  try:
    find order code for logging
    console.log("[KDS] Updating order CODE: oldStatus -> newStatus")
    
    result = supabase.update({status}).eq(id).select()
    
    if result.error:
      console.error("[KDS] DB error:", result.error)
      toast(error: error.message)
      return
    
    if !result.data OR result.data.length === 0:
      console.error("[KDS] 0 rows affected - permission issue")
      toast(error: "Nincs jogosultság vagy a rendelés nem található")
      return
    
    console.log("[KDS] Success:", result.data[0].status)
    toast(success: statusLabel)
    
  catch(err):
    console.error("[KDS] Exception:", err)
    toast(error: "Váratlan hiba")
    
  finally:
    setUpdatingId(null)
```

### KanbanOrderCard.tsx modositasok

A fo akciogomb CSS osztalyainak kiegeszitese:
- `relative z-10` a gomb poziciojahoz
- `touch-manipulation` a mobilos tapolas jobb kezelesehez
- `select-none` hogy ne lehessen kivalasztani a szoveget veletlenul
- Nagyobb gomb meret: `h-12` helyett `h-11` (mar igy van)

### Modositando fajlok osszefoglalasa

| Fajl | Valtoztatas |
|------|-------------|
| `src/pages/staff/StaffOrders.tsx` | handleStatusChange: .select() hozzaadasa, adatellenorzes, reszletes hibauzenetek, konzol logolalas |
| `src/components/staff/KanbanOrderCard.tsx` | Gomb CSS javitasok: z-index, touch-manipulation, select-none |
