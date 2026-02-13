import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsData, PeriodPreset, DateRange } from "@/hooks/useAnalyticsData";
import PeriodSelector from "@/components/admin/analytics/PeriodSelector";
import RevenueTab from "@/components/admin/analytics/RevenueTab";
import OrdersTab from "@/components/admin/analytics/OrdersTab";
import MenuPerformanceTab from "@/components/admin/analytics/MenuPerformanceTab";
import CustomersTab from "@/components/admin/analytics/CustomersTab";
import { subDays } from "date-fns";
import { Loader2 } from "lucide-react";

const Analytics = () => {
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const [customRange, setCustomRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { orders, orderItems, orderItemOptions, menuItems, menuCategories, isLoading, error } = useAnalyticsData(preset, customRange);

  return (
    <AdminLayout>
      <div className="py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Statisztika</h1>
          <PeriodSelector
            preset={preset}
            customRange={customRange}
            onPresetChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Adatok betöltése...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : (
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="!h-auto !shadow-none !scale-100 flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg w-fit">
              <TabsTrigger value="revenue" className="!h-9 !shadow-none !scale-100 text-sm">Bevétel</TabsTrigger>
              <TabsTrigger value="orders" className="!h-9 !shadow-none !scale-100 text-sm">Rendelések</TabsTrigger>
              <TabsTrigger value="menu" className="!h-9 !shadow-none !scale-100 text-sm">Menü teljesítmény</TabsTrigger>
              <TabsTrigger value="customers" className="!h-9 !shadow-none !scale-100 text-sm">Vásárlók</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="mt-4">
              <RevenueTab orders={orders} />
            </TabsContent>
            <TabsContent value="orders" className="mt-4">
              <OrdersTab orders={orders} orderItems={orderItems} />
            </TabsContent>
            <TabsContent value="menu" className="mt-4">
              <MenuPerformanceTab
                orderItems={orderItems}
                orderItemOptions={orderItemOptions}
                menuItems={menuItems}
                menuCategories={menuCategories}
              />
            </TabsContent>
            <TabsContent value="customers" className="mt-4">
              <CustomersTab orders={orders} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default Analytics;
