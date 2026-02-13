import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfQuarter, format } from "date-fns";

export type PeriodPreset = "today" | "week" | "month" | "quarter" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface OrderData {
  id: string;
  created_at: string;
  total_huf: number;
  status: string;
  payment_method: string;
  pickup_time: string | null;
  name: string;
  phone: string;
  email: string | null;
}

export interface OrderItemData {
  id: string;
  order_id: string | null;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  line_total_huf: number;
  item_id: string | null;
}

export interface OrderItemOptionData {
  id: string;
  order_item_id: string | null;
  label_snapshot: string;
  option_type: string | null;
  price_delta_huf: number;
}

export interface MenuItemData {
  id: string;
  name: string;
  category_id: string | null;
  price_huf: number;
  is_active: boolean;
}

export interface MenuCategoryData {
  id: string;
  name: string;
}

export interface AnalyticsData {
  orders: OrderData[];
  orderItems: OrderItemData[];
  orderItemOptions: OrderItemOptionData[];
  menuItems: MenuItemData[];
  menuCategories: MenuCategoryData[];
  isLoading: boolean;
  error: string | null;
}

function getDateRange(preset: PeriodPreset, custom?: DateRange): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "quarter":
      return { from: startOfQuarter(now), to: endOfDay(now) };
    case "custom":
      return custom || { from: subDays(now, 30), to: endOfDay(now) };
  }
}

async function fetchAllOrders(from: string, to: string): Promise<OrderData[]> {
  const allOrders: OrderData[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total_huf, status, payment_method, pickup_time, name, phone, email")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    if (data) {
      allOrders.push(...data);
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
    page++;
  }
  return allOrders;
}

async function fetchAllOrderItems(orderIds: string[]): Promise<OrderItemData[]> {
  if (orderIds.length === 0) return [];
  const allItems: OrderItemData[] = [];
  // Fetch in batches of 200 order IDs to avoid URL length limits
  const batchSize = 200;
  for (let i = 0; i < orderIds.length; i += batchSize) {
    const batch = orderIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from("order_items")
      .select("id, order_id, name_snapshot, qty, unit_price_huf, line_total_huf, item_id")
      .in("order_id", batch);
    if (error) throw error;
    if (data) allItems.push(...data);
  }
  return allItems;
}

async function fetchAllOrderItemOptions(orderItemIds: string[]): Promise<OrderItemOptionData[]> {
  if (orderItemIds.length === 0) return [];
  const allOptions: OrderItemOptionData[] = [];
  const batchSize = 200;
  for (let i = 0; i < orderItemIds.length; i += batchSize) {
    const batch = orderItemIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from("order_item_options")
      .select("id, order_item_id, label_snapshot, option_type, price_delta_huf")
      .in("order_item_id", batch);
    if (error) throw error;
    if (data) allOptions.push(...data);
  }
  return allOptions;
}

export function useAnalyticsData(preset: PeriodPreset, customRange?: DateRange): AnalyticsData {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [orderItemOptions, setOrderItemOptions] = useState<OrderItemOptionData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = getDateRange(preset, customRange);
  const fromStr = range.from.toISOString();
  const toStr = range.to.toISOString();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch orders + menu data in parallel
      const [fetchedOrders, menuItemsRes, menuCatRes] = await Promise.all([
        fetchAllOrders(fromStr, toStr),
        supabase.from("menu_items").select("id, name, category_id, price_huf, is_active"),
        supabase.from("menu_categories").select("id, name"),
      ]);

      if (menuItemsRes.error) throw menuItemsRes.error;
      if (menuCatRes.error) throw menuCatRes.error;

      setOrders(fetchedOrders);
      setMenuItems(menuItemsRes.data || []);
      setMenuCategories(menuCatRes.data || []);

      // Fetch order items
      const orderIds = fetchedOrders.map(o => o.id);
      const items = await fetchAllOrderItems(orderIds);
      setOrderItems(items);

      // Fetch options
      const itemIds = items.map(i => i.id);
      const options = await fetchAllOrderItemOptions(itemIds);
      setOrderItemOptions(options);
    } catch (err: any) {
      setError(err.message || "Hiba történt az adatok betöltésekor");
    } finally {
      setIsLoading(false);
    }
  }, [fromStr, toStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { orders, orderItems, orderItemOptions, menuItems, menuCategories, isLoading, error };
}

export { getDateRange };
