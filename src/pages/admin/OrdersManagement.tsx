import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Package,
  Archive,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Search,
  Download,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { exportOrdersToCSV } from "@/lib/orderExport";
import InfoTip from "@/components/admin/InfoTip";

interface OrderItemOption {
  id: string;
  label_snapshot: string;
  option_type: string | null;
  price_delta_huf: number;
}

interface OrderItem {
  id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  line_total_huf: number;
  options?: OrderItemOption[];
}

interface Order {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  total_huf: number;
  status: string;
  payment_method: string;
  pickup_time: string;
  created_at: string;
  notes?: string;
  archived?: boolean;
  items?: OrderItem[];
}

/** Format date as Hungarian string */
const formatHungarianDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("hu-HU", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

const getDateLabel = (dateKey: string): string => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateKey === today) return "Ma";
  if (dateKey === yesterday) return "Tegnap";
  return formatHungarianDate(dateKey);
};

const groupByDate = (orders: Order[]): Map<string, Order[]> => {
  const grouped = new Map<string, Order[]>();
  for (const order of orders) {
    const dateKey = new Date(order.created_at).toISOString().split("T")[0];
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(order);
  }
  return new Map([...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)));
};

const OrdersManagement = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a rendeléseket",
        variant: "destructive",
      });
      return;
    }

    // Fetch items + options
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("id, name_snapshot, qty, unit_price_huf, line_total_huf")
          .eq("order_id", order.id);

        const itemIds = (itemsData || []).map((i) => i.id);
        let optionsMap: Record<string, OrderItemOption[]> = {};

        if (itemIds.length > 0) {
          const { data: optionsData } = await supabase
            .from("order_item_options")
            .select(
              "id, label_snapshot, option_type, price_delta_huf, order_item_id"
            )
            .in("order_item_id", itemIds);

          if (optionsData) {
            for (const opt of optionsData) {
              const key = opt.order_item_id || "";
              if (!optionsMap[key]) optionsMap[key] = [];
              optionsMap[key].push({
                id: opt.id,
                label_snapshot: opt.label_snapshot,
                option_type: opt.option_type,
                price_delta_huf: opt.price_delta_huf,
              });
            }
          }
        }

        const itemsWithOptions = (itemsData || []).map((item) => ({
          ...item,
          options: optionsMap[item.id] || [],
        }));

        return { ...order, items: itemsWithOptions };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a rendelés állapotát",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Siker", description: "Rendelés állapota frissítve" });

    supabase.functions
      .invoke("send-order-status-email", {
        body: { order_id: orderId, new_status: newStatus },
      })
      .catch((err) => console.error("Status email error:", err));

    fetchOrders();
  };

  const archiveOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ archived: true } as any)
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült archiválni",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Archiválva" });
    fetchOrders();
  };

  const deleteOrder = async (orderId: string) => {
    // Delete options -> items -> order (cascade manually)
    const { data: items } = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", orderId);

    if (items && items.length > 0) {
      const itemIds = items.map((i) => i.id);
      await supabase
        .from("order_item_options")
        .delete()
        .in("order_item_id", itemIds);
      await supabase.from("order_items").delete().eq("order_id", orderId);
    }

    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült törölni a rendelést",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Törölve" });
    fetchOrders();
  };

  const archiveAllPast = async () => {
    const pastIds = orders
      .filter(
        (o) =>
          ["completed", "cancelled"].includes(o.status) && !(o as any).archived
      )
      .map((o) => o.id);

    if (pastIds.length === 0) return;

    const { error } = await supabase
      .from("orders")
      .update({ archived: true } as any)
      .in("id", pastIds);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült archiválni",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Összes archiválva", description: `${pastIds.length} rendelés archiválva` });
    fetchOrders();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { label: "Új", color: "bg-blue-100 text-blue-800", icon: Clock },
      preparing: {
        label: "Készítés alatt",
        color: "bg-yellow-100 text-yellow-800",
        icon: Package,
      },
      ready: {
        label: "Kész",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      completed: {
        label: "Átvéve",
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Lemondva",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };
    return configs[status as keyof typeof configs] || configs.new;
  };

  const filterOrders = (status: string) => {
    if (status === "all") {
      return orders.filter(
        (order) => !["completed", "cancelled"].includes(order.status)
      );
    }
    if (status === "past") {
      const pastOrders = orders.filter((order) =>
        ["completed", "cancelled"].includes(order.status)
      );
      if (!showArchived) {
        return pastOrders.filter((o) => !(o as any).archived);
      }
      return pastOrders;
    }
    return orders.filter((order) => order.status === status);
  };

  const getFilteredOrders = (tabValue: string) => {
    const base = filterOrders(tabValue);
    if (!debouncedSearch) return base;
    const q = debouncedSearch.toLowerCase();
    return base.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
    );
  };

  const getOrderCounts = () => {
    const activeOrders = orders.filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    );
    const pastOrders = orders.filter((o) =>
      ["completed", "cancelled"].includes(o.status)
    );

    return {
      new: orders.filter((o) => o.status === "new").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      past: pastOrders.filter((o) => !showArchived ? !(o as any).archived : true).length,
      all: activeOrders.length,
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </AdminLayout>
    );
  }

  const counts = getOrderCounts();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Rendelések kezelése
            <InfoTip text="Kezeld a bejövő rendeléseket: fogadd el, állítsd készre, vagy mondd le." />
          </h1>
          <Badge variant="outline">Összesen: {orders.length} rendelés</Badge>
        </div>

        {/* Search + Export row */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Keresés rendelésszám, név vagy telefon alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {debouncedSearch && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                {getFilteredOrders(activeTab).length} találat
              </p>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => exportOrdersToCSV(getFilteredOrders(activeTab))}
                  disabled={getFilteredOrders(activeTab).length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rendelések exportálása CSV-be</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="new" className="relative">
              Új rendelések
              {counts.new > 0 && (
                <Badge className="ml-2 bg-blue-600 text-white">
                  {counts.new}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="relative">
              Készítés alatt
              {counts.preparing > 0 && (
                <Badge className="ml-2 bg-yellow-600 text-white">
                  {counts.preparing}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              Kész
              {counts.ready > 0 && (
                <Badge className="ml-2 bg-green-600 text-white">
                  {counts.ready}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="relative">
              Múltbeli
              {counts.past > 0 && (
                <Badge className="ml-2 bg-gray-600 text-white">
                  {counts.past}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Aktív</TabsTrigger>
          </TabsList>

          {/* Active tabs: new, preparing, ready, all */}
          {["new", "preparing", "ready", "all"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-6">
              <div className="grid gap-4">
                {getFilteredOrders(tabValue).map((order) => (
                  <ActiveOrderCard
                    key={order.id}
                    order={order}
                    getStatusConfig={getStatusConfig}
                    onStatusChange={updateOrderStatus}
                  />
                ))}
                {getFilteredOrders(tabValue).length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Nincs{" "}
                        {tabValue === "all"
                          ? "aktív"
                          : "ilyen állapotú"}{" "}
                        rendelés
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}

          {/* Past orders tab */}
          <TabsContent value="past" className="mt-6">
            <PastOrdersTab
              orders={getFilteredOrders("past")}
              showArchived={showArchived}
              onToggleArchived={setShowArchived}
              onArchive={archiveOrder}
              onDelete={deleteOrder}
              onArchiveAll={archiveAllPast}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

/* ─── Active Order Card ─── */
const ActiveOrderCard = ({
  order,
  getStatusConfig,
  onStatusChange,
}: {
  order: Order;
  getStatusConfig: (s: string) => {
    label: string;
    color: string;
    icon: any;
  };
  onStatusChange: (id: string, status: string) => void;
}) => {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <span className="text-lg">#{order.code}</span>
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              {new Date(order.created_at).toLocaleString("hu-HU")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {order.total_huf} Ft
            </p>
            <p className="text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 inline mr-1" />
              {order.payment_method === "cash" ? "Készpénz" : "Kártya"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-semibold mb-2">Vevő adatok:</h4>
            <p className="text-sm">
              <strong>Név:</strong> {order.name}
            </p>
            <p className="text-sm">
              <Phone className="h-4 w-4 inline mr-1" />
              {order.phone}
            </p>
            {order.email && (
              <p className="text-sm">
                <Mail className="h-4 w-4 inline mr-1" />
                {order.email}
              </p>
            )}
            {order.pickup_time && (
              <p className="text-sm">
                <Clock className="h-4 w-4 inline mr-1" />
                Átvétel: {new Date(order.pickup_time).toLocaleString("hu-HU")}
              </p>
            )}
          </div>

          {order.notes && (
            <div>
              <h4 className="font-semibold mb-2">Megjegyzés:</h4>
              <p className="text-sm bg-muted p-2 rounded">{order.notes}</p>
            </div>
          )}
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Rendelt tételek:</h4>
            <div className="bg-muted/50 p-3 rounded space-y-2">
              {order.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.name_snapshot}</span>
                      <span className="text-muted-foreground ml-2">
                        × {item.qty}
                      </span>
                    </div>
                    <span className="font-medium">{item.line_total_huf} Ft</span>
                  </div>
                  {item.options &&
                    item.options.filter((o) => o.option_type !== "daily_meta")
                      .length > 0 && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {item.options
                          .filter((o) => o.option_type !== "daily_meta")
                          .map((opt) => (
                            <div
                              key={opt.id}
                              className="text-xs text-muted-foreground"
                            >
                              ↳ {opt.label_snapshot}
                              {opt.price_delta_huf !== 0 &&
                                ` (${opt.price_delta_huf > 0 ? "+" : ""}${opt.price_delta_huf} Ft)`}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {order.status === "new" && (
            <Button
              size="sm"
              onClick={() => onStatusChange(order.id, "preparing")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Készítés megkezdése
            </Button>
          )}
          {order.status === "preparing" && (
            <Button
              size="sm"
              onClick={() => onStatusChange(order.id, "ready")}
              className="bg-green-600 hover:bg-green-700"
            >
              Kész jelölése
            </Button>
          )}
          {order.status === "ready" && (
            <Button
              size="sm"
              onClick={() => onStatusChange(order.id, "completed")}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Átvéve
            </Button>
          )}
          {["new", "preparing"].includes(order.status) && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusChange(order.id, "cancelled")}
            >
              Lemondás
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <a href={`tel:${order.phone}`}>
              <Phone className="h-4 w-4 mr-1" />
              Hívás
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Past Orders Tab ─── */
const PastOrdersTab = ({
  orders,
  showArchived,
  onToggleArchived,
  onArchive,
  onDelete,
  onArchiveAll,
}: {
  orders: Order[];
  showArchived: boolean;
  onToggleArchived: (v: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onArchiveAll: () => void;
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const grouped = groupByDate(orders);
  const unarchivedCount = orders.filter((o) => !(o as any).archived).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)));
    }
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await onDelete(id);
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showArchived}
              onCheckedChange={onToggleArchived}
              id="show-archived"
            />
            <label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
              Archivált mutatása
            </label>
          </div>
          {orders.length > 0 && (
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              {selectedIds.size === orders.length ? "Kijelölés törlése" : "Összes kijelölése"}
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Kijelöltek törlése ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kijelölt rendelések törlése</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan véglegesen törlöd a kijelölt {selectedIds.size} rendelést? Ez a művelet nem vonható vissza.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mégsem</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Igen, törlés ({selectedIds.size})
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {unarchivedCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Archive className="h-4 w-4 mr-1" />
                  Összes archiválása ({unarchivedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Összes archiválása</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan archiválod az összes ({unarchivedCount}) múltbeli
                    rendelést? Ez a művelet nem vonható vissza.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mégsem</AlertDialogCancel>
                  <AlertDialogAction onClick={onArchiveAll}>
                    Igen, archiválás
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Date-grouped orders */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nincs múltbeli rendelés</p>
          </CardContent>
        </Card>
      ) : (
        [...grouped.entries()].map(([dateKey, dateOrders]) => (
          <div key={dateKey}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {getDateLabel(dateKey)} ({dateOrders.length})
            </h3>
            <div className="grid gap-3">
              {dateOrders.map((order) => (
                <PastOrderAdminCard
                  key={order.id}
                  order={order}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  selected={selectedIds.has(order.id)}
                  onToggleSelect={() => toggleSelect(order.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/* ─── Past Order Admin Card (collapsible) ─── */
const PastOrderAdminCard = ({
  order,
  onArchive,
  onDelete,
  selected,
  onToggleSelect,
}: {
  order: Order;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isArchived = (order as any).archived;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card
        className={cn(
          "transition-all",
          order.status === "cancelled" && "opacity-60",
          isArchived && "opacity-40",
          selected && "ring-2 ring-primary"
        )}
      >
        {/* Header row */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
          >
            {/* Top row: icon + code + name + price */}
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="shrink-0 mt-0.5 sm:mt-0" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
                <Checkbox checked={selected} />
              </div>
              {order.status === "completed" ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="min-w-0 flex-1">
                {/* First line: code, name, archived badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-bold text-sm sm:text-base">#{order.code}</span>
                    <span className="text-muted-foreground text-sm truncate">{order.name}</span>
                    {isArchived && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Archivált
                      </Badge>
                    )}
                  </div>
                  {/* Price - visible on mobile in first row */}
                  <span className="font-bold text-sm sm:text-lg whitespace-nowrap sm:hidden">
                    {order.total_huf.toLocaleString("hu-HU")} Ft
                  </span>
                </div>
                {/* Second line: date, phone, email */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  <span className="whitespace-nowrap">
                    {new Date(order.created_at).toLocaleString("hu-HU")}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Phone className="h-3 w-3" />
                    {order.phone}
                  </span>
                  {order.email && (
                    <span className="flex items-center gap-1 truncate max-w-[180px] sm:max-w-none">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{order.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Right side: price (desktop) + badge + chevron */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-7 sm:ml-0">
              <span className="font-bold text-lg whitespace-nowrap hidden sm:inline">
                {order.total_huf.toLocaleString("hu-HU")} Ft
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] sm:text-xs whitespace-nowrap",
                  order.status === "completed"
                    ? "border-green-500 text-green-700"
                    : "border-red-400 text-red-600"
                )}
              >
                {order.status === "completed" ? "Átvéve" : "Lemondva"}
              </Badge>
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded details */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
            {/* Customer contact */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {order.pickup_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Átvétel:{" "}
                  {new Date(order.pickup_time).toLocaleString("hu-HU")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                {order.payment_method === "cash" ? "Készpénz" : "Kártya"}
              </span>
            </div>

            {/* Ordered items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-muted/50 p-3 rounded space-y-2">
                {order.items.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">
                          {item.name_snapshot}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          × {item.qty}
                        </span>
                      </div>
                      <span className="font-medium">
                        {item.line_total_huf} Ft
                      </span>
                    </div>
                    {item.options &&
                      item.options.filter(
                        (o) => o.option_type !== "daily_meta"
                      ).length > 0 && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {item.options
                            .filter((o) => o.option_type !== "daily_meta")
                            .map((opt) => (
                              <div
                                key={opt.id}
                                className="text-xs text-muted-foreground"
                              >
                                ↳ {opt.label_snapshot}
                                {opt.price_delta_huf !== 0 &&
                                  ` (${opt.price_delta_huf > 0 ? "+" : ""}${opt.price_delta_huf} Ft)`}
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <p className="text-sm bg-muted p-2 rounded text-muted-foreground italic">
                {order.notes}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!isArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onArchive(order.id)}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archiválás
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Törlés
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rendelés törlése</AlertDialogTitle>
                    <AlertDialogDescription>
                      Biztosan véglegesen törlöd a #{order.code} rendelést?
                      Ez a művelet nem vonható vissza.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mégsem</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(order.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Igen, törlés
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${order.phone}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Hívás
                </a>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default OrdersManagement;
