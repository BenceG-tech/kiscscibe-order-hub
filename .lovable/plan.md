

# N+1 query optimalizalas

## Osszefoglalas

Mindket fajlban (`OrdersManagement.tsx` es `StaffOrders.tsx`) a `fetchOrders` fuggveny jelenleg N+1 lekerdezest vegez: eloszor az osszes rendeles, majd egyenkent az itemek es opciok. Ezt egyetlen nested select-re csereljuk, es datumszurot is adunk hozza.

## Valtoztatások

### 1. `src/pages/admin/OrdersManagement.tsx` - fetchOrders (144-203. sor)

A teljes `fetchOrders` fuggvenyt lecsereljuk:

```typescript
const fetchOrders = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id, name_snapshot, qty, unit_price_huf, line_total_huf,
        order_item_options (
          id, label_snapshot, option_type, price_delta_huf
        )
      )
    `)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    toast({ title: "Hiba", description: "Nem sikerült betölteni a rendeléseket", variant: "destructive" });
    return;
  }

  const mapped = (data || []).map((order) => ({
    ...order,
    items: (order.order_items || []).map((item) => ({
      id: item.id,
      name_snapshot: item.name_snapshot,
      qty: item.qty,
      unit_price_huf: item.unit_price_huf,
      line_total_huf: item.line_total_huf,
      options: (item.order_item_options || []).map((opt) => ({
        id: opt.id,
        label_snapshot: opt.label_snapshot,
        option_type: opt.option_type,
        price_delta_huf: opt.price_delta_huf,
      })),
    })),
  }));

  setOrders(mapped);
  setLoading(false);
};
```

**Megjegyzes a datumszurorol:** Az admin oldalon 30 napot hasznalunk (nem 7-et), mert a "Multbeli" ful regi rendeleseket is mutat. Az aktiv rendelesek (new/preparing/ready) altalaban fressebbek, de a past tab-nal 30 nap kell.

### 2. `src/pages/staff/StaffOrders.tsx` - fetchOrders (116-169. sor)

Ugyanez a minta, de 7 napos szuroval, mert a staff KDS feluleten csak az aktiv es friss rendelesek relevansak:

```typescript
const fetchOrders = useCallback(async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id, name_snapshot, qty, unit_price_huf, line_total_huf,
        order_item_options (
          id, label_snapshot, option_type, price_delta_huf
        )
      )
    `)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    toast.error("Nem sikerült betölteni a rendeléseket");
    setLoading(false);
    return;
  }

  const mapped = (data || []).map((order) => ({
    ...order,
    items: (order.order_items || []).map((item) => ({
      ...item,
      options: item.order_item_options || [],
    })),
  }));

  setOrders(mapped);
  setLoading(false);
}, []);
```

## Fontos reszletek

- A Supabase nested select `order_items` neven adja vissza a kapcsolt adatokat, de a mappeles soran `items`-re nevezzuk at, igy a renderelo komponensek (`ActiveOrderCard`, `KanbanOrderCard`, `PastOrderAdminCard`) valtozatlanul mukodnek
- Az `options` mezonev megmarad (nem `order_item_options`), a mappeles biztositja ezt
- Az `option_type !== "daily_meta"` szures a renderelo komponensekben van, azokat nem modositjuk
- Admin: 30 napos szuro (past tab miatt); Staff KDS: 7 napos szuro
- Eredmeny: 1 DB lekerdezes a korabbi 100+ helyett

